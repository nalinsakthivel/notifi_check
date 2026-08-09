# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Notifi Check — a small hub of free, client-first developer tools, all under one Next.js App
Router site:

- **Push Notification Tester** (`/push-notification-tester`) — send test pushes via Firebase
  Cloud Messaging or OneSignal. Credentials (a Firebase service account JSON, or a OneSignal App
  ID + REST API key) are posted once per request and never persisted server-side.
- **Privacy Policy Generator** (`/privacy-policy-generator`, tool at `/privacy-policy-generator/app`) —
  a 7-step wizard that assembles a Google Play–ready privacy policy. Entirely client-side; no
  server round-trip.
- **App Icon Generator** (`/app-icon-generator`) — upload one image, get a ZIP with every icon
  size for Android/iOS/Web-PWA/macOS/Windows. Entirely client-side (Canvas API + `fflate`); the
  image never leaves the browser.
- **Deep Link Tester** (`/deep-link-tester`) — parse a URL scheme or App Link, generate a QR code,
  and lint-check `assetlinks.json` / `apple-app-site-association`. Entirely client-side.
- **APK/AAB Analyzer** (`/apk-aab-analyzer`) — drag in an APK or AAB, parses the binary-XML
  manifest, permissions, signing cert, and size breakdown client-side; the file never leaves the
  browser.
- **Store Asset Resizer** (`/store-asset-resizer`) — resize screenshots to Play Store / App Store
  dimensions, export as a ZIP. Entirely client-side.
- **Data Safety Form Helper** (`/data-safety-form-helper`) — a worksheet for Google Play's Data
  Safety section, built on the same data catalog as the privacy policy generator. Entirely
  client-side.
- **FCM Payload Builder** (`/fcm-payload-builder`) — visually build the FCM HTTP v1 message JSON,
  export as cURL/Node.js/Flutter. Entirely client-side.
- **Feedback** (`/feedback`) — a form + floating action button (visible on every page) that emails
  the developer via Resend, with an optional screenshot attachment.

Shared invariant across every tool: nothing sensitive is persisted server-side. The push tester's
credentials are used once and discarded; every other tool either never calls a server at all, or
(feedback) only sends what the user explicitly submits.

## Commands

- `pnpm dev` — start dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

No test suite currently exists.

## Next.js version warning

`package.json` pins `next@16.2.10` — this is newer than the Claude training cutoff and has
breaking API/convention changes vs. what you already know. Before writing or changing any
Next.js-specific code (routing, route handlers, config, fonts, metadata), check
`node_modules/next/dist/docs/` for the current API rather than relying on memory. Relevant
subtrees: `01-app/02-guides`, `01-app/03-api-reference`.

## Route structure

`src/app/layout.tsx` is the true root layout: `<html>`/`<body>`, global fonts (Geist Mono),
sitewide metadata/OG/Twitter/robots defaults, viewport, and `<Analytics />`. It renders
`{children}` with no chrome.

`src/app/(notifi)/layout.tsx` is a route group — `(notifi)` adds no URL segment, it exists purely
so every "site" page shares `DevtoolsGuard`, `StatusBar`, `Footer`, and `FeedbackFab` without
forcing that chrome onto the non-page routes that live directly under `src/app` (`sitemap.ts`,
`robots.ts`, `opengraph-image.tsx`, and everything under `api/`).

All tool/guide pages live under `src/app/(notifi)/`:

| Route | Purpose |
| --- | --- |
| `/` | Tool-hub landing page — lists all tools. |
| `/push-notification-tester` | The FCM/OneSignal/web-push test-send tool (has its own `layout.tsx` for tool-specific metadata). |
| `/privacy-policy-generator` | SEO/marketing landing page for the policy generator. |
| `/privacy-policy-generator/app` | The actual 7-step generator (`PolicyGenerator`). |
| `/app-icon-generator` | Landing + tool combined on one page (`IconGenerator`). |
| `/deep-link-tester` | Landing + tool combined on one page (`DeepLinkTester`). |
| `/apk-aab-analyzer` | Landing + tool combined on one page (`ApkAnalyzer`). |
| `/store-asset-resizer` | Landing + tool combined on one page (`StoreAssetResizer`). |
| `/data-safety-form-helper` | Landing + tool combined on one page (`DataSafetyHelper`). |
| `/fcm-payload-builder` | Landing + tool combined on one page (`FcmPayloadBuilder`). |
| `/feedback` | Feedback form (`noindex`). |
| `/guide/*` | Four standalone reference/how-to pages (FCM error codes, FCM vs OneSignal, Firebase service account setup, OneSignal App ID/REST key setup). |

