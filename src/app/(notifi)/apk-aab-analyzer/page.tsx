import type { Metadata } from "next";
import { ApkAnalyzer } from "@/components/apk-analyzer/analyzer";

const title =
  "APK/AAB Analyzer — Inspect Android Package Manifest & Size, Free";
const description =
  "Drop in an .apk or .aab and inspect its manifest (package, version, SDK, permissions), signing info, and a size breakdown by category — entirely in your browser, nothing uploaded.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/apk-aab-analyzer" },
  keywords: [
    "apk analyzer",
    "aab analyzer",
    "android app bundle inspector",
    "androidmanifest.xml viewer",
    "apk permissions viewer",
    "apk size breakdown",
    "apk signature checker",
    "android binary xml parser",
  ],
  openGraph: {
    type: "website",
    url: "/apk-aab-analyzer",
    title,
    description,
    siteName: "Notifi Check",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Notifi Check",
      },
    ],
  },
  twitter: { card: "summary_large_image", title, description },
};

const features = [
  {
    title: "MANIFEST_DETAILS",
    body: "Package name, version code/name, min/target SDK, every uses-permission, and the list of activities/services/receivers/providers — parsed straight out of the APK's binary-XML manifest.",
  },
  {
    title: "SIGNING_INFO",
    body: "Detects legacy v1 signature material and modern v2/v3 signing-block IDs. Extracts a certificate SHA-256 where structurally readable. Detection and certificate extraction are not cryptographic verification; missing legacy files never means an APK is unsigned.",
  },
  {
    title: "SIZE_BREAKDOWN",
    body: "Entries grouped into DEX code, resources, assets, native libraries (per ABI), signing, and compiled resources — with a percentage of total size for each.",
  },
  {
    title: "AAB_SUPPORT",
    body: "Detects Android App Bundles, lists dynamic feature modules, and gives the same size breakdown. AAB's protobuf manifest isn't parsed yet — that's flagged clearly rather than guessed at.",
  },
  {
    title: "NOTHING_UPLOADED",
    body: "The file is read and parsed with the ZIP/binary-XML logic running entirely in your browser. Your APK/AAB never leaves your device.",
  },
];

const faq = [
  {
    q: "Is my APK or AAB uploaded anywhere?",
    a: "No. The file is read with the File API and parsed entirely client-side — ZIP extraction, binary XML manifest parsing, and signature inspection all run in your browser.",
  },
  {
    q: "How is the manifest read without a plain-XML AndroidManifest.xml?",
    a: "APK manifests are stored in a compact binary format (AXML) — a string pool plus a stream of start/end element and attribute chunks. This tool implements a minimal parser for that chunk format to pull out the package name, version, SDK levels, permissions, and component names.",
  },
  {
    q: "Why isn't there always a certificate SHA-256 fingerprint?",
    a: "A fingerprint requires exact DER certificate bytes from a supported PKCS#7 or APK signing block. Ambiguous or malformed structures are reported as unknown. Signatures are not cryptographically verified. Local or upload certificates may differ from the Play App Signing distribution certificate.",
  },
  {
    q: "Why is AAB manifest parsing more limited than APK?",
    a: "An .aab's AndroidManifest.xml is serialized protobuf (aapt2's Resources.proto), a different and larger parsing job than APK's binary XML. For now, AAB analysis covers file size breakdown and the list of dynamic feature modules; manifest field extraction is not yet implemented.",
  },
  {
    q: "What counts as 'Native libraries' in the size breakdown?",
    a: "Entries under lib/ or AAB module lib/ paths, broken out per ABI folder (armeabi-v7a, arm64-v8a, x86, x86_64) so you can see which architectures are inflating your package size.",
  },
];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Notifi Check",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "APK/AAB Analyzer",
          item: `${siteUrl}/apk-aab-analyzer`,
        },
      ],
    },
    {
      "@type": "WebApplication",
      name: "APK/AAB Analyzer",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web-based)",
      url: `${siteUrl}/apk-aab-analyzer`,
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

export default function ApkAabAnalyzerPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10 wrap-anywhere">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <span className="text-xs tracking-widest text-mute">
          FREE · NO_SIGNUP · RUNS_IN_YOUR_BROWSER
        </span>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          APK/AAB Analyzer
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">
          Drop in an .apk or .aab and get its manifest details, signing info,
          and a size breakdown by category — parsed entirely in your browser,
          nothing ever uploaded.
        </p>
      </div>

      {/* Tool */}
      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <ApkAnalyzer />
      </div>

      {/* Features */}
      <section
        aria-labelledby="features-heading"
        className="flex flex-col gap-5 rounded-md border border-border bg-panel px-6 py-6"
      >
        <h2
          id="features-heading"
          className="text-xs tracking-widest text-foreground"
        >
          WHAT_YOU_GET
        </h2>
        {features.map((f) => (
          <div key={f.title} className="border-l-2 border-border pl-4">
            <h3 className="min-w-0 text-xs tracking-widest text-accent wrap-anywhere">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">{f.body}</p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section
        aria-labelledby="faq-heading"
        className="flex flex-col gap-3 rounded-md border border-border bg-panel px-6 py-6"
      >
        <h2
          id="faq-heading"
          className="mb-2 text-xs tracking-widest text-foreground"
        >
          FAQ
        </h2>
        {faq.map((f) => (
          <details
            key={f.q}
            className="group rounded-md border border-border open:border-accent/60"
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-sm text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {f.q}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-mute transition-transform group-open:rotate-45"
                >
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
