import { z } from "zod";
import type {
  OneSignalMessagePayload,
  OneSignalResponse,
} from "./onesignal-types.ts";
import {
  DIAGNOSTICS,
  notificationDiagnostic,
  providerHttpDiagnostic,
  type DiagnosticCode,
} from "./diagnostics.ts";
const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";
const responseSchema = z.object({
  id: z.string().trim().min(1).max(256).optional(),
  errors: z
    .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
    .nullish(),
});
function failure(
  code: DiagnosticCode,
  providerStatus?: number,
): OneSignalResponse {
  return {
    success: false,
    error: DIAGNOSTICS[code][1],
    diagnosticCode: code,
    ...(providerStatus
      ? { providerStatus, errorCode: String(providerStatus) }
      : {}),
  };
}
async function boundedJson(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw Error("Empty body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 65536) {
        await reader.cancel();
        throw Error("Response limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let p = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, p);
    p += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function sendOneSignalNotification(
  payload: OneSignalMessagePayload,
): Promise<OneSignalResponse> {
  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Key ${payload.restApiKey}`,
      },
      body: JSON.stringify({
        app_id: payload.appId,
        include_subscription_ids: [payload.playerId],
        target_channel: "push",
        headings: { en: payload.title },
        contents: { en: payload.body },
        url: payload.url || undefined,
        data: payload.data,
      }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      return failure(providerHttpDiagnostic(response.status), response.status);
    }
    let value: unknown;
    try {
      value = await boundedJson(response);
    } catch (e) {
      return failure(
        e instanceof Error &&
          (e.name === "TimeoutError" || e.name === "AbortError")
          ? "request-timeout"
          : "response-invalid",
        response.status,
      );
    }
    const result = responseSchema.safeParse(value);
    if (!result.success) return failure("response-invalid", response.status);
    const { id, errors } = result.data;
    if (errors && Object.keys(errors).length) {
      return failure(
        !Array.isArray(errors) && Object.hasOwn(errors, "invalid_player_ids")
          ? "device-unregistered"
          : "payload-invalid",
        response.status,
      );
    }
    if (!id) return failure("response-invalid", response.status);
    return { success: true, notificationId: id };
  } catch (e) {
    return failure(notificationDiagnostic(e));
  }
}
