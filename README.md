# FCM Notification API

A production-ready Node.js API to send push notifications using Firebase Cloud Messaging (FCM).

## Features

- **Express.js API**: Seamless integration with existing backend or frontend.
- **Firebase Admin SDK**: Secure and robust communication with FCM.
- **Environment Driven**: Configuration via `.env` for security and flexibility.
- **TypeScript**: Type-safe implementation with best practices.
- **Web Push Test Endpoint**: Send or validate browser push notifications with FCM web tokens.

## Prerequisites

- Node.js (version 20+ recommended)
- A Firebase Project
- A service account key JSON file from Firebase Console

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory (copy from below):
   ```env
   PORT=3000
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/your/serviceAccountKey.json
   ```

3. **Add Firebase Service Account**
   Place your Firebase service account JSON file in the project (e.g., in a `firebase_json` folder) and ensure the path in `.env` matches.

## Running the API

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Usage

### Send Push Notification

**Endpoint:** `POST /api/notifications/send`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "fcmToken": "DEVICE_TOKEN_HERE",
  "title": "Notification Title",
  "body": "Notification message body",
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "messageId": "projects/your-project-id/messages/0:1234567890abcdef"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: fcmToken, title, and body are required."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Detailed error message from Firebase..."
}
```

### Send Web Push Notification

**Endpoint:** `POST /api/notifications/web-push/send`

Use this endpoint to test browser push notifications. It accepts the same FCM registration token you get from the Firebase Web SDK.

**Request Body:**
```json
{
  "fcmToken": "WEB_DEVICE_TOKEN_HERE",
  "title": "Web Push Title",
  "body": "Web push message body",
  "link": "https://example.com",
  "icon": "https://example.com/icon.png",
  "image": "https://example.com/banner.png",
  "validateOnly": false,
  "data": {
    "source": "web"
  }
}
```

If `validateOnly` is set to `true`, Firebase validates the payload and token without delivering a real push notification.

**Success Response (200 OK):**
```json
{
  "success": true,
  "messageId": "projects/your-project-id/messages/0:1234567890abcdef",
  "validated": false
}
```

## Project Structure

```text
/src
  /config       # Firebase initialization
  /controllers  # HTTP request handling
  /services     # FCM business logic
  /routes       # API route definitions
  /types        # TypeScript interfaces
  app.ts        # Express app configuration
  server.ts     # Server entry point
```

## Security Note

For production, it is highly recommended to add authentication (e.g., API keys or Bearer tokens) to both notification endpoints to prevent unauthorized usage.
