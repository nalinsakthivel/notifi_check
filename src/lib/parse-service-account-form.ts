import type { ServiceAccount } from "firebase-admin/app";
import { MAX_CREDENTIAL_BYTES, checkRequestSize, InputError } from "./notification-validation";

export class BadRequestError extends InputError {}

interface RawServiceAccountJson {
  project_id?: string;
  private_key?: string;
  client_email?: string;
}

export async function parseServiceAccountForm(
  request: Request
): Promise<{ serviceAccount: ServiceAccount; fields: Record<string, string> }> {
  checkRequestSize(request);
  const form = await request.formData();
  const file = form.get("serviceAccount");

  if (!(file instanceof File)) {
    throw new BadRequestError("Missing required file field: serviceAccount (Firebase service account JSON).");
  }

  if (file.size > MAX_CREDENTIAL_BYTES) throw new BadRequestError("Service account file exceeds 64 KB.");
  let parsed: RawServiceAccountJson;
  try {
    parsed = JSON.parse(await file.text()) as RawServiceAccountJson;
  } catch {
    throw new BadRequestError("serviceAccount file is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" ||
      typeof parsed.project_id !== "string" || typeof parsed.private_key !== "string" || typeof parsed.client_email !== "string" ||
      !parsed.project_id || !parsed.private_key || !parsed.client_email) {
    throw new BadRequestError(
      "serviceAccount JSON is missing required fields (project_id, private_key, client_email)."
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId: parsed.project_id,
    privateKey: parsed.private_key,
    clientEmail: parsed.client_email,
  };

  const fields: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (key !== "serviceAccount" && typeof value === "string") {
      fields[key] = value;
    }
  }

  return { serviceAccount, fields };
}
