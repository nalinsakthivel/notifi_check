import { zipSync } from "fflate";
import { ALL_ASSETS, type AssetSpec } from "./specs";

export interface SourceImage {
  id: string;
  file: File;
  image: HTMLImageElement;
  url: string;
  width: number;
  height: number;
}

let nextId = 0;

export async function loadSourceImage(file: File): Promise<SourceImage> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(`Could not read "${file.name}" — use a PNG, JPEG, or WebP image.`);
  }
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) {
    URL.revokeObjectURL(url);
    throw new Error(`"${file.name}" has no intrinsic size.`);
  }
  nextId += 1;
  return { id: `${Date.now()}-${nextId}`, file, image, url, width, height };
}

/** Fit-contain the source onto a canvas of exactly targetW×targetH, centered, letterboxed with `background`. */
export async function renderResized(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  background: string
): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, targetW, targetH);

  const scale = Math.min(targetW / img.naturalWidth, targetH / img.naturalHeight);
  const drawW = Math.round(img.naturalWidth * scale);
  const drawH = Math.round(img.naturalHeight * scale);
  const offsetX = Math.round((targetW - drawW) / 2);
  const offsetY = Math.round((targetH - drawH) / 2);
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, offsetX, offsetY, drawW, drawH);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG encoding failed.");
  return new Uint8Array(await blob.arrayBuffer());
}

export function sanitizeFilename(name: string): string {
  const base = name.replace(/\.[^./]+$/, "");
  const clean = base.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return clean || "screenshot";
}

export interface GenerateOptions {
  images: SourceImage[];
  assetIds: string[];
  background: string;
}

export async function generateZip(
  { images, assetIds, background }: GenerateOptions
): Promise<{ blob: Blob; fileCount: number }> {
  const selected = ALL_ASSETS.filter((a) => assetIds.includes(a.id));
  const files: Record<string, Uint8Array> = {};

  for (const spec of selected as AssetSpec[]) {
    let index = 0;
    for (const source of images) {
      index += 1;
      const name = sanitizeFilename(source.file.name);
      const path = `${spec.folder}/${String(index).padStart(2, "0")}-${name}.png`;
      files[path] = await renderResized(source.image, spec.width, spec.height, background);
    }
  }

  // PNGs are already compressed — store instead of deflating.
  const zipped = zipSync(files, { level: 0 });
  const buffer = new ArrayBuffer(zipped.length);
  new Uint8Array(buffer).set(zipped);
  return { blob: new Blob([buffer], { type: "application/zip" }), fileCount: Object.keys(files).length };
}
