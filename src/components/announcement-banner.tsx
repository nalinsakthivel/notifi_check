"use client";

import { useSyncExternalStore } from "react";

const DISMISSED_KEY = "notifi_check_announcement_oss_dismissed";
const DISMISSED_EVENT = "notifi_check_announcement_dismissed";
const GITHUB_URL = "https://github.com/nalinsakthivel/notifi_check";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(DISMISSED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DISMISSED_EVENT, callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(DISMISSED_KEY) === "1";
}

export function AnnouncementBanner() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-center gap-3 border-b border-border bg-foreground/5 px-4 py-2 text-center text-xs text-foreground">
      <span>
        📣 Notifi Check is now open source.{" "}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          View on GitHub
        </a>
      </span>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, "1");
          window.dispatchEvent(new Event(DISMISSED_EVENT));
        }}
        className="shrink-0 text-mute transition-colors hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}
