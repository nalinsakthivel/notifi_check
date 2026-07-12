"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FeedbackFab() {
  const pathname = usePathname();
  if (pathname === "/feedback") return null;

  return (
    <Link
      href="/feedback"
      aria-label="Send feedback"
      title="Send feedback"
      className="fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-full border border-border bg-panel text-mute shadow-lg transition-colors hover:border-accent hover:text-accent"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    </Link>
  );
}
