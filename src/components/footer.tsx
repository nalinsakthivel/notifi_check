import Link from "next/link";

const links = [
  { href: "/push-notification-tester", label: "PUSH_TESTER" },
  { href: "/privacy-policy-generator", label: "PRIVACY_POLICY_GENERATOR" },
  { href: "/app-icon-generator", label: "APP_ICON_GENERATOR" },
  { href: "/deep-link-tester", label: "DEEP_LINK_TESTER" },
  { href: "/apk-aab-analyzer", label: "APK_AAB_ANALYZER" },
  { href: "/store-asset-resizer", label: "STORE_ASSET_RESIZER" },
  { href: "/data-safety-form-helper", label: "DATA_SAFETY_FORM_HELPER" },
  { href: "/fcm-payload-builder", label: "FCM_PAYLOAD_BUILDER" },
  { href: "/guide/firebase-service-account", label: "FIREBASE_SETUP" },
  { href: "/guide/onesignal-app-id-and-rest-api-key", label: "ONESIGNAL_SETUP" },
  { href: "/guide/fcm-error-codes", label: "FCM_ERROR_CODES" },
  { href: "/guide/fcm-vs-onesignal", label: "FCM_VS_ONESIGNAL" },
  { href: "/feedback", label: "FEEDBACK" },
];

const GITHUB_URL = "https://github.com/nalinsakthivel/notifi_check";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="flex flex-col items-center gap-3 border-t border-border px-4 py-5 text-xs tracking-widest text-mute">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          GITHUB
        </a>
      </nav>
      <div className="flex flex-col items-center gap-1">
        <span>© {year} NOTIFI.CHECK</span>
        <span>
          BUILT BY{" "}
          <a
            href="https://nalinsakthivel.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            NALIN SAKTHIVEL
          </a>
        </span>
      </div>
    </footer>
  );
}
