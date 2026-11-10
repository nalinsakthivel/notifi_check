import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  await context.addInitScript(() => {
    window.__toolEvents = [];
    window.va = (...args) => window.__toolEvents.push(args);
  });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  // Real production-server input validation: these fail before any provider call.
  for (const route of ["send", "web-push/send", "onesignal/send"]) {
    const response = await context.request.post(
      `${base}/api/notifications/${route}`,
      { multipart: { title: "test" } },
    );
    assert.equal(response.status(), 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.diagnosticCode, "input-invalid");
  }
  await page.goto(`${base}/push-notification-tester`);
  await page.locator("input[name=serviceAccount]").setInputFiles({
    name: "synthetic.json",
    mimeType: "application/json",
    buffer: Buffer.from("SECRET_JSON"),
  });
  await page.locator("input[name=fcmToken]").fill("SECRET_TOKEN");
  await page
    .getByRole("button", { name: "SEND_TEST_PUSH", exact: true })
    .click();
  const alert = page.locator("section[role=alert]");
  await alert
    .getByRole("heading", { name: "Check the request fields" })
    .waitFor();
  assert.equal(await page.locator("input[name=fcmToken]").inputValue(), "");
  assert.equal(
    await page
      .locator("input[name=serviceAccount]")
      .evaluate((e) => e.files.length),
    0,
  );
  await alert.getByRole("button", { name: "Copy diagnostics" }).click();
  await page.getByText("Safe diagnostics copied.", { exact: true }).waitFor();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copied, /Code: input-invalid/);
  assert.doesNotMatch(copied, /SECRET|synthetic.json/);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "push mobile width",
  );
  await mkdir("docs/screenshots/phase3", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/phase3/fcm-mobile.png",
    fullPage: true,
  });
  // Controlled HTTP responses verify client behavior without sending a real push.
  await page.route("**/api/notifications/onesignal/send", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        diagnosticCode: "credentials-invalid",
        providerStatus: 401,
        error: "SECRET_RESPONSE",
      }),
    }),
  );
  await page.getByRole("button", { name: "ONESIGNAL", exact: true }).click();
  for (const [name, value] of [
    ["appId", "synthetic-app"],
    ["restApiKey", "SECRET_KEY"],
    ["playerId", "SECRET_DEVICE"],
  ])
    await page.locator(`input[name=${name}]`).fill(value);
  await page
    .getByRole("button", { name: "SEND_TEST_PUSH", exact: true })
    .click();
  await page
    .locator("section[role=alert]")
    .getByRole("heading", { name: "Check provider credentials" })
    .waitFor();
  assert.equal(await page.locator("input[name=restApiKey]").inputValue(), "");
  assert.equal(await page.locator("input[name=playerId]").inputValue(), "");
  assert.doesNotMatch(
    await page.locator("section[role=alert]").innerText(),
    /SECRET/,
  );
  assert.match(
    await page.locator("section[role=alert]").innerText(),
    /Application HTTP: 500/,
  );
  assert.match(
    await page.locator("section[role=alert]").innerText(),
    /Provider HTTP: 401/,
  );
  await page
    .locator("section[role=alert]")
    .getByRole("button", { name: "Copy diagnostics" })
    .click();
  assert.doesNotMatch(
    await page.evaluate(() => navigator.clipboard.readText()),
    /SECRET/,
  );
  assert.equal(
    await page
      .locator("section[role=alert]")
      .getByRole("link", { name: "Report a problem" })
      .getAttribute("href"),
    "/feedback",
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        throw new Error("denied");
      },
    });
  });
  await page
    .locator("section[role=alert]")
    .getByRole("button", { name: "Copy diagnostics" })
    .click();
  await page
    .getByText(
      "Copy unavailable. Select the diagnostic code and guidance manually.",
      { exact: true },
    )
    .waitFor();
  await page.evaluate(() => {
    delete navigator.clipboard.writeText;
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: "docs/screenshots/phase3/onesignal-desktop.png",
    fullPage: true,
  });
  const events = await page.evaluate(() =>
    window.__toolEvents.filter(
      (a) => a[0] === "event" && a[1]?.name === "tool_usage",
    ),
  );
  assert.ok(events.some((e) => e[1].data?.action === "failed"));
  for (const [, event] of events) {
    assert.ok(
      Object.keys(event.data).every((key) =>
        ["action", "tool", "variant"].includes(key),
      ),
    );
    assert.ok(
      ["opened", "started", "succeeded", "failed"].includes(event.data.action),
    );
    assert.doesNotMatch(JSON.stringify(event.data), /SECRET|synthetic/);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/apk-aab-analyzer`);
  await page.locator("input[type=file]").setInputFiles({
    name: "synthetic.apk",
    mimeType: "application/zip",
    buffer: Buffer.from("bad ZIP"),
  });
  await page
    .locator("section[role=alert]")
    .getByRole("heading", { name: "Archive is malformed or corrupt" })
    .waitFor();
  await page
    .locator("section[role=alert]")
    .getByRole("button", { name: "Copy diagnostics" })
    .click();
  assert.doesNotMatch(
    await page.evaluate(() => navigator.clipboard.readText()),
    /synthetic.apk/,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "analyzer mobile width",
  );
  await page.screenshot({
    path: "docs/screenshots/phase3/analyzer-mobile.png",
    fullPage: true,
  });
  await page
    .locator("section[role=alert]")
    .getByRole("link", { name: "Report a problem" })
    .click();
  await page.waitForURL("**/feedback");
  await page.getByLabel("Message", { exact: false }).waitFor();
  assert.doesNotMatch(
    await page.evaluate(() =>
      JSON.stringify({
        local: { ...localStorage },
        session: { ...sessionStorage },
      }),
    ),
    /SECRET/,
  );
  if (process.env.PUBLIC_APK_PATH) {
    await page.goto(`${base}/apk-aab-analyzer`);
    await page
      .locator("input[type=file]")
      .setInputFiles(process.env.PUBLIC_APK_PATH);
    await page.getByText("Completed", { exact: true }).waitFor();
    assert.match(
      await page.locator("body").innerText(),
      /io\.appium\.android\.apis/,
    );
    assert.match(
      await page.locator("body").innerText(),
      /da:63:19:48:7b:13:4e:a4:a6:7d:55:4c:0d:ee:bb:53:7e:11:b6:64:42:47:9e:f3:1c:08:7c:da:e6:1a:7b:1d/,
    );
  }
  await page.goto(`${base}/apk-aab-analyzer`);
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "synthetic.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not a package"),
    });
  await page
    .locator("section[role=alert]")
    .getByRole("heading", { name: "Select an APK or AAB" })
    .waitFor();
  assert.deepEqual(errors, []);
  assert.equal(
    requests.some((url) => /fonts\.(googleapis|gstatic)\.com/.test(url)),
    false,
  );
  console.log(
    JSON.stringify({
      passed: true,
      checks: [
        "production multipart validation",
        "credential/token reset",
        "real clipboard",
        "safe diagnostics",
        "status provenance",
        "mobile layouts",
        "feedback navigation",
        "analytics sink allowlist",
        "selfhosted font",
        "browser runtime",
      ],
      screenshots: 3,
      toolEvents: events.length,
    }),
  );
  await context.close();
} finally {
  await browser.close();
}
