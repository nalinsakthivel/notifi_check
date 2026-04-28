import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Notification endpoint: http://localhost:${PORT}/api/notifications/send`);
  console.log(`Web push endpoint: http://localhost:${PORT}/api/notifications/web-push/send`);
});