When adding a new tool, follow this checklist: route under `src/app/(notifi)/<tool>/page.tsx` →
add it to `src/app/sitemap.ts` → add a footer link in `src/components/footer.tsx` → add an entry
to the `tools` array (and its `jsonLd.itemListElement`) in `(notifi)/page.tsx`. `robots.ts` and
`opengraph-image.tsx` are shared and don't need per-tool changes unless a tool needs a distinct OG
image.

### SEO/metadata pattern

Every tool/guide `page.tsx` repeats the same recipe: a `title`/`description` const pair;
`export const metadata: Metadata` using `title: { absolute: title }` (bypasses the root layout's
template), `alternates.canonical`, `openGraph` (via the shared `/opengraph-image` route), and a
`twitter` card; a `jsonLd` object (`WebApplication` / `FAQPage` / `HowTo` / `BreadcrumbList` as
fits the content) rendered through `<script type="application/ld+json" dangerouslySetInnerHTML>`;
and a local `const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"`. Match
this pattern rather than inventing a new one.

## Push Notification Tester

Three API routes, two form components, driven by a tab switcher:

- [src/app/(notifi)/push-notification-tester/page.tsx](src/app/(notifi)/push-notification-tester/page.tsx) —
  client page with a tab switcher (`send` / `webpush` / `onesignal`) rendering `<SendForm mode="...">`
  for the FCM tabs and `<OneSignalForm>` for OneSignal.
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

## Privacy Policy Generator

Entirely client-side — the form never calls a server. Files under [src/lib/policy/](src/lib/policy/)
and [src/components/policy/generator.tsx](src/components/policy/generator.tsx):

- `types.ts` — `policySchema` (Zod, ~26 fields across app info, category/pricing, data/permissions/
  services arrays, children flag, policy options), the inferred `PolicyInput` type, `STEP_FIELDS`
  (field names grouped per wizard step, used for per-step validation), `emptyPolicyInput()`, and
  the static catalogs `DATA_GROUPS`, `PERMISSIONS`, `SERVICES` (28 SDKs, each with a category and
  privacy-policy URL).
- `templates.ts` — `TEMPLATES: PolicyTemplate[]`, 7 presets (education, business, ecommerce,
  healthcare, ai, finance, gaming) as `Partial<PolicyInput>` used to prefill the form.
- `engine.ts` — `generatePolicy(input: PolicyInput): string` is the core abstraction: it builds a
  markdown document section-by-section, and each of the ~15 sections (Introduction, Information
  Collected, How It's Used, Data Sharing, Third-Party Services, Android Permissions, Security,
  Children's Privacy, Retention, Your Rights, Deletion, Cookies, International Transfers, Changes,
  Contact) is included **conditionally** based on booleans/arrays derived from `input` (e.g.
  `usesAds`, `usesPayments`, `collectsLocation`, services filtered by category). Sections and
  sentences are skipped entirely when not applicable — this is not a fixed template with blanks
  filled in, output genuinely varies per answer combination. Also exports `markdownToHtml()` and
  `policyHtmlDocument()` for HTML export, both pure functions.
- `components/policy/generator.tsx` — the `PolicyGenerator` client component drives the 7-step
  wizard, validates per step via `policySchema`/`STEP_FIELDS`, autosaves in-progress input to
  `localStorage["ppg:draft"]`, and on the final step calls `generatePolicy(input)` directly in the
  browser. Recently generated policies are cached to `localStorage["ppg:recent"]`.

## App Icon Generator

Also entirely client-side (Canvas API + `fflate`, no upload). Files under [src/lib/icon/](src/lib/icon/)
and [src/components/icon/generator.tsx](src/components/icon/generator.tsx):

