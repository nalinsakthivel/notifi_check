import { DiagnosticError, type DiagnosticCode } from "../diagnostics.ts";
import { readSigningBlock } from "./signing-block.ts";
import { readArchive } from "./archive.ts";
import type { AnalysisLimits } from "./limits.ts";
import { parseApkManifest, type ManifestInfo } from "./manifest.ts";
import { analyzeSignature, type SignatureInfo } from "./cert.ts";
import { buildSizeBreakdown, type SizeCategory } from "./size-breakdown.ts";

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
  diagnosticCodes: DiagnosticCode[];
}

function detectFormat(paths: string[]): PackageFormat {
  const hasBundleConfig = paths.includes("BundleConfig.pb");
  const hasBaseManifest = paths.some(
    (p) => p === "base/manifest/AndroidManifest.xml",
  );
  if (hasBundleConfig || hasBaseManifest) return "aab";
  if (paths.includes("AndroidManifest.xml")) return "apk";
  return "unknown";
}

function topLevelModules(paths: string[]): string[] {
  const set = new Set<string>();
  for (const p of paths) {
    if (!p.endsWith("/manifest/AndroidManifest.xml")) continue;
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
export async function analyzePackage(
  fileName: string,
  input: Blob | Uint8Array,
  limits: Partial<AnalysisLimits> = {},
  progress?: (stage: "Reading" | "Analyzing") => void,
): Promise<AnalyzeResult> {
  progress?.("Reading");
  const archive = await readArchive(
    input instanceof Blob ? input : new Blob([new Uint8Array(input)]),
    limits,
  );
  progress?.("Analyzing");
  const warnings: string[] = [];
  const diagnosticCodes: DiagnosticCode[] = [];
  const allEntries = archive.entries;
  const paths = allEntries.map((e) => e.path);
  const format = detectFormat(paths);
  const sigCandidates =
    format === "apk"
      ? paths.filter((p) => /^META-INF\/[^/]+\.(RSA|DSA|EC)$/i.test(p))
      : [];
  if (sigCandidates.length > 64)
    throw new DiagnosticError(
      "package-limit",
      "Too many signature entries: the safety limit is 64.",
    );
  const wantedNames = new Set([
    ...sigCandidates,
    ...(format === "apk" ? ["AndroidManifest.xml"] : []),
  ]);
  const extracted: Record<string, Uint8Array> = Object.create(null);
  for (const entry of allEntries)
    if (wantedNames.has(entry.path))
      extracted[entry.path] = await archive.readEntry(entry);
  if (!paths.includes("AndroidManifest.xml") && format !== "aab")
    warnings.push(
      "No AndroidManifest.xml found at the ZIP root; this may not be an APK.",
    );
  if (format === "unknown") diagnosticCodes.push("manifest-missing");
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
        diagnosticCodes.push("manifest-invalid");
        warnings.push(
          "AndroidManifest.xml could not be parsed — showing partial results.",
        );
      }
    } else {
      warnings.push("No AndroidManifest.xml found at the ZIP root.");
    }
  } else if (format === "aab") {
    diagnosticCodes.push("aab-manifest-unsupported");
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
      signature = await analyzeSignature(
        sigMap,
        await readSigningBlock(
          input instanceof Blob ? input : new Blob([new Uint8Array(input)]),
          archive.directoryOffset,
          archive.limits.maxSigningBytes,
        ),
      );
    } catch {
      warnings.push("Could not analyze the signing block.");
    }
  }

  const modules =
    format === "aab"
      ? topLevelModules(paths).filter((m) => m !== "META-INF")
      : [];

  if (modules.length > 200)
    warnings.push("Module list limited to the first 200 modules.");
  return {
    fileName,
    totalSize,
    fileCount: allEntries.length,
    format,
    sizeBreakdown,
    modules: modules.slice(0, 200),
    manifest,
    manifestUnsupportedReason,
    signature,
    warnings,
    diagnosticCodes,
  };
}
