import type { Metadata } from "next";
import { DataSafetyHelper } from "@/components/data-safety/helper";

const title = "Data Safety Form Helper — Google Play Data Safety Worksheet";
const description =
  "Answer once, get the responses for Google Play's Data Safety section — built on the same data catalog as the privacy policy generator. Free, runs in your browser, nothing submitted anywhere.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/data-safety-form-helper" },
  keywords: [
    "google play data safety form",
    "data safety section generator",
    "play console data safety",
    "app data collection worksheet",
    "data safety checklist",
    "google play data safety help",
  ],
  openGraph: {
    type: "website",
    url: "/data-safety-form-helper",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

const faq = [
  {
    q: "Does this submit anything to Google Play Console?",
    a: "No. This tool only builds a worksheet in your browser — a table you read from and transcribe into Play Console's Data Safety form yourself. Nothing is sent anywhere, and nothing is stored server-side.",
  },
  {
    q: "Is this legal advice or an official Google tool?",
    a: "No to both. It's an unofficial worksheet, not legal advice and not a substitute for reading Google's own Data Safety policy. You're responsible for the accuracy of what you submit — Google can suspend apps over Data Safety mismatches, so double-check every row against your app's actual behavior before transcribing it.",
  },
  {
    q: "How does it suggest purposes for the SDKs I use?",
    a: "Each service in the catalog has a category (analytics, ads, crash reporting, auth, etc.). Checking a service shows a hint of the purposes typically associated with that category — it's a convenience suggestion only. Your own checkbox selections on each data type are what drive the output.",
  },
  {
    q: "What's the difference between this and the Privacy Policy Generator?",
    a: "Both draw from the same data-type and service catalog, but they produce different things: the Privacy Policy Generator writes a policy document for your users; this tool produces the specific Collected / Shared / Optional / Purpose answers Play Console's Data Safety form asks for.",
  },
  {
    q: "What are Google's fixed purpose options?",
    a: "App functionality, Analytics, Developer communications, Advertising or marketing, Fraud prevention/security/compliance, Personalization, and Account management — the same list Play Console shows you per data type.",
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
        {
          "@type": "ListItem",
          position: 2,
          name: "Data Safety Form Helper",
          item: `${siteUrl}/data-safety-form-helper`,
        },
      ],
    },
    {
      "@type": "WebApplication",
      name: "Data Safety Form Helper",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web-based)",
      url: `${siteUrl}/data-safety-form-helper`,
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

export default function DataSafetyFormHelperPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <span className="text-xs tracking-widest text-mute">
          FREE · NO_SIGNUP · RUNS_IN_YOUR_BROWSER
        </span>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">Data Safety Form Helper</h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">
          Answer once, get the responses for Google Play&apos;s Data Safety section — built on the
          same data catalog as the Privacy Policy Generator. A worksheet you transcribe into Play
          Console yourself; nothing here is submitted anywhere.
        </p>
      </div>

      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <DataSafetyHelper />
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
