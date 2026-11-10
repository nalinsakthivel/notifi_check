"use client";
import { DiagnosticPanel } from "@/components/diagnostic-panel";
import { requestPush } from "@/lib/push-response";
import type { DiagnosticCode } from "@/lib/diagnostics";

import { FormEvent, useState } from "react";
import { trackToolEvent } from "@/lib/tool-analytics";

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; messageId?: string; validated?: boolean }
  | {
      status: "error";
      diagnosticCode: DiagnosticCode;
      appStatus?: number;
      providerStatus?: number;
    };

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-mute/60";

export function SendForm({ mode }: { mode: "send" | "webpush" }) {
  const [result, setResult] = useState<Result>({ status: "idle" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tool = mode === "send" ? "fcm" : "webpush";
    setResult({ status: "loading" });
    trackToolEvent("push_notification_tester", "started", tool);
    const formEl = e.currentTarget;
    try {
      const response = await requestPush(new FormData(formEl), tool);
      if (response.success) {
        setResult({
          status: "success",
          messageId: response.messageId,
          validated: response.validated,
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
      <Field
        label="Firebase service account JSON"
        hint="Never stored — read once, then discarded."
      >
        <input
          type="file"
          name="serviceAccount"
          accept="application/json,.json"
          required
          className="block w-full text-sm text-mute file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:tracking-widest file:text-foreground hover:file:border-accent"
        />
      </Field>

      <Field label="FCM device token">
        <input
          type="text"
          name="fcmToken"
          required
          placeholder="Paste device or web push token"
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

      {mode === "webpush" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Link (optional)">
              <input
                type="url"
                name="link"
                placeholder="https://example.com"
                className={fieldClass}
              />
            </Field>
            <Field label="Icon URL (optional)">
              <input type="url" name="icon" className={fieldClass} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-mute">
            <input
              type="checkbox"
              name="validateOnly"
              value="true"
              className="h-3.5 w-3.5 accent-accent"
            />
            Validate only (don&apos;t actually deliver)
          </label>
        </>
      )}

      <Field
        label="Data payload (optional JSON)"
        hint="Custom key-value pairs your app reads when the notification is received. Must be string values."
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
          <p className="tracking-wide">
            {result.validated
              ? "[OK] DRY-RUN VALIDATED"
              : "[OK] PROVIDER ACCEPTED"}
          </p>
          <p className="mt-2 text-xs">
            Provider acceptance does not confirm device delivery. A dry run does
            not send a notification.
          </p>
          {result.messageId && (
            <p className="mt-1 break-all font-mono text-xs text-live/80">
              {result.messageId}
            </p>
          )}
          {result.validated !== undefined && (
            <p className="mt-1 text-live/80">
              VALIDATE_ONLY: {String(result.validated).toUpperCase()}
            </p>
          )}
        </div>
      )}

      {result.status === "error" && (
        <DiagnosticPanel
          key={result.diagnosticCode}
          tool={mode === "send" ? "fcm" : "webpush"}
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
