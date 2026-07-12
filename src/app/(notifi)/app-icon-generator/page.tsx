import type { Metadata } from "next";
import { IconGenerator } from "@/components/icon/generator";

const title = "Free App Icon Generator — iOS, Android, Web & macOS Icon Sizes";
const description =
  "Generate every app icon size from one image: Android launcher icons, iOS AppIcon set with Contents.json, favicons, PWA icons, macOS iconset, and Windows ICO. Free, runs in your browser.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/app-icon-generator" },
  keywords: [
    "app icon generator",
    "ios app icon sizes",
    "android launcher icon generator",
    "favicon generator",
    "pwa icon generator",
    "appiconset generator",
    "icon resizer",
    "free app icon maker",
  ],
  openGraph: {
    type: "website",
    url: "/app-icon-generator",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

const features = [
  {
    title: "EVERY_PLATFORM_AT_ONCE",
    body: "One 1024×1024 image in, a structured ZIP out: Android mipmap densities, the full iOS AppIcon.appiconset, web favicons and PWA icons, a macOS iconset, and a Windows ICO.",
  },
  {
    title: "XCODE_READY",
    body: "The iOS folder includes a generated Contents.json — drag AppIcon.appiconset straight into Assets.xcassets and you're done. iOS icons are auto-flattened since the App Store rejects transparency.",
  },
  {
    title: "REAL_FAVICON.ICO",
    body: "Gets you a proper multi-size favicon.ico (16/32/48) plus apple-touch-icon and maskable PWA icons with the safe-zone padding Android expects.",
  },
  {
    title: "NOTHING_LEAVES_YOUR_BROWSER",
    body: "Resizing, ICO packing, and zipping run entirely on your device with the Canvas API. Your artwork is never uploaded anywhere.",
  },
  {
    title: "QUALITY_DOWNSCALING",
    body: "Icons are halved in steps with high-quality smoothing instead of one giant jump, so 16px and 48px sizes stay crisp instead of muddy.",
  },
  {
    title: "README_INCLUDED",
    body: "The ZIP ships with a README telling you exactly where each folder goes — res/, Assets.xcassets, your web root, or iconutil for .icns.",
  },
];

const steps = [
  {
    title: "UPLOAD_YOUR_ARTWORK",
    body: "Drop in a square PNG, JPEG, WebP, or SVG — 1024×1024 or larger for best results. Non-square images are center-cropped.",
  },
  {
    title: "PICK_PLATFORMS_AND_OPTIONS",
    body: "Choose Android, iOS, Web/PWA, macOS, and Windows, set a background color for flattened icons, and keep or drop transparency.",
  },
  {
    title: "DOWNLOAD_THE_ZIP",
    body: "Preview key sizes, then download one ZIP with every icon organized by platform, ready to drop into your project.",
  },
];

const faq = [
  {
    q: "What size should my source image be?",
    a: "1024×1024 pixels or larger, since the biggest generated icon (iOS App Store / Play Store) is 1024px or 512px. Smaller images still work but large icons may look soft. Non-square images are center-cropped automatically.",
  },
  {
    q: "Which icon sizes does it generate for Android?",
    a: "All launcher densities — mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, and xxxhdpi 192 — organized into mipmap folders, plus the 512×512 Play Store listing icon. For adaptive icons, use your artwork as the foreground layer in Android Studio's Image Asset tool.",
  },
  {
    q: "Which iOS sizes are included?",
    a: "The complete AppIcon set for iPhone and iPad: 20, 29, 40, 60, 76, and 83.5 pt at their @1x/@2x/@3x scales, plus the 1024×1024 App Store marketing icon — with a Contents.json so Xcode recognizes the set immediately.",
  },
  {
    q: "Why are iOS icons flattened onto a background color?",
    a: "Apple requires app icons to be fully opaque — the App Store rejects icons with an alpha channel. Transparent areas are filled with your chosen background color for iOS (and the maskable PWA icon), while Android launcher icons and favicons can keep transparency.",
  },
  {
    q: "Is my image uploaded to a server?",
    a: "No. Decoding, resizing, ICO packing, and ZIP creation all happen locally in your browser using the Canvas API. The image never leaves your device.",
  },
  {
    q: "How do I make a macOS .icns file?",
    a: "The ZIP includes an AppIcon.iconset folder with all required sizes. On a Mac, run: iconutil -c icns AppIcon.iconset — that produces AppIcon.icns for your app bundle.",
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
          name: "App Icon Generator",
          item: `${siteUrl}/app-icon-generator`,
        },
      ],
    },
    {
      "@type": "WebApplication",
      name: "App Icon Generator",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web-based)",
      url: `${siteUrl}/app-icon-generator`,
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

export default function AppIconGeneratorPage() {
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
          App Icon Generator for iOS, Android, Web & more
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">
          Upload one square image and download every icon size your app needs — Android launcher
          icons, the full iOS AppIcon set with Contents.json, favicons, PWA icons, macOS iconset,
          and Windows ICO — in a single organized ZIP.
        </p>
      </div>

      {/* Tool */}
      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <IconGenerator />
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
