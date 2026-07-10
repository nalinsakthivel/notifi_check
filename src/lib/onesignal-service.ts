import { OneSignalMessagePayload, OneSignalResponse } from "./onesignal-types";

const ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications";

export async function sendOneSignalNotification(
  payload: OneSignalMessagePayload
): Promise<OneSignalResponse> {
  try {
    const res = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
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
      const message = Array.isArray(json.errors) ? json.errors.join(", ") : `HTTP ${res.status}`;
      return { success: false, error: message, errorCode: String(res.status) };
    }

    return { success: true, notificationId: json.id };
  } catch (rawError: unknown) {
    console.error("Error sending OneSignal notification:", rawError);
    const message = rawError instanceof Error ? rawError.message : String(rawError);
    return { success: false, error: message || "Unknown error occurred while sending notification" };
  }
}