- `specs.ts` — `PlatformId` (`"android" | "ios" | "web" | "macos" | "windows"`), `IconSpec`,
  `PlatformSpec`, and the static `PLATFORMS: PlatformSpec[]` defining every output file per
  platform: Android mipmap densities (mdpi 48 → xxxhdpi 192) + Play Store 512; iOS's full
  `AppIcon.appiconset` (20/29/40/60/76/83.5pt @1x–3x + 1024 marketing, with `iosContentsJson()`
  generating the matching `Contents.json`); Web/PWA (16/32/48 favicons, apple-touch-icon 180,
  icon-192/512, maskable-512, `favicon.ico`, `site.webmanifest`); macOS iconset (16/32/128/256/512
  @1x/@2x); Windows `icon.ico` (16/32/48/256). Also `readmeText(selected)` for the bundled README.
- `generate.ts` — `loadSourceImage(file)` (decodes via `Image.decode()`, warns if non-square or
  <1024px), `renderPng(img, size, style, flags)` (Canvas stepped-halving downscale for quality,
  optional shape clip via `Path2D`/`roundRect`, optional background flatten/maskable padding,
  optional drop-shadow), `buildIco(entries)` (hand-rolled ICO binary packer — PNG-encoded entries
  per the modern ICO spec), `generateZip(img, options)` (renders every spec for selected platforms
  with a render cache keyed by size+flags, packs via `fflate`'s `zipSync` at `level: 0` since PNGs
  are already compressed), and `sanitizeFilename()`.
- `components/icon/generator.tsx` — `IconGenerator` client component: drag/drop or file-input
  upload → `loadSourceImage()` → live Canvas preview as background/padding/shape/effect controls
  change → `generateZip()` on submit → downloadable `.zip` via object URL.

## Feedback

- [src/app/api/feedback/send/route.ts](src/app/api/feedback/send/route.ts) — Node runtime route.
  Reads `multipart/form-data` (`message`, `email`, `page`, `screenshot`), validates message
  required + email regex + screenshot is an image ≤5MB, then sends via **Resend**
  (`RESEND_API_KEY`). Sent `to` `FEEDBACK_TO_EMAIL`, with `replyTo` set to the submitter's email
  if given, and the screenshot passed as a Resend `attachments` entry. The `from` address has a
  `TODO` to switch once a custom sending domain verifies in Resend.
- [src/components/feedback-form.tsx](src/components/feedback-form.tsx) — client form building a
  `FormData` (auto-injects `page: window.location.pathname`), mirrors the server's screenshot
  type/size validation client-side before POSTing.
- [src/components/feedback-fab.tsx](src/components/feedback-fab.tsx) — floating action button
  fixed bottom-right, links to `/feedback`, hides itself when already on that page (`usePathname()`).
  Mounted globally in `(notifi)/layout.tsx`.

## Shared/global pieces

- `src/components/status-bar.tsx` — top status bar: client-side uptime clock (resets on reload,
  not real server uptime), visitor counter fetched from `/api/visits` (POST once per session via
  a `sessionStorage` guard, GET on repeat visits), static "LIVE" indicator.
- `src/components/footer.tsx` — site-wide footer nav linking every tool + guide + feedback.
- `src/components/devtools-guard.tsx` — blocks the context menu and common devtools shortcuts
  (F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U). A UX deterrent, not a real security boundary.
- `src/components/check-pill.tsx` — generic controlled checkbox-as-pill (`label`, `checked`,
  `onChange`). Shared between the policy generator and icon generator forms — reuse it rather
  than writing another checkbox component.
- `src/lib/redis.ts` — singleton Upstash Redis client (`KV_REST_API_URL`/`KV_REST_API_TOKEN`).
  Only consumer is `src/app/api/visits/route.ts` (increments/reads a single
  `notifi_check:visits` key), backing the StatusBar visitor count.
- `src/lib/fcm-status.ts` — sessionStorage + CustomEvent pub/sub (`reportFcmStatus`,
  `readFcmStatus`, `onFcmStatusChange`) for tracking FCM up/down/unknown across components in a
  session.

## Environment variables

| Variable | Used by | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | root layout, `robots.ts`, `sitemap.ts`, every tool's `page.tsx` | Correct canonical/OG URLs in production |
| `GOOGLE_SITE_VERIFICATION` | root layout | Search Console verification |
| `RESEND_API_KEY` / `FEEDBACK_TO_EMAIL` | `src/app/api/feedback/send/route.ts` | Feedback emails to send at all |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | `src/lib/redis.ts` | Visitor counter in the StatusBar |

None of these are required for the push tester, policy generator, or icon generator to function —
those take credentials per-request from the user (or run entirely client-side) rather than from
server env vars.
