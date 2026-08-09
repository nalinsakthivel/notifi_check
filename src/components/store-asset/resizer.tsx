"use client";

import { useEffect, useRef, useState } from "react";
import { STORES, DEFAULT_ASSET_IDS } from "@/lib/store-asset/specs";
import { generateZip, loadSourceImage, type SourceImage } from "@/lib/store-asset/generate";
import { CheckPill } from "@/components/check-pill";

export function StoreAssetResizer() {
  const [images, setImages] = useState<SourceImage[]>([]);
  const [assetIds, setAssetIds] = useState<string[]>(DEFAULT_ASSET_IDS);
  const [background, setBackground] = useState("#ffffff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zip, setZip] = useState<{ url: string; fileCount: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.url));
  }, [images]);
  useEffect(() => {
    return () => {
      if (zip) URL.revokeObjectURL(zip.url);
    };
  }, [zip]);

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) =>
      ["image/png", "image/jpeg", "image/webp"].includes(f.type)
    );
    if (files.length === 0) return;
    setError(null);
    setZip(null);
    try {
      const loaded = await Promise.all(files.map(loadSourceImage));
      setImages((prev) => [...prev, ...loaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read one of those files.");
    }
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
    setZip(null);
  }

  async function handleGenerate() {
    if (images.length === 0 || busy) return;
    if (assetIds.length === 0) {
      setError("Select at least one target size.");
      return;
    }
    setBusy(true);
    setError(null);
    setZip(null);
    try {
      const { blob, fileCount } = await generateZip({ images, assetIds, background });
      setZip({ url: URL.createObjectURL(blob), fileCount });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  const toggleAsset = (id: string, on: boolean) =>
    setAssetIds((prev) => (on ? [...prev, id] : prev.filter((a) => a !== id)));

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
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-md border border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? "border-accent bg-accent/5" : "border-border bg-panel hover:border-mute"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="text-sm tracking-widest text-foreground">DROP_SCREENSHOTS_HERE</span>
        <span className="text-xs text-mute">
          or click to browse — PNG, JPEG, or WebP, multiple files supported
        </span>
      </label>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <figure
              key={img.id}
              className="relative flex flex-col items-center gap-1 rounded-md border border-border bg-panel p-2"
            >
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                aria-label={`Remove ${img.file.name}`}
                className="absolute -right-2 -top-2 flex size-5 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-xs text-mute transition-colors hover:border-red-400 hover:text-red-400"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.file.name}
                className="size-20 rounded-sm border border-border object-cover"
              />
              <figcaption className="max-w-20 truncate text-[10px] text-mute" title={img.file.name}>
                {img.file.name}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* Background color */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Letterbox background color</span>
        <label className="flex w-fit items-center gap-3 rounded-md border border-border bg-panel px-3 py-2">
          <input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            aria-label="Letterbox background color"
            className="size-8 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0"
          />
          <span className="text-sm text-mute">{background}</span>
        </label>
        <p className="text-xs text-mute/70">
          Screenshots are fit-contain onto each target size, centered — this fills the leftover
          space instead of stretching or cropping.
        </p>
      </div>

      {/* Target sizes */}
      {STORES.map((store) => (
        <fieldset key={store.id}>
          <legend className="mb-2.5 text-sm font-medium text-foreground">{store.label}</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {store.assets.map((a) => (
              <CheckPill
                key={a.id}
                label={`${a.label} (${a.width}×${a.height})`}
                checked={assetIds.includes(a.id)}
                onChange={(on) => toggleAsset(a.id, on)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <div aria-live="polite" className="min-h-5 text-sm">
        {error && <span className="text-red-400">{error}</span>}
        {!error && busy && <span className="text-mute">Resizing screenshots…</span>}
        {!error && !busy && zip && (
          <span className="text-live">Done — {zip.fileCount} files ready.</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={images.length === 0 || busy}
          className="cursor-pointer rounded-md bg-accent px-6 py-2.5 text-sm font-semibold tracking-widest text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "GENERATING…" : "GENERATE_ZIP"}
        </button>
        {zip && (
          <a
            href={zip.url}
            download="store-assets.zip"
            className="rounded-md border border-live px-6 py-2.5 text-sm font-semibold tracking-widest text-live transition-colors hover:bg-live/10"
          >
            DOWNLOAD_ZIP
          </a>
        )}
      </div>

      <p className="text-xs text-mute/70">
        {images.length} screenshot{images.length === 1 ? "" : "s"} × {assetIds.length} target size
        {assetIds.length === 1 ? "" : "s"} ={" "}
        {images.length * assetIds.length} file{images.length * assetIds.length === 1 ? "" : "s"} in
        the ZIP. Your screenshots never leave this device — resizing and zipping happen entirely in
        your browser.
      </p>
    </div>
  );
}
