"use client";

import { FormEvent, useState } from "react";
import { trackToolEvent } from "@/lib/tool-analytics";

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; notificationId?: string }
  | { status: "error"; error: string; errorCode?: string; httpStatus?: number };

interface OneSignalApiResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
  errorCode?: string;
}

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-mute/60";

export function OneSignalForm() {
  const [result, setResult] = useState<Result>({ status: "idle" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult({ status: "loading" });
    trackToolEvent("push_notification_tester", "started", "onesignal");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    try {
      const res = await fetch("/api/notifications/onesignal/send", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as OneSignalApiResponse;

      formEl.reset();

      if (!res.ok || !json.success) {
        trackToolEvent("push_notification_tester", "failed", "onesignal");
        setResult({
          status: "error",
          error: json.error || `Request failed with HTTP ${res.status}`,
          errorCode: json.errorCode,
          httpStatus: res.status,
        });
        return;
      }

      trackToolEvent("push_notification_tester", "succeeded", "onesignal");
      setResult({ status: "success", notificationId: json.notificationId });
    } catch (rawErr: unknown) {
      formEl.reset();
      trackToolEvent("push_notification_tester", "failed", "onesignal");
      const message = rawErr instanceof Error ? rawErr.message : String(rawErr);
      setResult({ status: "error", error: message });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border border-border bg-panel p-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="OneSignal App ID">
          <input type="text" name="appId" required placeholder="App ID" className={fieldClass} />
        </Field>
        <Field label="REST API Key" hint="Never stored — used once, then discarded.">
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

      <div className="grid grid-cols-2 gap-4">
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
        <input type="url" name="url" placeholder="https://example.com" className={fieldClass} />
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
        <div className="rounded-md border border-live/40 bg-live/5 px-4 py-3 text-sm text-live">
          <p className="tracking-wide">[OK] SENT SUCCESSFULLY</p>
          {result.notificationId && (
            <p className="mt-1 break-all font-mono text-xs text-live/80">{result.notificationId}</p>
          )}
        </div>
      )}

      {result.status === "error" && (
        <div className="rounded-md border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <p className="tracking-wide">
            [FAIL] SEND FAILED{result.httpStatus ? ` (HTTP ${result.httpStatus})` : ""}
          </p>
          {result.errorCode && (
            <p className="mt-1 font-mono text-xs text-red-400/80">{result.errorCode}</p>
          )}
          <p className="mt-1 whitespace-pre-wrap text-red-400/80">{result.error}</p>
        </div>
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
      <span className="text-xs tracking-widest text-mute">{label.toUpperCase()}</span>
      {children}
      {hint && <span className="text-xs text-mute/70">{hint}</span>}
    </label>
  );
}
