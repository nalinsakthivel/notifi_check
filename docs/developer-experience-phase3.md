# Phase 3: diagnostics and production validation

## What changed

Push and package errors now use a finite diagnostic catalog. The shared result panel provides guidance, application/provider HTTP provenance, keyboard-accessible copy controls, clipboard failure feedback, and links to the existing feedback page and GitHub issues. Mobile text wraps; diagnostic text has increased contrast. Provider acceptance and dry-run validation are explicitly distinguished from device delivery.

The copied report contains only fixed tool/code/category/guidance and validated numeric statuses. It never serializes provider bodies or copies credentials, tokens, message IDs, filenames, package names, certificate fingerprints, permissions or file contents. User-initiated field copying in the analyzer remains available separately. Feedback submission is always explicit; remove private data and inspect screenshots before submitting them.

### Reliability fixes

- OneSignal responses use the existing Zod dependency at runtime. Missing/empty/wrong-type IDs, primitive/non-JSON bodies, array/object errors and oversized responses cannot become success. Upstream 401/403, 429 and 5xx responses are classified separately from application failures. Provider response bodies are capped at 64 KiB and never returned to the browser.
- Requests now use the current official `https://api.onesignal.com/notifications` endpoint and `include_subscription_ids` with `target_channel: push`. Redirects are disabled. This follows OneSignal's official [server configuration](https://github.com/OneSignal/onesignal-node-api/blob/main/servers.ts) and [notification model](https://github.com/OneSignal/onesignal-node-api/blob/main/models/Notification.ts); it avoids relying on legacy origin/targeting aliases. The form still accepts the existing player/subscription ID field.
- Multipart bytes are counted before parsing, independently of missing/dishonest Content-Length. The reader is cancelled when the 256 KiB budget is exceeded. Duplicate fields, malformed multipart, whitespace-only required fields, excessive optional URL lengths and unsupported URL schemes fail safely. Credential files remain capped at 64 KiB.
- Firebase SDK failures are mapped only from known codes: credential/project mismatch, stale token, payload, quota, APNs/Web Push configuration and service/network failures. Raw SDK exceptions are not displayed. Firebase apps retain their existing per-request finally cleanup.
- The browser validates successful response shapes and uses a 20-second transport timeout. OneSignal retains its 12-second abortable upstream timeout. A timeout means acceptance/delivery is unknown, not that nothing was sent; there are no automatic retries or Promise.race SDK cleanup shortcuts. An application error no longer writes a global FCM-down status.
- Analyzer failures carry typed catalog codes through the existing worker/controller. Unknown error strings never reach diagnostics. Optional result diagnostic arrays are checked and reconstructed from catalog values; malformed arrays fail safely. Partial manifest/AAB results retain their limitations and useful size/signing facts. Cancellation and resource ceilings remain unchanged.
- Tool events now have runtime allowlists and reconstruct only fixed tool/action/optional variant properties. Analyzer lifecycle events and push variants are covered. Cancellation and supersession do not emit failure; no diagnostic text or user input is an analytics property. See [analytics.md](analytics.md).

## Self-hosted font

The same Geist Mono family is loaded through supported `next/font/local`, preserving the CSS variable, variable weights 100–900 and swap behavior. The unmodified official font and SIL Open Font License are vendored under `src/app/fonts`. Provenance and verified package integrity/file checksums are recorded in [the font README](../src/app/fonts/README.md). No new runtime dependency, internal Next.js asset reference, font mock, TLS exception or Google build-time fetch is needed.

## Validation results

- `npm test`: **61 passed, 0 failed**, retaining the original 39 tests. New tests cover OneSignal schemas/status/transport/body limits/current endpoint, safe diagnostic copying, app/provider provenance, response-body timeout classification, streamed input bounds/cancellation, URLs, worker diagnostic boundaries, analytics runtime guards and font integrity.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- Plain `npm run build`: passed, including TypeScript and all 26 static pages, with no font test hook or Google Fonts access. Existing optional Upstash visitor-counter configuration warnings remain.
- Production-server Chromium tests: real invalid multipart requests for all three push routes; synthetic credential/token reset on failure; real clipboard success and accessible clipboard-denial feedback; app/provider status labels; fixed analytics sink properties; feedback navigation; responsive layouts; no external Google font request or browser runtime errors.
- Existing analyzer browser smoke tests cover worker creation, same-file reselection, cancellation, replacement, malformed ZIP, valid synthetic APK/AAB, no package upload and mobile width. The expected corrupt-archive label was updated to the new catalog guidance.
- An independent review reproduced response-body timeout misclassification and malformed worker-result diagnostics. Regression tests failed before their fixes and passed afterward. Typed decompression limit errors are preserved instead of being downgraded to generic corruption.

### Public signed APK compatibility

