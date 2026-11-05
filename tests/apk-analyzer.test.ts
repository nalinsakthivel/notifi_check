import test from "node:test";
import assert from "node:assert/strict";
import { zipSync } from "fflate";
import { analyzePackage } from "../src/lib/apk-analyzer/analyze.ts";
import { readArchive } from "../src/lib/apk-analyzer/archive.ts";

const bytes = (s: string) => new TextEncoder().encode(s);
const blob = (files: Record<string, Uint8Array>) => new Blob([zipSync(files)]);
test("AAB is analyzed without decompressing assets; module sizes are categorized", async () => {
  const result = await analyzePackage(
    "test.aab",
    blob({
      "BundleConfig.pb": bytes("config"),
      "base/manifest/AndroidManifest.xml": bytes("protobuf"),
      "base/assets/a": bytes("asset"),
      "feature/manifest/AndroidManifest.xml": bytes("pb"),
    }),
  );
  assert.equal(result.format, "aab");
  assert.equal(result.manifest, null);
  assert.deepEqual(result.modules, ["base", "feature"]);
  assert.equal(
    result.sizeBreakdown.find((x) => x.label === "Assets")?.uncompressedSize,
    5,
  );
});
test("malformed ZIP fails actionably", async () => {
  await assert.rejects(readArchive(new Blob([bytes("bad")])), /ZIP|archive/i);
});
test("file and entry limits apply before extraction", async () => {
  const file = blob({ "AndroidManifest.xml": bytes("abc") });
  await assert.rejects(readArchive(file, { maxFileBytes: 1 }), /limit|large/i);
  await assert.rejects(readArchive(file, { maxEntryBytes: 2 }), /limit|large/i);
});
test("missing manifest is reported without fabricated package fields", async () => {
  const result = await analyzePackage(
    "missing.apk",
    blob({ "classes.dex": bytes("dex") }),
  );
  assert.equal(result.manifest, null);
  assert.match(result.warnings.join(" "), /manifest/i);
});
test("ZIP bombs are rejected, including dishonest uncompressed size", async () => {
  const file = zipSync({ "AndroidManifest.xml": new Uint8Array(200000) });
  await assert.rejects(readArchive(new Blob([file])), /ratio|expansion/i);
  // Lie in both headers, retaining real compressed data.
  const view = new DataView(file.buffer);
  view.setUint32(22, 100, true);
  for (let i = 0; i < file.length - 4; i++)
    if (view.getUint32(i, true) === 0x02014b50)
      view.setUint32(i + 24, 100, true);
  const archive = await readArchive(new Blob([file]));
  await assert.rejects(
    archive.readEntry(archive.entries[0]),
    /size|decompress|CRC/i,
  );
});
test("selected entry CRC is validated", async () => {
  const file = zipSync(
    { "AndroidManifest.xml": bytes("manifest") },
    { level: 0 },
  );
  file[30 + "AndroidManifest.xml".length] ^= 1;
  const archive = await readArchive(new Blob([file]));
  await assert.rejects(archive.readEntry(archive.entries[0]), /CRC/i);
});

import { axml, apkWithBlock } from "./fixtures/apk.ts";
import { parseAxml } from "../src/lib/apk-analyzer/axml.ts";
import { parseApkManifest } from "../src/lib/apk-analyzer/manifest.ts";
import { analyzeSignature } from "../src/lib/apk-analyzer/cert.ts";
import { categorize } from "../src/lib/apk-analyzer/size-breakdown.ts";
test("valid APK preserves package fields and never reports missing v1 as unsigned", async () => {
  const manifest = axml([
    {
      name: "manifest",
      attrs: { package: "com.example", versionCode: 7, versionName: "1.0" },
    },
    { name: "manifest", close: true },
  ]);
  const r = await analyzePackage(
    "a.apk",
    blob({ "AndroidManifest.xml": manifest }),
  );
  assert.equal(r.manifest?.packageName, "com.example");
  assert.equal(r.manifest?.versionCode, "7");
  assert.equal(r.signature?.presence, "none-detected");
  assert.equal(r.signature?.verification, "not-verified");
});
test("modern APK signing schemes are detected without legacy files", async () => {
  for (const [id, scheme] of [
    [0x7109871a, "v2"],
    [0xf05368c0, "v3"],
    [0x1b93ad61, "v3.1"],
  ] as const) {
    const r = await analyzePackage(
      "a.apk",
      apkWithBlock([{ id, value: Uint8Array.of(0, 0, 0, 0) }]),
    );
    assert.ok(r.signature?.schemes.includes(scheme));
    assert.equal(r.signature?.presence, "present");
    assert.equal(r.signature?.verification, "not-verified");
  }
});
test("v1-only material is presence, never verification", async () => {
  const r = await analyzeSignature(
    new Map([["META-INF/CERT.RSA", bytes("bad certificate")]]),
  );
  assert.deepEqual(r.schemes, ["v1"]);
  assert.equal(r.certSha256, null);
  assert.equal(r.verification, "not-verified");
});
test("malformed XML is rejected rather than yielding fabricated manifest fields", () => {
  assert.throws(() => parseAxml(bytes("not binary XML")), /XML|AXML/i);
  assert.throws(() => parseApkManifest(bytes("bad")), /XML|AXML/i);
  const valid = axml([{ name: "manifest" }, { name: "manifest", close: true }]);
  new DataView(valid.buffer).setUint32(4, valid.length + 10, true);
  assert.throws(() => parseAxml(valid));
});
test("activity aliases and additional permission declarations are preserved", () => {
  const info = parseApkManifest(
    axml([
      { name: "manifest", attrs: { package: "com.example" } },
      {
        name: "uses-permission-sdk-23",
        attrs: { name: "android.permission.CAMERA" },
      },
      { name: "uses-permission-sdk-23", close: true },
      { name: "permission", attrs: { name: "com.example.CUSTOM" } },
      { name: "permission", close: true },
      { name: "application" },
      {
        name: "activity-alias",
        attrs: { name: ".Launcher", targetActivity: ".Main" },
      },
      { name: "activity-alias", close: true },
      { name: "application", close: true },
      { name: "manifest", close: true },
    ]),
  );
  assert.deepEqual(info.permissions, ["android.permission.CAMERA"]);
  assert.deepEqual(info.declaredPermissions, ["com.example.CUSTOM"]);
  assert.equal(info.components[0].type, "activity-alias");
});
test("AAB module-relative sizes use the APK categories", () => {
  assert.equal(
    categorize("base/lib/arm64-v8a/lib.so"),
    "Native libraries (arm64-v8a)",
  );
  assert.equal(categorize("feature/resources.pb"), "Compiled resources");
  assert.equal(categorize("base/manifest/AndroidManifest.xml"), "Manifest");
});

