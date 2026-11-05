export interface AnalysisLimits {
  maxFileBytes: number;
  maxEntries: number;
  maxDirectoryBytes: number;
  maxEntryBytes: number;
  maxExtractedBytes: number;
  maxTotalBytes: number;
  maxRatio: number;
  maxSigningBytes: number;
}
export const DEFAULT_LIMITS: Readonly<AnalysisLimits> = Object.freeze({
  maxFileBytes: 512 * 1024 ** 2,
  maxEntries: 50000,
  maxDirectoryBytes: 16 * 1024 ** 2,
  maxEntryBytes: 16 * 1024 ** 2,
  maxExtractedBytes: 32 * 1024 ** 2,
  maxTotalBytes: 4 * 1024 ** 3,
  maxRatio: 200,
  maxSigningBytes: 16 * 1024 ** 2,
});
export function analysisLimits(
  overrides: Partial<AnalysisLimits> = {},
): AnalysisLimits {
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  for (const [key, value] of Object.entries(limits)) {
    if (
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      value > DEFAULT_LIMITS[key as keyof AnalysisLimits]
    )
      throw new Error(
        `Invalid ${key}: limits must be positive integers no greater than the safe default.`,
      );
  }
  return limits;
}
