"use client";

import { useEffect, useRef, useState } from "react";
import { PLATFORMS, type PlatformId } from "@/lib/icon/specs";
import {
  generateZip,
  loadSourceImage,
  renderPng,
  sanitizeFilename,
  type Background,
  type IconShape,
  type RenderStyle,
  type SourceImage,
} from "@/lib/icon/generate";
import { CheckPill } from "@/components/check-pill";

const PREVIEW_SIZES = [192, 96, 48, 16];
const ALL_PLATFORMS = PLATFORMS.map((p) => p.id);
const SHAPE_RADIUS: Record<IconShape, string> = { square: "10%", squircle: "27%", circle: "50%" };

interface Preview {
  size: number;
  url: string;
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer rounded-md border px-3.5 py-2 text-sm transition-colors ${
              value === o.value
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-panel text-mute hover:border-mute"
            }`}
          >
            <input
              type="radio"
              name={label}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function NeighborIcon({
  glyph,
  label,
  shapeClass = "rounded-full",
  labelClass = "text-white/90",
}: {
  glyph: React.ReactNode;
  label: string;
  shapeClass?: string;
  labelClass?: string;
}) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <span className={`flex size-10 items-center justify-center bg-white/90 shadow-sm ${shapeClass}`}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          {glyph}
        </svg>
      </span>
      {label && <figcaption className={`text-[10px] ${labelClass}`}>{label}</figcaption>}
    </figure>
  );
}

function AppIconFigure({
  url,
  radius,
  labelClass,
}: {
  url?: string;
  radius: string;
  labelClass: string;
}) {
  return (
    <figure className="flex flex-col items-center gap-1">
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt="Your app icon preview"
          width={40}
          height={40}
          className="size-10 shadow-sm"
          style={{ borderRadius: radius }}
        />
      ) : (
        <span
          className="flex size-10 items-center justify-center bg-white/50 text-[9px] text-slate-500"
          style={{ borderRadius: radius }}
        >
          ?
        </span>
      )}
      <figcaption className={`text-[10px] font-medium ${labelClass}`}>Your App</figcaption>
    </figure>
  );
}

export function IconGenerator() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [platforms, setPlatforms] = useState<PlatformId[]>(ALL_PLATFORMS);
  const [bgType, setBgType] = useState<"color" | "gradient">("color");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgFrom, setBgFrom] = useState("#6d28d9");
  const [bgTo, setBgTo] = useState("#2563eb");
  const [padding, setPadding] = useState(10); // percent
  const [shape, setShape] = useState<IconShape>("squircle");
  const [effect, setEffect] = useState<"none" | "shadow">("none");
  const [filename, setFilename] = useState("ic_launcher");
  const [keepTransparency, setKeepTransparency] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"android" | "ios" | "web">("android");
  const [livePreview, setLivePreview] = useState<{
    android: string;
    ios: string;
    web: string;
  } | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [zip, setZip] = useState<{ url: string; fileCount: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const background: Background =
    bgType === "gradient" ? { type: "gradient", from: bgFrom, to: bgTo } : { type: "color", color: bgColor };
  const style: RenderStyle = { background, padding: padding / 100, shape, effect };

  // Revoke object URLs when replaced.
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.url);
    };
  }, [source]);
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);
  useEffect(() => {
    return () => {
      if (zip) URL.revokeObjectURL(zip.url);
    };
  }, [zip]);
  useEffect(() => {
    return () => {
      if (livePreview) Object.values(livePreview).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [livePreview]);

  // Live device previews — re-render (debounced) whenever the source or styling changes.
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const toUrl = (data: Uint8Array) => {
      const buffer = new ArrayBuffer(data.length);
      new Uint8Array(buffer).set(data);
      return URL.createObjectURL(new Blob([buffer], { type: "image/png" }));
    };
    const t = setTimeout(async () => {
      try {
        // Android launcher: user shape · iOS: flattened square (system rounds it) · Web: favicon
        const [android, ios, web] = await Promise.all([
          renderPng(source.image, 192, style, { flatten: !keepTransparency, shaped: true }),
          renderPng(source.image, 192, style, { flatten: true }),
          renderPng(source.image, 64, style, { flatten: !keepTransparency }),
        ]);
        if (cancelled) return;
        setLivePreview({ android: toUrl(android), ios: toUrl(ios), web: toUrl(web) });
      } catch {
        // preview is best-effort
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, bgType, bgColor, bgFrom, bgTo, padding, shape, effect, keepTransparency]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setZip(null);
    setPreviews([]);
    try {
      setSource(await loadSourceImage(file));
    } catch (e) {
      setSource(null);
      setLivePreview(null);
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  }

  async function handleGenerate() {
    if (!source || busy) return;
    if (platforms.length === 0) {
      setError("Select at least one platform.");
      return;
    }
    setBusy(true);
    setError(null);
    setZip(null);
    setPreviews([]);
    try {
      const { blob, fileCount } = await generateZip(source.image, {
        platforms,
        style,
        keepTransparency,
        filename,
      });
      const rendered: Preview[] = [];
      for (const size of PREVIEW_SIZES) {
        const data = await renderPng(source.image, size, style, {
          flatten: !keepTransparency,
          shaped: true,
        });
        const buffer = new ArrayBuffer(data.length);
        new Uint8Array(buffer).set(data);
        rendered.push({ size, url: URL.createObjectURL(new Blob([buffer], { type: "image/png" })) });
      }
      setPreviews(rendered);
      setZip({ url: URL.createObjectURL(blob), fileCount });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  const togglePlatform = (id: PlatformId, on: boolean) =>
    setPlatforms((prev) => (on ? [...prev, id] : prev.filter((p) => p !== id)));

  return (
    <div className="flex flex-col gap-6">
      {/* Upload */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-md border border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? "border-accent bg-accent/5" : "border-border bg-panel hover:border-mute"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {source ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source.url}
              alt="Uploaded icon source"
              className="size-20 rounded-md border border-border object-contain"
            />
            <span className="text-sm text-foreground">
              {source.width}×{source.height} — click or drop to replace
            </span>
          </>
        ) : (
          <>
            <span className="text-sm tracking-widest text-foreground">DROP_IMAGE_HERE</span>
            <span className="text-xs text-mute">
              or click to browse — PNG, JPEG, WebP, or SVG, ideally 1024×1024 or larger
            </span>
          </>
        )}
      </label>

      {source && source.warnings.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-md border border-yellow-500/40 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-200/90">
          {source.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {/* Options + live device preview */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 flex-col gap-5">
          <Segmented
            label="Shape (Android launcher)"
            value={shape}
            onChange={setShape}
            options={[
              { value: "square", label: "Square" },
              { value: "squircle", label: "Squircle" },
              { value: "circle", label: "Circle" },
            ]}
          />

          <Segmented
            label="Background"
            value={bgType}
            onChange={setBgType}
            options={[
              { value: "color", label: "Color" },
              { value: "gradient", label: "Gradient" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-4">
            {bgType === "color" ? (
              <label className="flex items-center gap-3 rounded-md border border-border bg-panel px-3 py-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  aria-label="Background color"
                  className="size-8 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                />
                <span className="text-sm text-mute">{bgColor}</span>
              </label>
            ) : (
              <>
                <label className="flex items-center gap-3 rounded-md border border-border bg-panel px-3 py-2">
                  <input
                    type="color"
                    value={bgFrom}
                    onChange={(e) => setBgFrom(e.target.value)}
                    aria-label="Gradient start color"
                    className="size-8 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                  />
                  <span className="text-sm text-mute">{bgFrom}</span>
                </label>
                <span aria-hidden="true" className="text-mute">
                  →
                </span>
                <label className="flex items-center gap-3 rounded-md border border-border bg-panel px-3 py-2">
                  <input
                    type="color"
                    value={bgTo}
                    onChange={(e) => setBgTo(e.target.value)}
                    aria-label="Gradient end color"
                    className="size-8 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                  />
                  <span className="text-sm text-mute">{bgTo}</span>
                </label>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="icon-padding" className="text-sm font-medium text-foreground">
              Padding — {padding}%
            </label>
            <input
              id="icon-padding"
              type="range"
              min={0}
              max={30}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <Segmented
            label="Effect"
            value={effect}
            onChange={setEffect}
            options={[
              { value: "none", label: "None" },
              { value: "shadow", label: "Shadow" },
            ]}
          />

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="icon-filename" className="text-sm font-medium text-foreground">
                Android filename
              </label>
              <input
                id="icon-filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                onBlur={() => setFilename(sanitizeFilename(filename))}
                className="w-full rounded-md border border-border bg-panel px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
              />
              <p className="text-xs text-mute/70">Used for the mipmap PNGs, e.g. ic_launcher.png</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Transparency</span>
              <label className="flex cursor-pointer items-center gap-2.5 py-2.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={keepTransparency}
                  onChange={(e) => setKeepTransparency(e.target.checked)}
                  className="size-4 shrink-0 accent-accent"
                />
                Keep transparency
              </label>
              <p className="text-xs text-mute/70">
                Applies where allowed — iOS is always flattened.
              </p>
            </div>
          </div>
        </div>

        {/* Device previews */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2" role="tablist" aria-label="Preview device">
            {(
              [
                ["android", "Android"],
                ["ios", "iOS"],
                ["web", "Web"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={previewTab === tab}
                onClick={() => setPreviewTab(tab)}
                className={`cursor-pointer rounded-md border px-3.5 py-1.5 text-xs tracking-widest transition-colors ${
                  previewTab === tab
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-panel text-mute hover:border-mute"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {previewTab === "android" && (
            <div className="w-64 rounded-4xl border-4 border-border bg-black p-2 shadow-xl">
              <div className="flex h-105 flex-col overflow-hidden rounded-[1.6rem] bg-linear-to-b from-sky-300 via-orange-100 to-orange-200">
                <div className="flex items-center justify-between px-4 pt-2 text-[10px] font-medium text-slate-800">
                  <span>10:08</span>
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">▲</span>100%
                  </span>
                </div>
                <div className="mx-4 mt-4 rounded-xl bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold text-slate-800">Lunch with Jane</p>
                  <p className="text-[10px] text-slate-500">4:00 PM – 4:30 PM</p>
                </div>
                <div className="mt-6 flex items-start justify-center gap-3 px-2">
                  <NeighborIcon label="Phone" labelClass="text-slate-700" glyph={<path d="M22 16.9v3a2 2 0 01-2.2 2A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8 9.9a16 16 0 006.1 6.1l1.2-1.2a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 1.9z" />} />
                  <NeighborIcon label="Mail" labelClass="text-slate-700" glyph={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></>} />
                  <AppIconFigure
                    url={livePreview?.android}
                    radius={SHAPE_RADIUS[shape]}
                    labelClass="text-slate-700"
                  />
                  <NeighborIcon label="Photos" labelClass="text-slate-700" glyph={<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>} />
                </div>
                <div className="mt-auto px-4 pb-4">
                  <div className="flex h-9 items-center rounded-full bg-white/90 px-3 text-xs text-slate-400 shadow-sm">
                    Search
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewTab === "ios" && (
            <div className="w-64 rounded-4xl border-4 border-border bg-black p-2 shadow-xl">
              <div className="relative flex h-105 flex-col overflow-hidden rounded-[1.6rem] bg-slate-400 bg-[radial-gradient(circle_at_70%_15%,#f6a53c,transparent_55%),radial-gradient(circle_at_25%_75%,#1e3a5f,transparent_65%)]">
                <div className="flex items-center justify-between px-5 pt-2 text-[10px] font-semibold text-white">
                  <span>9:41</span>
                  <span aria-hidden="true" className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">●●●</span>
                  </span>
                </div>
                <div className="mt-8 flex items-start justify-center gap-3 px-2">
                  <NeighborIcon label="Photos" shapeClass="rounded-[22.5%]" glyph={<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>} />
                  <AppIconFigure url={livePreview?.ios} radius="22.5%" labelClass="text-white" />
                  <NeighborIcon label="Mail" shapeClass="rounded-[22.5%]" glyph={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></>} />
                </div>
                <div className="mt-auto px-3 pb-3">
                  <div className="flex items-center justify-center gap-4 rounded-3xl bg-white/25 px-4 py-2.5 backdrop-blur">
                    <NeighborIcon label="" glyph={<path d="M22 16.9v3a2 2 0 01-2.2 2A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8 9.9a16 16 0 006.1 6.1l1.2-1.2a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 1.9z" />} />
                    <NeighborIcon label="" glyph={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>} />
                    <NeighborIcon label="" glyph={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></>} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewTab === "web" && (
            <div className="w-64 overflow-hidden rounded-xl border border-border shadow-xl">
              <div className="flex items-center gap-1.5 bg-slate-200 px-3 pt-2.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-red-400" />
                <span aria-hidden="true" className="size-2 rounded-full bg-yellow-400" />
                <span aria-hidden="true" className="size-2 rounded-full bg-green-400" />
                <div className="ml-2 flex min-w-0 items-center gap-2 rounded-t-lg bg-white px-3 py-1.5">
                  {livePreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={livePreview.web} alt="Favicon preview" width={16} height={16} className="size-4 rounded-sm" />
                  ) : (
                    <span className="size-4 rounded-sm bg-slate-300" />
                  )}
                  <span className="truncate text-[11px] text-slate-700">Your App</span>
                  <span aria-hidden="true" className="ml-auto text-[10px] text-slate-400">✕</span>
                </div>
              </div>
              <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
                <span aria-hidden="true" className="text-[10px] text-slate-400">⟳</span>
                <div className="flex flex-1 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3 shrink-0">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                  </svg>
                  https://example.com
                </div>
              </div>
              <div className="flex h-64 flex-col items-center justify-center gap-3 bg-white">
                {livePreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={livePreview.web} alt="PWA icon preview" width={64} height={64} className="size-16 rounded-xl shadow" />
                ) : (
                  <span className="size-16 rounded-xl bg-slate-200" />
                )}
                <span className="text-xs text-slate-500">Your App</span>
              </div>
            </div>
          )}

          <p className="max-w-64 text-center text-xs text-mute/70">
            Live preview — updates as you change shape, background, padding, and effect.
          </p>
        </div>
      </div>

      {/* Platforms */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-medium text-foreground">Platforms</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => (
            <CheckPill
              key={p.id}
              label={p.label}
              checked={platforms.includes(p.id)}
              onChange={(on) => togglePlatform(p.id, on)}
            />
          ))}
        </div>
      </fieldset>

      <div aria-live="polite" className="min-h-5 text-sm">
        {error && <span className="text-red-400">{error}</span>}
        {!error && busy && <span className="text-mute">Rendering icons…</span>}
        {!error && !busy && zip && (
          <span className="text-live">Done — {zip.fileCount} files ready.</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!source || busy}
          className="cursor-pointer rounded-md bg-accent px-6 py-2.5 text-sm font-semibold tracking-widest text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "GENERATING…" : "GENERATE_ICONS"}
        </button>
        {zip && (
          <a
            href={zip.url}
            download="app-icons.zip"
            className="rounded-md border border-live px-6 py-2.5 text-sm font-semibold tracking-widest text-live transition-colors hover:bg-live/10"
          >
            DOWNLOAD_ZIP
          </a>
        )}
      </div>

      {/* Size strip */}
      {previews.length > 0 && (
        <div className="rounded-md border border-border bg-panel px-5 py-5">
          <h3 className="mb-4 text-xs tracking-widest text-foreground">SIZES</h3>
          <div className="flex flex-wrap items-end gap-6">
            {previews.map((p) => (
              <figure key={p.size} className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`${p.size}×${p.size} icon preview`}
                  width={Math.min(p.size, 96)}
                  height={Math.min(p.size, 96)}
                  className="rounded-sm border border-border"
                  style={{ imageRendering: p.size <= 48 ? "pixelated" : "auto" }}
                />
                <figcaption className="text-xs tabular-nums text-mute">
                  {p.size}×{p.size}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-mute/70">
        Your image never leaves this device — resizing, ICO packing, and zipping all happen in
        your browser.
      </p>
    </div>
  );
}
