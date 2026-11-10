"use client";
import { DiagnosticPanel } from "@/components/diagnostic-panel";
import { requestPush } from "@/lib/push-response";
import type { DiagnosticCode } from "@/lib/diagnostics";

import { FormEvent, useState } from "react";
import { trackToolEvent } from "@/lib/tool-analytics";

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; notificationId?: string }
  | {
      status: "error";
      diagnosticCode: DiagnosticCode;
      appStatus?: number;
      providerStatus?: number;
    };

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-mute/60";

export function OneSignalForm() {
  const [result, setResult] = useState<Result>({ status: "idle" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tool = "onesignal";
    setResult({ status: "loading" });
    trackToolEvent("push_notification_tester", "started", tool);
    const formEl = e.currentTarget;
    try {
      const response = await requestPush(new FormData(formEl), tool);
      if (response.success) {
        setResult({
          status: "success",
          notificationId: response.notificationId,
        });
        trackToolEvent("push_notification_tester", "succeeded", tool);
      } else {
        setResult({ ...response, status: "error" });
        trackToolEvent("push_notification_tester", "failed", tool);
      }
    } finally {
      formEl.reset();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={result.status === "loading"}
      className="min-w-0 wrap-anywhere flex flex-col gap-4 rounded-md border border-border bg-panel p-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="OneSignal App ID">
          <input
            type="text"
            name="appId"
            required
            placeholder="App ID"
            className={fieldClass}
          />
        </Field>
        <Field
          label="REST API Key"
          hint="Never stored — used once, then discarded."
        >
          <input
            type="password"
            name="restApiKey"
            required
            placeholder="REST API Key"
            className={fieldClass}
          />
        </Field>
      </div>

      <Field label="Player ID / Subscription ID">
        <input
          type="text"
          name="playerId"
          required
          placeholder="Target device player ID"
          className={fieldClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input
            type="text"
            name="title"
            required
            defaultValue="Notification Title"
            className={fieldClass}
          />
        </Field>
        <Field label="Body">
          <input
            type="text"
            name="body"
            required
            defaultValue="Notification message body"
            className={fieldClass}
          />
        </Field>
      </div>

      <Field label="Launch URL (optional)">
        <input
          type="url"
          name="url"
          placeholder="https://example.com"
          className={fieldClass}
        />
      </Field>

      <Field
        label="Data payload (optional JSON)"
        hint="Custom key-value pairs your app reads when the notification is received."
      >
        <textarea
          name="data"
          rows={3}
          defaultValue={JSON.stringify({ type: "title", id: "123" }, null, 2)}
          className={`${fieldClass} font-mono`}
        />
      </Field>

      <button
        type="submit"
        disabled={result.status === "loading"}
        className="mt-2 w-fit rounded-md border border-accent bg-accent/10 px-4 py-2 text-xs tracking-widest text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {result.status === "loading" ? "SENDING…" : "SEND_TEST_PUSH"}
      </button>

      {result.status === "success" && (
        <div
          role="status"
          className="rounded-md border border-live/40 bg-live/5 px-4 py-3 text-sm text-live"
        >
          <p className="tracking-wide">[OK] PROVIDER ACCEPTED</p>
          <p className="mt-2 text-xs">
            Provider acceptance does not confirm device delivery. Check the
            subscription, device permissions and provider delivery report.
          </p>
          {result.notificationId && (
            <p className="mt-1 break-all font-mono text-xs text-live/80">
              {result.notificationId}
            </p>
          )}
        </div>
      )}

      {result.status === "error" && (
        <DiagnosticPanel
          key={result.diagnosticCode}
          tool={"onesignal"}
          code={result.diagnosticCode}
          appStatus={result.appStatus}
          providerStatus={result.providerStatus}
        />
      )}
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs tracking-widest text-mute">
        {label.toUpperCase()}
      </span>
      {children}
      {hint && <span className="text-xs text-mute/70">{hint}</span>}
    </label>
  );
}
