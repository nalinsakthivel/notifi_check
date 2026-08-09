import type { Metadata } from "next";
import { FcmPayloadBuilder } from "@/components/fcm-payload/builder";

const title = "FCM Payload Builder — Visual Firebase Cloud Messaging JSON Builder";
const description =
  "Build a full FCM HTTP v1 message JSON visually — notification, data, android, apns, and webpush blocks — and export it as cURL, Node.js, or Flutter code. Free, runs in your browser.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/fcm-payload-builder" },
  keywords: [
    "fcm payload builder",
    "firebase cloud messaging json",
    "fcm http v1 message",
    "fcm android payload",
    "fcm apns payload",
    "fcm curl example",
    "fcm node.js example",
  ],
  openGraph: {
    type: "website",
    url: "/fcm-payload-builder",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

const faq = [
  {
    q: "What is the FCM HTTP v1 message format?",
    a: "It's the JSON body Firebase's v1 Send API expects, wrapped as { \"message\": {...} }. It can include a token/topic/condition target, a notification block, a flat string-only data block, and platform-specific android/apns/webpush overrides.",
  },
  {
    q: "Why must data payload values be strings?",
    a: "FCM's data payload is delivered to the client as a flat map of strings — numbers, booleans, and objects must be serialized (e.g. JSON.stringify) before sending and parsed back out in your app.",
  },
  {
    q: "Does this send the notification?",
    a: "No — this only builds the JSON message body. Use the cURL/Node export with a real OAuth access token or Admin SDK credential, or use the Push Notification Tester to actually send.",
  },
  {
    q: "What does apns-priority 5 vs 10 mean?",
    a: "10 delivers immediately and wakes the device; 5 is throttled for power efficiency and can be delayed. Apple requires priority 5 for any notification with content-available but no alert/sound/badge.",
  },
];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Notifi Check", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "FCM Payload Builder", item: `${siteUrl}/fcm-payload-builder` },
      ],
    },
    {
      "@type": "WebApplication",
      name: "FCM Payload Builder",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web-based)",
      url: `${siteUrl}/fcm-payload-builder`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description,
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function FcmPayloadBuilderPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <span className="text-xs tracking-widest text-mute">FREE · NO_SIGNUP · RUNS_IN_YOUR_BROWSER</span>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">FCM Payload Builder</h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">
          Visually build the full FCM HTTP v1 message JSON — notification, data, android, apns, and
          webpush blocks — then export as cURL, Node.js, or a Flutter receive handler.
        </p>
      </div>

      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <FcmPayloadBuilder />
      </div>

      <section
        aria-labelledby="faq-heading"
        className="flex flex-col gap-3 rounded-md border border-border bg-panel px-6 py-6"
      >
        <h2 id="faq-heading" className="mb-2 text-xs tracking-widest text-foreground">
          FAQ
        </h2>
        {faq.map((f) => (
          <details key={f.q} className="group rounded-md border border-border open:border-accent/60">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {f.q}
                <span aria-hidden="true" className="shrink-0 text-mute transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-mute">{f.a}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
