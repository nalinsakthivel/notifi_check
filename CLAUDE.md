# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

FCM & OneSignal Push Notification Tester — single-page Next.js app to send test push
notifications via Firebase Cloud Messaging or OneSignal. For FCM, the user uploads a Firebase
service account JSON in the browser; it's posted once to a server route, used to build an
ephemeral Firebase Admin app, and discarded. For OneSignal, the user pastes an App ID + REST API
key, posted once to a server route that calls the OneSignal REST API directly. Nothing is
persisted server-side (no DB, no auth, no session).

## Commands

- `pnpm dev` — start dev server (Turbopack)
- `pnpm build` — production build
- `pnpm lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

No test suite currently exists.

## Next.js version warning

`package.json` pins `next@16.2.10` — this is newer than the Claude training cutoff and has
breaking API/convention changes vs. what you already know. Before writing or changing any
Next.js-specific code (routing, route handlers, config, fonts, metadata), check
`node_modules/next/dist/docs/` for the current API rather than relying on memory. Relevant
subtrees: `01-app/02-guides`, `01-app/03-api-reference`.

## Architecture

App Router, three API routes, two form components, driven by a tab switcher:

- [src/app/page.tsx](src/app/page.tsx) — client page with a tab switcher (`send` / `webpush` /
  `onesignal`) rendering `<SendForm mode="...">` for the FCM tabs and `<OneSignalForm>` for
  OneSignal.
- [src/components/send-form.tsx](src/components/send-form.tsx) — FCM form. Submits
  `multipart/form-data` (service account file + fields) directly to one of the two FCM API routes
  depending on `mode`. Always calls `formEl.reset()` after the request (success or failure) so
  the uploaded JSON never lingers in the DOM.
- [src/components/onesignal-form.tsx](src/components/onesignal-form.tsx) — OneSignal form. No
  file upload — submits `multipart/form-data` with App ID, REST API key, player ID, and message
  fields to the OneSignal API route. Also resets after every request.
- [src/app/api/notifications/send/route.ts](src/app/api/notifications/send/route.ts) — plain FCM
  `notification` + `data` message.
- [src/app/api/notifications/web-push/send/route.ts](src/app/api/notifications/web-push/send/route.ts) —
  adds `webpush` block (icon/image/link) and supports `validateOnly` (dry-run via
  `messaging.send(message, true)`).
- [src/app/api/notifications/onesignal/send/route.ts](src/app/api/notifications/onesignal/send/route.ts) —
  parses the form directly (no service account), calls the OneSignal REST API
  (`POST https://onesignal.com/api/v1/notifications`, `Authorization: Key <restApiKey>`).

The two FCM routes follow the same pipeline:
`parseServiceAccountForm(request)` → build payload → `sendNotification`/`sendWebPushNotification`
→ `NextResponse.json`, with `BadRequestError` mapped to HTTP 400 and everything else normalized
through `toFirebaseLikeError` and returned as HTTP 500. The OneSignal route mirrors this shape
(400 for malformed input, 500 for provider/network failure) but has no shared credential parser
since there's no file upload.

Supporting lib modules ([src/lib/](src/lib/)):

- `parse-service-account-form.ts` — reads the multipart form, validates/parses the service
  account JSON (`project_id`, `private_key`, `client_email`), throws `BadRequestError` on any
  malformed input. Non-file fields pass through as a flat `Record<string, string>`. FCM-only.
- `firebase-admin.ts` — `withMessaging(serviceAccount, fn)`: initializes a uniquely-named
  (`ephemeral-${uuid}`) Firebase Admin app from the in-memory service account, hands the caller a
  `Messaging` instance, always `deleteApp`s it in a `finally`. This is the only place a Firebase
  Admin app is created — every request gets its own, never reused, never touches disk.
- `fcm-service.ts` — `sendNotification` / `sendWebPushNotification`, both wrap `withMessaging`
  and normalize thrown errors into `{ success: false, error, errorCode }` rather than throwing.
- `fcm-types.ts` — `FCMMessagePayload`, `WebPushMessagePayload extends FCMMessagePayload`,
  shared `FCMResponse` shape used by both FCM API responses and the client.
- `onesignal-service.ts` — `sendOneSignalNotification`: calls the OneSignal REST API directly via
  `fetch`, no SDK/admin-app lifecycle needed since it's a stateless HTTP call. Normalizes both
  HTTP-level failures and OneSignal's `errors[]` response field into `{ success: false, error,
  errorCode }`.
- `onesignal-types.ts` — `OneSignalMessagePayload`, `OneSignalResponse`, independent of the FCM
  types since the credential shape (App ID + REST API key, not a service account) differs.
- `errors.ts` — `toFirebaseLikeError`: normalizes any thrown value (Firebase Admin errors carry a
  `.code`) into `{ message, code?, name? }`. Used both server-side and client-side (in
  `send-form.tsx`) for consistent error shapes. FCM-only; the OneSignal route/form normalize
  errors inline since there's no Firebase-specific `.code` to extract.

Key invariant to preserve when touching this code: neither the Firebase service account nor the
OneSignal REST API key is ever written to disk or logged, and each FCM request's Admin app is
torn down even on error (the `try/finally` in `withMessaging`).
