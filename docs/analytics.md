# Privacy-safe product analytics

Vercel Analytics is already mounted in `src/app/layout.tsx`. This change adds a single allowlisted `tool_usage` custom event.

## Event properties
- `tool`: one of eight fixed tool identifiers
- `action`: `opened`, `started`, `succeeded`, or `failed`
- `variant`: optional `fcm`, `webpush`, or `onesignal`

Tool openings are recorded for eight interactive tool routes. The privacy-policy marketing page is intentionally excluded; the interactive wizard route is counted. Push tester start/success/failure events are recorded for all three providers. Other tools currently report *openings only*; their completion events require individual instrumentation.

No raw input, URLs, device tokens, Firebase service-account JSON, OneSignal credentials, payloads, file names, file contents, user IDs, or error strings are sent. Avoid adding dynamic properties to the analytics helper.

## Verification
1. Run `pnpm install && pnpm lint && pnpm build`.
2. Test navigation between tool pages and FCM/OneSignal form success and failure paths.
3. Review the Vercel preview deployment (if enabled), without promoting to production.
4. After an approved deployment, inspect Vercel Analytics custom events and confirm only allowlisted properties are present.

Note: event tracking is production-mode only; local development does not emit these events. Custom-event visibility and retention depend on Vercel plan and configuration. A page opening is not evidence of successful tool use.
