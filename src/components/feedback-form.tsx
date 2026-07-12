"use client";

import { FormEvent, useState } from "react";

type Result =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success" }
  | { status: "error"; message: string };

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

export function FeedbackForm() {
  const [result, setResult] = useState<Result>({ status: "idle" });
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setScreenshotError(null);
    if (!file) {
      setScreenshotName(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setScreenshotError("Screenshot must be an image file.");
      e.target.value = "";
      setScreenshotName(null);
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setScreenshotError("Screenshot must be smaller than 5 MB.");
      e.target.value = "";
      setScreenshotName(null);
      return;
    }
    setScreenshotName(file.name);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    formData.set("page", window.location.pathname);

    setResult({ status: "sending" });
    try {
      const res = await fetch("/api/feedback/send", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ status: "success" });
      } else {
        setResult({ status: "error", message: data.error || "Failed to send feedback." });
      }
    } catch {
      setResult({ status: "error", message: "Network error — please try again." });
    } finally {
      formEl.reset();
      setScreenshotName(null);
    }
  }

  if (result.status === "success") {
    return (
      <div className="rounded-md border border-live/60 bg-live/[0.07] px-6 py-6 text-center">
        <p className="text-sm text-foreground">
          Thanks — your feedback was sent. I read every message.
        </p>
        <button
          type="button"
          onClick={() => setResult({ status: "idle" })}
          className="mt-4 cursor-pointer rounded-md border border-border px-4 py-2 text-xs tracking-widest text-mute transition-colors hover:border-mute hover:text-foreground"
        >
          SEND_ANOTHER
        </button>
      </div>
    );
  }

  const sending = result.status === "sending";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fb-message" className="text-sm font-medium text-foreground">
          Message<span aria-hidden="true" className="ml-0.5 text-accent">*</span>
        </label>
        <textarea
          id="fb-message"
          name="message"
          required
          rows={6}
          placeholder="A bug, an idea, or anything that felt off…"
          className="w-full resize-y rounded-md border border-border bg-panel px-4 py-3 text-sm text-foreground placeholder-mute/60 outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fb-email" className="text-sm font-medium text-foreground">
          Your email (optional)
        </label>
        <input
          id="fb-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full rounded-md border border-border bg-panel px-4 py-2.5 text-sm text-foreground placeholder-mute/60 outline-none transition-colors focus:border-accent"
        />
        <p className="text-xs text-mute/70">Leave this if you want a reply.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fb-screenshot" className="text-sm font-medium text-foreground">
          Screenshot (optional)
        </label>
        <input
          id="fb-screenshot"
          name="screenshot"
          type="file"
          accept="image/*"
          onChange={handleScreenshotChange}
          className="w-full cursor-pointer rounded-md border border-dashed border-border bg-panel px-4 py-3 text-sm text-mute outline-none transition-colors file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:tracking-widest file:text-background hover:border-mute focus:border-accent"
        />
        {screenshotName && !screenshotError && (
          <p className="text-xs text-live">{screenshotName} attached</p>
        )}
        {screenshotError && (
          <p role="alert" className="text-xs text-red-400">
            {screenshotError}
          </p>
        )}
      </div>

      <div aria-live="polite" className="min-h-5 text-sm">
        {result.status === "error" && <span className="text-red-400">{result.message}</span>}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="cursor-pointer self-start rounded-md bg-accent px-6 py-2.5 text-sm font-semibold tracking-widest text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending ? "SENDING…" : "SEND_FEEDBACK"}
      </button>
    </form>
  );
}
