# Notifi Check

FCM Push Notification Tester — a single-page Next.js app to send test push notifications via
Firebase Cloud Messaging. Upload a Firebase service account JSON, fire a data/notification or
web-push message, and see the result. The credential is used once per request and never stored
or logged on the server.

Live at **[notifi-check.vercel.app](https://notifi-check.vercel.app)**.

## Features

- **Two send modes** — plain FCM `data`/`notification` messages, or web-push messages with
  icon/image/link and a `validateOnly` dry-run.
- **Stateless by design** — the service account is read once from the upload, used to build a
  throwaway Firebase Admin app, and discarded (`deleteApp` runs even on error).
- **Live status bar** — uptime clock, visitor count (Upstash Redis), and an FCM up/down indicator
  derived from your last send result this session.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You'll need a Firebase project with Cloud
Messaging enabled and a service account JSON (Project Settings → Service Accounts → Generate new
private key) to actually send a test push.

## Commands

- `pnpm dev` — start the dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint

## Environment variables

| Variable | Purpose | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL used for OpenGraph/canonical metadata | For production deploys |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis, used for the visitor counter | For the visitor counter to work |

None of these are required to send a test push — that flow only needs the service account JSON
uploaded through the form each time.

## Architecture

See [CLAUDE.md](CLAUDE.md) for the full request pipeline and module breakdown.

## Deployment

Deployed on [Vercel](https://vercel.com). Pushing to the connected branch triggers a deploy
automatically; the visitor counter needs an Upstash Redis integration wired up in the Vercel
project for `KV_REST_API_URL`/`KV_REST_API_TOKEN` to exist.
