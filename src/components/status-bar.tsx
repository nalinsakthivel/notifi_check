"use client";

import { useEffect, useState } from "react";
import { onFcmStatusChange, readFcmStatus, type FcmStatus } from "@/lib/fcm-status";

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

const VISIT_COUNTED_KEY = "notifi_check_visit_counted";

const statusLabel: Record<FcmStatus, string> = {
  unknown: "FCM ?",
  up: "FCM UP",
  down: "FCM DOWN",
};

const statusColor: Record<FcmStatus, string> = {
  unknown: "text-mute",
  up: "text-live",
  down: "text-red-400",
};

export function StatusBar() {
  const [uptime, setUptime] = useState(0);
  const [visits, setVisits] = useState<number | null>(null);
  const [fcmStatus, setFcmStatus] = useState<FcmStatus>(() =>
    typeof window === "undefined" ? "unknown" : readFcmStatus()
  );

  useEffect(() => onFcmStatusChange(setFcmStatus), []);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const alreadyCounted = sessionStorage.getItem(VISIT_COUNTED_KEY);
    const method = alreadyCounted ? "GET" : "POST";

    fetch("/api/visits", { method })
      .then((res) => res.json())
      .then((data: { count: number | null }) => {
        if (data.count !== null) setVisits(data.count);
        sessionStorage.setItem(VISIT_COUNTED_KEY, "1");
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs tracking-widest text-mute">
      <span>SYS.NOTIFI</span>
      <span className="tabular-nums">UPTIME {formatUptime(uptime)}</span>
      <span className="tabular-nums">
        VISITORS {visits === null ? "—" : visits.toLocaleString()}
      </span>
      <span className={`flex items-center gap-1.5 ${statusColor[fcmStatus]}`}>
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            fcmStatus === "up" ? "bg-live" : fcmStatus === "down" ? "bg-red-400" : "bg-mute"
          }`}
        />
        {statusLabel[fcmStatus]}
      </span>
      <span className="flex items-center gap-1.5 text-live">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-live" />
        LIVE
      </span>
    </div>
  );
}
