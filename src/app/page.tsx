"use client";

import { useState } from "react";
import { SendForm } from "@/components/send-form";

export default function Home() {
  const [tab, setTab] = useState<"send" | "webpush">("send");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 72 72" fill="none" className="shrink-0 text-foreground">
            <path
              d="M23 44V31C23 22 29.8 15 38 15C46.2 15 53 22 53 31V44L57 50H19L23 44Z"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d="M31 50C31 53.3 33.7 56 37 56C40.3 56 43 53.3 43 50"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="53" cy="20" r="12" fill="#3b82f6" stroke="#3b82f6" strokeWidth="3" />
            <path
              d="M47.5 20L51.5 24L59 15.5"
              stroke="#050608"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-base font-semibold tracking-wide">
            NOTIFI<span className="text-accent">.CHECK</span>
          </span>
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">FCM Push Notification Tester</h1>
        <p className="mt-1 text-sm text-mute">
          Upload your Firebase service account JSON to send a test push. The file is sent once
          per request and never stored on the server.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "send", label: "SEND" },
          { id: "webpush", label: "WEB_PUSH" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`rounded-md border px-3 py-1.5 text-xs tracking-widest transition-colors ${
              tab === t.id
                ? "border-accent text-accent"
                : "border-border text-mute hover:border-mute hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "send" && <SendForm mode="send" />}
      {tab === "webpush" && <SendForm mode="webpush" />}

      <section className="rounded-md border border-border bg-panel px-6 py-6 text-sm text-mute">
        <h2 className="text-xs tracking-widest text-foreground">ABOUT</h2>
        <p className="mt-3">
          Notifi Check is a free tool for testing Firebase Cloud Messaging (FCM) push
          notifications without writing any code. Paste a device or web-push token, upload your
          Firebase service account JSON, and send a real notification straight from the browser —
          useful for confirming that a Firebase project, token, or web-push configuration actually
          works before wiring it into an app.
        </p>
        <h2 className="mt-5 text-xs tracking-widest text-foreground">WHY TEST FCM DIRECTLY</h2>
        <p className="mt-3">
          Push notification bugs are hard to isolate inside a full app — is the token stale, is
          the service account misconfigured, is the payload malformed, or is FCM itself
          unreachable? Sending a notification directly, outside your app code, narrows that down
          in one request. The <span className="text-foreground">WEB_PUSH</span> tab also supports
          a validate-only dry run, so you can check a payload is well-formed without actually
          delivering it.
        </p>
        <h2 className="mt-5 text-xs tracking-widest text-foreground">HOW IT WORKS</h2>
        <p className="mt-3">
          Your Firebase service account JSON is read once from the upload for that single request,
          used to create a short-lived Firebase Admin instance, and discarded immediately after —
          it is never written to disk, logged, or stored server-side. Get a service account key
          from your Firebase project under Project Settings → Service Accounts → Generate new
          private key.
        </p>
      </section>
    </main>
  );
}
