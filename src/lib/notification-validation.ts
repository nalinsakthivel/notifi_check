import { z } from "zod";

export const MAX_CREDENTIAL_BYTES = 64 * 1024;
export const MAX_REQUEST_BYTES = 256 * 1024;
export const MAX_FIELD_LENGTH = 4096;

const dataSchema = z.record(z.string().min(1).max(128), z.string().max(MAX_FIELD_LENGTH));

export function parseNotificationData(raw: string | undefined): Record<string, string> | undefined {
  if (!raw?.trim()) return undefined;
  if (raw.length > 16 * 1024) throw new InputError("Data payload exceeds 16 KB.");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new InputError("Data payload must be valid JSON."); }
  const parsed = dataSchema.safeParse(value);
  if (!parsed.success) throw new InputError("Data payload must be an object of string keys and string values.");
  return parsed.data;
}

export class InputError extends Error {
  constructor(message: string) { super(message); this.name = "InputError"; }
}

export function requireFields(fields: Record<string, string>, names: string[]): void {
  for (const name of names) {
    if (!fields[name]?.trim()) throw new InputError(`Missing required field: ${name}.`);
    if (fields[name].length > MAX_FIELD_LENGTH) throw new InputError(`Field ${name} is too long.`);
  }
}

export function checkRequestSize(request: Request): void {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_REQUEST_BYTES) throw new InputError("Request exceeds 256 KB.");
}

export function publicError(error: unknown): { message: string; code?: string } {
  if (error instanceof InputError) return { message: error.message };
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code : undefined;
  const safeCodes = new Set([
    "messaging/invalid-registration-token", "messaging/registration-token-not-registered",
    "messaging/mismatched-credential", "messaging/invalid-argument",
    "messaging/authentication-error", "messaging/third-party-auth-error",
    "messaging/quota-exceeded", "messaging/unavailable", "messaging/internal-error",
  ]);
  return { message: "Notification request failed. Check credentials, token and provider configuration.", ...(code && safeCodes.has(code) ? { code } : {}) };
}
