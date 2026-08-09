import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const tools = [
  {
    href: "/push-notification-tester",
    label: "PUSH_NOTIFICATION_TESTER",
    badge: "live",
    description:
      "Send a real FCM or OneSignal test push from the browser — service account or REST API key, nothing stored server-side.",
  },
  {
    href: "/privacy-policy-generator",
    label: "PRIVACY_POLICY_GENERATOR",
    badge: "live",
    description:
      "Answer 7 quick steps and get a Google Play–ready privacy policy for your Android app — GDPR, CCPA, COPPA, 25+ SDKs.",
  },
  {
    href: "/app-icon-generator",
    label: "APP_ICON_GENERATOR",
    badge: "new",
    description:
      "Upload one image, download every icon size — Android mipmaps, iOS AppIcon set, favicons, PWA, macOS, and Windows ICO.",
  },
  {
    href: "/deep-link-tester",
    label: "DEEP_LINK_TESTER",
    badge: "new",
    description:
      "Paste a URL scheme or App Link, generate a QR code, and validate assetlinks.json / apple-app-site-association by fetching and lint-checking them.",
  },
  {
    href: "/apk-aab-analyzer",
    label: "APK_AAB_ANALYZER",
    badge: "new",
    description:
      "Drag in an APK or AAB — package name, version, min/target SDK, permissions, signing cert SHA-256, and a size breakdown.",
  },
  {
    href: "/store-asset-resizer",
    label: "STORE_ASSET_RESIZER",
    badge: "new",
    description:
      "Upload screenshots and resize them to Play Store and App Store required dimensions, export as a ZIP.",
  },
  {
    href: "/data-safety-form-helper",
    label: "DATA_SAFETY_FORM_HELPER",
    badge: "new",
    description:
      "Answer once, get the responses for Google Play's Data Safety section — built on the same data catalog as the privacy policy generator.",
  },
  {
    href: "/fcm-payload-builder",
    label: "FCM_PAYLOAD_BUILDER",
    badge: "new",
    description:
      "A visual builder for the full FCM message JSON (android/apns/webpush blocks, priority, TTL, collapse keys) with cURL/Node/Flutter export.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Notifi Check",
      url: siteUrl,
      description:
        "Free developer tools: FCM & OneSignal push notification tester and Android privacy policy generator. No signup, nothing stored server-side.",
    },
    {
      "@type": "ItemList",
      name: "Notifi Check developer tools",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "FCM & OneSignal Push Notification Tester",
          url: `${siteUrl}/push-notification-tester`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Privacy Policy Generator for Android Apps",
          url: `${siteUrl}/privacy-policy-generator`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "App Icon Generator",
          url: `${siteUrl}/app-icon-generator`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Deep Link Tester",
          url: `${siteUrl}/deep-link-tester`,
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "APK/AAB Analyzer",
          url: `${siteUrl}/apk-aab-analyzer`,
        },
        {
          "@type": "ListItem",
          position: 6,
          name: "Store Asset Resizer",
          url: `${siteUrl}/store-asset-resizer`,
        },
        {
          "@type": "ListItem",
          position: 7,
          name: "Data Safety Form Helper",
          url: `${siteUrl}/data-safety-form-helper`,
        },
        {
          "@type": "ListItem",
          position: 8,
          name: "FCM Payload Builder",
          url: `${siteUrl}/fcm-payload-builder`,
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 72 72" fill="none" className="shrink-0 text-foreground">
            <path
              d="M23 44V31C23 22 29.8 15 38 15C46.2 15 53 22 53 31V44L57 50H19L23 44Z"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d="M31 50C31 53.3 33.7 56 37 56C40.3 56 43 53.3 43 50"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="53" cy="20" r="12" fill="#3b82f6" stroke="#3b82f6" strokeWidth="3" />
            <path
              d="M47.5 20L51.5 24L59 15.5"
              stroke="#050608"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-base font-semibold tracking-wide">
            NOTIFI<span className="text-accent">.CHECK</span>
          </span>
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Free developer tools for app builders
        </h1>
        <p className="mt-1 text-sm text-mute">
          No signup, no tracking of your inputs, nothing stored server-side. Pick a tool to get
          started.
        </p>
      </div>

      <nav aria-label="Tools" className="flex flex-col gap-3">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-md border border-border bg-panel px-5 py-4 transition-colors hover:border-accent"
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0 rounded-sm bg-live px-1.5 py-0.5 text-[10px] font-semibold tracking-widest text-background">
                {t.badge}
              </span>
              <span className="min-w-0 text-sm tracking-widest text-foreground wrap-anywhere">
                {t.label}
              </span>
              <span className="ml-auto shrink-0 text-accent transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-mute">{t.description}</p>
          </Link>
        ))}

      </nav>

      <section className="rounded-md border border-border bg-panel px-6 py-6">
        <div className="border-l-2 border-border pl-4">
          <h2 className="text-xs tracking-widest text-foreground">ABOUT</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Notifi Check is a small collection of free tools for app developers. Test Firebase
            Cloud Messaging and OneSignal push notifications without writing code, or generate a
            professional privacy policy for your Google Play listing. Everything runs per-request
            or in your browser — credentials and answers are never stored on a server.
          </p>
        </div>
      </section>
    </main>
  );
}
