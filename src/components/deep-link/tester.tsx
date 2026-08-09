"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseDeepLink } from "@/lib/deep-link/parse-url";
import { encodeQr } from "@/lib/deep-link/qrcode";
import { checkAssetLinks, checkAasa, type FetchLintResult } from "@/lib/deep-link/link-validators";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-mute/50 focus:border-accent focus:outline-none";
const labelClass = "text-xs tracking-widest text-mute";

function drawQr(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const qr = encodeQr(text, "M");
  const scale = 6;
  const quiet = 4;
  const dim = (qr.size + quiet * 2) * scale;
  canvas.width = dim;
  canvas.height = dim;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = "#000000";
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.modules[y][x]) {
        ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
      }
    }
  }
}

function RuleList({ result }: { result: FetchLintResult }) {
  if (!result.fetched) {
    return (
      <p className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-mute">
        {result.fetchError}
      </p>
    );
  }
  if (result.rules.length === 0) {
    return <p className="text-sm text-mute">Fetched, but nothing to check.</p>;
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {result.rules.map((r, i) => (
        <li
          key={i}
          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
            r.pass ? "border-live/30 bg-live/5" : "border-red-500/30 bg-red-500/5"
          }`}
        >
          <span className={r.pass ? "text-live" : "text-red-500"}>{r.pass ? "PASS" : "FAIL"}</span>
          <span className="flex-1 text-foreground">
            {r.label}
            <span className="block text-xs text-mute">{r.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function DomainValidator({
  title,
  wellKnownPath,
  check,
}: {
  title: string;
  wellKnownPath: string;
  check: (domain: string) => Promise<FetchLintResult>;
}) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FetchLintResult | null>(null);

  async function run() {
    if (!domain.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await check(domain));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border/60 p-4">
      <span className={labelClass}>{title}</span>
      <p className="text-xs text-mute">
        Fetches <code className="text-foreground">https://&#123;domain&#125;{wellKnownPath}</code> from your
        browser. Most sites don&apos;t send permissive CORS headers for well-known files, so a fetch
        failure here is expected — check the Network tab or validate server-side if it fails.
      </p>
      <div className="flex gap-2">
        <input
          className={fieldClass}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="example.com"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading || !domain.trim()}
          className="shrink-0 rounded-sm border border-border px-4 py-2 text-xs tracking-widest text-mute hover:border-accent hover:text-foreground disabled:opacity-40"
        >
          {loading ? "CHECKING…" : "CHECK"}
        </button>
      </div>
      {result && <RuleList result={result} />}
    </div>
  );
}

export function DeepLinkTester() {
  const [input, setInput] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const parsed = useMemo(() => (input.trim() ? parseDeepLink(input) : null), [input]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (parsed?.ok && parsed.value) {
      drawQr(canvas, parsed.value.href);
    } else {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [parsed]);

  function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "deep-link-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* URL input + parser */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>DEEP_LINK_URL</span>
          <input
            className={fieldClass}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="myapp://path?x=1  or  https://example.com/path?x=1"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        {parsed && !parsed.ok && (
          <p className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-500">
            {parsed.error}
          </p>
        )}

        {parsed?.ok && parsed.value && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-3">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className={labelClass}>SCHEME</dt>
                <dd className="text-foreground">
                  {parsed.value.scheme}
                  {parsed.value.isHttpLink && (
                    <span className="ml-2 rounded-sm border border-accent/40 px-1.5 py-0.5 text-[10px] tracking-widest text-accent">
                      APP_LINK
                    </span>
                  )}
                </dd>
                <dt className={labelClass}>HOST</dt>
                <dd className="text-foreground">{parsed.value.host || <span className="text-mute">—</span>}</dd>
                {parsed.value.port && (
                  <>
                    <dt className={labelClass}>PORT</dt>
                    <dd className="text-foreground">{parsed.value.port}</dd>
                  </>
                )}
                <dt className={labelClass}>PATH</dt>
                <dd className="text-foreground">{parsed.value.path || <span className="text-mute">—</span>}</dd>
                {parsed.value.fragment && (
                  <>
                    <dt className={labelClass}>FRAGMENT</dt>
                    <dd className="text-foreground">{parsed.value.fragment}</dd>
                  </>
                )}
              </dl>

              {parsed.value.params.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className={labelClass}>QUERY_PARAMS</span>
                  <div className="overflow-hidden rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-background/60 text-left">
                          <th className="px-3 py-1.5 font-normal text-mute">Key</th>
                          <th className="px-3 py-1.5 font-normal text-mute">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.value.params.map((p, i) => (
                          <tr key={i} className="border-b border-border/60 last:border-0">
                            <td className="px-3 py-1.5 text-foreground">{p.key}</td>
                            <td className="px-3 py-1.5 break-all text-foreground">{p.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <canvas
                ref={canvasRef}
                className="h-40 w-40 rounded-md border border-border bg-white"
              />
              <button
                type="button"
                onClick={downloadQr}
                className="rounded-sm border border-border px-3 py-1.5 text-xs tracking-widest text-mute hover:border-accent hover:text-foreground"
              >
                DOWNLOAD_PNG
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Domain validators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DomainValidator
          title="ANDROID_ASSETLINKS_VALIDATOR"
          wellKnownPath="/.well-known/assetlinks.json"
          check={checkAssetLinks}
        />
        <DomainValidator
          title="IOS_AASA_VALIDATOR"
          wellKnownPath="/.well-known/apple-app-site-association"
          check={checkAasa}
        />
      </div>
    </div>
  );
}
