import { zipSync } from "fflate";
import { PLATFORMS, readmeText, type PlatformId } from "./specs";

export interface SourceImage {
  image: HTMLImageElement;
  url: string;
  width: number;
  height: number;
  warnings: string[];
}

export type IconShape = "square" | "squircle" | "circle";

export type Background =
  | { type: "color"; color: string }
  | { type: "gradient"; from: string; to: string };

export interface RenderStyle {
  background: Background;
  /** Fraction of the canvas kept as padding around the artwork (0–0.4) */
  padding: number;
  /** Mask shape — applied to Android launcher icons and the preview */
  shape: IconShape;
  effect: "none" | "shadow";
}

export async function loadSourceImage(file: File): Promise<SourceImage> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Could not read that file — use a PNG, JPEG, WebP, or SVG image.");
  }
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) {
    URL.revokeObjectURL(url);
    throw new Error("Image has no intrinsic size — export your SVG with width/height attributes.");
  }
  const warnings: string[] = [];
  if (width !== height) warnings.push("Image is not square — it will be center-cropped.");
  if (Math.min(width, height) < 1024)
    warnings.push("Image is smaller than 1024×1024 — large icons may look soft.");
  return { image, url, width, height, warnings };
}

interface RenderFlags {
  /** Fill the background (iOS, Play Store, or "flatten transparency" turned on) */
  flatten: boolean;
  /** PWA maskable icon: background fill + ~80% safe zone */
  maskable?: boolean;
  /** Apply the shape mask (Android launcher icons + preview) */
  shaped?: boolean;
}

function squareSource(img: HTMLImageElement): { sx: number; sy: number; s: number } {
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  return { sx: (img.naturalWidth - s) / 2, sy: (img.naturalHeight - s) / 2, s };
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return [canvas, ctx];
}

function fillBackground(ctx: CanvasRenderingContext2D, size: number, background: Background) {
  if (background.type === "gradient") {
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, background.from);
    g.addColorStop(1, background.to);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = background.color;
  }
  ctx.fillRect(0, 0, size, size);
}

function clipShape(ctx: CanvasRenderingContext2D, size: number, shape: IconShape) {
  const path = new Path2D();
  if (shape === "circle") {
    path.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else {
    // ponytail: rounded-rect approximation of Android's squircle; superellipse if fidelity matters
    path.roundRect(0, 0, size, size, size * 0.27);
  }
  ctx.clip(path);
}

/** Render the source image at `size`, halving in steps for clean small icons. */
export async function renderPng(
  img: HTMLImageElement,
  size: number,
  style: RenderStyle,
  { flatten, maskable, shaped }: RenderFlags
): Promise<Uint8Array> {
  const { sx, sy, s } = squareSource(img);

  // Stepped downscale: draw the source square, then halve until within 2x of target.
  let [current] = ((): [HTMLCanvasElement] => {
    const [c, ctx] = makeCanvas(s);
    ctx.drawImage(img, sx, sy, s, s, 0, 0, s, s);
    return [c];
  })();
  while (current.width / 2 >= size * 2) {
    const half = Math.floor(current.width / 2);
    const [c, ctx] = makeCanvas(half);
    ctx.drawImage(current, 0, 0, half, half);
    current = c;
  }

  const [canvas, ctx] = makeCanvas(size);
  const useShape = shaped && style.shape !== "square";
  if (useShape) clipShape(ctx, size, style.shape);
  if (flatten || maskable || useShape) fillBackground(ctx, size, style.background);

  // Maskable icons keep artwork inside the ~80% safe zone regardless of padding.
  const padding = maskable ? Math.max(style.padding, 0.1) : style.padding;
  const inner = Math.round(size * (1 - 2 * padding));
  const offset = Math.round((size - inner) / 2);
  if (style.effect === "shadow") {
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = size * 0.06;
    ctx.shadowOffsetY = size * 0.03;
  }
  ctx.drawImage(current, offset, offset, inner, inner);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG encoding failed.");
  return new Uint8Array(await blob.arrayBuffer());
}

/** Build a .ico containing PNG-encoded entries (supported since Windows Vista / all browsers). */
export function buildIco(entries: { size: number; data: Uint8Array }[]): Uint8Array {
  const headerSize = 6 + entries.length * 16;
  const total = headerSize + entries.reduce((n, e) => n + e.data.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, entries.length, true);
  let dir = 6;
  let offset = headerSize;
  for (const e of entries) {
    out[dir] = e.size >= 256 ? 0 : e.size; // width (0 = 256)
    out[dir + 1] = e.size >= 256 ? 0 : e.size; // height
    out[dir + 2] = 0; // palette colors
    out[dir + 3] = 0; // reserved
    view.setUint16(dir + 4, 1, true); // color planes
    view.setUint16(dir + 6, 32, true); // bits per pixel
    view.setUint32(dir + 8, e.data.length, true);
    view.setUint32(dir + 12, offset, true);
    out.set(e.data, offset);
    offset += e.data.length;
    dir += 16;
  }
  return out;
}

export interface GenerateOptions {
  platforms: PlatformId[];
  style: RenderStyle;
  /** Keep alpha where the platform allows it (Android launcher, favicons, PWA) */
  keepTransparency: boolean;
  /** Android launcher filename (without extension), e.g. "ic_launcher" */
  filename: string;
}

export function sanitizeFilename(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^[0-9]/, "_$&");
  return clean || "ic_launcher";
}

export async function generateZip(
  img: HTMLImageElement,
  { platforms, style, keepTransparency, filename }: GenerateOptions
): Promise<{ blob: Blob; fileCount: number }> {
  const selected = PLATFORMS.filter((p) => platforms.includes(p.id));
  const launcherName = sanitizeFilename(filename);
  const files: Record<string, Uint8Array> = {};
  const cache = new Map<string, Uint8Array>();

  const render = async (size: number, flags: RenderFlags) => {
    const key = `${size}:${flags.flatten}:${flags.maskable}:${flags.shaped}`;
    let data = cache.get(key);
    if (!data) {
      data = await renderPng(img, size, style, flags);
      cache.set(key, data);
    }
    return data;
  };

  for (const platform of selected) {
    for (const spec of platform.pngs) {
      const path = spec.path.replace("ic_launcher", launcherName);
      files[path] = await render(spec.size, {
        flatten: spec.flatten || !keepTransparency,
        maskable: spec.maskable,
        shaped: spec.shaped,
      });
    }
    for (const ico of platform.icos) {
      const entries = [];
      for (const size of ico.sizes) {
        entries.push({ size, data: await render(size, { flatten: !keepTransparency }) });
      }
      files[ico.path] = buildIco(entries);
    }
    for (const extra of platform.extraFiles) {
      files[extra.path] = new TextEncoder().encode(extra.content);
    }
  }
  files["README.txt"] = new TextEncoder().encode(readmeText(platforms));

  // PNGs are already compressed — store instead of deflating.
  const zipped = zipSync(files, { level: 0 });
  const buffer = new ArrayBuffer(zipped.length);
  new Uint8Array(buffer).set(zipped);
  return { blob: new Blob([buffer], { type: "application/zip" }), fileCount: Object.keys(files).length };
}
