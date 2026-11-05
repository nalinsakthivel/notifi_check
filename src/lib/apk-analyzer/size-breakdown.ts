export interface SizeCategory {
  label: string;
  compressedSize: number;
  uncompressedSize: number;
}

const ABI_DIRS = [
  "armeabi-v7a",
  "arm64-v8a",
  "x86",
  "x86_64",
  "armeabi",
  "mips",
  "mips64",
];

/** Buckets a ZIP entry path into a human category, per the size-breakdown spec. */
export function categorize(path: string): string {
  // Strip only recognized module-relative prefixes (AAB).
  path = path.replace(
    /^[^/]+\/(?=(?:dex|lib|res|assets|manifest)\/|resources\.pb$)/,
    "",
  );
  if (path.startsWith("dex/")) path = path.slice(4);
  if (path === "manifest/AndroidManifest.xml") return "Manifest";
  const base = path.split("/").pop() ?? path;

  if (/^classes\d*\.dex$/.test(base)) return "Code (DEX)";
  if (path.startsWith("META-INF/")) return "Signing";
  if (base === "resources.arsc" || base === "resources.pb")
    return "Compiled resources";
  if (path.startsWith("res/")) return "Resources";
  if (path.startsWith("assets/")) return "Assets";
  if (path.startsWith("lib/")) {
    const abi = path.split("/")[1];
    return ABI_DIRS.includes(abi)
      ? `Native libraries (${abi})`
      : "Native libraries (other)";
  }
  if (path === "AndroidManifest.xml") return "Manifest";
  return "Other";
}

export function buildSizeBreakdown(
  entries: { path: string; compressedSize: number; uncompressedSize: number }[],
): SizeCategory[] {
  const byCategory = new Map<string, SizeCategory>();
  for (const e of entries) {
    const label = categorize(e.path);
    const existing = byCategory.get(label);
    if (existing) {
      existing.compressedSize += e.compressedSize;
      existing.uncompressedSize += e.uncompressedSize;
    } else {
      byCategory.set(label, {
        label,
        compressedSize: e.compressedSize,
        uncompressedSize: e.uncompressedSize,
      });
    }
  }
  return [...byCategory.values()].sort(
    (a, b) => b.uncompressedSize - a.uncompressedSize,
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
