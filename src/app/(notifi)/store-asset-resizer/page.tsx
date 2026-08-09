import type { Metadata } from "next";
import { StoreAssetResizer } from "@/components/store-asset/resizer";

const title = "Free Store Asset Resizer — Google Play & App Store Screenshot Sizes";
const description =
  "Resize app screenshots to every Google Play and Apple App Store listing size — phone, tablet, feature graphic, iPhone, and iPad — in one ZIP. Free, runs in your browser.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/store-asset-resizer" },
  keywords: [
    "store asset resizer",
    "app screenshot resizer",
    "google play screenshot sizes",
    "app store screenshot sizes",
    "feature graphic generator",
    "play store listing images",
    "ios screenshot resizer",
  ],
  openGraph: {
    type: "website",
    url: "/store-asset-resizer",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

const features = [
  {
    title: "MULTIPLE_SCREENSHOTS_AT_ONCE",
    body: "Drop in every screenshot for your listing and resize all of them to every selected target size in one pass — no repeating the same crop by hand.",
  },
  {
    title: "NEVER_DISTORTS_YOUR_ART",
    body: "Each screenshot is fit-contain onto the exact target dimensions and centered, preserving aspect ratio. Leftover space is letterboxed with a background color you pick, not stretched or cropped.",
  },
  {
    title: "GOOGLE_PLAY_+_APP_STORE_PRESETS",
    body: "Phone and tablet sizes for Google Play, plus the feature graphic, and iPhone/iPad presets for the App Store — organized into one folder per size inside the ZIP.",
  },
  {
    title: "NOTHING_LEAVES_YOUR_BROWSER",
    body: "Resizing and zipping run entirely on your device with the Canvas API. Your screenshots are never uploaded anywhere.",
  },
];

const steps = [
  {
    title: "UPLOAD_YOUR_SCREENSHOTS",
    body: "Drag in one or more PNG, JPEG, or WebP screenshots — mobile screens, marketing shots, whatever your listing needs.",
  },
  {
    title: "PICK_TARGET_SIZES_AND_BACKGROUND",
    body: "Choose which Google Play and App Store sizes to generate, and set the letterbox background color used to fill any leftover space.",
  },
  {
    title: "DOWNLOAD_THE_ZIP",
    body: "Every screenshot gets resized to every selected size, organized into one folder per target — ready to upload to Play Console or App Store Connect.",
  },
];

const faq = [
  {
    q: "Will this stretch or crop my screenshots?",
    a: "No. Each screenshot is scaled to fit entirely within the target dimensions (fit-contain) and centered — aspect ratio is always preserved. Any leftover space is filled with your chosen background color instead of cropping or stretching the image.",
  },
  {
    q: "Which sizes are included?",
    a: "Google Play: phone portrait (1080×1920), phone landscape (1920×1080), 7-inch tablet (1200×1920), 10-inch tablet (1600×2560), and the feature graphic (1024×500). App Store: 6.9\" iPhone, 6.5\" iPhone, iPhone 15/16 Pro, and iPad Pro 13\".",
  },
  {
    q: "Are these the exact sizes Apple and Google require?",
    a: "They're commonly-used, currently-accurate presets, but store requirements change over time and vary by submission flow. Always double check the current Google Play Console and App Store Connect requirements before submitting — this tool only handles the resizing mechanics.",
  },
  {
    q: "Is my screenshot uploaded to a server?",
    a: "No. Decoding, resizing, and ZIP creation all happen locally in your browser using the Canvas API. Your images never leave your device.",
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
          name: "Store Asset Resizer",
          item: `${siteUrl}/store-asset-resizer`,
        },
      ],
    },
    {
      "@type": "WebApplication",
      name: "Store Asset Resizer",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web-based)",
      url: `${siteUrl}/store-asset-resizer`,
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

export default function StoreAssetResizerPage() {
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
          Store Asset Resizer for Google Play & App Store
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">
          Upload your screenshots and download every Google Play and App Store listing size —
          phone, tablet, feature graphic, iPhone, and iPad — resized without distortion, organized
          into one ZIP.
        </p>
      </div>

      {/* Tool */}
      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <StoreAssetResizer />
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
            <h3 className="min-w-0 text-xs tracking-widest text-accent wrap-anywhere">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">{f.body}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section
        aria-labelledby="how-heading"
        className="flex flex-col gap-5 rounded-md border border-border bg-panel px-6 py-6"
      >
        <h2 id="how-heading" className="text-xs tracking-widest text-foreground">
          HOW_IT_WORKS
        </h2>
        <ol className="flex flex-col gap-5">
          {steps.map((s, i) => (
            <li key={s.title} className="border-l-2 border-border pl-4">
              <h3 className="min-w-0 text-xs tracking-widest text-accent wrap-anywhere">
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
    </main>
  );
}
