"use client";

import { toFirebaseLikeError } from "@/lib/errors";
import { reportFcmStatus } from "@/lib/fcm-status";
import { FormEvent, useState } from "react";
import { trackToolEvent } from "@/lib/tool-analytics";

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; messageId?: string; validated?: boolean }
  | { status: "error"; error: string; errorCode?: string; httpStatus?: number };

interface SendApiResponse {
  success: boolean;
  messageId?: string;
  validated?: boolean;
  error?: string;
  errorCode?: string;
}

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-mute/60";

export function SendForm({ mode }: { mode: "send" | "webpush" }) {
  const [result, setResult] = useState<Result>({ status: "idle" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult({ status: "loading" });
    trackToolEvent("push_notification_tester", "started", mode === "send" ? "fcm" : "webpush");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const endpoint =
      mode === "send"
        ? "/api/notifications/send"
        : "/api/notifications/web-push/send";

    try {
      const res = await fetch(endpoint, { method: "POST", body: form });
      const json = (await res.json()) as SendApiResponse;

      // Always clear the file input after the request completes, success or not,
      // so the JSON key never lingers in the DOM/form state longer than needed.
      formEl.reset();

      if (!res.ok || !json.success) {
        trackToolEvent("push_notification_tester", "failed", mode === "send" ? "fcm" : "webpush");
        // A 4xx here means the request itself was malformed (bad file, missing
        // fields) — that's user error, not FCM being unreachable. Only a 5xx
        // means our route actually tried to talk to FCM and failed.
        if (res.status >= 500) reportFcmStatus("down");
        setResult({
          status: "error",
          error: json.error || `Request failed with HTTP ${res.status}`,
          errorCode: json.errorCode,
          httpStatus: res.status,
        });
        return;
      }

      trackToolEvent("push_notification_tester", "succeeded", mode === "send" ? "fcm" : "webpush");
      reportFcmStatus("up");
      setResult({
        status: "success",
        messageId: json.messageId,
        validated: json.validated,
      });
    } catch (rawErr: unknown) {
      formEl.reset();
      trackToolEvent("push_notification_tester", "failed", mode === "send" ? "fcm" : "webpush");
      const err = toFirebaseLikeError(rawErr);
      reportFcmStatus("down");
      setResult({ status: "error", error: err.message });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border border-border bg-panel p-6"
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

      {mode === "webpush" && (
        <>
          <div className="grid grid-cols-2 gap-4">
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
        <div className="rounded-md border border-live/40 bg-live/5 px-4 py-3 text-sm text-live">
          <p className="tracking-wide">[OK] SENT SUCCESSFULLY</p>
          {result.messageId && (
            <p className="mt-1 break-all font-mono text-xs text-live/80">{result.messageId}</p>
          )}
          {result.validated !== undefined && (
            <p className="mt-1 text-live/80">VALIDATE_ONLY: {String(result.validated).toUpperCase()}</p>
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
