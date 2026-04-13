import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not defined in environment variables');
}

// Resolve path relative to the root directory
const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(resolvedPath),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

export const messaging = admin.messaging();

console.log('Firebase Admin initialized successfully');
