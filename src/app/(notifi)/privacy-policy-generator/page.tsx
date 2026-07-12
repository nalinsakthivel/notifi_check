import type { Metadata } from "next";
import Link from "next/link";

const title = "Free Privacy Policy Generator for Android Apps — Google Play Ready";
const description =
  "Generate a professional privacy policy for your Android app in minutes. Covers Firebase, AdMob, GDPR, CCPA, COPPA and 25+ SDKs. Free, no signup, no coding.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/privacy-policy-generator" },
  keywords: [
    "privacy policy generator",
    "android app privacy policy",
    "google play privacy policy",
    "free privacy policy generator",
    "app privacy policy template",
    "GDPR privacy policy generator",
    "AdMob privacy policy",
    "Firebase privacy policy",
  ],
  openGraph: {
    type: "website",
    url: "/privacy-policy-generator",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

const features = [
  {
    title: "GOOGLE_PLAY_READY",
    body: "Structured around what Play Console reviewers expect — data collection, permissions, third-party SDKs, children's privacy, and deletion.",
  },
  {
    title: "25+_SDKS_COVERED",
    body: "Select Firebase, AdMob, OneSignal, Stripe, OpenAI and more — matching disclosure sections with official privacy links are added automatically.",
  },
  {
    title: "GDPR_CCPA_COPPA",
    body: "Toggle the regulations that apply to you and get the corresponding user-rights language written in, including children's privacy under COPPA.",
  },
  {
    title: "NOTHING_LEAVES_YOUR_BROWSER",
    body: "The policy is generated entirely on your device. No signup, no server, no tracking of your answers — drafts autosave to local storage only.",
  },
  {
    title: "EVERY_EXPORT_FORMAT",
    body: "Copy to clipboard or download as Markdown or styled HTML, print, save as PDF, and share — ready to host anywhere Google Play can link to.",
  },
  {
    title: "TEMPLATES_AND_EDITING",
    body: "Start from presets for education, ecommerce, AI, finance, gaming and more, then fine-tune the generated Markdown before you publish.",
  },
];

const steps = [
  {
    title: "DESCRIBE_YOUR_APP",
    body: "Name, developer details, category, monetization — plus exactly which data, permissions, and SDKs your app uses.",
  },
  {
    title: "GENERATE_INSTANTLY",
    body: "The engine assembles only the sections that apply to your answers — thousands of possible policies, never a one-size-fits-all template.",
  },
  {
    title: "PUBLISH_ANYWHERE",
    body: "Preview, edit, then export as HTML, Markdown, or PDF and paste the hosted URL into your Google Play Console listing.",
  },
];

const faq = [
  {
    q: "Is this privacy policy generator really free?",
    a: "Yes — completely free with no signup, no watermarks, and no locked export formats. The policy is generated in your browser and you own the output.",
  },
  {
    q: "Does Google Play require a privacy policy for my app?",
    a: "Yes. Google Play requires a privacy policy link in your store listing for all apps, and it must accurately describe your data collection. It's also required to complete the Data Safety form in Play Console.",
  },
  {
    q: "Is the generated policy legally binding legal advice?",
    a: "No. The generator produces a professional starting document based on your answers, but it is not legal advice. For high-risk categories (finance, health, children's apps), have a lawyer review it before publishing.",
  },
  {
    q: "Where do I host the privacy policy for Google Play?",
    a: "Anywhere with a public URL — your website, GitHub Pages, Notion, or a free static host. Download the HTML export, upload it, and paste the link into Play Console under App content → Privacy policy.",
  },
  {
    q: "Does it cover Firebase, AdMob, and other SDKs?",
    a: "Yes. Selecting a service like Firebase Analytics or Google AdMob automatically adds the matching analytics or advertising disclosure with a link to that provider's privacy policy — 25+ services are supported.",
  },
  {
    q: "Is my app data stored on your servers?",
    a: "No. Everything runs client-side. Your answers are autosaved to your own browser's local storage so you can come back later, and nothing is ever sent to a server.",
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
          name: "Privacy Policy Generator",
          item: `${siteUrl}/privacy-policy-generator`,
        },
      ],
    },
    {
      "@type": "WebApplication",
      name: "Privacy Policy Generator for Android Apps",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web-based)",
      url: `${siteUrl}/privacy-policy-generator`,
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

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
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
          Privacy Policy Generator for Android Apps
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">
          Answer a few questions about your app — data collected, permissions, SDKs — and get a
          professional, Google Play–ready privacy policy. No coding, no lawyer-speak guesswork.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href="/privacy-policy-generator/app"
            className="rounded-md bg-accent px-5 py-2 text-sm font-semibold tracking-widest text-background transition-opacity hover:opacity-85"
          >
            GENERATE_MY_POLICY →
          </Link>
          <a
            href="#how-it-works"
            className="rounded-md border border-border px-5 py-2 text-sm tracking-widest text-mute transition-colors hover:border-mute hover:text-foreground"
          >
            HOW_IT_WORKS
          </a>
        </div>
        <p className="mt-4 text-xs tracking-widest text-mute/70">
          GDPR · CCPA · COPPA · PLAY_DATA_SAFETY_ALIGNED
        </p>
      </div>

      {/* Features */}
      <section
        aria-labelledby="features-heading"
        className="flex flex-col gap-5 rounded-md border border-border bg-panel px-6 py-6"
      >
        <h2 id="features-heading" className="text-xs tracking-widest text-foreground">
          WHAT_YOU_GET
        </h2>
        {features.map((f) => (
          <div key={f.title} className="border-l-2 border-border pl-4">
            <h3 className="text-xs tracking-widest text-accent">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">{f.body}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="flex scroll-mt-16 flex-col gap-5 rounded-md border border-border bg-panel px-6 py-6"
      >
        <h2 id="how-heading" className="text-xs tracking-widest text-foreground">
          HOW_IT_WORKS
        </h2>
        <ol className="flex flex-col gap-5">
          {steps.map((s, i) => (
            <li key={s.title} className="border-l-2 border-border pl-4">
              <h3 className="text-xs tracking-widest text-accent">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
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

      {/* CTA */}
      <div className="flex flex-col items-start gap-3 rounded-md border border-accent bg-accent/[0.07] px-6 py-6">
        <h2 className="text-base font-semibold tracking-tight">
          Ship your app with a policy you can stand behind
        </h2>
        <p className="text-sm text-mute">
          Seven steps, a couple of minutes, and every export format you need for Google Play.
        </p>
        <Link
          href="/privacy-policy-generator/app"
          className="rounded-md bg-accent px-5 py-2 text-sm font-semibold tracking-widest text-background transition-opacity hover:opacity-85"
        >
          START_GENERATING →
        </Link>
      </div>
    </main>
  );
}
