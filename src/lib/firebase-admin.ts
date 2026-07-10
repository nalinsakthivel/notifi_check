import { initializeApp, cert, deleteApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { randomUUID } from "crypto";

/**
 * Builds a throwaway admin app from an in-memory service account object.
 * App is deleted after use — nothing here ever touches disk.
 */
export async function withMessaging<T>(
  serviceAccount: ServiceAccount,
  fn: (messaging: Messaging) => Promise<T>
): Promise<T> {
  const app = initializeApp({ credential: cert(serviceAccount) }, `ephemeral-${randomUUID()}`);

  try {
    return await fn(getMessaging(app));
  } finally {
    await deleteApp(app);
  }
}
