import type { Metadata } from "next";
import Link from "next/link";

const title = "Get a Firebase Service Account JSON — Notifi Check";
const description =
  "Step-by-step guide to generating a Firebase service account JSON key from the Firebase console to send test FCM push notifications.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "/guide/firebase-service-account",
  },
  openGraph: {
    type: "article",
    url: "/guide/firebase-service-account",
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
    title: "Open your Firebase project",
    plainText:
      "Go to the Firebase console and select the project you want a test push notification credential for. If you don't have a project yet, create one first — it's free.",
    body: (
      <>
        Go to the{" "}
        <span className="text-foreground">Firebase console</span> and select the project you
        want a test push notification credential for. If you don&apos;t have a project yet,
        create one first — it&apos;s free.
      </>
    ),
  },
  {
    title: "Open Project Settings",
    plainText:
      "Click the gear icon next to Project Overview in the top-left sidebar, then select Project settings.",
    body: (
      <>
        Click the gear icon next to <span className="text-foreground">Project Overview</span> in
        the top-left sidebar, then select <span className="text-foreground">Project settings</span>.
      </>
    ),
  },
  {
    title: "Go to the Service Accounts tab",
    plainText:
      'In Project settings, click the Service accounts tab. You\'ll see a "Firebase Admin SDK" panel with your project\'s default service account already selected.',
    body: (
      <>
        In Project settings, click the{" "}
        <span className="text-foreground">Service accounts</span> tab. You&apos;ll see a
        &quot;Firebase Admin SDK&quot; panel with your project&apos;s default service account
        already selected.
      </>
    ),
  },
  {
    title: "Generate a new private key",
    plainText:
      "Click Generate new private key, then confirm in the dialog that appears. This downloads a JSON file to your computer — this is your service account credential.",
    body: (
      <>
        Click <span className="text-foreground">Generate new private key</span>, then confirm in
        the dialog that appears. This downloads a JSON file to your computer — this is your
        service account credential.
      </>
    ),
  },
  {
    title: "Upload the JSON file to Notifi Check",
    plainText:
      'Head back to the Notifi Check tester, choose the SEND or WEB_PUSH tab, and upload the downloaded file in the "Firebase service account JSON" field. It\'s read once for that request and never stored — nothing touches a database or disk on the server.',
    body: (
      <>
        Head back to the <Link href="/" className="text-accent underline">Notifi Check</Link>{" "}
        tester, choose the <span className="text-foreground">SEND</span> or{" "}
        <span className="text-foreground">WEB_PUSH</span> tab, and upload the downloaded file in
        the &quot;Firebase service account JSON&quot; field. It&apos;s read once for that request
        and never stored — nothing touches a database or disk on the server.
      </>
    ),
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Get a Firebase Service Account JSON",
  description,
  step: steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title,
    text: step.plainText,
  })),
};

export default function FirebaseServiceAccountGuide() {
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
          How to Get a Firebase Service Account JSON
        </h1>
        <p className="mt-2 text-sm text-mute">
          A Firebase service account JSON key is what lets a server (or a tool like Notifi Check)
          authenticate as your Firebase project and send messages through Firebase Cloud
          Messaging (FCM). Here&apos;s how to generate one from the Firebase console.
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
          A service account JSON grants admin access to your Firebase project — treat it like a
          password. Don&apos;t commit it to a public repo, don&apos;t share it, and revoke it from the
          Service Accounts tab if you ever suspect it leaked. Notifi Check reads the file once
          per request, uses it to create a short-lived Firebase Admin instance, and discards it
          immediately after — it is never written to disk, logged, or stored server-side.
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
