import test from "node:test";
import assert from "node:assert/strict";
import {
  readNotificationForm,
  InputError,
  validateOptionalUrl,
} from "../src/lib/notification-validation.ts";
const url = "http://example.test";
test("actual multipart bytes are bounded without a trusted Content-Length and reader is cancelled", async () => {
  for (const length of [undefined, "1"]) {
    let cancelled = false;
    const stream = new ReadableStream({
      pull(c) {
        c.enqueue(new Uint8Array(270000));
      },
      cancel() {
        cancelled = true;
      },
    });
    const headers: Record<string, string> = {
      "content-type": "multipart/form-data; boundary=x",
    };
    if (length) headers["content-length"] = length;
    const request = new Request(url, {
      method: "POST",
      headers,
      body: stream,
      duplex: "half",
    } as RequestInit);
    await assert.rejects(
      readNotificationForm(request),
      (e) =>
        e instanceof InputError && e.diagnosticCode === "request-too-large",
    );
    assert.equal(cancelled, true);
  }
});
test("malformed multipart is classified as input without exposing body", async () => {
  const request = new Request(url, {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=x" },
    body: "SECRET_PRIVATE_KEY",
  });
  await assert.rejects(
    readNotificationForm(request),
    (e) => e instanceof InputError && !e.message.includes("SECRET"),
  );
});
test("normal multipart works and duplicate fields are rejected", async () => {
  const form = new FormData();
  form.set("title", "test");
  const parsed = await readNotificationForm(
    new Request(url, { method: "POST", body: form }),
  );
  assert.equal(parsed.get("title"), "test");
  form.append("title", "second");
  await assert.rejects(
    readNotificationForm(new Request(url, { method: "POST", body: form })),
    InputError,
  );
});
test("optional URLs reject unsupported schemes, invalid URLs and oversized values without echoing them", () => {
  for (const value of [
    "javascript:SECRET",
    "bad SECRET",
    "https://example.test/" + "s".repeat(4096),
  ])
    assert.throws(
      () => validateOptionalUrl(value),
      (e) => e instanceof InputError && !e.message.includes("SECRET"),
    );
  assert.equal(
    validateOptionalUrl("https://example.test/icon.png"),
    "https://example.test/icon.png",
  );
  assert.equal(validateOptionalUrl(""), undefined);
});
