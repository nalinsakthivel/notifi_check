# Phase 3: developer diagnostics and production validation

Status: proposed for review. Base: `feat/nextjs-rebuild` at `95b56db` (Phase 2 merged in PR #3). Working branch: `feat/developer-experience-phase3`.

## Audit and intent

Keep the existing interface and both tools' architecture. Phase 2 already supplies worker isolation, resource budgets, cancellation, manifest/signing parsing, field copy controls and analyzer events; do not reimplement these. Push routes already sanitize SDK messages, bound some fields, and delete Firebase app instances in finally. Feedback form/FAB and fixed analytics helper already exist.

Gaps observed in the merged source:

- OneSignal only recognizes nonempty array errors and can report success without a valid notification ID. JSON parsing, timeouts and network failures collapse to generic messages.
- FCM client treats every server failure or fetch/JSON exception as FCM being down, including bad credentials or malformed replies. Successful provider acceptance is not proof of device delivery.
- Multipart size checking trusts Content-Length; malformed multipart parsing becomes a server error. OneSignal whitespace-only inputs bypass required-field checks. Optional web-push fields need consistent validation.
- Analyzer errors cross the worker boundary as strings, preventing stable diagnostics and troubleshooting without fragile message matching. Existing XML, ZIP and signing limitations need to remain visible.
- Analytics properties have TypeScript unions but no runtime validation. Documentation predates analyzer completion events.
- next/font/google makes the normal build depend on access to Google Fonts. Installed Next.js documentation supports next/font/local.

Current environment: deployed site and GitHub API probes receive proxy 403. No Firebase credential file, Google application credentials or feedback service credentials are configured. This is not evidence of provider outage or production application failure.

## Approaches and recommendation

Recommend focused extensions to existing flows: one finite diagnostic catalog, typed analyzer failures, shared accessible diagnostic rendering, stronger response/input handling, existing feedback links, and a licensed locally hosted Geist Mono asset. No new runtime dependencies or redesign.

An alternative is guidance-only documentation, which leaves false success/provider-down behavior intact. A larger provider abstraction, telemetry backend or broad analyzer rewrite would add scope without addressing this task more directly. The focused extension is the proposed implementation choice.

## Diagnostic contract and privacy

Create a dependency-free catalog with fixed tool/provider, diagnostic code, category, title, explanation and next steps. Categories cover input, credentials/project configuration, device/subscription, payload, quota, timeout/network, provider availability, unsupported package features, safety limits, malformed archives/manifests and unexpected internal failures.

Map only allowlisted provider error codes/statuses and known typed local errors. Preserve status provenance: browser-to-app HTTP status and app-to-provider status are distinct; an application-generated 500 or malformed reply is not evidence of provider outage. Validate diagnostic codes and optional fields at runtime on both sides of worker/server boundaries; reconstruct copy text from catalog entries rather than serializing received objects. Never show or copy arbitrary provider response bodies, SDK exceptions, credential parsing fragments, filenames or archive entry names. Unknown failures get fixed safe guidance. Preserve existing response fields where needed and add an optional structured diagnostic; existing errorCode stays allowlisted. Do not equate a credential, payload, subscription or local network failure with a provider outage. A success says accepted or dry-run validated, not delivered.

The shared result panel has a descriptive heading, alert/status semantics, wrapping text, keyboard-accessible Copy diagnostics and clipboard-failure feedback. Copied troubleshooting text contains only fixed catalog values, tool/provider, stage and sanitized numeric HTTP status where known. It excludes message IDs and all user inputs. Existing explicit field-copy actions remain available.

Use the existing feedback page and GitHub issue flow with a reminder to remove secrets and identifying package/device information. Nothing is submitted automatically; no dynamic input or file metadata goes into feedback URLs. Do not build a second feedback backend.

## Push reliability

Handle malformed/non-JSON responses, structured OneSignal errors, missing/empty IDs, timeouts and transport errors separately. Validate successful response shape before emitting succeeded. Retain per-request ephemeral Firebase apps and cleanup.

Validate required fields consistently (including whitespace-only values), bound optional fields, and accept only supported HTTP(S) link/icon/image URLs. Bound actual multipart request bytes before form parsing, independent of missing or dishonest Content-Length, cancel the stream reader immediately at the limit, and classify malformed multipart as input errors. Test these conditions at the real parser boundary. Never echo invalid values. Clear credentials/tokens/form inputs on completion and all error paths; never log or persist them.

Automated provider tests use controlled fetch/SDK boundaries and synthetic credentials only. Any timeout protection must not leave an SDK app in use after deletion or claim a cancelled send was not delivered. Use an abortable transport or supported SDK timeout rather than Promise.race with premature Firebase app deletion. Timeout guidance must state acceptance/delivery is unknown. Do not automatically retry a potentially delivered push.

## Analyzer compatibility

Extend current archive/parser errors with stable typed codes preserved across worker messages. Keep client-side File/Blob handling, limits and cancellation. Surface actionable guidance for unsupported ZIP64/encryption, expansion budgets, corrupt ZIP, malformed binary XML, missing manifest and AAB protobuf limitations. Partial results remain clearly partial; signature presence remains separate from certificate extraction and verification.

Exercise representative public signed APKs from an authoritative upstream release when reachable, retained outside Git, recording source and checksum. Compare manifest/certificate facts with independent Android/JDK tooling where available. Do not commit real private packages, keys or device data. Add synthetic regression cases for compatibility issues actually found; do not loosen security budgets to make a fixture pass. Real AAB/rotation/ZIP64 coverage that cannot be obtained remains explicitly unverified.

## Fonts

Vendor the official Geist Mono variable WOFF2 (matching the existing family/style), license and provenance/checksum into a stable repository asset directory. Use supported next/font/local with the same CSS variable, weight range and display behavior. No references to Next.js internal devtools assets, runtime package paths, external test hooks or disabled TLS. The normal build must run without Google Fonts or temporary mocks. Review screenshots for typography/layout preservation.

## Measurement

Retain the existing tool_usage event with fixed tool/action/variant values. Add runtime membership checks and tests so casts or JavaScript callers cannot add identifying properties/values. No diagnostic text, response bodies, tokens, credentials, file/package/certificate names, URLs or contents in events. Cancellation and supersession remain excluded from failure. Update docs to distinguish acceptance, validation and actual delivery.

## Validation and deliverables

Run npm test, npm run lint, npx tsc --noEmit and plain npm run build. Exercise the resulting production server with real Chromium: push input/response classifications, reset/clipboard/accessible alerts, existing analyzer worker behavior, mobile layout and feedback navigation. Capture screenshots of changed UI using synthetic inputs only. Test emitted analytics properties with a controlled analytics sink, not assumptions about dashboard visibility.

Attempt read-only deployed-page checks and safe invalid-input requests when policy permits. No production notification send, merge, promotion or deployment. Without real service credentials and test devices, actual provider authorization/delivery/APNs/browser permission behavior cannot be validated; report these tests as unrun, not passing. Production site policy denial must be reported separately from local production-build validation.

Document changed files, diagnostics/troubleshooting, reproduced defects, checks/results, screenshots, remaining risks and credentials/device/package-dependent checks. Commit logically, push the new branch and create a draft PR targeting feat/nextjs-rebuild. GitHub API access is currently blocked; retry after any applied network change and report the actual outcome.

## Remaining security boundaries

Provider acceptance cannot prove delivery. This work does not add user accounts, distributed rate limiting, full cryptographic APK verification or AAB protobuf support. Public push routes may still need infrastructure-level abuse controls. User-submitted feedback remains an explicit data-sharing action; diagnostics must never silently include sensitive input. Public-release package testing does not establish compatibility with all Android build tools or signing schemes.

Design review completed: no additional user decisions identified. Clarifications about status provenance, timeout ownership, streamed multipart bounds and runtime catalog validation incorporated. Baseline: 39 unit tests pass; production-site/GitHub API probes are network-policy blocked.
