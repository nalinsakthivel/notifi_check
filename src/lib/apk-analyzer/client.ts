import {
  DiagnosticError,
  DIAGNOSTICS,
  diagnosticCode,
  errorDiagnostic,
  type DiagnosticCode,
} from "../diagnostics.ts";
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
  failure(message: string, code?: DiagnosticCode): void;
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
        throw new DiagnosticError(
          "package-limit",
          `File is too large. Select an APK/AAB no larger than ${limits.maxFileBytes / 1024 ** 2} MiB.`,
        );
      if (!/\.(apk|aab)$/i.test(file.name))
        throw new DiagnosticError(
          "package-input-invalid",
          "Select a .apk or .aab file.",
        );
    } catch (e) {
      const code = errorDiagnostic(e);
      callbacks.failure(
        `${DIAGNOSTICS[code][1]}. ${DIAGNOSTICS[code][2]}`,
        code,
      );
      return;
    }
    const fail = (code: DiagnosticCode) => {
      if (this.id !== id) return;
      this.cancel();
      callbacks.failure(
        `${DIAGNOSTICS[code][1]}. ${DIAGNOSTICS[code][2]}`,
        code,
      );
    };
    try {
      const worker = this.createWorker();
      this.active = {
        worker,
        timer: setTimeout(() => fail("analysis-timeout"), this.timeoutMs),
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
          const result = message.result;
          if (
            !result ||
            typeof result !== "object" ||
            Array.isArray(result) ||
            (result.diagnosticCodes !== undefined &&
              !Array.isArray(result.diagnosticCodes))
          ) {
            fail("response-invalid");
            return;
          }
          const codes = [
            ...new Set(
              (result.diagnosticCodes ?? [])
                .slice(0, 16)
                .map((code: unknown) => diagnosticCode(code)),
            ),
          ];
          this.cancel();
          callbacks.success({ ...result, diagnosticCodes: codes });
        } else if (message.type === "error")
          fail(diagnosticCode(message.diagnosticCode));
      };
      worker.onerror = (event) => {
        event.preventDefault();
        fail("worker-unavailable");
      };
      worker.onmessageerror = () => fail("worker-unavailable");
      worker.postMessage({ id, file, limits });
    } catch {
      fail("worker-unavailable");
    }
  }
}
