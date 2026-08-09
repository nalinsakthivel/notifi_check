import { unzipSync } from "fflate";
import { parseApkManifest, type ManifestInfo } from "./manifest";
import { analyzeSignature, type SignatureInfo } from "./cert";
import { buildSizeBreakdown, type SizeCategory } from "./size-breakdown";

export type PackageFormat = "apk" | "aab" | "unknown";

export interface AnalyzeResult {
  fileName: string;
  totalSize: number;
  fileCount: number;
  format: PackageFormat;
  sizeBreakdown: SizeCategory[];
  /** AAB dynamic-feature module names (top-level dirs alongside base/), empty for APK. */
  modules: string[];
  manifest: ManifestInfo | null;
  manifestUnsupportedReason: string | null;
  signature: SignatureInfo | null;
  warnings: string[];
}

function detectFormat(paths: string[]): PackageFormat {
  const hasBundleConfig = paths.includes("BundleConfig.pb");
  const hasBaseManifest = paths.some((p) => p === "base/manifest/AndroidManifest.xml");
  if (hasBundleConfig || hasBaseManifest) return "aab";
  if (paths.includes("AndroidManifest.xml")) return "apk";
  return "unknown";
}

function topLevelModules(paths: string[]): string[] {
  const set = new Set<string>();
  for (const p of paths) {
    const first = p.split("/")[0];
    if (first && first !== p && !first.startsWith("META-INF")) set.add(first);
  }
  return [...set].sort();
}

/**
 * Reads a .apk/.aab (a File's bytes) and produces a best-effort analysis.
 * Every stage is isolated so a failure in one (bad manifest, unreadable
 * signature block, …) still leaves the rest of the result usable.
 */
export async function analyzePackage(fileName: string, bytes: Uint8Array): Promise<AnalyzeResult> {
  const warnings: string[] = [];

  // Pass 1: list every entry's metadata without inflating anything, so we can
  // compute size breakdown and detect format cheaply even for huge APKs.
  const allEntries: { path: string; compressedSize: number; uncompressedSize: number }[] = [];
  // Pass 2: content we actually need — manifest + signature files — collected
  // via the same filter callback so we only inflate what's necessary.
  const wantedNames = new Set<string>();

  try {
    // First lightweight pass: filter always returns false, just to enumerate
    // entries (fflate still calls the filter for every central-directory entry,
    // and size/originalSize come from the central directory — no inflation happens).
    unzipSync(bytes, {
      filter(file) {
        allEntries.push({
          path: file.name,
          compressedSize: file.size,
          uncompressedSize: file.originalSize,
        });
        return false;
      },
    });
  } catch (e) {
    throw new Error(
      e instanceof Error && /invalid zip/i.test(e.message)
        ? "This doesn't look like a valid APK/AAB — the file isn't a readable ZIP archive."
        : "Could not read this file as a ZIP archive.",
    );
  }

  const paths = allEntries.map((e) => e.path);
  const format = detectFormat(paths);

  if (format === "apk" && paths.includes("AndroidManifest.xml")) {
    wantedNames.add("AndroidManifest.xml");
  }
  const sigCandidates = paths.filter((p) => /^META-INF\/[^/]+\.(RSA|DSA|EC)$/i.test(p));
  for (const name of sigCandidates) wantedNames.add(name);

  let extracted: Record<string, Uint8Array> = {};
  if (wantedNames.size > 0) {
    try {
      extracted = unzipSync(bytes, { filter: (file) => wantedNames.has(file.name) });
    } catch {
      warnings.push("Could not extract manifest/signature contents from this archive.");
    }
  }

  const sizeBreakdown = buildSizeBreakdown(allEntries);
  const totalSize = allEntries.reduce((sum, e) => sum + e.uncompressedSize, 0);

  let manifest: ManifestInfo | null = null;
  let manifestUnsupportedReason: string | null = null;
  if (format === "apk") {
    const manifestBytes = extracted["AndroidManifest.xml"];
    if (manifestBytes) {
      try {
        manifest = parseApkManifest(manifestBytes);
      } catch {
        warnings.push("AndroidManifest.xml could not be parsed — showing partial results.");
      }
    } else {
      warnings.push("No AndroidManifest.xml found at the ZIP root.");
    }
  } else if (format === "aab") {
    manifestUnsupportedReason =
      "AAB manifest parsing (package name, version, permissions) is not yet supported — " +
      "the manifest is stored as protobuf (aapt2's Resources.proto format), a larger and " +
      "riskier parsing job than APK's binary XML. Showing file size breakdown and module list only.";
  }

  let signature: SignatureInfo | null = null;
  if (format === "apk") {
    const sigMap = new Map<string, Uint8Array>();
    for (const name of sigCandidates) {
      const bytes2 = extracted[name];
      if (bytes2) sigMap.set(name, bytes2);
    }
    try {
      signature = await analyzeSignature(sigMap);
    } catch {
      warnings.push("Could not analyze the signing block.");
    }
  }

  const modules = format === "aab" ? topLevelModules(paths).filter((m) => m !== "META-INF") : [];

  return {
    fileName,
    totalSize,
    fileCount: allEntries.length,
    format,
    sizeBreakdown,
    modules,
    manifest,
    manifestUnsupportedReason,
    signature,
    warnings,
  };
}
