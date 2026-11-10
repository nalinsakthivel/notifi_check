import { z } from "zod";
import {
  diagnosticCode,
  safeHttpStatus,
  type DiagnosticCode,
} from "./diagnostics.ts";
export type PushResult =
  | {
      success: true;
      messageId?: string;
      notificationId?: string;
      validated?: boolean;
    }
  | {
      success: false;
      diagnosticCode: DiagnosticCode;
      appStatus?: number;
      providerStatus?: number;
    };
const successSchema = z.object({
  success: z.literal(true),
  messageId: z.string().min(1).max(1024).optional(),
  notificationId: z.string().min(1).max(256).optional(),
  validated: z.boolean().optional(),
});
export async function parsePushResponse(
  response: Response,
  tool: "fcm" | "webpush" | "onesignal",
): Promise<PushResult> {
  let value: unknown;
  try {
    value = await response.json();
  } catch (e) {
    return {
      success: false,
      diagnosticCode:
        e instanceof Error &&
        (e.name === "TimeoutError" || e.name === "AbortError")
          ? "request-timeout"
          : "response-invalid",
      appStatus: response.status,
    };
  }
  const parsed = successSchema.safeParse(value);
  if (
    response.ok &&
    parsed.success &&
    (tool === "onesignal" ? parsed.data.notificationId : parsed.data.messageId)
  )
    return parsed.data;
  const v =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const code =
    v.success === false
      ? diagnosticCode(
          v.diagnosticCode,
          response.status === 400 ? "input-invalid" : "unexpected",
        )
      : "response-invalid";
  return {
    success: false,
    diagnosticCode: code,
    appStatus: response.status,
    ...(safeHttpStatus(v.providerStatus)
      ? { providerStatus: safeHttpStatus(v.providerStatus) }
      : {}),
  };
}
const ENDPOINTS = {
  fcm: "/api/notifications/send",
  webpush: "/api/notifications/web-push/send",
  onesignal: "/api/notifications/onesignal/send",
} as const;
export async function requestPush(
  form: FormData,
  tool: keyof typeof ENDPOINTS,
): Promise<PushResult> {
  if (!Object.hasOwn(ENDPOINTS, tool))
    return { success: false, diagnosticCode: "input-invalid" };
  try {
    return await parsePushResponse(
      await fetch(ENDPOINTS[tool], {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(20000),
        redirect: "error",
        cache: "no-store",
      }),
      tool,
    );
  } catch (e) {
    return {
      success: false,
      diagnosticCode:
        e instanceof Error &&
        (e.name === "TimeoutError" || e.name === "AbortError")
          ? "request-timeout"
          : "network-error",
    };
  }
}
