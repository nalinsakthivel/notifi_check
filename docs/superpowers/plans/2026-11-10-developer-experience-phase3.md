# Phase 3 developer experience implementation plan

> **For agentic workers:** Use test-driven development for each component and a fresh final code review.

**Goal:** Safe, actionable diagnostics and normal offline-font production builds.
**Spec:** ../specs/2026-11-10-developer-experience-phase3-design.md (approved).
**Architecture:** Finite diagnostic catalog, validated push request/response boundaries, existing worker and UI flows, licensed local fonts.
**Tech Stack:** Existing TypeScript/Next.js/React/Zod/fflate; no new runtime dependencies.

## Constraints and review focus

Never persist credentials/tokens or upload package bytes. Never copy arbitrary errors or provider bodies. Distinguish application HTTP failures from provider failures; timeouts imply unknown acceptance. Preserve the existing 39 tests. Work only on feat/developer-experience-phase3. No merge or deployment.

### Tasks

- [x] Diagnostic boundary: tests first for finite codes, safe copy, provider classification and malformed response handling. Add src/lib/diagnostics.ts and push-response.ts; test synthetic errors containing secrets.
- [x] Push requests/services: tests first for runtime OneSignal schemas (object/array errors, missing IDs, non-JSON, status/transport failures), streamed multipart size limits and URL/field checks; retain ephemeral SDK cleanup. Integrate routes.
- [x] Analyzer diagnostics: stable typed codes through existing archive/worker/controller boundaries; preserve cancellation and partial results. Test unknown/malicious worker messages and compatibility cases.
- [x] Accessible UI: shared diagnostic panel with copy/feedback controls; integrate existing forms and analyzer; do not claim delivery or outages from application failures. Browser regressions for resets, clipboard, mobile width and alerts.
- [x] Independent font task: official licensed Geist Mono asset via next/font/local; normal build must work without mocks/network fonts.
- [x] Independent analytics task: runtime allowlists and property reconstruction; tests and updated measurement docs; never emit dynamic diagnostics.
- [x] Validation: npm test, npm run lint, npx tsc --noEmit, npm run build; real Chromium worker/UI checks and screenshots; public signed package compatibility where accessible; document blocked production/provider/device tests.
- [x] Implementation pushed; draft PR attempted against feat/nextjs-rebuild and blocked by enforced network policy: POST https://api.github.com/graphql → Forbidden. Final report/screenshots committed with the remaining external limitation.

## Execution ledger

Plan follows approved design; implementation is authorized without another approval gate. Native implementation for shared diagnostics/UI boundaries; independent font and analytics tasks may run in parallel under dispatching-parallel-agents. All workers share the checkout; each owns separate files.

Completed: 61 tests pass including original39; lint/TypeScript/plain production build pass. Public Appium APK v1/v2/fingerprint compatibility checked against keytool. Both browser suites and the normal final production build pass. Review findings (response-body timeout and worker diagnostic shape) reproduced RED then fixed GREEN. Font/analytics independent tasks integrated. No added dependency or lockfile changes.

Final regression: unsupported file selections use package-input-invalid guidance, not push credential advice (RED→GREEN). No unresolved review findings or deferred code fixes. Real provider/device and deployed-host tests remain explicitly unrun for unavailable credentials/devices/network access.
