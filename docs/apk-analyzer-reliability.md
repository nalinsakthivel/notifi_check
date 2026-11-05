# APK/AAB analyzer reliability

The analyzer runs in a dedicated module Web Worker. It receives a browser File and reads bounded Blob slices; it never uploads package bytes. Replacing a file, cancelling, unmounting, finishing or failing terminates the worker and clears its handlers/timer. Jobs have IDs so late messages cannot update current results. A two-minute watchdog handles worker stalls. Processing states are reported without inventing percentage progress.

## Resource limits

`src/lib/apk-analyzer/limits.ts` defines the defaults. `analyzePackage` and `AnalysisController` accept stricter overrides; values above the safety ceilings are rejected.

| Resource | Limit |
| --- | --- |
| Input file | 512 MiB |
| ZIP entries | 50,000 |
| Central directory | 16 MiB |
| Individual extracted entry (compressed and expanded) | 16 MiB |
| Total extracted data | 32 MiB |
| Total declared expanded archive size | 4 GiB |
| Expansion ratio per entry | 200:1 |
| APK Signing Block | 16 MiB |
| Legacy signature candidates | 64 |

Only the APK manifest and legacy signature candidates are extracted. AAB manifests remain protobuf and are not extracted. DEFLATE is fed in 1 KiB compressed chunks; fflate's retained history is 32 KiB, and each chunk's temporary expansion is bounded by DEFLATE's maximum expansion. Actual output is checked before copying into a bounded declared-size buffer. Selected entries must match their declared output length and CRC. Directory metadata supplies the size breakdown; sizes do not prove integrity of unextracted assets.

ZIP64, multidisk archives, encryption, unsupported compression, duplicates, malformed offsets and overlapping selected data are rejected. Standard stored/DEFLATE entries, data-descriptor flags and APK alignment extra fields are supported. Safety limits can reject unusually large legitimate packages; errors identify the limit.

Binary XML has bounded chunks, string pools, node counts, attributes, nesting and returned text. Both element and attribute namespaces are checked. Resource references remain unknown. Malformed manifests yield a warning and independent size/signing results. Activity aliases and SDK-23 permission uses are included; custom declarations are shown separately. Lists show at most 200 rows with an explicit notice, preventing excessive DOM work.

## Signing interpretation

- v1 means legacy META-INF signature material exists.
- v2/v3/v3.1 means a recognized ID occurs in a structurally framed APK Signing Block. Malformed signer contents remain inconclusive.
- No detected material is **not** proof of an unsigned APK.
- Every result says **Not verified**. No cryptographic package/JAR verification, certificate trust check or Play signing-key lookup is performed.
- A fingerprint hashes exact structurally extracted X.509 DER bytes. Multiple certificates in the unordered v1 certificate SET are not arbitrarily treated as a leaf. For modern signing, the displayed fingerprint is the first successfully extracted signer certificate; the tool does not enumerate every signer, rotation lineage or chain.
- Upload/local certificates may differ from the Play App Signing distribution certificate.

No filenames, package IDs, certificates, permissions or archive data are included in analytics. Events use only the existing fixed tool/action allowlists. Cancellation and supersession are not failures.

## Validation

Use Node.js 24 for the repository's native TypeScript test runner. Dependencies remain declared and locked with pnpm; no dependencies or lockfiles changed. On this cloud machine `npm install --package-lock=false --no-audit --no-fund` installed them without introducing a second lockfile.

- `npm test`: 39 passed, 0 failed. Includes synthetic valid/malformed ZIP/APK/AAB, bombs and dishonest sizes, CRC, file/entry/total budgets, binary XML, namespace spoofing, scheme detection, public-certificate fingerprints, cancellation, timeout, replacement and worker errors.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- Plain `npm run build`: blocked by environment policy denying fonts.googleapis.com, used by the pre-existing next/font layout.
- Production compilation with `NEXT_FONT_GOOGLE_MOCKED_RESPONSES=/tmp/notifi-fonts.cjs npm run build`: passed, including TypeScript and all 26 static pages. The external temporary fixture supplies CSS using a local fallback font, solely to isolate worker/application compilation from the unavailable Google Fonts service. It is not a normal production font validation and is not committed or deployed.
- Real Chromium smoke test against that production build: passed. Checks worker execution, valid APK/AAB, same-file reselection, cancellation, replacement, malformed ZIP, mobile width, no package upload and no browser runtime errors. Firefox, Safari and real signed production packages were not exercised.

The optional browser smoke runner is `tests/browser/apk-analyzer.smoke.mjs`. With the app running locally and Playwright/Chromium available, run `node --experimental-strip-types tests/browser/apk-analyzer.smoke.mjs`. Set `PLAYWRIGHT_MODULE` to an installed Playwright module path and `CHROMIUM_PATH` to a system Chromium if they are outside normal resolution; `ANALYZER_URL` selects the local test route. It only creates synthetic packages. No browser dependency was added to the app.

The independent review identified unchecked XML element namespaces. Regression tests reproduced the problem, then passed after validating namespaces, matching closing tags and excluding foreign elements. Browser testing separately found long feature text overflowing the mobile page; wrapping fixed the failing width assertion.

## Changed files

- `src/lib/apk-analyzer/archive.ts`, `limits.ts`: bounded archive reads and extraction.
- `src/lib/apk-analyzer/analyze.ts`: selective analysis, stage reporting and result budgets.
- `src/lib/apk-analyzer/axml.ts`, `manifest.ts`: validated XML and preserved manifest facts.
- `src/lib/apk-analyzer/cert.ts`, `signing-block.ts`: signing presence and certificate extraction.
- `src/lib/apk-analyzer/size-breakdown.ts`: AAB module categories.
- `src/lib/apk-analyzer/client.ts`, `analysis.worker.ts`: worker ownership and lifecycle.
- `src/components/apk-analyzer/analyzer.tsx`: states, Cancel, copy, wrapping and fixed analytics.
- `src/app/(notifi)/apk-aab-analyzer/page.tsx`: accurate signing/format descriptions and mobile wrapping.
- `tests/apk-analyzer.test.ts`, `apk-worker.test.ts`, `browser/apk-analyzer.smoke.mjs`, `fixtures/*`: synthetic fixtures, public certificate and regression tests.
- `docs/superpowers/specs/2026-11-05-apk-analyzer-reliability-design.md`, `docs/superpowers/plans/2026-11-05-apk-analyzer-reliability.md`, this document: approved scope, implementation plan and evidence.
