import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';

const router = Router();

/**
 * @route POST /api/notifications/send
 * @desc Send a push notification via FCM
 * @access Public (Consider adding API key or Auth middleware for production)
 */
router.post('/send', notificationController.send);

export default router;
