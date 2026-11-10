"use client";

import { track } from "@vercel/analytics";
import {
  buildToolEvent,
  type ToolName,
  type ToolAction,
  type ToolVariant,
} from "./tool-event.ts";

export type { ToolName, ToolAction } from "./tool-event.ts";

// The pure builder is the sole boundary for outgoing custom event properties.
export function trackToolEvent(
  tool: ToolName,
  action: ToolAction,
  variant?: ToolVariant,
) {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production")
    return;
  const properties = buildToolEvent(tool, action, variant);
  if (properties) track("tool_usage", properties);
}
