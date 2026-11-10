# Privacy-safe product analytics

Vercel Analytics is already mounted in `src/app/layout.tsx`. This change adds a single allowlisted `tool_usage` custom event.

## Event properties
- `tool`: one of eight fixed tool identifiers
- `action`: `opened`, `started`, `succeeded`, or `failed`
- `variant`: optional `fcm`, `webpush`, or `onesignal`

Tool openings are recorded for eight interactive tool routes. The privacy-policy marketing page is intentionally excluded; the interactive wizard route is counted. Push tester start/success/failure events are recorded for all three providers. The APK/AAB analyzer records `started` when a selected file begins analysis, `succeeded` when the current analysis returns a result, and `failed` on a current analysis error (including timeout or worker failure). Cancelling, replacing a running analysis, or leaving the page does not record a failure or success for the cancelled attempt. Other tools currently report *openings only*; their completion events require individual instrumentation.

A push `succeeded` event means the provider accepted the request; it does not confirm delivery to a device or that a notification was displayed. Analyzer success means local analysis completed, not that an app passed store review or a security audit.

No raw input, URLs, device tokens, Firebase service-account JSON, OneSignal credentials, payloads, file names, file contents, user IDs, or error strings are sent. The helper validates exact primitive string membership at runtime, including calls from JavaScript or TypeScript casts. Invalid events are dropped. Variants are accepted only for the push tester. Outgoing properties are reconstructed by the dependency-free `buildToolEvent` boundary; caller objects and extra fields are never forwarded. Avoid adding dynamic properties to the analytics helper.

## Verification
1. Run `npm test`, `npm run lint`, and `npm run build`. The analytics tests exercise the real outgoing-property builder without sending events to Vercel.
2. Test navigation between tool pages and FCM/OneSignal form success and failure paths.
3. Review the Vercel preview deployment (if enabled), without promoting to production.
4. After an approved deployment, inspect Vercel Analytics custom events and confirm only allowlisted properties are present.

Note: event tracking is production-mode only; local development does not emit these events. Custom-event visibility and retention depend on Vercel plan and configuration. Browser blocking, connectivity, and SDK sampling or delivery behavior can leave gaps; event counts are not an audit log. Dashboard counts cannot establish device delivery or a reliable end-to-end completion rate. A page opening is not evidence of successful tool use.
