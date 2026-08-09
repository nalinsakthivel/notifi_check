import type { ServiceCategory } from "@/lib/policy/types";

/** Google Play Console's fixed "Purpose of collection" list (Data safety form). */
export const PURPOSES = [
  "App functionality",
  "Analytics",
  "Developer communications",
  "Advertising or marketing",
  "Fraud prevention, security, and compliance",
  "Personalization",
  "Account management",
] as const;

export type Purpose = (typeof PURPOSES)[number];

/**
 * Convenience hint only — maps a service's existing `category` to the purpose(s) a developer
 * likely wants to check. Never drives the output directly; the user's own checkbox selections do.
 */
export const CATEGORY_PURPOSE_HINTS: Partial<Record<ServiceCategory, Purpose[]>> = {
  analytics: ["Analytics"],
  crash: ["Analytics", "App functionality"],
  ads: ["Advertising or marketing"],
  attribution: ["Advertising or marketing", "Analytics"],
  auth: ["Account management", "App functionality"],
  payments: ["Account management", "Fraud prevention, security, and compliance"],
  push: ["App functionality"],
  cloud: ["App functionality"],
  maps: ["App functionality"],
  platform: ["App functionality"],
  ai: ["App functionality"],
  social: ["App functionality", "Personalization"],
  other: [],
};
