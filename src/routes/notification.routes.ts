import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';

const router = Router();

/**
 * @route POST /api/notifications/send
 * @desc Send a push notification via FCM
 * @access Public (Consider adding API key or Auth middleware for production)
 */
router.post('/send', notificationController.send);

/**
 * @route POST /api/notifications/web-push/send
 * @desc Send or validate a web push notification via FCM
 * @access Public (Consider adding API key or Auth middleware for production)
 */
router.post('/web-push/send', notificationController.sendWebPush);

export default router;
