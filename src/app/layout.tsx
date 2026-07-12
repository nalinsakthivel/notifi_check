import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const title = "Notifi Check — Free Developer Tools for App Builders";
const description =
  "Free developer tools: FCM & OneSignal push notification tester and Android privacy policy generator. No signup, nothing stored server-side.";

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
    "Firebase push notification",
    "Firebase push notification tester",
    "send Firebase push notification",
    "OneSignal",
    "OneSignal push notification tester",
    "push notification tester",
    "web push",
    "notification testing tool",
    "privacy policy generator",
    "android app privacy policy",
    "free developer tools",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
