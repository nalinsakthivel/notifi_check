const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
import { zipSync } from "fflate";
import { axml } from "../fixtures/apk.ts";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    const requests = [];
    let workers = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("worker", () => workers++);
    page.on("request", (r) => {
      if (r.method() === "POST")
        requests.push({ url: r.url(), body: r.postData() });
    });
    await page.goto(
      process.env.ANALYZER_URL || "http://127.0.0.1:3000/apk-aab-analyzer",
    );
    const manifest = axml([
      {
        name: "manifest",
        attrs: {
          package: "com.example.synthetic",
          versionCode: 42,
          versionName: "1.0",
        },
      },
      { name: "manifest", close: true },
    ]);
    const payload = {
      name: "synthetic.apk",
      mimeType: "application/zip",
      buffer: Buffer.from(zipSync({ "AndroidManifest.xml": manifest })),
    };
    const input = page.locator("input[type=file]");
    const slow = {
      name: "slow.apk",
      mimeType: "application/zip",
      buffer: Buffer.from(
        zipSync({
          "AndroidManifest.xml": randomBytes(4 * 1024 * 1024),
        }),
      ),
    };
    await input.setInputFiles(payload);
    await page.getByText("Completed", { exact: true }).waitFor();
    assert.match(
      await page.locator("body").innerText(),
      /com.example.synthetic/,
    );
    assert.match(await page.locator("body").innerText(), /Not verified/);
    assert.ok(workers > 0, "real browser worker created");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "mobile page does not overflow",
    );
    await input.setInputFiles(payload);
    await page.getByText("Completed", { exact: true }).waitFor();
    assert.equal(workers, 2, "same file can be analyzed again");
    // A bounded random manifest keeps the worker active long enough to cancel.
    await page.evaluate(() => {
      window.heartbeat = 0;
      window.heartbeatTimer = setInterval(() => window.heartbeat++, 10);
    });
    await input.setInputFiles(slow);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByText("Cancelled", { exact: true }).waitFor();
    assert.equal(await page.getByText("Completed", { exact: true }).count(), 0);
    assert.ok(
      await page.evaluate(() => window.heartbeat > 0),
      "main thread remains responsive",
    );
    await page.evaluate(() => clearInterval(window.heartbeatTimer));
    await input.setInputFiles({
      name: "bad.apk",
      mimeType: "application/zip",
      buffer: Buffer.from("not zip"),
    });
    await page.getByText(/Invalid or unsupported ZIP archive/).waitFor();
    await input.setInputFiles({
      name: "bundle.aab",
      mimeType: "application/zip",
      buffer: Buffer.from(
        zipSync({
          "BundleConfig.pb": Buffer.from("cfg"),
          "base/manifest/AndroidManifest.xml": Buffer.from("pb"),
          "base/assets/x": Buffer.from("asset"),
        }),
      ),
    });
    await page.getByText("Completed", { exact: true }).waitFor();
    assert.match(
      await page.locator("body").innerText(),
      /AAB manifest parsing/,
    );
    // Immediate replacement: the second selected file owns the result.
    await input.setInputFiles(slow);
    await input.setInputFiles({ ...payload, name: "replacement.apk" });
    await page.getByText("Completed", { exact: true }).waitFor();
    assert.match(await page.locator("body").innerText(), /replacement.apk/);
    const fileUploads = requests.filter((r) =>
      /synthetic|replacement|com\.example|AndroidManifest/.test(r.body || ""),
    );
    assert.deepEqual(fileUploads, [], "no package data uploaded");
    assert.deepEqual(errors, [], "no browser runtime errors");
    console.log(
      JSON.stringify({
        checks: [
          "real worker",
          "valid APK",
          "same-file reselection",
          "cancellation",
          "malformed ZIP",
          "valid AAB",
          "replacement",
          "mobile width",
          "no package upload",
          "no runtime errors",
        ],
        workers,
        passed: true,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
