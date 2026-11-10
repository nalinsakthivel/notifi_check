import type { DiagnosticCode } from "./diagnostics.ts";
export interface OneSignalMessagePayload {
  appId: string;
  restApiKey: string;
  playerId: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

export interface OneSignalResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
  errorCode?: string;
  diagnosticCode?: DiagnosticCode;
  providerStatus?: number;
}
