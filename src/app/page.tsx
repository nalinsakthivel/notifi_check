"use client";

import { useState } from "react";
import Link from "next/link";
import { SendForm } from "@/components/send-form";
import { OneSignalForm } from "@/components/onesignal-form";

export default function Home() {
  const [tab, setTab] = useState<"send" | "webpush" | "onesignal">("send");

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
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          FCM & OneSignal Push Notification Tester
        </h1>
        <p className="mt-1 text-sm text-mute">
          Upload your Firebase service account JSON, or paste a OneSignal App ID and REST API key,
          to send a test push. Credentials are used once per request and never stored on the
          server.
        </p>
      </div>

      <Link
        href="/guide/firebase-service-account"
        className="group flex items-center gap-3 rounded-md border border-accent bg-accent/[0.07] px-4 py-3 text-xs transition-colors hover:bg-accent/[0.12]"
      >
        <span className="shrink-0 rounded-sm bg-accent px-1.5 py-0.5 font-semibold tracking-widest text-background">
          i
        </span>
        <span className="text-mute">
          <span className="tracking-widest text-foreground">NEED_A_SERVICE_ACCOUNT_JSON</span> —
          step-by-step guide to generate one from Firebase
        </span>
        <span className="ml-auto shrink-0 text-accent transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>

      <div className="flex items-center gap-3 rounded-md border border-border/60 px-4 py-3 text-xs text-mute/70">
        <span className="shrink-0 rounded-sm border border-mute/40 px-1.5 py-0.5 tracking-widest text-mute/70">
          soon
        </span>
        <span>
          App Icon Generator and Privacy Policy Generator — more free dev tools on the way.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "send", label: "SEND" },
          { id: "webpush", label: "WEB_PUSH" },
          { id: "onesignal", label: "ONESIGNAL" },
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
      {tab === "onesignal" && <OneSignalForm />}

      <section className="flex flex-col gap-5 rounded-md border border-border bg-panel px-6 py-6">
        <InfoBlock title="ABOUT">
          Notifi Check is a free tool for testing Firebase Cloud Messaging (FCM) and OneSignal
          push notifications without writing any code. Paste a device or web-push token, upload
          your Firebase service account JSON — or paste a OneSignal App ID, REST API key, and
          player ID — and send a real notification straight from the browser. Useful for
          confirming that a Firebase project, OneSignal app, token, or web-push configuration
          actually works before wiring it into an app.
        </InfoBlock>

        <InfoBlock title="WHY TEST DIRECTLY">
          Push notification bugs are hard to isolate inside a full app — is the token stale, is
          the service account or REST API key misconfigured, is the payload malformed, or is the
          push provider itself unreachable? Sending a notification directly, outside your app
          code, narrows that down in one request. The <span className="text-foreground">WEB_PUSH</span>{" "}
          tab also supports a validate-only dry run, so you can check a payload is well-formed
          without actually delivering it.
        </InfoBlock>

        <InfoBlock title="HOW IT WORKS">
          Your Firebase service account JSON is read once from the upload for that single request,
          used to create a short-lived Firebase Admin instance, and discarded immediately after —
          it is never written to disk, logged, or stored server-side. Get a service account key
          from your Firebase project under Project Settings → Service Accounts → Generate new
          private key — see the{" "}
          <Link href="/guide/firebase-service-account" className="text-accent underline">
            step-by-step guide
          </Link>{" "}
          if you need help. For OneSignal, your App ID and REST API key are sent once per request
          directly to the OneSignal API and never stored — find both under Settings → Keys & IDs
          in your OneSignal dashboard.
        </InfoBlock>
      </section>
    </main>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-border pl-4">
      <h2 className="text-xs tracking-widest text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-mute">{children}</p>
    </div>
  );
}
