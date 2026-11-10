import test from "node:test";
import assert from "node:assert/strict";
import { buildToolEvent } from "../src/lib/tool-event.ts";

test("builds only fixed analytics properties for all supported tools and actions", () => {
  for (const tool of [
    "push_notification_tester",
    "privacy_policy_generator",
    "app_icon_generator",
    "deep_link_tester",
    "apk_aab_analyzer",
    "store_asset_resizer",
    "data_safety_form_helper",
    "fcm_payload_builder",
  ]) {
    for (const action of ["opened", "started", "succeeded", "failed"]) {
      assert.deepEqual(buildToolEvent(tool, action), { tool, action });
    }
  }
  for (const variant of ["fcm", "webpush", "onesignal"]) {
    assert.deepEqual(
      buildToolEvent("push_notification_tester", "started", variant),
      {
        tool: "push_notification_tester",
        action: "started",
        variant,
      },
    );
  }
});

test("rejects runtime values outside exact primitive string allowlists", () => {
  const invalid = [
    undefined,
    null,
    "",
    "APK_AAB_ANALYZER",
    "apk_aab_analyzer ",
    "secret-token",
    "__proto__",
    "constructor",
    42,
    {},
    [],
    new String("apk_aab_analyzer"),
    { toString: () => "apk_aab_analyzer" },
  ];
  for (const value of invalid)
    assert.equal(buildToolEvent(value, "started"), null);
  for (const value of [...invalid, "cancelled", "Started"])
    assert.equal(buildToolEvent("apk_aab_analyzer", value), null);
  for (const value of [
    null,
    "",
    "FCM",
    "fcm ",
    "secret-token",
    {},
    new String("fcm"),
  ]) {
    assert.equal(
      buildToolEvent("push_notification_tester", "started", value),
      null,
    );
  }
});

test("rejects variants on tools that do not use push providers", () => {
  assert.equal(buildToolEvent("apk_aab_analyzer", "succeeded", "fcm"), null);
});

test("never forwards caller objects or their identifying properties", () => {
  const input = {
    tool: "apk_aab_analyzer",
    action: "started",
    filename: "private.apk",
    token: "secret",
  };
  assert.equal(buildToolEvent(input, "started"), null);
  assert.equal(buildToolEvent("apk_aab_analyzer", input), null);
  const event = buildToolEvent(input.tool, input.action);
  assert.deepEqual(event, { tool: "apk_aab_analyzer", action: "started" });
  assert.notEqual(event, input);
  assert.equal(JSON.stringify(event).includes("private.apk"), false);
});
