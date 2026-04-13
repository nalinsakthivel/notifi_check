import express from 'express';
import cors from 'cors';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'FCM Notification API is running' });
});

export default app;
