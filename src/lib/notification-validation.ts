import { z } from "zod";
import { DiagnosticError, type DiagnosticCode } from "./diagnostics.ts";

export const MAX_CREDENTIAL_BYTES = 64 * 1024;
export const MAX_REQUEST_BYTES = 256 * 1024;
export const MAX_FIELD_LENGTH = 4096;

const dataSchema = z.record(
  z.string().min(1).max(128),
  z.string().max(MAX_FIELD_LENGTH),
);

export function parseNotificationData(
  raw: string | undefined,
): Record<string, string> | undefined {
  if (!raw?.trim()) return undefined;
  if (raw.length > 16 * 1024)
    throw new InputError("Data payload exceeds 16 KB.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new InputError("Data payload must be valid JSON.");
  }
  const parsed = dataSchema.safeParse(value);
  if (!parsed.success)
    throw new InputError(
      "Data payload must be an object of string keys and string values.",
    );
  return parsed.data;
}

export class InputError extends DiagnosticError {
  constructor(message: string, code: DiagnosticCode = "input-invalid") {
    super(code, message);
    this.name = "InputError";
  }
}

export function requireFields(
  fields: Record<string, string>,
  names: string[],
): void {
  for (const name of names) {
    if (!fields[name]?.trim())
      throw new InputError(`Missing required field: ${name}.`);
    if (fields[name].length > MAX_FIELD_LENGTH)
      throw new InputError(`Field ${name} is too long.`);
  }
}

export function checkRequestSize(request: Request): void {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_REQUEST_BYTES)
    throw new InputError("Request exceeds 256 KB.", "request-too-large");
}

export function publicError(error: unknown): {
  message: string;
  code?: string;
} {
  if (error instanceof InputError) return { message: error.message };
  const code =
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;
  const safeCodes = new Set([
    "messaging/invalid-registration-token",
    "messaging/registration-token-not-registered",
    "messaging/mismatched-credential",
    "messaging/invalid-argument",
    "messaging/authentication-error",
    "messaging/third-party-auth-error",
    "messaging/quota-exceeded",
    "messaging/unavailable",
    "messaging/internal-error",
  ]);
  return {
    message:
      "Notification request failed. Check credentials, token and provider configuration.",
    ...(code && safeCodes.has(code) ? { code } : {}),
  };
}

/** Count actual streamed bytes before invoking the multipart parser. */
export async function readNotificationForm(
  request: Request,
): Promise<FormData> {
  try {
    checkRequestSize(request);
  } catch (e) {
    await request.body?.cancel();
    throw e;
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    await request.body?.cancel();
    throw new InputError("Use a multipart form request.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("Request body is missing.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new InputError("Request exceeds 256 KB.", "request-too-large");
      }
      chunks.push(value);
    }
  } catch (e) {
    if (e instanceof InputError) throw e;
    throw new InputError("Request body could not be read.");
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  let form: FormData;
  try {
    form = await new Response(body, {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    throw new InputError(
      "Malformed multipart form. Select the fields again and retry.",
    );
  }
  const names = new Set<string>();
  for (const [name] of form) {
    if (names.has(name))
      throw new InputError("Duplicate form fields are not supported.");
    names.add(name);
  }
  return form;
}
export function validateOptionalUrl(
  raw: string | undefined,
): string | undefined {
  if (!raw?.trim()) return undefined;
  if (raw.length > MAX_FIELD_LENGTH)
    throw new InputError("Optional URL is too long.");
  try {
    const url = new URL(raw);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw Error();
  } catch {
    throw new InputError(
      "Optional links and images must be valid HTTP(S) URLs without embedded credentials.",
    );
  }
  return raw;
}
