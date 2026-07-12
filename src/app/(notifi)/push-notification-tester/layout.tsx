import type { Metadata } from "next";

const title = "Notifi Check — FCM & OneSignal Push Notification Tester";
const description =
  "Free FCM & OneSignal push notification tester. Send a real test push in seconds — no signup, nothing stored server-side.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/push-notification-tester" },
  openGraph: {
    type: "website",
    url: "/push-notification-tester",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function PushTesterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
