import { analyzePackage } from "./analyze.ts";
import type { AnalysisLimits } from "./limits.ts";
// File structured cloning retains browser-backed bytes. No upload, whole-file
// buffer or main-thread parsing. The owner terminates this worker on every exit.
const scope = self as unknown as {
  onmessage:
    | ((
        event: MessageEvent<{
          id: number;
          file: File;
          limits: Partial<AnalysisLimits>;
        }>,
      ) => void)
    | null;
  postMessage(message: unknown): void;
};
scope.onmessage = async ({ data: { id, file, limits } }) => {
  try {
    const result = await analyzePackage(file.name, file, limits, (stage) =>
      scope.postMessage({ id, type: "progress", stage }),
    );
    scope.postMessage({ id, type: "result", result });
  } catch (e) {
    scope.postMessage({
      id,
      type: "error",
      error:
        e instanceof Error
          ? e.message
          : "Could not analyze this APK/AAB. Export a fresh package and retry.",
    });
  }
};
