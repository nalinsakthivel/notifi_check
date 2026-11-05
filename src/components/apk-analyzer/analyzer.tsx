"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalyzeResult } from "@/lib/apk-analyzer/analyze";
import { AnalysisController } from "@/lib/apk-analyzer/client";
import { trackToolEvent } from "@/lib/tool-analytics";
import { formatBytes } from "@/lib/apk-analyzer/size-breakdown";

function Row({
  label,
  value,
  copy = false,
}: {
  label: string;
  value: string | null;
  copy?: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-2 text-sm last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="shrink-0 text-mute">{label}</span>
      <span
        className={`min-w-0 wrap-anywhere sm:text-right ${value ? "text-foreground" : "text-mute/60 italic"}`}
      >
        {value ?? "Unknown"}
        {copy && value && (
          <button
            type="button"
            aria-label={`Copy ${label}`}
            className="ml-2 text-xs text-accent underline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                setCopyStatus("Copied");
              } catch {
                setCopyStatus(
                  "Copy failed — select and copy the value manually.",
                );
              }
            }}
          >
            Copy
          </button>
        )}
        {copyStatus && (
          <span role="status" className="ml-2 text-xs text-mute">
            {copyStatus}
          </span>
        )}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-panel px-5 py-5">
      <h3 className="mb-3 text-xs tracking-widest text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function ApkAnalyzer() {
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [stage, setStage] = useState("Idle");
  const busy = stage === "Reading" || stage === "Analyzing";
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const controllerRef = useRef<AnalysisController | null>(null);
  useEffect(
    () => () => {
      controllerRef.current?.dispose();
    },
    [],
  );

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!controllerRef.current)
      controllerRef.current = new AnalysisController(
        () =>
          new Worker(
            new URL(
              "../../lib/apk-analyzer/analysis.worker.ts",
              import.meta.url,
            ),
            { type: "module" },
          ),
      );
    setError(null);
    setResult(null);
    setFileLabel(file.name);
    setStage("Reading");
    trackToolEvent("apk_aab_analyzer", "started");
    controllerRef.current.start(file, {
      progress: setStage,
      success: (analysis) => {
        setResult(analysis);
        setStage("Completed");
        trackToolEvent("apk_aab_analyzer", "succeeded");
      },
      failure: (message) => {
        setError(message);
        setStage("Failed");
        trackToolEvent("apk_aab_analyzer", "failed");
      },
    });
  }

  const totalCompressed =
    result?.sizeBreakdown.reduce((s, c) => s + c.compressedSize, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Upload */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-md border border-dashed px-6 py-8 text-center transition-colors ${
          dragging
            ? "border-accent bg-accent/5"
            : "border-border bg-panel hover:border-mute"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".apk,.aab"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            handleFile(file);
          }}
        />
        {fileLabel ? (
          <span className="max-w-full wrap-anywhere text-sm text-foreground">
            {fileLabel} — click or drop to replace
          </span>
        ) : (
          <>
            <span className="text-sm tracking-widest text-foreground">
              DROP_APK_OR_AAB_HERE
            </span>
            <span className="text-xs text-mute">or click to browse</span>
          </>
        )}
      </label>

      <div aria-live="polite" className="min-h-5 text-sm">
        {error && <span className="text-red-400">{error}</span>}
        {!error && (
          <span className="text-mute">
            {stage !== "Idle" && `${stage}${busy ? "…" : ""}`}
          </span>
        )}
        {busy && (
          <button
            type="button"
            className="ml-4 text-accent underline"
            onClick={() => {
              controllerRef.current?.cancel();
              setStage("Cancelled");
              setResult(null);
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {result && (
        <div className="flex flex-col gap-6">
          {/* File-level info */}
          <Section title="FILE_INFO">
            <Row label="Filename" value={result.fileName} />
            <Row
              label="Format"
              value={
                result.format === "apk"
                  ? "APK"
                  : result.format === "aab"
                    ? "AAB (Android App Bundle)"
                    : "Unknown (not a recognizable APK/AAB structure)"
              }
            />
            <Row
              label="Total uncompressed size"
              value={formatBytes(result.totalSize)}
            />
            <Row
              label="Total compressed (in ZIP)"
              value={formatBytes(totalCompressed)}
            />
            <Row label="File count" value={String(result.fileCount)} />
            {result.modules.length > 0 && (
              <Row label="Modules" value={result.modules.join(", ")} />
            )}
          </Section>

          {result.warnings.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-md border border-yellow-500/40 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-200/90">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          {/* Manifest */}
          {result.format === "apk" && (
            <Section title="MANIFEST">
              {result.manifest ? (
                <>
                  <Row
                    copy
                    label="Package"
                    value={result.manifest.packageName}
                  />
                  <Row
                    copy
                    label="Version code"
                    value={result.manifest.versionCode}
                  />
                  <Row
                    copy
                    label="Version name"
                    value={result.manifest.versionName}
                  />
                  <Row label="Min SDK" value={result.manifest.minSdkVersion} />
                  <Row
                    label="Target SDK"
                    value={result.manifest.targetSdkVersion}
                  />
                  {result.manifest.unknownFields.length > 0 && (
                    <p className="mt-2 text-xs text-mute/70">
                      Could not determine:{" "}
                      {result.manifest.unknownFields.join(", ")}.
                    </p>
                  )}

                  <h4 className="mt-4 mb-2 text-xs tracking-widest text-mute">
                    PERMISSIONS ({result.manifest.permissions.length})
                  </h4>
                  {result.manifest.permissions.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {result.manifest.permissions.slice(0, 200).map((p) => (
                        <li
                          key={p}
                          className="max-w-full wrap-anywhere rounded-md border border-border bg-background px-2 py-1 text-xs text-mute"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-mute/60 italic">none found</p>
                  )}

                  {result.manifest.permissions.length > 200 && (
                    <p className="text-xs text-mute">
                      Showing the first 200 permissions.
                    </p>
                  )}
                  {result.manifest.declaredPermissions.length > 0 && (
                    <div className="mt-4 text-xs text-mute wrap-anywhere">
                      Declared custom permissions:{" "}
                      {result.manifest.declaredPermissions
                        .slice(0, 200)
                        .join(", ")}
                      {result.manifest.declaredPermissions.length > 200 &&
                        " (first 200 shown)"}
                    </div>
                  )}
                  <h4 className="mt-4 mb-2 text-xs tracking-widest text-mute">
                    COMPONENTS ({result.manifest.components.length})
                  </h4>
                  {result.manifest.components.length > 200 && (
                    <p className="text-xs text-mute">
                      Showing the first 200 components.
                    </p>
                  )}
                  {result.manifest.components.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {result.manifest.components.slice(0, 200).map((c, i) => (
                        <li
                          key={`${c.type}-${c.name}-${i}`}
                          className="wrap-anywhere text-xs text-mute"
                        >
                          <span className="text-accent">{c.type}</span> {c.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-mute/60 italic">none found</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-mute/70">
                  Could not read AndroidManifest.xml from this APK.
                </p>
              )}
            </Section>
          )}

          {result.format === "aab" && result.manifestUnsupportedReason && (
            <Section title="MANIFEST">
              <p className="text-xs text-mute/70">
                {result.manifestUnsupportedReason}
              </p>
            </Section>
          )}

          {/* Signature */}
          {result.format === "apk" && result.signature && (
            <Section title="SIGNATURE">
              <Row
                label="Signature material"
                value={
                  result.signature.presence === "present"
                    ? "Detected"
                    : result.signature.presence === "unknown"
                      ? "Unknown"
                      : "None detected (not proof of an unsigned APK)"
                }
              />
              <Row
                label="Detected schemes"
                value={result.signature.schemes.join(", ") || "Unknown"}
              />
              <Row label="Cryptographic verification" value="Not verified" />
              {result.signature.signatureFiles.length > 0 && (
                <Row
                  label="Legacy signature files"
                  value={result.signature.signatureFiles.join(", ")}
                />
              )}
              <Row
                copy
                label="Certificate SHA-256"
                value={result.signature.certSha256}
              />
              {result.signature.certExtractionNote && (
                <p className="mt-2 text-xs text-mute/70 wrap-anywhere">
                  {result.signature.certExtractionNote}
                </p>
              )}
              <p className="mt-2 text-xs text-mute/70">
                Detection and certificate extraction do not verify this package.
                This certificate may differ from the Play App Signing
                distribution certificate or upload key.
              </p>
            </Section>
          )}

          {/* Size breakdown */}
          <Section title="SIZE_BREAKDOWN">
            <div className="flex flex-col gap-2.5">
              {result.sizeBreakdown.map((c) => {
                const pct =
                  result.totalSize > 0
                    ? (c.uncompressedSize / result.totalSize) * 100
                    : 0;
                return (
                  <div key={c.label} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-foreground">{c.label}</span>
                      <span className="tabular-nums text-mute">
                        {formatBytes(c.uncompressedSize)} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.max(pct, 0.5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      )}

      <p className="text-xs text-mute/70">
        Your APK/AAB never leaves this device — it&apos;s read and parsed
        entirely in your browser.
      </p>
    </div>
  );
}
