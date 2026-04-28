import { messaging } from '../config/firebase.js';
import {
  FCMMessagePayload,
  FCMResponse,
  WebPushMessagePayload,
} from '../types/fcm.types.js';

export class FCMService {
  async sendNotification(payload: FCMMessagePayload): Promise<FCMResponse> {
    try {
      const message = {
        token: payload.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      };

      const response = await messaging.send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error: any) {
      console.error('Error sending FCM message:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending notification',
      };
    }
  }

  async sendWebPushNotification(payload: WebPushMessagePayload): Promise<FCMResponse> {
    try {
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

      const response = await messaging.send(message, payload.validateOnly ?? false);

      return {
        success: true,
        messageId: response,
        validated: payload.validateOnly ?? false,
      };
    } catch (error: any) {
      console.error('Error sending web push message:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending web push notification',
      };
    }
  }
}

export const fcmService = new FCMService();