import { readFileSync } from "node:fs";
const certificate = new Uint8Array(
  readFileSync(new URL("./fixtures/isrg-root-x1.der", import.meta.url)),
);
const expectedFingerprint =
  "96:bc:ec:06:26:49:76:f3:74:60:77:9a:cf:28:c5:a7:cf:e8:a3:c0:aa:e1:1a:8f:fc:ee:05:c0:bd:df:08:c6";
function concat(...chunks: Uint8Array[]) {
  const out = new Uint8Array(chunks.reduce((n, b) => n + b.length, 0));
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}
function der(tag: number, ...chunks: Uint8Array[]) {
  const content = concat(...chunks),
    n = content.length;
  return concat(
    Uint8Array.of(
      tag,
      ...(n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 255]),
    ),
    content,
  );
}
const signedDataOid = Uint8Array.of(
  6,
  9,
  0x2a,
  0x86,
  0x48,
  0x86,
  0xf7,
  0x0d,
  1,
  7,
  2,
);
function pkcs7(certs: Uint8Array[]) {
  return der(
    0x30,
    signedDataOid,
    der(
      0xa0,
      der(
        0x30,
        der(2, Uint8Array.of(1)),
        der(0x31),
        der(0x30),
        der(0xa0, ...certs),
        der(0x31),
      ),
    ),
  );
}
function lp(b: Uint8Array) {
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, b.length, true);
  return concat(len, b);
}
test("v1 certificate fingerprint matches independent OpenSSL SHA-256", async () => {
  const info = await analyzeSignature(
    new Map([["META-INF/CERT.RSA", pkcs7([certificate])]]),
  );
  assert.equal(info.certSha256, expectedFingerprint);
  assert.equal(info.verification, "not-verified");
});
test("multiple unordered v1 certificates are inconclusive, not an arbitrary leaf", async () => {
  const info = await analyzeSignature(
    new Map([["META-INF/CERT.RSA", pkcs7([certificate, certificate])]]),
  );
  assert.equal(info.certSha256, null);
});
test("modern signer certificate fingerprint uses exact DER bytes", async () => {
  const signed = concat(
    lp(new Uint8Array()),
    lp(lp(certificate)),
    lp(new Uint8Array()),
  );
  const signer = concat(lp(signed), lp(new Uint8Array()), lp(new Uint8Array()));
  const result = await analyzePackage(
    "modern.apk",
    apkWithBlock([{ id: 0x7109871a, value: lp(lp(signer)) }]),
  );
  assert.equal(result.signature?.certSha256, expectedFingerprint);
});
test("malformed modern footer gives unknown signing, without unsigned claims", async () => {
  const file = new Uint8Array(
    await apkWithBlock([
      { id: 0x7109871a, value: new Uint8Array(4) },
    ]).arrayBuffer(),
  );
  for (let i = 0; i < file.length - 16; i++)
    if (
      new TextDecoder().decode(file.subarray(i, i + 16)) === "APK Sig Block 42"
    )
      new DataView(file.buffer).setUint32(i - 8, 0xffffffff, true);
  const result = await analyzePackage("a.apk", new Blob([file]));
  assert.equal(result.signature?.presence, "unknown");
});
test("valid ZIP data descriptors allow zero local sizes and CRC", async () => {
  const file = zipSync({
    "AndroidManifest.xml": axml([
      { name: "manifest" },
      { name: "manifest", close: true },
    ]),
  });
  const v = new DataView(file.buffer);
  v.setUint16(6, 8, true);
  v.setUint32(14, 0, true);
  v.setUint32(18, 0, true);
  v.setUint32(22, 0, true);
  for (let i = 0; i < file.length - 46; i++)
    if (v.getUint32(i, true) === 0x02014b50) v.setUint16(i + 8, 8, true);
  const archive = await readArchive(new Blob([file]));
  assert.ok((await archive.readEntry(archive.entries[0])).length > 0);
});
test("unsupported XML value types stay unknown and typed string index is used", () => {
  const b = axml([
    {
      name: "manifest",
      attrs: { package: "com.example", versionName: "1.0", versionCode: 4 },
    },
    { name: "manifest", close: true },
  ]);
  const v = new DataView(b.buffer);
  let p = 8;
  while (v.getUint16(p, true) !== 0x102) p += v.getUint32(p + 4, true);
  v.setUint32(p + 36 + 20 + 8, 0xffffffff, true);
  v.setUint8(p + 36 + 40 + 15, 1);
  const info = parseApkManifest(b);
  assert.equal(info.versionName, "1.0");
  assert.equal(info.versionCode, null);
});
test("namespace spoofing and truncated element trees do not yield trusted values", () => {
  const b = axml([
    { name: "manifest", attrs: { package: "com.example", versionName: "1.0" } },
    { name: "manifest", close: true },
  ]);
  const v = new DataView(b.buffer);
  let p = 8;
  while (v.getUint16(p, true) !== 0x102) p += v.getUint32(p + 4, true);
  v.setUint32(p + 36 + 20, 0xffffffff, true);
  assert.equal(parseApkManifest(b).versionName, null);
  const truncated = b.slice(0, -24);
  new DataView(truncated.buffer).setUint32(4, truncated.length, true);
  assert.throws(() => parseAxml(truncated));
});
test("extraction total budget and entry counts are bounded", async () => {
  const file = blob({ a: bytes("abcd"), b: bytes("abcd") });
  await assert.rejects(readArchive(file, { maxEntries: 1 }), /limit/i);
  const archive = await readArchive(file, { maxExtractedBytes: 6 });
  await archive.readEntry(archive.entries[0]);
  await assert.rejects(archive.readEntry(archive.entries[1]), /limit/i);
});
test("selected local data cannot overlap the next entry", async () => {
  const file = zipSync({
    "AndroidManifest.xml": bytes("x"),
    other: bytes("y"),
  });
  new DataView(file.buffer).setUint16(28, 65535, true);
  const a = await readArchive(new Blob([file]));
  await assert.rejects(a.readEntry(a.entries[0]), /overlap/i);
});

