// Public diagnostics are a finite catalog, never provider exception text.
export const DIAGNOSTICS = {
  "input-invalid": [
    "Input",
    "Check the request fields",
    "Use the required fields, valid service-account JSON and a JSON object containing string-valued data. No invalid values are included in this report.",
  ],
  "request-too-large": [
    "Input",
    "Request exceeds the safety limit",
    "Keep the entire multipart request under 256 KiB and the service-account file under 64 KiB. Reduce optional data and retry.",
  ],
  "credentials-invalid": [
    "Configuration",
    "Check provider credentials",
    "Use a Firebase service account with messaging access or the OneSignal app REST API key. Check permissions and key validity. Never share private keys or tokens in feedback.",
  ],
  "delivery-config": [
    "Configuration",
    "Check APNs or Web Push configuration",
    "For Apple devices, check the APNs key/certificate and environment in Firebase. For browsers, check Web Push credentials, service worker configuration and notification permission. Never share these keys or registration tokens.",
  ],
  "project-mismatch": [
    "Configuration",
    "Project or app does not match",
    "Use credentials and a registration token or subscription from the same Firebase project or OneSignal app. Check the app configuration before retrying.",
  ],
  "device-unregistered": [
    "Device",
    "Device or subscription is unavailable",
    "Obtain a fresh registration token or subscribed device ID from the test device. Check notification permission and subscription state.",
  ],
  "payload-invalid": [
    "Payload",
    "Provider rejected the payload",
    "Check string-valued data, supported payload sizes and HTTPS web-push links. Verify required title and body fields.",
  ],
  "quota-exceeded": [
    "Quota",
    "Provider quota or rate limit reached",
    "Wait for the provider retry interval and check project quotas. Do not repeatedly send the same notification.",
  ],
  "provider-unavailable": [
    "Provider",
    "Provider reported a service failure",
    "Check the provider status page and project logs. This report applies to this request, not a global outage. Acceptance or delivery may be unknown; check before sending again.",
  ],
  "network-error": [
    "Network",
    "Could not complete the network request",
    "Check connectivity and server egress configuration. This does not establish a provider outage. Acceptance or delivery is unknown; check provider logs before sending again.",
  ],
  "request-timeout": [
    "Timeout",
    "Request timed out",
    "Acceptance or delivery is unknown. Check provider logs and the test device before sending again; do not automatically retry.",
  ],
  "response-invalid": [
    "Response",
    "Received an unexpected response",
    "The server or provider returned an unsupported response. Acceptance or delivery is unknown. Check deployment/provider logs using this safe diagnostic code, not the submitted credentials.",
  ],
  unexpected: [
    "Unknown",
    "Could not complete the operation",
    "Retry only after checking the tool configuration and provider logs. For push requests, acceptance or delivery may be unknown. Report this safe diagnostic if the problem persists.",
  ],
  "package-input-invalid": [
    "Input",
    "Select an APK or AAB",
    "Choose an original .apk or .aab file exported by Android tooling. Other file types are not supported; renaming a generic ZIP does not make it an Android package. Files remain on this device.",
  ],
  "package-invalid": [
    "Archive",
    "Archive is malformed or corrupt",
    "Use a fresh APK/AAB exported by Android tooling. Check the download completed. This browser-only tool does not repair archives.",
  ],
  "package-unsupported": [
    "Compatibility",
    "Archive feature is unsupported",
    "Use a standard single-disk APK/AAB with stored or DEFLATE entries. ZIP64 and encrypted archives are not supported. Use Android Studio or bundletool for unsupported packages.",
  ],
  "package-limit": [
    "Safety limit",
    "Package exceeds an analysis budget",
    "Default limits include 512 MiB input, 16 MiB per extracted entry, 32 MiB total extraction and 200:1 expansion. Use Android Studio for larger packages; do not remove decompression protections.",
  ],
  "manifest-invalid": [
    "Manifest",
    "Manifest could not be parsed",
    "The manifest is malformed or uses unsupported binary XML. Size and signing results may still be available. Inspect the original with Android Studio or aapt2. Missing fields are not inferred.",
  ],
  "manifest-missing": [
    "Manifest",
    "No root APK manifest was found",
    "Check that this is an APK or AAB rather than a generic ZIP. Export the original package again; package and SDK information cannot be inferred.",
  ],
  "aab-manifest-unsupported": [
    "Compatibility",
    "AAB manifest details are unavailable",
    "AAB manifests use protobuf. This tool currently shows module and size information only. Use bundletool dump manifest for package, SDK and permission details.",
  ],
  "analysis-timeout": [
    "Timeout",
    "Analysis timeout",
    "Analysis exceeded the two-minute safety budget. Try a smaller package or inspect it with Android Studio. The local worker was terminated and no file was uploaded.",
  ],
  "worker-unavailable": [
    "Browser",
    "Analysis worker is unavailable",
    "Use a current browser with Web Workers enabled. Check extensions or browser policy, then retry. The package is never uploaded.",
  ],
} as const;
export type DiagnosticCode = keyof typeof DIAGNOSTICS;
export type DiagnosticTool =
  | "fcm"
  | "webpush"
  | "onesignal"
  | "apk_aab_analyzer";
