import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback-form";

const title = "Feedback — Notifi Check";
const description =
  "Send feedback, report a bug, or attach a screenshot — goes straight to the person building Notifi Check.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/feedback" },
  openGraph: {
    type: "website",
    url: "/feedback",
    title,
    description,
    siteName: "Notifi Check",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Notifi Check" }],
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: false, follow: true },
};

export default function FeedbackPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <span className="text-xs tracking-widest text-mute">FEEDBACK</span>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">Send feedback</h1>
        <p className="mt-1 text-sm leading-relaxed text-mute">
          A bug, a rough edge, an idea for a tool — this goes straight to my inbox. Attach a
          screenshot if it helps explain what you&rsquo;re seeing.
        </p>
      </div>

      <div className="rounded-md border border-border bg-panel px-6 py-6">
        <FeedbackForm />
      </div>
    </main>
  );
}
