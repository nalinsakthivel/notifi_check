import type { Metadata } from "next";
import { PolicyGenerator } from "@/components/policy/generator";

const title = "Generate Your Privacy Policy — Free Android Privacy Policy Generator";
const description =
  "Answer a few questions about your Android app and get a professional, Google Play–ready privacy policy. Free, no signup, nothing stored on a server.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/privacy-policy-generator/app" },
  openGraph: {
    type: "website",
    url: "/privacy-policy-generator/app",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function GeneratorPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 rounded-md border border-border bg-panel px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight">Generate your privacy policy</h1>
        <p className="mt-1 text-sm text-mute">
          7 quick steps. Everything runs in your browser — your answers never leave this device.
        </p>
      </div>
      <PolicyGenerator />
    </main>
  );
}
