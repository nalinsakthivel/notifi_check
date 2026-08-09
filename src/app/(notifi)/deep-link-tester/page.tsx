import type { Metadata } from "next";
import { DeepLinkTester } from "@/components/deep-link/tester";

const title = "Deep Link Tester — Parse, QR Code & App Links Validator";
const description =
  "Parse custom-scheme and HTTPS App/Universal Links, generate a scannable QR code, and validate Android assetlinks.json and iOS apple-app-site-association files. Free, runs in your browser.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/deep-link-tester" },
  keywords: [
    "deep link tester",
    "app link validator",
    "universal link tester",
    "assetlinks.json validator",
    "apple-app-site-association validator",
    "deep link qr code generator",
    "android app links",
    "ios universal links",
  ],
  openGraph: {
    type: "website",
    url: "/deep-link-tester",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

const faq = [
  {
    q: "What's the difference between a custom scheme link and an App/Universal Link?",
    a: "A custom scheme (myapp://path) only works if the app is installed and only your app can register that scheme. An HTTPS App Link (Android) or Universal Link (iOS) uses a real https:// URL that opens your app if it's installed and falls back to the browser if not — but requires hosting a verification file.",
  },
  {
    q: "Why does the assetlinks.json / AASA check say it couldn't fetch?",
    a: "Both files are fetched directly from your browser, which is subject to CORS. Most sites don't send permissive CORS headers on well-known files, so a blocked fetch is expected — check your browser's Network tab, or verify server-side (curl) to confirm the file itself is correct.",
  },
  {
    q: "Does the QR code get sent anywhere?",
    a: "No — the QR encoder runs entirely in your browser (a hand-rolled implementation, no third-party service or library), and the canvas never leaves your device except when you choose to download the PNG.",
  },
  {
    q: "What do the assetlinks.json rules check?",
    a: "That the file is a JSON array, each entry's relation includes delegate_permission/common.handle_all_urls, and target has namespace \"android_app\", a package_name string, and sha256_cert_fingerprints formatted as colon-separated hex pairs.",
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
        { "@type": "ListItem", position: 2, name: "Deep Link Tester", item: `${siteUrl}/deep-link-tester` },
      ],
    },
    {
      "@type": "WebApplication",
      name: "Deep Link Tester",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web-based)",
      url: `${siteUrl}/deep-link-tester`,
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

export default function DeepLinkTesterPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <span className="text-xs tracking-widest text-mute">FREE · NO_SIGNUP · RUNS_IN_YOUR_BROWSER</span>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">Deep Link Tester</h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">
          Parse a custom-scheme or HTTPS App/Universal Link, generate a scannable QR code, and
          validate Android <code className="text-foreground">assetlinks.json</code> and iOS{" "}
          <code className="text-foreground">apple-app-site-association</code> files.
        </p>
      </div>

      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <DeepLinkTester />
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