export function diagnosticCode(
  value: unknown,
  fallback: DiagnosticCode = "unexpected",
): DiagnosticCode {
  return typeof value === "string" && Object.hasOwn(DIAGNOSTICS, value)
    ? (value as DiagnosticCode)
    : fallback;
}
export class DiagnosticError extends Error {
  readonly diagnosticCode: DiagnosticCode;
  constructor(code: DiagnosticCode, message?: string) {
    super(message ?? DIAGNOSTICS[code][1]);
    this.name = "DiagnosticError";
    this.diagnosticCode = code;
  }
}
export function errorDiagnostic(error: unknown): DiagnosticCode {
  return error instanceof DiagnosticError
    ? diagnosticCode(error.diagnosticCode)
    : "unexpected";
}
const FCM_CODES: Record<string, DiagnosticCode> = {
  "messaging/invalid-registration-token": "device-unregistered",
  "messaging/registration-token-not-registered": "device-unregistered",
  "messaging/mismatched-credential": "project-mismatch",
  "messaging/invalid-argument": "payload-invalid",
  "messaging/authentication-error": "credentials-invalid",
  "messaging/third-party-auth-error": "delivery-config",
  "messaging/quota-exceeded": "quota-exceeded",
  "messaging/message-rate-exceeded": "quota-exceeded",
  "messaging/device-message-rate-exceeded": "quota-exceeded",
  "messaging/topics-message-rate-exceeded": "quota-exceeded",
  "messaging/unavailable": "provider-unavailable",
  "messaging/server-unavailable": "provider-unavailable",
  "messaging/internal-error": "provider-unavailable",
  "app/invalid-credential": "credentials-invalid",
  "app/invalid-service-account": "credentials-invalid",
  "app/network-error": "network-error",
  "app/network-timeout": "request-timeout",
};
export function notificationDiagnostic(error: unknown): DiagnosticCode {
  if (error instanceof DiagnosticError) return errorDiagnostic(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? error.code
      : undefined;
  if (typeof code === "string" && Object.hasOwn(FCM_CODES, code))
    return FCM_CODES[code];
  if (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  )
    return "request-timeout";
  if (error instanceof TypeError) return "network-error";
  return "unexpected";
}
export function providerHttpDiagnostic(status: number): DiagnosticCode {
  if (status === 401 || status === 403) return "credentials-invalid";
  if (status === 429) return "quota-exceeded";
  if (status >= 500 && status <= 599) return "provider-unavailable";
  if (status === 400 || status === 404 || status === 422)
    return "payload-invalid";
  return "response-invalid";
}
export function safeHttpStatus(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 100 &&
    value <= 599
    ? value
    : undefined;
}
export function diagnosticText(value: unknown): string {
  const v =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const code = diagnosticCode(v.code);
  const [category, title, guidance] = DIAGNOSTICS[code];
  const tools = ["fcm", "webpush", "onesignal", "apk_aab_analyzer"];
  const tool =
    typeof v.tool === "string" && tools.includes(v.tool) ? v.tool : "unknown";
  const app = safeHttpStatus(v.appStatus),
    provider = safeHttpStatus(v.providerStatus);
  return [
    `Notifi Check diagnostic`,
    `Tool: ${tool}`,
    `Code: ${code}`,
    `Category: ${category}`,
    title,
    guidance,
    ...(app ? [`Application HTTP: ${app}`] : []),
    ...(provider ? [`Provider HTTP: ${provider}`] : []),
  ].join("\n");
}
