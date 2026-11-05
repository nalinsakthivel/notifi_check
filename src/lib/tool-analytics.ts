"use client";

import { track } from "@vercel/analytics";

export type ToolName =
  | "push_notification_tester" | "privacy_policy_generator"
  | "app_icon_generator" | "deep_link_tester"
  | "apk_aab_analyzer" | "store_asset_resizer"
  | "data_safety_form_helper" | "fcm_payload_builder";

export type ToolAction = "opened" | "started" | "succeeded" | "failed";

// Strict allowlists: never accept arbitrary URLs, payloads, tokens, file names,
// identifiers, or error messages as analytics properties.
export function trackToolEvent(tool: ToolName, action: ToolAction, variant?: "fcm" | "webpush" | "onesignal") {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return;
  track("tool_usage", variant ? { tool, action, variant } : { tool, action });
}
