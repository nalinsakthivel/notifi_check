import { OneSignalMessagePayload, OneSignalResponse } from "./onesignal-types";
import { publicError } from "./notification-validation";

const ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications";
const REQUEST_TIMEOUT_MS = 12_000;

export async function sendOneSignalNotification(
  payload: OneSignalMessagePayload
): Promise<OneSignalResponse> {
  try {
    const res = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Key ${payload.restApiKey}`,
      },
      body: JSON.stringify({
        app_id: payload.appId,
        include_player_ids: [payload.playerId],
        headings: { en: payload.title },
        contents: { en: payload.body },
        url: payload.url || undefined,
        data: payload.data,
      }),
    });

    const json = await res.json();

    if (!res.ok || (Array.isArray(json.errors) && json.errors.length > 0)) {
      const message = `OneSignal rejected the request (HTTP ${res.status}). Check the app ID, API key, subscription ID and payload.`;
      return { success: false, error: message, errorCode: String(res.status) };
    }

    return { success: true, notificationId: json.id };
  } catch (rawError: unknown) {
    const message = publicError(rawError).message;
    return { success: false, error: message || "Unknown error occurred while sending notification" };
  }
}
