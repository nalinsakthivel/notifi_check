import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { StatusBar } from "@/components/status-bar";
import { DevtoolsGuard } from "@/components/devtools-guard";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const title = "Notifi Check — FCM Push Notification Tester";
const description =
  "Send test push notifications through Firebase Cloud Messaging. Upload a service account, fire a data or web-push message, and see the result — nothing is stored server-side.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — Notifi Check",
  },
  description,
  applicationName: "Notifi Check",
  keywords: [
    "FCM",
    "Firebase Cloud Messaging",
    "push notification tester",
    "web push",
    "notification testing tool",
  ],
  authors: [{ name: "Notifi Check" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#050608",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Notifi Check",
  alternateName: "FCM Push Notification Tester",
  description,
  url: siteUrl,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web-based)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Send FCM data and notification messages",
    "Send web push messages with icon, image, and link",
    "Validate-only dry run for web push",
    "No server-side storage of credentials",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DevtoolsGuard />
        <StatusBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