Downloaded outside Git from the authoritative [Appium ApiDemos v3.1.0 release](https://github.com/appium/android-apidemos/releases/download/v3.1.0/ApiDemos-debug.apk), without installing it:

- APK SHA-256: `b13059630dfea8ec2828797911e4ce1893be3adac5cc9db61421434f7987f2d3`
- Parsed package: `io.appium.android.apis`; version: `3.1.0`; signing material: v1 and v2.
- Extracted certificate SHA-256 matches independent JDK `keytool -printcert -jarfile` output: `da:63:19:48:7b:13:4e:a4:a6:7d:55:4c:0d:ee:bb:53:7e:11:b6:64:42:47:9e:f3:1c:08:7c:da:e6:1a:7b:1d`.
- No manifest warnings. The public debug fixture uses an old weak signing key/algorithm; this test checks extraction compatibility, not package trust or cryptographic signature verification. The APK is not committed.

### Screenshots

All inputs are synthetic and credentials/tokens have been cleared before capture:

- [FCM mobile diagnostics](screenshots/phase3/fcm-mobile.png)
- [OneSignal desktop diagnostics](screenshots/phase3/onesignal-desktop.png)
- [Analyzer mobile diagnostics](screenshots/phase3/analyzer-mobile.png)

### Reproduce browser checks

Start the built app locally with `npm start`. With Playwright and Chromium available, run `node --experimental-strip-types tests/browser/phase3.smoke.mjs` and `node --experimental-strip-types tests/browser/apk-analyzer.smoke.mjs`. Set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` if these tools are outside normal module/browser resolution. No browser dependency is added to the app. Optional `PUBLIC_APK_PATH` enables the known Appium sample's browser-worker package/fingerprint assertions. `TEST_BASE_URL` selects the local Phase 3 test server; use only an isolated test server because the runner submits synthetic invalid requests and intercepts provider responses.

## Unrun checks, external blockers and risks

- The managed environment's enforced network policy rejects `notifi-check.vercel.app` and `api.github.com` with proxy HTTP 403. Therefore the deployed site's page/API behavior and draft PR creation cannot be confirmed here. This is an environment denial, not evidence of a production application or provider outage. Local production-server tests are distinguished from deployed production tests. No bypass is attempted.
- No real Firebase/OneSignal credentials or test devices/subscriptions were supplied. Authenticated sends, FCM dry-run authorization, APNs/Web Push delivery, notification permissions and provider dashboard delivery reports are **unrun**. Synthetic/mocked provider success is not live delivery evidence. Never paste secrets into chat or issue reports.
- One public debug APK and synthetic APK/AAB fixtures were tested; real AABs, v3 rotation lineages, OEM-specific packages, Safari and Firefox remain unverified. ZIP64/encrypted/multidisk archives remain explicitly unsupported. Full cryptographic signature/trust verification and protobuf AAB manifest parsing remain out of scope.
- Public push endpoints still need appropriate infrastructure abuse controls/rate limits. Upstream SDK behavior and infrastructure/request logging must be reviewed before operating with production credentials. This change does not add authentication or claim to eliminate distributed abuse.
- Feedback needs the existing Resend configuration to send email; those settings are unavailable here. The fixed GitHub issue link provides an alternative. No feedback was sent automatically.
- No merge, production promotion or deployment was performed.

## Modified files

- Shared diagnostics/UI: `src/lib/diagnostics.ts`, `src/lib/push-response.ts`, `src/components/diagnostic-panel.tsx`, `src/components/send-form.tsx`, `src/components/onesignal-form.tsx`.
- Push boundaries: `src/lib/notification-validation.ts`, `parse-service-account-form.ts`, `fcm-service.ts`, `fcm-types.ts`, `onesignal-service.ts`, `onesignal-types.ts`; `src/app/api/notifications/{send,web-push/send,onesignal/send}/route.ts`.
- Analyzer integration: `src/lib/apk-analyzer/{archive,axml,limits,analyze,analysis.worker,client}.ts`, `src/components/apk-analyzer/analyzer.tsx`.
- Fonts/analytics: `src/app/layout.tsx`, `src/app/fonts/*`, `src/lib/tool-event.ts`, `src/lib/tool-analytics.ts`, `docs/analytics.md`.
- Tests: `tests/{diagnostics,push-input,tool-analytics,font,apk-analyzer,apk-worker}.test.ts`, `tests/browser/{phase3,apk-analyzer}.smoke.mjs`.
- Documentation: approved Phase 3 design/plan, this report and `docs/screenshots/phase3/*`.

## Branch and PR outcome

Implementation is pushed on [feat/developer-experience-phase3](https://github.com/nalinsakthivel/notifi_check/tree/feat/developer-experience-phase3). The requested draft PR command against feat/nextjs-rebuild was attempted and returned exactly: `Post "https://api.github.com/graphql": Forbidden`. No PR was created and no API/network bypass was attempted. Enabling api.github.com in the managed environment settings is the remaining prerequisite for a retry.
