# Notifi Check

A small hub of free, client-first developer tools for app builders — all under one Next.js App
Router site. Nothing sensitive is persisted server-side: credentials are used once per request and
discarded, and most tools never call a server at all.

Live at **[notifi-check.vercel.app](https://notifi-check.vercel.app)**.

## Tools

- **Push Notification Tester** (`/push-notification-tester`) — send a real FCM or OneSignal test
  push from the browser. Service account JSON or REST API key, used once per request, never
  stored.
- **Privacy Policy Generator** (`/privacy-policy-generator`) — a 7-step wizard that assembles a
  Google Play–ready privacy policy. Entirely client-side.
- **App Icon Generator** (`/app-icon-generator`) — upload one image, get every icon size for
  Android/iOS/Web-PWA/macOS/Windows. Entirely client-side.
- **Deep Link Tester** (`/deep-link-tester`) — parse a URL scheme or App Link, generate a QR code,
  and lint-check `assetlinks.json` / `apple-app-site-association`.
- **APK/AAB Analyzer** (`/apk-aab-analyzer`) — drag in an APK or AAB for package info, SDK
  versions, permissions, signing cert fingerprint, and a size breakdown. Entirely client-side.
- **Store Asset Resizer** (`/store-asset-resizer`) — resize screenshots to Play Store / App Store
  dimensions, export as a ZIP. Entirely client-side.
- **Data Safety Form Helper** (`/data-safety-form-helper`) — a worksheet for Google Play's Data
  Safety section, built on the same data catalog as the privacy policy generator.
- **FCM Payload Builder** (`/fcm-payload-builder`) — visually build an FCM HTTP v1 message JSON,
  export as cURL, Node.js, or Flutter.
- **Feedback** (`/feedback`) — a form + floating action button on every page that emails the
  maintainer, with an optional screenshot attachment.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Every tool works out of the box — most need
no environment variables at all, since credentials/inputs are supplied per-request or the tool
runs entirely in your browser.

## Commands

- `pnpm dev` — start the dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint

## Environment variables

Copy [.env.example](.env.example) to `.env.local` and fill in what you need. All are optional —
see the table below for what each one unlocks.

| Variable | Purpose | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL for canonical/OpenGraph metadata | Correct URLs in production |
| `GOOGLE_SITE_VERIFICATION` | Search Console verification | Search Console only |
| `RESEND_API_KEY` / `FEEDBACK_TO_EMAIL` | Sends feedback form submissions via [Resend](https://resend.com) | Feedback emails to send at all |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | [Upstash Redis](https://upstash.com), backs the visitor counter | Visitor counter in the status bar |

None of these are required for the push tester, policy generator, icon generator, deep link
tester, APK/AAB analyzer, store asset resizer, data safety helper, or FCM payload builder to
function.

## Architecture

See [CLAUDE.md](CLAUDE.md) for the full route structure, module breakdown, and conventions this
codebase follows.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
