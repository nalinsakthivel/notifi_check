import { zipSync } from "fflate";
export function axml(
  nodes: {
    name: string;
    attrs?: Record<string, string | number>;
    close?: boolean;
  }[],
): Uint8Array {
  const strings = [
    "http://schemas.android.com/apk/res/android",
    ...new Set(
      nodes.flatMap((n) => [
        n.name,
        ...Object.keys(n.attrs ?? {}),
        ...(Object.values(n.attrs ?? {}).filter(
          (v) => typeof v === "string",
        ) as string[]),
      ]),
    ),
  ];
  const encoder = new TextEncoder();
  const data = strings.map((s) => {
    const b = encoder.encode(s);
    return Uint8Array.of(s.length, b.length, ...b, 0);
  });
  const pool = new Uint8Array(
    28 + strings.length * 4 + data.reduce((s, b) => s + b.length, 0),
  );
  const pv = new DataView(pool.buffer);
  pv.setUint16(0, 1, true);
  pv.setUint16(2, 28, true);
  pv.setUint32(4, pool.length, true);
  pv.setUint32(8, strings.length, true);
  pv.setUint32(16, 256, true);
  pv.setUint32(20, 28 + strings.length * 4, true);
  let p = 28 + strings.length * 4;
  data.forEach((b, i) => {
    pv.setUint32(28 + i * 4, p - (28 + strings.length * 4), true);
    pool.set(b, p);
    p += b.length;
  });
  const chunks = nodes.map((n) => {
    const attrs = Object.entries(n.attrs ?? {});
    const b = new Uint8Array(n.close ? 24 : 36 + attrs.length * 20);
    const v = new DataView(b.buffer);
    v.setUint16(0, n.close ? 0x103 : 0x102, true);
    v.setUint16(2, 16, true);
    v.setUint32(4, b.length, true);
    v.setUint32(16, 0xffffffff, true);
    v.setUint32(20, strings.indexOf(n.name), true);
    if (!n.close) {
      v.setUint16(24, 20, true);
      v.setUint16(26, 20, true);
      v.setUint16(28, attrs.length, true);
      attrs.forEach(([key, value], i) => {
        const a = 36 + i * 20;
        v.setUint32(a, key === "package" ? 0xffffffff : 0, true);
        v.setUint32(a + 4, strings.indexOf(key), true);
        v.setUint32(
          a + 8,
          typeof value === "string" ? strings.indexOf(value) : 0xffffffff,
          true,
        );
        v.setUint16(a + 12, 8, true);
        v.setUint8(a + 15, typeof value === "string" ? 3 : 16);
        v.setUint32(
          a + 16,
          typeof value === "string" ? strings.indexOf(value) : value,
          true,
        );
      });
    }
    return b;
  });
  const out = new Uint8Array(
    8 + pool.length + chunks.reduce((s, b) => s + b.length, 0),
  );
  const v = new DataView(out.buffer);
  v.setUint16(0, 3, true);
  v.setUint16(2, 8, true);
  v.setUint32(4, out.length, true);
  out.set(pool, 8);
  p = 8 + pool.length;
  for (const b of chunks) {
    out.set(b, p);
    p += b.length;
  }
  return out;
}
export function apkWithBlock(pairs: { id: number; value: Uint8Array }[]): Blob {
  const zip = zipSync({
    "AndroidManifest.xml": axml([
      { name: "manifest", attrs: { package: "com.example" } },
      { name: "manifest", close: true },
    ]),
  });
  const view = new DataView(zip.buffer);
  let end = zip.length - 22;
  while (view.getUint32(end, true) !== 0x06054b50) end--;
  const offset = view.getUint32(end + 16, true);
  const size = 32 + pairs.reduce((s, p) => s + 12 + p.value.length, 0);
  const block = new Uint8Array(size);
  const bv = new DataView(block.buffer);
  bv.setBigUint64(0, BigInt(size - 8), true);
  let pos = 8;
  for (const pair of pairs) {
    bv.setBigUint64(pos, BigInt(4 + pair.value.length), true);
    bv.setUint32(pos + 8, pair.id, true);
    block.set(pair.value, pos + 12);
    pos += 12 + pair.value.length;
  }
  bv.setBigUint64(size - 24, BigInt(size - 8), true);
  block.set(new TextEncoder().encode("APK Sig Block 42"), size - 16);
  const out = new Uint8Array(zip.length + size);
  out.set(zip.subarray(0, offset));
  out.set(block, offset);
  out.set(zip.subarray(offset), offset + size);
  new DataView(out.buffer).setUint32(end + size + 16, offset + size, true);
  return new Blob([out]);
}
