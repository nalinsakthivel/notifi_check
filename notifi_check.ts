import { GoogleAuth } from "google-auth-library";
import axios, { AxiosResponse } from "axios";
import path from "path";

const SERVICE_ACCOUNT_PATH: string = path.join(
  __dirname,
  "./firebase_json/finishingschool-tnsdc-firebase-adminsdk-fbsvc-861927f09b.json"
);

const PROJECT_ID: string = "finishingschool-tnsdc";

const FCM_TOKEN: string =
  "dQpmSLR_Q0C37a3zPGAlPj:APA91bGIELa-jEdRTM-QnjH1KYWND9WJ3JCxUHP0RYQ3PrnXvvhW1qP3YL5dyiGFvzHGi0IQnNDcg9HqXC3FcWSgQZ1Ni3_y8HyCUlyQ6HXTPBUe2_qPbM4";

async function getAccessToken(): Promise<string | null> {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  return accessToken.token ?? null;
}

interface FCMMessage {
  message: {
    token: string;
    notification: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
  };
}

async function sendPushNotification(): Promise<void> {
  try {
    const token = await getAccessToken();

    if (!token) {
      throw new Error("Failed to retrieve access token");
    }

    const url: string = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

    const message: FCMMessage = {
      message: {
        token: FCM_TOKEN,
        notification: {
          title: "Hello from Node.js!",
          body: "This is a test notification 🚀",
        },
        data: {
          msgType: "openProfile",
        },
      },
    };

    const response: AxiosResponse = await axios.post(url, message, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Push notification sent successfully:", response.data);
  } catch (error: any) {
    console.error(
      "Error sending push notification:",
      error.response?.data || error.message
    );
  }
}

sendPushNotification();