import { messaging } from '../config/firebase.js';
import { FCMMessagePayload, FCMResponse } from '../types/fcm.types.js';

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
}

export const fcmService = new FCMService();
