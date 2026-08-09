"use client";

import { useMemo, useState } from "react";
import { CheckPill } from "@/components/check-pill";
import {
  buildFcmMessage,
  emptyFcmPayloadInput,
  toCurl,
  toFlutter,
  toNode,
  type ApnsPriority,
  type FcmPriority,
} from "@/lib/fcm-payload/build";

type ExportTab = "json" | "curl" | "node" | "flutter";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-mute/50 focus:border-accent focus:outline-none";
const labelClass = "text-xs tracking-widest text-mute";

export function FcmPayloadBuilder() {
  const [input, setInput] = useState(emptyFcmPayloadInput());
  const [tab, setTab] = useState<ExportTab>("json");
  const [copied, setCopied] = useState(false);

  const message = useMemo(() => buildFcmMessage(input), [input]);
  const json = useMemo(() => JSON.stringify({ message }, null, 2), [message]);

  const exportText =
    tab === "json" ? json : tab === "curl" ? toCurl(message) : tab === "node" ? toNode(message) : toFlutter(message);

  function copy() {
    navigator.clipboard.writeText(exportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function updateData(i: number, field: "key" | "value", value: string) {
    setInput((prev) => {
      const dataPairs = [...prev.dataPairs];
      dataPairs[i] = { ...dataPairs[i], [field]: value };
      if (i === dataPairs.length - 1 && (dataPairs[i].key || dataPairs[i].value)) {
        dataPairs.push({ key: "", value: "" });
      }
      return { ...prev, dataPairs };
    });
  }

  function removeData(i: number) {
    setInput((prev) => ({
      ...prev,
      dataPairs: prev.dataPairs.filter((_, idx) => idx !== i),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Core */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>DEVICE_TOKEN (optional)</span>
          <input
            className={fieldClass}
            value={input.token}
            onChange={(e) => setInput({ ...input, token: e.target.value })}
            placeholder="FCM registration token"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>TITLE</span>
            <input
              className={fieldClass}
              value={input.title}
              onChange={(e) => setInput({ ...input, title: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>BODY</span>
            <input
              className={fieldClass}
              value={input.body}
              onChange={(e) => setInput({ ...input, body: e.target.value })}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>IMAGE_URL (optional)</span>
          <input
            className={fieldClass}
            value={input.imageUrl}
            onChange={(e) => setInput({ ...input, imageUrl: e.target.value })}
            placeholder="https://..."
          />
        </label>
      </div>

      {/* Data payload */}
      <div className="flex flex-col gap-2">
        <span className={labelClass}>DATA_PAYLOAD (string key/value pairs)</span>
        {input.dataPairs.map((pair, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={fieldClass}
              placeholder="key"
              value={pair.key}
              onChange={(e) => updateData(i, "key", e.target.value)}
            />
            <input
              className={fieldClass}
              placeholder="value"
              value={pair.value}
              onChange={(e) => updateData(i, "value", e.target.value)}
            />
            {(pair.key || pair.value) && (
              <button
                type="button"
                onClick={() => removeData(i)}
                className="shrink-0 text-mute hover:text-foreground"
                aria-label="Remove pair"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Android block */}
      <div className="flex flex-col gap-3 rounded-md border border-border/60 p-4">
        <CheckPill
          label="ANDROID_CONFIG"
          checked={input.android.enabled}
          onChange={(v) => setInput({ ...input, android: { ...input.android, enabled: v } })}
        />
        {input.android.enabled && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>PRIORITY</span>
              <select
                className={fieldClass}
                value={input.android.priority}
                onChange={(e) =>
                  setInput({
                    ...input,
                    android: { ...input.android, priority: e.target.value as FcmPriority },
                  })
                }
              >
                <option value="">(unset)</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>TTL_SECONDS</span>
              <input
                className={fieldClass}
                value={input.android.ttl}
                onChange={(e) =>
                  setInput({ ...input, android: { ...input.android, ttl: e.target.value } })
                }
                placeholder="3600"
                inputMode="numeric"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>COLLAPSE_KEY</span>
              <input
                className={fieldClass}
                value={input.android.collapseKey}
                onChange={(e) =>
                  setInput({ ...input, android: { ...input.android, collapseKey: e.target.value } })
                }
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>CHANNEL_ID</span>
              <input
                className={fieldClass}
                value={input.android.channelId}
                onChange={(e) =>
                  setInput({ ...input, android: { ...input.android, channelId: e.target.value } })
                }
              />
            </label>
          </div>
        )}
      </div>

      {/* APNs block */}
      <div className="flex flex-col gap-3 rounded-md border border-border/60 p-4">
        <CheckPill
          label="APNS_CONFIG (iOS)"
          checked={input.apns.enabled}
          onChange={(v) => setInput({ ...input, apns: { ...input.apns, enabled: v } })}
        />
        {input.apns.enabled && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>PRIORITY</span>
              <select
                className={fieldClass}
                value={input.apns.priority}
                onChange={(e) =>
                  setInput({ ...input, apns: { ...input.apns, priority: e.target.value as ApnsPriority } })
                }
              >
                <option value="">(unset)</option>
                <option value="5">5 (power-friendly)</option>
                <option value="10">10 (immediate)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>SOUND</span>
              <input
                className={fieldClass}
                value={input.apns.sound}
                onChange={(e) => setInput({ ...input, apns: { ...input.apns, sound: e.target.value } })}
                placeholder="default"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>BADGE</span>
              <input
                className={fieldClass}
                value={input.apns.badge}
                onChange={(e) => setInput({ ...input, apns: { ...input.apns, badge: e.target.value } })}
                inputMode="numeric"
                placeholder="1"
              />
            </label>
          </div>
        )}
      </div>

      {/* Webpush block */}
      <div className="flex flex-col gap-3 rounded-md border border-border/60 p-4">
        <CheckPill
          label="WEBPUSH_CONFIG"
          checked={input.webpush.enabled}
          onChange={(v) => setInput({ ...input, webpush: { ...input.webpush, enabled: v } })}
        />
        {input.webpush.enabled && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>CLICK_LINK</span>
              <input
                className={fieldClass}
                value={input.webpush.link}
                onChange={(e) => setInput({ ...input, webpush: { ...input.webpush, link: e.target.value } })}
                placeholder="https://..."
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>ICON_URL</span>
              <input
                className={fieldClass}
                value={input.webpush.icon}
                onChange={(e) => setInput({ ...input, webpush: { ...input.webpush, icon: e.target.value } })}
                placeholder="https://..."
              />
            </label>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["json", "curl", "node", "flutter"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-sm px-3 py-1.5 text-xs tracking-widest transition-colors ${
                tab === t ? "bg-accent text-background" : "border border-border text-mute hover:text-foreground"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={copy}
            className="ml-auto rounded-sm border border-border px-3 py-1.5 text-xs tracking-widest text-mute hover:border-accent hover:text-foreground"
          >
            {copied ? "COPIED" : "COPY"}
          </button>
        </div>
        <pre className="max-h-96 overflow-auto rounded-md border border-border bg-background p-4 text-xs leading-relaxed text-foreground">
          <code>{exportText}</code>
        </pre>
      </div>
    </div>
  );
}
