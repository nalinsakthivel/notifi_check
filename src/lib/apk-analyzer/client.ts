import type { AnalyzeResult } from "./analyze.ts";
import { analysisLimits, type AnalysisLimits } from "./limits.ts";
export type AnalysisStage = "Reading" | "Analyzing";
export interface WorkerPort {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(message: unknown): void;
  terminate(): void;
}
interface Callbacks {
  progress(stage: AnalysisStage): void;
  success(result: AnalyzeResult): void;
  failure(message: string): void;
}
export class AnalysisController {
  private id = 0;
  private active: {
    worker: WorkerPort;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;
  private createWorker: () => WorkerPort;
  private limits: Partial<AnalysisLimits>;
  private timeoutMs: number;
  constructor(
    createWorker: () => WorkerPort,
    limits: Partial<AnalysisLimits> = {},
    timeoutMs = 120000,
  ) {
    this.createWorker = createWorker;
    this.limits = limits;
    this.timeoutMs = timeoutMs;
  }
  cancel() {
    ++this.id;
    if (this.active) {
      const { worker, timer } = this.active;
      this.active = null;
      clearTimeout(timer);
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      worker.terminate();
    }
  }
  dispose() {
    this.cancel();
  }
  start(file: File, callbacks: Callbacks) {
    this.cancel();
    const id = this.id;
    let limits: AnalysisLimits;
    try {
      limits = analysisLimits(this.limits);
      if (file.size > limits.maxFileBytes)
        throw new Error(
          `File is too large. Select an APK/AAB no larger than ${limits.maxFileBytes / 1024 ** 2} MiB.`,
        );
      if (!/\.(apk|aab)$/i.test(file.name))
        throw new Error("Select a .apk or .aab file.");
    } catch (e) {
      callbacks.failure(e instanceof Error ? e.message : "Invalid file.");
      return;
    }
    const fail = (message: string) => {
      if (this.id !== id) return;
      this.cancel();
      callbacks.failure(message);
    };
    try {
      const worker = this.createWorker();
      this.active = {
        worker,
        timer: setTimeout(
          () =>
            fail(
              "Analysis exceeded the two-minute safety timeout. Try a smaller package.",
            ),
          this.timeoutMs,
        ),
      };
      worker.onmessage = (event) => {
        if (this.id !== id || event.data?.id !== id) return;
        const message = event.data;
        if (
          message.type === "progress" &&
          (message.stage === "Reading" || message.stage === "Analyzing")
        )
          callbacks.progress(message.stage);
        else if (message.type === "result") {
          this.cancel();
          callbacks.success(message.result);
        } else if (message.type === "error")
          fail(message.error || "Could not analyze this archive.");
      };
      worker.onerror = (event) => {
        event.preventDefault();
        fail(
          "The analysis worker stopped unexpectedly. Try again or use a current browser.",
        );
      };
      worker.onmessageerror = () =>
        fail(
          "The browser could not read the analysis worker result. Try again in a current browser.",
        );
      worker.postMessage({ id, file, limits });
    } catch {
      fail(
        "Could not start the analysis worker. Enable Web Workers or use a current browser.",
      );
    }
  }
}
