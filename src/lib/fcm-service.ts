import type { ServiceAccount } from "firebase-admin/app";
import { withMessaging } from "./firebase-admin";
import { FCMMessagePayload, FCMResponse, WebPushMessagePayload } from "./fcm-types";
import { toFirebaseLikeError } from "./errors";

export async function sendNotification(
  serviceAccount: ServiceAccount,
  payload: FCMMessagePayload
): Promise<FCMResponse> {
  try {
    return await withMessaging(serviceAccount, async (messaging) => {
      const message = {
        token: payload.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      };

      const messageId = await messaging.send(message);
      return { success: true, messageId };
    });
  } catch (rawError: unknown) {
    console.error("Error sending FCM message:", rawError);
    const error = toFirebaseLikeError(rawError);
    return {
      success: false,
      error: error.message || "Unknown error occurred while sending notification",
      errorCode: error.code,
    };
  }
}

export async function sendWebPushNotification(
  serviceAccount: ServiceAccount,
  payload: WebPushMessagePayload
): Promise<FCMResponse> {
  try {
    return await withMessaging(serviceAccount, async (messaging) => {
      const message = {
        token: payload.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon,
            image: payload.image,
          },
          fcmOptions: payload.link
            ? {
                link: payload.link,
              }
            : undefined,
        },
      };

      const messageId = await messaging.send(message, payload.validateOnly ?? false);
      return {
        success: true,
        messageId,
        validated: payload.validateOnly ?? false,
      };
    });
  } catch (rawError: unknown) {
    console.error("Error sending web push message:", rawError);
    const error = toFirebaseLikeError(rawError);
    return {
      success: false,
      error: error.message || "Unknown error occurred while sending web push notification",
      errorCode: error.code,
    };
  }
}
