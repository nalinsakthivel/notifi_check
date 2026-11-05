import test from "node:test";
import assert from "node:assert/strict";
import { parseNotificationData, publicError, requireFields, checkRequestSize, InputError } from "../src/lib/notification-validation.ts";

test("accepts valid string-valued data", () => {
  assert.deepEqual(parseNotificationData('{"type":"test"}'), { type: "test" });
});
test("rejects malformed JSON", () => {
  assert.throws(() => parseNotificationData("{oops"), InputError);
});
test("rejects arrays, primitives, and non-string values", () => {
  for (const input of ['[]', '"hello"', '{"n":42}', '{"ok":null}']) {
    assert.throws(() => parseNotificationData(input), InputError);
  }
});
test("allows empty optional data", () => {
  assert.equal(parseNotificationData(""), undefined);
});
test("rejects missing and oversized fields", () => {
  assert.throws(() => requireFields({ title: " " }, ["title"]), InputError);
  assert.throws(() => requireFields({ title: "x".repeat(4097) }, ["title"]), InputError);
});
test("rejects oversized declared request", () => {
  assert.throws(() => checkRequestSize(new Request("https://example.test", { headers: { "content-length": "262145" } })), InputError);
});
test("does not expose secrets from provider errors", () => {
  const result = publicError(new Error("secret=very-sensitive"));
  assert.doesNotMatch(result.message, /secret|very-sensitive/);
});
test("retains only approved provider codes", () => {
  assert.equal(publicError(Object.assign(new Error("private"), { code: "messaging/unavailable" })).code, "messaging/unavailable");
  assert.equal(publicError(Object.assign(new Error("private"), { code: "private/code" })).code, undefined);
});
