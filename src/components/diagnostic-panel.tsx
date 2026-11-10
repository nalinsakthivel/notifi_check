"use client";
import Link from "next/link";
import { useId, useState } from "react";
import {
  DIAGNOSTICS,
  diagnosticCode,
  diagnosticText,
  safeHttpStatus,
  type DiagnosticTool,
} from "@/lib/diagnostics";
export function DiagnosticPanel({
  code,
  tool,
  appStatus,
  providerStatus,
  warning = false,
}: {
  code: unknown;
  tool: DiagnosticTool;
  appStatus?: number;
  providerStatus?: number;
  warning?: boolean;
}) {
  const id = useId();
  const [copyStatus, setCopyStatus] = useState("");
  const safeCode = diagnosticCode(code);
  const [category, title, guidance] = DIAGNOSTICS[safeCode];
  const app = safeHttpStatus(appStatus),
    provider = safeHttpStatus(providerStatus);
  return (
    <section
      role={warning ? "status" : "alert"}
      aria-labelledby={id}
      className={`min-w-0 rounded-md border px-4 py-3 text-sm wrap-anywhere ${warning ? "border-yellow-500/40 bg-yellow-500/5" : "border-red-500/40 bg-red-500/5"}`}
    >
      <h3 id={id} className="font-medium text-foreground">
        {title}
      </h3>
      <p className="mt-1 text-xs text-foreground/75">
        {category} · {safeCode}
      </p>
      <p className="mt-2 text-foreground/75">{guidance}</p>
      {app && (
        <p className="mt-1 text-xs text-foreground/75">
          Application HTTP: {app}
        </p>
      )}
      {provider && (
        <p className="mt-1 text-xs text-foreground/75">
          Provider HTTP: {provider}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-accent">
        <button
          type="button"
          className="min-h-10 underline focus-visible:outline-2"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                diagnosticText({
                  tool,
                  code: safeCode,
                  appStatus: app,
                  providerStatus: provider,
                }),
              );
              setCopyStatus("Safe diagnostics copied.");
            } catch {
              setCopyStatus(
                "Copy unavailable. Select the diagnostic code and guidance manually.",
              );
            }
          }}
        >
          Copy diagnostics
        </button>
        <Link
          href="/feedback"
          className="min-h-10 inline-flex items-center underline"
        >
          Report a problem
        </Link>
        <a
          href="https://github.com/nalinsakthivel/notifi_check/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-10 inline-flex items-center underline"
        >
          GitHub issue <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
      <p role="status" className="text-xs text-foreground/75">
        {copyStatus}
      </p>
      <p className="mt-1 text-xs text-foreground/75">
        The copied report contains only fixed diagnostic guidance and HTTP
        statuses. Remove credentials, tokens and identifying app information
        from anything you add to feedback.
      </p>
    </section>
  );
}
