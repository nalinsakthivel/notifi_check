# APK analyzer reliability implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Bound browser analysis and report signing facts honestly.
**Architecture:** Selective Blob ZIP reader, dedicated worker, cancellable controller, existing UI.
**Tech Stack:** Next.js 16, React 19, TypeScript, fflate, node:test.
**Spec:** ../specs/2026-11-05-apk-analyzer-reliability-design.md (approved).

## Global Constraints

Files remain in the browser. No private fixture keys. No cryptographic verification claims. No AAB protobuf parser. No merge/deploy. Use existing isolated checkout.

## Review Focus

Data descriptors and alignment fields must remain supported; dishonest DEFLATE sizes must not allocate without bounds; unordered certificate sets must not imply a leaf; replaced jobs must not mutate UI or analytics; malformed XML must not fabricate fields.

### Task 1: Bounded ZIP analysis

Files: src/lib/apk-analyzer/{archive,limits,analyze}.ts; tests/apk-analyzer.test.ts, tests/fixtures/apk.ts.
Interface: readArchive(blob, limits) returns bounded metadata and readEntry(entry); analyzePackage accepts Blob or bytes and progress callback.
- [ ] Write synthetic valid APK/AAB and archive-limit/CRC/data-descriptor tests; run to observe failure.
- [ ] Implement selective Blob reads and fixed-output DEFLATE decoding; preserve independent analysis results.
- [ ] Run analyzer tests and commit.

### Task 2: Manifest, signing and categorization

Files: src/lib/apk-analyzer/{axml,manifest,cert,signing-block,size-breakdown}.ts; analyzer tests.
Interfaces: manifest retains existing fields and adds declared permissions/aliases; signature exposes presence, schemes, verification and certificate provenance.
- [ ] Add malformed AXML, unknown-value, module sizes, signing block and fingerprint tests; observe failures.
- [ ] Implement bounded parsing and honest signing labels, then rerun tests and commit.

### Task 3: Worker and interface

Files: src/lib/apk-analyzer/{analysis.worker,client}.ts; src/components/apk-analyzer/analyzer.tsx; analyzer page; tests/apk-worker.test.ts.
Interfaces: controller.start(file, callbacks), cancel(), dispose(); worker posts tagged progress/result/error messages.
- [ ] Write fake-worker lifecycle and concurrent/cancel tests; observe failure.
- [ ] Implement worker ownership and UI states/copy/analytics; update FAQ.
- [ ] Run tests, typecheck and commit.

### Task 4: Validation and draft PR

- [ ] Run npm install, npm test, npm run lint, npx tsc --noEmit, npm run build.
- [ ] Validate real browser worker startup, cancellation, malformed/synthetic package requests where tooling permits.
- [ ] Fresh whole-branch review; reproduce and fix important findings with tests.
- [ ] Commit final changes, push feature branch and open draft PR targeting feat/nextjs-rebuild.
