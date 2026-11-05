import test from "node:test";
import assert from "node:assert/strict";
import {
  AnalysisController,
  type WorkerPort,
} from "../src/lib/apk-analyzer/client.ts";
class FakeWorker implements WorkerPort {
  onmessage: WorkerPort["onmessage"] = null;
  onerror: WorkerPort["onerror"] = null;
  onmessageerror: WorkerPort["onmessageerror"] = null;
  terminated = false;
  request: unknown;
  postMessage(value: unknown) {
    this.request = value;
  }
  terminate() {
    this.terminated = true;
  }
}
test("replacement and cancellation terminate workers and suppress stale callbacks", () => {
  const workers: FakeWorker[] = [];
  const events: string[] = [];
  const controller = new AnalysisController(() => {
    const w = new FakeWorker();
    workers.push(w);
    return w;
  });
  const callbacks = {
    progress: () => events.push("progress"),
    success: () => events.push("success"),
    failure: () => events.push("failure"),
  };
  controller.start(new File(["test"], "a.apk"), callbacks);
  const old = workers[0].onmessage!;
  controller.start(new File(["test"], "b.apk"), callbacks);
  assert.equal(workers[0].terminated, true);
  old({ data: { id: 1, type: "error", error: "stale" } } as MessageEvent);
  assert.deepEqual(events, []);
  controller.cancel();
  assert.equal(workers[1].terminated, true);
  assert.equal(workers[1].onmessage, null);
});
test("completion cleans up; progress and completion belong to the current job", () => {
  const w = new FakeWorker();
  const controller = new AnalysisController(() => w);
  const events: string[] = [];
  controller.start(new File(["x"], "x.apk"), {
    progress: (s) => events.push(s),
    success: () => events.push("done"),
    failure: () => events.push("failed"),
  });
  w.onmessage!({
    data: { id: 1, type: "progress", stage: "Analyzing" },
  } as MessageEvent);
  w.onmessage!({ data: { id: 1, type: "result", result: {} } } as MessageEvent);
  assert.deepEqual(events, ["Analyzing", "done"]);
  assert.equal(w.terminated, true);
  assert.equal(w.onmessage, null);
});
test("worker errors, creation failure, oversized file and disposal leave no active worker", () => {
  const w = new FakeWorker();
  let error = "";
  const callbacks = {
    progress: () => {},
    success: () => {},
    failure: (s: string) => {
      error = s;
    },
  };
  const c = new AnalysisController(() => w);
  c.start(new File(["a"], "a.apk"), callbacks);
  w.onerror!({ preventDefault() {} } as ErrorEvent);
  assert.match(error, /worker|browser/i);
  assert.equal(w.terminated, true);
  const broken = new AnalysisController(() => {
    throw new Error("blocked");
  });
  broken.start(new File(["a"], "a.apk"), callbacks);
  assert.match(error, /worker|browser/i);
  c.dispose();
  assert.equal(w.onmessage, null);
});
