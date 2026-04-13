export interface FCMMessagePayload {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