test("an untrusted DER container cannot masquerade as PKCS7 SignedData", async () => {
  const fake = der(
    0x30,
    Uint8Array.of(6, 1, 0),
    der(
      0xa0,
      der(
        0x30,
        der(2, Uint8Array.of(1)),
        der(0x31),
        der(0x30),
        der(0xa0, certificate),
        der(0x31),
      ),
    ),
  );
  assert.equal(
    (await analyzeSignature(new Map([["META-INF/CERT.RSA", fake]]))).certSha256,
    null,
  );
});
test("too many signature candidates fail before extraction", async () => {
  const files: Record<string, Uint8Array> = {
    "AndroidManifest.xml": bytes("bad"),
  };
  for (let i = 0; i < 65; i++) files[`META-INF/CERT${i}.RSA`] = bytes("x");
  await assert.rejects(
    analyzePackage("a.apk", blob(files)),
    /signature.*limit|too many signature/i,
  );
});

test("element namespace mismatches and invalid namespace indices are rejected", () => {
  for (const ns of [0, 0xfffffffe]) {
    const b = axml([
      { name: "manifest" },
      { name: "uses-permission", attrs: { name: "android.permission.CAMERA" } },
      { name: "uses-permission", close: true },
      { name: "manifest", close: true },
    ]);
    const v = new DataView(b.buffer);
    let p = 8;
    while (v.getUint16(p, true) !== 0x102) p += v.getUint32(p + 4, true);
    p += v.getUint32(p + 4, true);
    v.setUint32(p + 16, ns, true);
    assert.throws(() => parseApkManifest(b), /XML|AXML/i);
  }
});
test("foreign-namespaced manifest elements cannot contribute Android permissions", () => {
  const b = axml([
    { name: "manifest" },
    { name: "uses-permission", attrs: { name: "android.permission.CAMERA" } },
    { name: "uses-permission", close: true },
    { name: "manifest", close: true },
  ]);
  const v = new DataView(b.buffer);
  let p = 8;
  while (v.getUint16(p, true) !== 0x102) p += v.getUint32(p + 4, true);
  p += v.getUint32(p + 4, true);
  v.setUint32(p + 16, 0, true);
  p += v.getUint32(p + 4, true);
  v.setUint32(p + 16, 0, true);
  assert.deepEqual(parseApkManifest(b).permissions, []);
});
