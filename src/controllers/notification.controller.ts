import { Request, Response } from 'express';
import { fcmService } from '../services/fcm.service.js';
import { FCMMessagePayload } from '../types/fcm.types.js';

export class NotificationController {
  async send(req: Request, res: Response): Promise<void> {
    try {
      const { fcmToken, title, body, data } = req.body;

      // Basic validation
      if (!fcmToken || !title || !body) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: fcmToken, title, and body are required.',
        });
        return;
      }

      const payload: FCMMessagePayload = {
        fcmToken,
        title,
        body,
        data,
      };

      const result = await fcmService.sendNotification(payload);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error: any) {
      console.error('Unhandled error in NotificationController:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'An unexpected error occurred',
      });
    }
  }
}

export const notificationController = new NotificationController();
