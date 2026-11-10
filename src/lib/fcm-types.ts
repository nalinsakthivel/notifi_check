import type { DiagnosticCode } from "./diagnostics.ts";
export interface FCMMessagePayload {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface WebPushMessagePayload extends FCMMessagePayload {
  link?: string;
  icon?: string;
  image?: string;
  validateOnly?: boolean;
}

export interface FCMResponse {
  success: boolean;
  messageId?: string;
  validated?: boolean;
  error?: string;
  errorCode?: string;
  diagnosticCode?: DiagnosticCode;
  providerStatus?: number;
}
