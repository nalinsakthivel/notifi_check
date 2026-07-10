import type { Metadata } from "next";
import Link from "next/link";

const title = "Find Your OneSignal App ID & REST API Key — Notifi Check";
const description =
  "Step-by-step guide to finding your OneSignal App ID, REST API key, and a player/subscription ID so you can send a test push notification.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "/guide/onesignal-app-id-and-rest-api-key",
  },
  openGraph: {
    type: "article",
    url: "/guide/onesignal-app-id-and-rest-api-key",
    title,
    description,
    siteName: "Notifi Check",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const steps = [
  {
    title: "Open your OneSignal app",
    plainText:
      "Sign in to the OneSignal dashboard and select the app you want to test push notifications for. If you don't have one yet, create a new app and add a Web Push or Mobile Push platform.",
    body: (
      <>
        Sign in to the <span className="text-foreground">OneSignal dashboard</span> and select
        the app you want to test push notifications for. If you don&apos;t have one yet, create a
        new app and add a Web Push or Mobile Push platform.
      </>
    ),
  },
  {
    title: "Go to Settings → Keys & IDs",
    plainText:
      "In the left sidebar, click Settings, then Keys & IDs. This page shows your OneSignal App ID and REST API Key.",
    body: (
      <>
        In the left sidebar, click <span className="text-foreground">Settings</span>, then{" "}
        <span className="text-foreground">Keys & IDs</span>. This page shows your{" "}
        <span className="text-foreground">OneSignal App ID</span> and{" "}
        <span className="text-foreground">REST API Key</span>.
      </>
    ),
  },
  {
    title: "Copy the App ID and REST API Key",
    plainText:
      "Copy both values. The App ID identifies which OneSignal app to send through; the REST API key authenticates the request. Treat the REST API key like a password — it can send to your entire subscriber base.",
    body: (
      <>
        Copy both values. The <span className="text-foreground">App ID</span> identifies which
        OneSignal app to send through; the{" "}
        <span className="text-foreground">REST API key</span> authenticates the request. Treat
        the REST API key like a password — it can send to your entire subscriber base.
      </>
    ),
  },
  {
    title: "Get a Player ID / Subscription ID",
    plainText:
      "Open Audience → Subscriptions in the OneSignal dashboard and copy the Player ID (also called Subscription ID) of any test device or browser that has subscribed to your app. This is the target for a single test push.",
    body: (
      <>
        Open <span className="text-foreground">Audience → Subscriptions</span> in the OneSignal
        dashboard and copy the <span className="text-foreground">Player ID</span> (also called
        Subscription ID) of any test device or browser that has subscribed to your app. This is
        the target for a single test push.
      </>
    ),
  },
  {
    title: "Send a test push from Notifi Check",
    plainText:
      "Head back to the Notifi Check tester, choose the ONESIGNAL tab, and paste the App ID, REST API key, and Player ID. Both credentials are sent once per request directly to the OneSignal API and never stored server-side.",
    body: (
      <>
        Head back to the{" "}
        <Link href="/" className="text-accent underline">
          Notifi Check
        </Link>{" "}
        tester, choose the <span className="text-foreground">ONESIGNAL</span> tab, and paste the
        App ID, REST API key, and Player ID. Both credentials are sent once per request directly
        to the OneSignal API and never stored server-side.
      </>
    ),
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Find Your OneSignal App ID and REST API Key",
  description,
  step: steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title,
    text: step.plainText,
  })),
};

export default function OneSignalCredentialsGuide() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <p className="text-xs tracking-widest text-mute">
          <Link href="/" className="hover:text-foreground">
            NOTIFI.CHECK
          </Link>{" "}
          / GUIDE
        </p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          Find Your OneSignal App ID & REST API Key
        </h1>
        <p className="mt-2 text-sm text-mute">
          Sending a test push through OneSignal needs three things: an App ID, a REST API key,
          and a Player ID to target. Here&apos;s where to find each one in the OneSignal
          dashboard.
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="rounded-md border border-border bg-panel px-6 py-5 text-sm text-mute"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-xs tracking-widest text-accent">
                STEP {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-sm font-semibold text-foreground">{step.title}</h2>
            </div>
            <p className="mt-2 leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="rounded-md border border-border bg-panel px-6 py-6 text-sm text-mute">
        <h2 className="text-xs tracking-widest text-foreground">SECURITY NOTE</h2>
        <p className="mt-3 leading-relaxed">
          A OneSignal REST API key can send notifications to your entire subscriber base — treat
          it like a password. Don&apos;t commit it to a public repo or share it. Notifi Check
          sends it once per request directly to the OneSignal API and never stores it
          server-side.
        </p>
      </section>

      <Link
        href="/"
        className="w-fit rounded-md border border-accent bg-accent/10 px-4 py-2 text-xs tracking-widest text-accent transition-colors hover:bg-accent/20"
      >
        BACK TO NOTIFI.CHECK
      </Link>
    </main>
  );
}
