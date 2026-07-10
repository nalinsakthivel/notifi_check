# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

FCM Push Notification Tester — single-page Next.js app to send test push notifications via
Firebase Cloud Messaging. User uploads a Firebase service account JSON in the browser, it's
posted once to a server route, used to build an ephemeral Firebase Admin app, and discarded.
Nothing is persisted server-side (no DB, no auth, no session).

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

App Router, two API routes, one shared form component driving both:

- [src/app/page.tsx](src/app/page.tsx) — client page with a tab switcher (`send` vs `webpush`)
  rendering `<SendForm mode="...">` for each.
- [src/components/send-form.tsx](src/components/send-form.tsx) — the only form. Submits
  `multipart/form-data` (service account file + fields) directly to one of the two API routes
  depending on `mode`. Always calls `formEl.reset()` after the request (success or failure) so
  the uploaded JSON never lingers in the DOM.
- [src/app/api/notifications/send/route.ts](src/app/api/notifications/send/route.ts) — plain FCM
  `notification` + `data` message.
- [src/app/api/notifications/web-push/send/route.ts](src/app/api/notifications/web-push/send/route.ts) —
  adds `webpush` block (icon/image/link) and supports `validateOnly` (dry-run via
  `messaging.send(message, true)`).

Both routes follow the same pipeline:
`parseServiceAccountForm(request)` → build payload → `sendNotification`/`sendWebPushNotification`
→ `NextResponse.json`, with `BadRequestError` mapped to HTTP 400 and everything else normalized
through `toFirebaseLikeError` and returned as HTTP 500.

Supporting lib modules ([src/lib/](src/lib/)):

- `parse-service-account-form.ts` — reads the multipart form, validates/parses the service
  account JSON (`project_id`, `private_key`, `client_email`), throws `BadRequestError` on any
  malformed input. Non-file fields pass through as a flat `Record<string, string>`.
- `firebase-admin.ts` — `withMessaging(serviceAccount, fn)`: initializes a uniquely-named
  (`ephemeral-${uuid}`) Firebase Admin app from the in-memory service account, hands the caller a
  `Messaging` instance, always `deleteApp`s it in a `finally`. This is the only place a Firebase
  Admin app is created — every request gets its own, never reused, never touches disk.
- `fcm-service.ts` — `sendNotification` / `sendWebPushNotification`, both wrap `withMessaging`
  and normalize thrown errors into `{ success: false, error, errorCode }` rather than throwing.
- `fcm-types.ts` — `FCMMessagePayload`, `WebPushMessagePayload extends FCMMessagePayload`,
  shared `FCMResponse` shape used by both API responses and the client.
- `errors.ts` — `toFirebaseLikeError`: normalizes any thrown value (Firebase Admin errors carry a
  `.code`) into `{ message, code?, name? }`. Used both server-side and client-side (in
  `send-form.tsx`) for consistent error shapes.

Key invariant to preserve when touching this code: the service account credential is never
written to disk or logged, and each request's Admin app is torn down even on error (the
`try/finally` in `withMessaging`).
