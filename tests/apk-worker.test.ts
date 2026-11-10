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

test("oversized files are rejected without starting a worker", () => {
  let created = false;
  let error = "";
  const c = new AnalysisController(
    () => {
      created = true;
      return new FakeWorker();
    },
    { maxFileBytes: 1 },
  );
  c.start(new File(["xx"], "a.apk"), {
    progress: () => {},
    success: () => assert.fail("must not succeed"),
    failure: (s) => {
      error = s;
    },
  });
  assert.equal(created, false);
  assert.match(error, /large/i);
});
test("worker timeout terminates resources and reports one failure", async () => {
  const w = new FakeWorker();
  let failures = 0;
  const c = new AnalysisController(() => w, {}, 5);
  await new Promise<void>((resolve) =>
    c.start(new File(["x"], "a.apk"), {
      progress: () => {},
      success: () => assert.fail("must time out"),
      failure: (s) => {
        assert.match(s, /timeout/i);
        failures++;
        resolve();
      },
    }),
  );
  assert.equal(failures, 1);
  assert.equal(w.terminated, true);
  assert.equal(w.onmessage, null);
});
test("message decoding and postMessage failures clean up the active worker", () => {
  for (const throws of [false, true]) {
    const w = new FakeWorker();
    if (throws)
      w.postMessage = () => {
        throw new Error("clone failed");
      };
    let failures = 0;
    const c = new AnalysisController(() => w);
    c.start(new File(["x"], "a.apk"), {
      progress: () => {},
      success: () => assert.fail("must not succeed"),
      failure: () => failures++,
    });
    if (!throws) w.onmessageerror!({} as MessageEvent);
    assert.equal(failures, 1);
    assert.equal(w.terminated, true);
    assert.equal(w.onmessage, null);
  }
});

test("worker error messages are reconstructed from catalog and never copy arbitrary payloads", () => {
  const w = new FakeWorker();
  let message = "";
  let code = "";
  const c = new AnalysisController(() => w);
  c.start(new File(["x"], "a.apk"), {
    progress: () => {},
    success: () => assert.fail(),
    failure: (text, diagnostic) => {
      message = text;
      code = diagnostic ?? "";
    },
  });
  w.onmessage!({
    data: {
      id: 1,
      type: "error",
      error: "SECRET filename private.apk",
      diagnosticCode: "package-unsupported",
    },
  } as MessageEvent);
  assert.equal(code, "package-unsupported");
  assert.doesNotMatch(message, /SECRET|private/);
  assert.match(message, /unsupported/i);
});

test("malformed optional worker diagnostics fail safely before rendering", () => {
  const w = new FakeWorker();
  let code = "";
  let success = false;
  const c = new AnalysisController(() => w);
  c.start(new File(["x"], "a.apk"), {
    progress: () => {},
    success: () => {
      success = true;
    },
    failure: (_text, value) => {
      code = value ?? "";
    },
  });
  w.onmessage!({
    data: { id: 1, type: "result", result: { diagnosticCodes: "SECRET" } },
  } as MessageEvent);
  assert.equal(success, false);
  assert.equal(code, "response-invalid");
  assert.equal(w.terminated, true);
});
test("worker diagnostic arrays are reconstructed as fixed codes", () => {
  const w = new FakeWorker();
  let codes: unknown;
  const c = new AnalysisController(() => w);
  c.start(new File(["x"], "a.apk"), {
    progress: () => {},
    success: (r) => {
      codes = r.diagnosticCodes;
    },
    failure: () => assert.fail(),
  });
  w.onmessage!({
    data: {
      id: 1,
      type: "result",
      result: {
        diagnosticCodes: ["manifest-invalid", "SECRET", { token: "SECRET" }],
      },
    },
  } as MessageEvent);
  assert.deepEqual(codes, ["manifest-invalid", "unexpected"]);
});
