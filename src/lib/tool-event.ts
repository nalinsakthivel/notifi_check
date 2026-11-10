const tools = [
  "push_notification_tester",
  "privacy_policy_generator",
  "app_icon_generator",
  "deep_link_tester",
  "apk_aab_analyzer",
  "store_asset_resizer",
  "data_safety_form_helper",
  "fcm_payload_builder",
] as const;
const actions = ["opened", "started", "succeeded", "failed"] as const;
const variants = ["fcm", "webpush", "onesignal"] as const;

export type ToolName = (typeof tools)[number];
export type ToolAction = (typeof actions)[number];
export type ToolVariant = (typeof variants)[number];
export type ToolEvent = {
  tool: ToolName;
  action: ToolAction;
  variant?: ToolVariant;
};

function member<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return (
    typeof value === "string" && values.some((allowed) => allowed === value)
  );
}

// Accept unknown at the boundary: TypeScript types cannot constrain JS or cast callers.
export function buildToolEvent(
  tool: unknown,
  action: unknown,
  variant?: unknown,
): ToolEvent | null {
  if (!member(tools, tool) || !member(actions, action)) return null;
  if (variant === undefined) return { tool, action };
  if (tool !== "push_notification_tester" || !member(variants, variant))
    return null;
  // Reconstruct every outgoing property; never spread or coerce caller input.
  return { tool, action, variant };
}
