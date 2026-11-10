import test from "node:test";
import assert from "node:assert/strict";
import {
  diagnosticCode,
  notificationDiagnostic,
  diagnosticText,
} from "../src/lib/diagnostics.ts";
import { sendOneSignalNotification } from "../src/lib/onesignal-service.ts";
import { parsePushResponse } from "../src/lib/push-response.ts";
const input = {
  appId: "synthetic",
  restApiKey: "SECRET_KEY",
  playerId: "SECRET_TOKEN",
  title: "test",
  body: "test",
};
test("FCM classification uses safe codes, never provider messages", () => {
  assert.equal(
    notificationDiagnostic({
      code: "messaging/mismatched-credential",
      message: "SECRET",
    }),
    "project-mismatch",
  );
  assert.equal(
    notificationDiagnostic({
      code: "messaging/registration-token-not-registered",
    }),
    "device-unregistered",
  );
  assert.equal(
    notificationDiagnostic({ code: "messaging/authentication-error" }),
    "credentials-invalid",
  );
  assert.equal(
    notificationDiagnostic({ code: "app/invalid-credential" }),
    "credentials-invalid",
  );
  assert.equal(
    notificationDiagnostic({ code: "messaging/third-party-auth-error" }),
    "delivery-config",
  );
  assert.equal(notificationDiagnostic(new Error("SECRET")), "unexpected");
});
test("diagnostic copy reconstructs allowlisted fields and preserves HTTP provenance", () => {
  const text = diagnosticText({
    tool: "fcm",
    code: "credentials-invalid",
    appStatus: 500,
    providerStatus: 401,
    token: "SECRET",
    message: "SECRET",
    fileName: "PRIVATE.apk",
  });
  assert.match(text, /Application HTTP: 500/);
  assert.match(text, /Provider HTTP: 401/);
  assert.doesNotMatch(text, /SECRET|PRIVATE/);
  assert.equal(diagnosticCode("SECRET"), "unexpected");
  assert.equal(diagnosticCode("__proto__"), "unexpected");
  assert.doesNotMatch(
    diagnosticText({
      tool: "SECRET",
      code: "SECRET",
      providerStatus: "SECRET",
    }),
    /SECRET/,
  );
});
test("app 500 and unexpected response cannot establish provider outage", async () => {
  const r = await parsePushResponse(
    new Response("not json", { status: 500 }),
    "fcm",
  );
  assert.equal(r.success, false);
  if (!r.success) assert.equal(r.diagnosticCode, "response-invalid");
  const r2 = await parsePushResponse(
    Response.json(
      {
        success: false,
        diagnosticCode: "SECRET",
        error: "SECRET",
        errorCode: "SECRET",
      },
      { status: 500 },
    ),
    "fcm",
  );
  assert.equal(r2.success, false);
  if (!r2.success) {
    assert.equal(r2.diagnosticCode, "unexpected");
    assert.doesNotMatch(JSON.stringify(r2), /SECRET/);
  }
});
test("OneSignal runtime schema rejects empty IDs, non-JSON, primitives and object errors safely", async () => {
  const original = globalThis.fetch;
  try {
    for (const body of [
      {},
      { id: "" },
      null,
      "SECRET",
      { id: 123 },
      { errors: { invalid_player_ids: ["SECRET_TOKEN"] } },
      { id: "x", errors: ["SECRET_KEY"] },
      { id: "x", errors: { detail: "SECRET" } },
      { id: "x", errors: "SECRET" },
    ]) {
      globalThis.fetch = async () => Response.json(body);
      const r = await sendOneSignalNotification(input);
      assert.equal(r.success, false);
      assert.doesNotMatch(JSON.stringify(r), /SECRET/);
    }
    globalThis.fetch = async () =>
      new Response("<html>SECRET</html>", { status: 502 });
    const r = await sendOneSignalNotification(input);
    assert.equal(r.success, false);
    assert.doesNotMatch(JSON.stringify(r), /SECRET/);
  } finally {
    globalThis.fetch = original;
  }
});
test("OneSignal acceptance requires valid ID and distinguishes upstream status and transport", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      Response.json({ id: "synthetic-id", errors: [] });
    assert.equal((await sendOneSignalNotification(input)).success, true);
    for (const [status, code] of [
      [401, "credentials-invalid"],
      [403, "credentials-invalid"],
      [429, "quota-exceeded"],
      [503, "provider-unavailable"],
    ] as const) {
      globalThis.fetch = async () => new Response("SECRET", { status });
      const r = await sendOneSignalNotification(input);
      assert.equal(r.diagnosticCode, code);
      assert.equal(r.providerStatus, status);
    }
    globalThis.fetch = async () => {
      throw new DOMException("SECRET", "TimeoutError");
    };
    assert.equal(
      (await sendOneSignalNotification(input)).diagnosticCode,
      "request-timeout",
    );
    globalThis.fetch = async () => {
      throw new TypeError("SECRET");
    };
    assert.equal(
      (await sendOneSignalNotification(input)).diagnosticCode,
      "network-error",
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("timeouts while reading the response body keep timeout classification", async () => {
  const response = new Response();
  response.json = async () => {
    throw new DOMException("SECRET", "TimeoutError");
  };
  const result = await parsePushResponse(response, "fcm");
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.diagnosticCode, "request-timeout");
  assert.doesNotMatch(JSON.stringify(result), /SECRET/);
});

test("OneSignal stops reading oversized provider bodies before schema parsing", async () => {
  const original = globalThis.fetch;
  let cancelled = false;
  try {
    globalThis.fetch = async () =>
      new Response(
        new ReadableStream({
          pull(c) {
            c.enqueue(new Uint8Array(70000));
          },
          cancel() {
            cancelled = true;
          },
        }),
      );
    const result = await sendOneSignalNotification(input);
    assert.equal(result.success, false);
    assert.equal(result.diagnosticCode, "response-invalid");
    assert.equal(cancelled, true);
  } finally {
    globalThis.fetch = original;
  }
});

test("OneSignal uses the official API origin and subscription targeting without redirects", async () => {
  const original = globalThis.fetch;
  let destination = "";
  let options: RequestInit | undefined;
  try {
    globalThis.fetch = async (url, init) => {
      destination = String(url);
      options = init;
      return Response.json({ id: "accepted" });
    };
    await sendOneSignalNotification(input);
    assert.equal(destination, "https://api.onesignal.com/notifications");
    assert.equal(options?.redirect, "error");
    const body = JSON.parse(String(options?.body));
    assert.deepEqual(body.include_subscription_ids, [input.playerId]);
    assert.equal(body.target_channel, "push");
    assert.equal("include_player_ids" in body, false);
  } finally {
    globalThis.fetch = original;
  }
});
