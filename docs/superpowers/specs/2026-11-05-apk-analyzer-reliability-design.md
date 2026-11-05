# APK/AAB analyzer reliability and security

Status: approved by the user on 2026-11-05. Base: latest fetched `feat/nextjs-rebuild`.

## Intent and constraints

Improve the existing developer tool without redesigning it. Files stay entirely in the browser. Preserve package, SDK, permission, component and size information when reliably available. Never infer missing manifest values or claim cryptographic verification. Preserve the AAB protobuf-manifest limitation. Do not merge or deploy.

## Approaches

Recommended: use a dedicated module Web Worker with bounded, selective ZIP reads and the existing fflate dependency. Inspect the central directory first, then read and decompress only the APK manifest and bounded signature entries. Terminate the worker to cancel synchronous parsing and release its memory. This avoids reading the whole package or extracting irrelevant content.

An alternative is transferring a size-capped whole-file buffer to a worker. It is simpler but retains unnecessary package-sized allocations. A full APK verification library would broaden dependency and browser-compatibility risk; safe structural detection is sufficient for this task. These alternatives are not proposed for implementation.

## Archive boundary

Worker receives a File, request ID and validated limits; it reads Blob slices rather than a whole-file arrayBuffer. Proposed defaults (implementation choices): 512 MiB input, 50,000 entries, 16 MiB central directory, 16 MiB per selected entry, 32 MiB total extracted data, 4 GiB total declared uncompressed size and 200:1 maximum expansion ratio. Limits live in one typed configuration module and can be overridden within validated ranges.

Reject malformed offsets, overlapping data ranges, inconsistent local/central metadata, duplicate paths, encrypted entries, unsupported compression and ZIP64/multidisk archives with actionable messages. Bound actual decompression output as well as declared sizes; never allocate from untrusted uncompressed sizes. Verify selected-entry CRC and output size. List-only entries are not decompressed. No archive path is written to disk.

Support valid data-descriptor archives (flag bit 3 permits zero local CRC/sizes), and accept APK alignment extra fields. Stream compressed input in small bounded chunks; the inflater must bound allocations before callbacks, not merely check output after an unbounded inflateSync. Cap signing-block reads at 16 MiB. Confirm the existing fflate streaming implementation meets the allocation bound before using it.

## Signing

Read the APK Signing Block immediately before the central directory, checking both size fields, magic, pair lengths and containment. Detect recognized v2, v3 and v3.1 IDs only within valid framing; malformed framing yields Unknown. Legacy signature entries indicate v1 material, not verified signing. Results distinguish signature material present, none detected, and inconclusive; none detected is never displayed as a verified unsigned APK.

Certificate extraction is bounded and structural. SHA-256 hashes the exact DER certificate bytes using SubtleCrypto. Do not label the first certificate in an unordered PKCS#7 set as the signing leaf without matching signer information; expose its provenance and ambiguity. Modern signer certificate lists may provide certificates when their length-prefixed structures validate. Every result explicitly says Not verified. Explain that local/upload certificates cannot establish the Play App Signing distribution certificate.

## Manifest and sizes

Validate binary XML document and chunk boundaries, string pools, string encodings, attributes, matching element structure and bounded nesting/counts. Unsupported types remain unresolved rather than becoming fabricated integers. Surface malformed manifest warnings while retaining independent size/signing results. Include activity aliases, uses-permission-sdk-23 and separately identified custom permission declarations. Match Android namespaced attributes rather than spoofable unqualified names.

Bound parsed node counts, string-pool bytes and returned text/list sizes, independently of entry size limits. Limit rendered lists to manageable batches with explicit truncation notices; never silently omit fields or send tens of thousands of DOM rows to React.

Normalize recognized AAB module-relative paths for size categories, including dex, resources.pb, manifest, res, assets and ABI libraries. Derive module names from module manifests rather than arbitrary top-level directories. Preserve sum correctness.

## Worker lifecycle and interface

A single controller owns the active worker. New selection cancels the previous job, clears results and terminates the worker. Request IDs guard every callback, including failures. Unmount, cancellation, success, failure and worker errors clean up handlers and terminate workers. Add a bounded timeout and a clear unsupported-worker error.

Show Reading, Analyzing, Completed and Failed; progress reports bytes actually read or entries actually inspected, never invented percentages. Cancel is separate from failure. Reset the file input after selection so the same file can be selected again. Retain existing styling, wrap long values on mobile and provide accessible copy buttons for package, versions and fingerprints, including clipboard-failure feedback.

Use trackToolEvent only with fixed tool/action values. Emit started at accepted analysis start, succeeded at current-job completion and failed at current-job failure. No file-derived properties. Cancellation and superseded jobs never emit failure.

Update the analyzer landing-page feature descriptions and FAQ so signing and format limitations match the actual results. Keep the existing layout and metadata conventions.

## Tests and validation

Use node:test and synthetic ZIP, AXML, signing-block and public certificate fixtures; never commit private keys or real app packages. Cover valid APK/AAB, missing manifests, malformed/unsupported formats, decompression attacks and dishonest sizes, configured limits, signing schemes/ambiguity/fingerprints, module sizes, cancellation, stale results and cleanup using a fake worker boundary. Add browser-level worker validation if available; Node unit tests alone do not prove worker bundling or mobile interaction.

Run the requested npm install, npm test, npm run lint, npx tsc --noEmit and npm run build, preserving the pnpm lockfile workflow where possible and reporting any existing baseline failures. Inspect the installed Next.js documentation before Next.js-specific changes. Review memory ownership, browser APIs and generated worker assets. Commit logically and open a draft PR targeting feat/nextjs-rebuild. No merge or deployment.

## Limitations

No cryptographic APK or JAR signature verification, certificate trust validation or Play signing-key lookup. No AAB protobuf manifest parser. Unsupported ZIP features fail explicitly. Resource references may remain unresolved. Defaults may reject unusually large legitimate packages; errors explain the applicable limit.
