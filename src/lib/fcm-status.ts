export type FcmStatus = "unknown" | "up" | "down";

const STORAGE_KEY = "notifi_check_fcm_status";
const EVENT_NAME = "notifi-check:fcm-status";

export function reportFcmStatus(status: FcmStatus) {
  sessionStorage.setItem(STORAGE_KEY, status);
  window.dispatchEvent(new CustomEvent<FcmStatus>(EVENT_NAME, { detail: status }));
}

export function readFcmStatus(): FcmStatus {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored === "up" || stored === "down" ? stored : "unknown";
}

export function onFcmStatusChange(handler: (status: FcmStatus) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<FcmStatus>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
