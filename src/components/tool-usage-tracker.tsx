"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackToolEvent, type ToolName } from "@/lib/tool-analytics";

const routes: Record<string, ToolName> = {
  "/push-notification-tester": "push_notification_tester",
  "/privacy-policy-generator/app": "privacy_policy_generator",
  "/app-icon-generator": "app_icon_generator",
  "/deep-link-tester": "deep_link_tester",
  "/apk-aab-analyzer": "apk_aab_analyzer",
  "/store-asset-resizer": "store_asset_resizer",
  "/data-safety-form-helper": "data_safety_form_helper",
  "/fcm-payload-builder": "fcm_payload_builder",
};

export function ToolUsageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const tool = routes[pathname];
    if (tool) trackToolEvent(tool, "opened");
  }, [pathname]);
  return null;
}
