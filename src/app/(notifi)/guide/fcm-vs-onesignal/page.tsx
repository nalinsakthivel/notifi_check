import type { Metadata } from "next";
import Link from "next/link";

const title = "FCM vs OneSignal: Which to Test With — Notifi Check";
const description =
  "How Firebase Cloud Messaging and OneSignal differ for push notifications, and which one to reach for depending on your stack.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "/guide/fcm-vs-onesignal",
  },
  openGraph: {
    type: "article",
    url: "/guide/fcm-vs-onesignal",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const rows = [
  {
    label: "Credential model",
    fcm: "Firebase service account JSON (project-scoped admin credential)",
    onesignal: "App ID + REST API key (no per-project file to manage)",
  },
  {
    label: "Targeting",
    fcm: "Raw device/web-push registration token, or topic/condition",
    onesignal: "Player ID / Subscription ID, or segments and tags",
  },
  {
    label: "Delivery infra",
    fcm: "Google's own infra — direct to Android, iOS (via APNs), and web push",
    onesignal: "Third-party layer on top of FCM/APNs — adds its own dashboard, analytics, A/B testing",
  },
  {
    label: "Setup cost",
    fcm: "Requires a Firebase project + generating a service account key",
    onesignal: "Requires a OneSignal account + linking your Firebase/APNs credentials once",
  },
  {
    label: "Best fit",
    fcm: "You already run on Firebase, or want the fewest moving parts / vendors",
    onesignal: "You want built-in segmentation, A/B testing, and analytics without building it yourself",
  },
];

const faq = [
  {
    q: "Can I use both FCM and OneSignal in the same app?",
    a: "Yes — OneSignal actually sends through FCM/APNs under the hood for many platforms, so using OneSignal doesn't require you to give up Firebase. Some teams use FCM directly for transactional pushes and OneSignal for marketing segments.",
  },
  {
    q: "Which is free?",
    a: "Both have generous free tiers for testing and small-to-medium volume. FCM is free at any volume for standard messages. OneSignal is free up to a subscriber-count threshold, then paid tiers add advanced segmentation and support.",
  },
  {
    q: "Which is easier to test without writing code?",
    a: "Both — Notifi Check supports sending a real test push through either provider directly from the browser: FCM via a service account JSON, or OneSignal via an App ID and REST API key.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FcmVsOneSignalGuide() {
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
          FCM vs OneSignal: Which Should You Test With
        </h1>
        <p className="mt-2 text-sm text-mute">
          Firebase Cloud Messaging (FCM) and OneSignal both deliver push notifications to
          Android, iOS, and web — but they differ in credential model, targeting, and
          what&apos;s built on top. Here&apos;s how they compare.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-panel">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-widest text-mute">
              <th className="px-4 py-3 font-normal"> </th>
              <th className="px-4 py-3 font-normal text-foreground">FCM</th>
              <th className="px-4 py-3 font-normal text-foreground">ONESIGNAL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 align-top text-xs tracking-widest text-accent">
                  {r.label}
                </td>
                <td className="px-4 py-3 align-top text-mute">{r.fcm}</td>
                <td className="px-4 py-3 align-top text-mute">{r.onesignal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="flex flex-col gap-5 rounded-md border border-border bg-panel px-6 py-6">
        {faq.map((f) => (
          <div key={f.q} className="border-l-2 border-border pl-4">
            <h2 className="text-xs tracking-widest text-foreground">{f.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{f.a}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/guide/firebase-service-account"
          className="w-fit rounded-md border border-border px-4 py-2 text-xs tracking-widest text-mute transition-colors hover:border-mute hover:text-foreground"
        >
          FIREBASE_SETUP_GUIDE
        </Link>
        <Link
          href="/guide/onesignal-app-id-and-rest-api-key"
          className="w-fit rounded-md border border-border px-4 py-2 text-xs tracking-widest text-mute transition-colors hover:border-mute hover:text-foreground"
        >
          ONESIGNAL_SETUP_GUIDE
        </Link>
        <Link
          href="/"
          className="w-fit rounded-md border border-accent bg-accent/10 px-4 py-2 text-xs tracking-widest text-accent transition-colors hover:bg-accent/20"
        >
          BACK TO NOTIFI.CHECK
        </Link>
      </div>
    </main>
  );
}
