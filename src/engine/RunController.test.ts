/**
 * Unit tests for the run pipeline (RunController) against a fake engine and
 * a fake host, on real in-memory project storage. The end-to-end store
 * behaviour (queue, snapshots, continuations, sweeps) is covered by
 * store/projects.integration.test.ts.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(import("../utils/metrics"), () => ({
  track: vi.fn(),
  time_event: vi.fn(),
}));

import { track } from "../utils/metrics";
import {
  createMemoryProjectStorage,
  readRunMeta,
  RUNS_DIR,
  writeRunMeta,
  type ProjectStorage,
  type RunMeta,
} from "../storage";
import { emptyEngineFrame } from "../wasm/engineFrame";
import type { LammpsWeb, LMPModifier } from "../types";
import {
  collectRunMetrics,
  prepareEngineInputs,
  prepareVarsScript,
  RunController,
  runWorkdirId,
  STORAGE_FULL_RUN_ERROR,
  stopReasonOf,
  type RunHost,
  type RunPlan,
} from "./RunController";

const SCRIPT = "units lj\nrun 100\n";

beforeEach(() => {
  vi.mocked(track).mockClear();
});

describe("prepareVarsScript", () => {
  type WriteFile = (path: string, data: string | Uint8Array) => void;
  let writeFile: ReturnType<typeof vi.fn<WriteFile>>;

  beforeEach(() => {
    writeFile = vi.fn<WriteFile>();
  });

  it("returns the input script itself without vars", () => {
    for (const vars of [undefined, {}]) {
      const result = prepareVarsScript(
        { workdirId: "p/runs/run-001", inputScript: "in.lmp", vars },
        "some content",
        { writeFile },
      );
      expect(result).toBe("in.lmp");
    }
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("writes the vars and wrapper files into the workdir and runs the wrapper", () => {
    const result = prepareVarsScript(
      {
        workdirId: "p/runs/run-001",
        inputScript: "in.lmp",
        vars: { temp: 300, pressure: 1 },
      },
      "run 1000\n",
      { writeFile },
    );

    expect(result).toBe("_wrapper_in.lmp");
    expect(writeFile.mock.calls).toEqual([
      [
        "/p/runs/run-001/_vars_in.lmp",
        "variable temp equal 300\nvariable pressure equal 1\n\n",
      ],
      [
        "/p/runs/run-001/_wrapper_in.lmp",
        "variable temp equal 300\nvariable pressure equal 1\n\nrun 1000\n",
      ],
    ]);
  });
});

describe("collectRunMetrics", () => {
  it("computes metrics from the engine state", () => {
    const engine = { getTimesteps: () => 1000, getNumAtoms: () => 500 };
    expect(collectRunMetrics(engine, 2.0, ["pe", "ke"])).toEqual({
      timesteps: 1000,
      timestepsPerSecond: "500.000",
      numAtoms: 500,
      computes: ["pe", "ke"],
    });
  });

  it("handles zero duration gracefully", () => {
    const engine = { getTimesteps: () => 100, getNumAtoms: () => 10 };
    expect(collectRunMetrics(engine, 0, []).timestepsPerSecond).toBe("0.000");
  });
});

describe("stopReasonOf", () => {
  it("routes the engine's error message to a stop reason", () => {
    expect(stopReasonOf(undefined)).toBe("completed");
    // Empty string is what a clean run reports.
    expect(stopReasonOf("")).toBe("completed");
    expect(stopReasonOf("ERROR: Atomify::canceled by user")).toBe("canceled");
    expect(stopReasonOf("ERROR: Unknown command: frobnicate")).toBe("failed");
  });
});

describe("prepareEngineInputs", () => {
  const data = new Uint8Array([0, 159, 146, 150]);
  const inputs = [
    { fileName: "in.lmp", content: "atom_style full\nrun 10\n" },
    { fileName: "include.lmp", content: "pair_style hybrid lj/cut 2.5\n" },
    { fileName: "restart.bin", content: data },
  ];

  it("runs styles serially for scripts that don't opt into KOKKOS", () => {
    const prepared = prepareEngineInputs(inputs, "in.lmp", false)!;
    const byName = Object.fromEntries(
      prepared.files.map((file) => [file.fileName, file.content]),
    );
    const main = byName["in.lmp"] as string;
    expect(main.startsWith("suffix off\n")).toBe(true);
    expect(main).toContain("suffix kk\natom_style full\nsuffix off");
    // Group inspection hooks precede every run.
    expect(main).toMatch(/include _wrapper_groups\.lmp\nrun 10/);
    // Includes get the style wrapping but not the leading `suffix off`.
    expect(byName["include.lmp"]).toBe(
      "suffix kk\npair_style hybrid lj/cut 2.5\nsuffix off\n",
    );
    // Binary inputs reach the engine byte-exact.
    expect(byName["restart.bin"]).toBe(data);
    expect(prepared.script).toBe(inputs[0].content);
    expect(prepared.runScript).toBe(main);
  });

  it("leaves opted-in scripts alone and injects the opt-in for the toggle", () => {
    const optedIn = prepareEngineInputs(
      [{ fileName: "in.lmp", content: "suffix kk\nrun 10\n" }],
      "in.lmp",
      false,
    )!;
    expect(optedIn.runScript).not.toContain("suffix off");

    const toggled = prepareEngineInputs(inputs, "in.lmp", true)!;
    expect(toggled.script.startsWith("suffix kk")).toBe(true);
    expect(toggled.runScript.startsWith("suffix kk")).toBe(true);
    expect(toggled.runScript).not.toContain("suffix off");
    expect(
      toggled.files.find((file) => file.fileName === "include.lmp")?.content,
    ).toBe("pair_style hybrid lj/cut 2.5\n");
  });

  it("returns null when the input script is missing or not text", () => {
    expect(prepareEngineInputs(inputs, "in.other", false)).toBeNull();
    expect(prepareEngineInputs(inputs, "restart.bin", false)).toBeNull();
  });
});

describe("RunController", () => {
  it("loads a fresh run into its own workdir, runs it and persists the results", async () => {
    const engine = new FakeEngine({
      outputs: {
        "dump.out": "ITEM: TIMESTEP\n0\n",
        // Preprocessed input copies and engine wrappers never come back.
        "in.lmp": "mangled",
        "_wrapper_in.lmp": "wrapper",
      },
    });
    const host = fakeHost({ console: ["LAMMPS (fake)", "Total wall time"] });
    const { plan, storage } = await claimedRun({ vars: { T: 2 } });

    const outcome = await new RunController(engine, host).execute(plan);

    const workdir = `/${runWorkdirId("proj", "run-001")}`;
    expect(outcome.workdirId).toBe(runWorkdirId("proj", "run-001"));
    // Engine setup happens before the run starts, in this order.
    expect(engine.calls.slice(0, 5)).toEqual([
      `mkdir ${workdir}`,
      "clearBondDistances",
      "setBuildNeighborlist false",
      `chdir ${workdir}`,
      `writeFile ${workdir}/data.txt`,
    ]);
    expect(engine.calls.indexOf("start")).toBeLessThan(
      engine.calls.indexOf(`runFile ${workdir}/_wrapper_in.lmp`),
    );
    expect(engine.read(`${workdir}/in.lmp`)).toContain("suffix off");
    expect(engine.read(`${workdir}/_wrapper_in.lmp`)).toMatch(
      /^variable T equal 2\n\nsuffix off/,
    );
    expect(host.beginFreshRun).toHaveBeenCalledWith(
      runWorkdirId("proj", "run-001"),
    );
    expect(host.applyAtomifyCommands).toHaveBeenCalledWith(SCRIPT);
    expect(host.setRunning.mock.calls).toEqual([[true], [false]]);
    expect(host.publishFinalFrame).toHaveBeenCalledTimes(1);

    const meta = await readRunMeta(storage, "proj", "run-001");
    expect(meta).toMatchObject({
      status: "completed",
      vars: { T: 2 },
      stats: { timesteps: 500, numAtoms: 100 },
    });
    expect(meta?.finishedAt).toBeTruthy();
    expect(meta?.error).toBeUndefined();
    expect(outcome.meta).toEqual(meta);
    const run = `${RUNS_DIR}/run-001`;
    expect(await storage.read("proj", `${run}/dump.out`)).toBe(
      "ITEM: TIMESTEP\n0\n",
    );
    expect(await storage.read("proj", `${run}/in.lmp`)).toBe(SCRIPT);
    expect(await storage.stat("proj", `${run}/_wrapper_in.lmp`)).toBeNull();
    // No engine-written log: the captured console is persisted instead.
    expect(await storage.read("proj", `${run}/log.lammps`)).toBe(
      "LAMMPS (fake)\nTotal wall time\n",
    );
    expect(await storage.read("proj", `${run}/.atomify/frame.png`)).toEqual(
      new Uint8Array([137, 80, 78, 71]),
    );
    expect(byName("Simulation.Start")).toEqual([{ simulationId: "proj" }]);
    expect(byName("Simulation.Stop")[0]).toMatchObject({
      stopReason: "completed",
      simulationId: "proj",
      timesteps: 500,
    });
  });

  it("streams every frame to rendering and every Nth to the status, while the run lasts", async () => {
    const engine = new FakeEngine({ frames: 7 });
    const host = fakeHost({ uiUpdateFrequency: 3 });
    const { plan } = await claimedRun();

    await new RunController(engine, host).execute(plan);

    expect(host.processFrame.mock.calls.map(([publish]) => publish)).toEqual([
      false,
      false,
      true,
      false,
      false,
      true,
      false,
    ]);
    // The listener belongs to the run: gone once it settled.
    expect(engine.stepListener).toBeUndefined();
  });

  it("records a stop-button abort as canceled and shows its final state", async () => {
    const engine = new FakeEngine({ error: "ERROR: Atomify::canceled" });
    const host = fakeHost();
    const { plan, storage } = await claimedRun();

    const outcome = await new RunController(engine, host).execute(plan);

    expect(outcome.meta.status).toBe("canceled");
    expect(outcome.meta.error).toBeUndefined();
    expect(host.publishFinalFrame).toHaveBeenCalled();
    expect(host.setLastError).not.toHaveBeenCalledWith(
      expect.stringContaining("canceled"),
    );
    expect((await readRunMeta(storage, "proj", "run-001"))?.status).toBe(
      "canceled",
    );
  });

  it("fails a run with the engine's error, and keeps it out of metrics", async () => {
    const engine = new FakeEngine({ error: "ERROR: Unknown command: secret" });
    const host = fakeHost();
    const { plan } = await claimedRun();

    const outcome = await new RunController(engine, host).execute(plan);

    expect(outcome.meta).toMatchObject({
      status: "failed",
      error: "ERROR: Unknown command: secret",
    });
    expect(host.setLastError).toHaveBeenLastCalledWith(
      "ERROR: Unknown command: secret",
    );
    expect(host.publishFinalFrame).not.toHaveBeenCalled();
    expect(host.setRunning).toHaveBeenLastCalledWith(false);
    for (const [, payload] of vi.mocked(track).mock.calls) {
      expect(JSON.stringify(payload ?? {})).not.toContain("secret");
    }
  });

  it("fails the run when the engine worker crashes mid-run", async () => {
    const crash = new Error("The simulation engine crashed: Aborted(OOM)");
    const engine = new FakeEngine({ crash });
    const host = fakeHost();
    const { plan } = await claimedRun();

    const outcome = await new RunController(engine, host).execute(plan);

    expect(outcome.meta).toMatchObject({
      status: "failed",
      error: crash.message,
    });
    expect(host.setLastError).toHaveBeenLastCalledWith(crash.message);
    expect(host.setRunning).toHaveBeenLastCalledWith(false);
    // The rejected output copies are reported, not thrown.
    expect(host.notice).toHaveBeenCalledWith(
      `Could not copy run outputs to storage: ${crash.message}`,
    );
  });

  it("fails without starting the engine when the input script is not in the snapshot", async () => {
    const engine = new FakeEngine();
    const host = fakeHost();
    const { plan } = await claimedRun({ inputScript: "in.missing" });

    const outcome = await new RunController(engine, host).execute(plan);

    const message =
      "Input script in.missing was not found among the simulation files.";
    expect(outcome.meta).toMatchObject({ status: "failed", error: message });
    expect(host.setLastError).toHaveBeenLastCalledWith(message);
    expect(host.beginFreshRun).not.toHaveBeenCalled();
    expect(host.setRunning).not.toHaveBeenCalled();
    expect(engine.calls).not.toContain("start");
    // No unmatched Simulation.Start.
    expect(byName("Simulation.Start")).toEqual([]);
  });

  it("does not drive a busy engine", async () => {
    const engine = new FakeEngine();
    engine.running = true;
    const host = fakeHost();
    const { plan } = await claimedRun();

    const outcome = await new RunController(engine, host).execute(plan);

    expect(outcome.meta).toMatchObject({
      status: "failed",
      error: "The engine did not start this run.",
    });
    expect(engine.calls.some((call) => call.startsWith("runFile"))).toBe(false);
  });

  it("continues the resident state in its own workdir without reloading it", async () => {
    const engine = new FakeEngine({ outputs: { "dump.out": "steps 0-30" } });
    const host = fakeHost();
    const { plan, storage } = await claimedRun({
      continuation: { workdirId: "proj/runs/run-001", steps: 20 },
    });

    const outcome = await new RunController(engine, host).execute(plan);

    expect(outcome.workdirId).toBe("proj/runs/run-001");
    expect(engine.calls).toEqual([
      "writeFile /proj/runs/run-001/_wrapper_continue.lmp",
      "runFile /proj/runs/run-001/_wrapper_continue.lmp",
    ]);
    expect(engine.read("/proj/runs/run-001/_wrapper_continue.lmp")).toBe(
      "run 20\n",
    );
    expect(host.beginFreshRun).not.toHaveBeenCalled();
    expect(host.applyAtomifyCommands).not.toHaveBeenCalled();
    // Outputs continue in the resident workdir and land in the new run.
    expect(await storage.read("proj", `${RUNS_DIR}/run-001/dump.out`)).toBe(
      "steps 0-30",
    );
    expect(outcome.meta.status).toBe("completed");
  });

  it("fails a run whose outputs hit the quota and skips the frame capture", async () => {
    const engine = new FakeEngine({ outputs: { "dump.out": "big" } });
    const host = fakeHost();
    const { plan, storage } = await claimedRun();
    const write = storage.write.bind(storage);
    vi.spyOn(storage, "write").mockImplementation(async (dir, path, data) => {
      if (path.endsWith("dump.out")) {
        throw new DOMException("quota", "QuotaExceededError");
      }
      return write(dir, path, data);
    });

    const outcome = await new RunController(engine, host).execute(plan);

    expect(outcome.storageFull).toBe(true);
    expect(outcome.meta).toMatchObject({
      status: "failed",
      error: STORAGE_FULL_RUN_ERROR,
    });
    expect(host.notice).toHaveBeenCalledWith(
      expect.stringContaining('Browser storage is full: run #1 of "Project"'),
    );
    expect(host.captureFrame).not.toHaveBeenCalled();
  });
});

// --- Helpers ---------------------------------------------------------------

interface FakeEngineOptions {
  /** getErrorMessage after the run (e.g. a LAMMPS error or the cancel marker). */
  error?: string;
  /** runFile rejects with this, like the proxy after a worker crash. */
  crash?: Error;
  /** Frames delivered to the step listener while runFile is pending. */
  frames?: number;
  /** Workdir files snapshotWorkdir reports, by relative path. */
  outputs?: Record<string, string>;
}

class FakeEngine implements LammpsWeb {
  readonly latestFrame = emptyEngineFrame();
  /** Engine calls that change its state, in order. */
  readonly calls: string[] = [];
  readonly files = new Map<string, string | Uint8Array>();
  stepListener?: () => void;
  running = false;
  private error = "";

  constructor(private readonly options: FakeEngineOptions = {}) {}

  read(path: string): string {
    const data = this.files.get(path);
    if (data === undefined) throw new Error(`No such file: ${path}`);
    return typeof data === "string" ? data : new TextDecoder().decode(data);
  }

  setStepListener(listener: (() => void) | undefined) {
    this.stepListener = listener;
  }
  writeFile(path: string, data: string | Uint8Array) {
    this.calls.push(`writeFile ${path}`);
    this.files.set(path, data);
  }
  mkdir(path: string) {
    this.calls.push(`mkdir ${path}`);
  }
  chdir(path: string) {
    this.calls.push(`chdir ${path}`);
  }
  clearBondDistances() {
    this.calls.push("clearBondDistances");
  }
  setBuildNeighborlist(build: boolean) {
    this.calls.push(`setBuildNeighborlist ${build}`);
  }
  start() {
    this.calls.push("start");
    return true;
  }
  async runFile(path: string) {
    this.calls.push(`runFile ${path}`);
    for (let i = 0; i < (this.options.frames ?? 0); i++) {
      this.stepListener?.();
    }
    if (this.options.crash) throw this.options.crash;
    this.error = this.options.error ?? "";
  }
  async snapshotWorkdir() {
    if (this.options.crash) throw this.options.crash;
    return {
      files: Object.entries(this.options.outputs ?? {}).map(
        ([path, content]) => ({
          path,
          bytes: new TextEncoder().encode(content),
        }),
      ),
      skipped: [],
    };
  }
  getIsRunning = () => this.running;
  getErrorMessage = () => this.error;
  getExceptionMessage = (address: number) => `exception at ${address}`;
  getNumAtoms = () => 100;
  getTimesteps = () => 500;
  getRunTimesteps = () => 0;
  getRunTotalTimesteps = () => 0;
  getTimestepsPerSecond = () => 0;
  getCPURemain = () => 0;
  getWhichFlag = () => 0;
  getLastCommand = () => "";
  getMemoryUsage = () => 0;
  getComputeNames = () => [];
  getFixNames = () => [];
  getVariableNames = () => [];
  getCompute = noModifier;
  getFix = noModifier;
  getVariable = noModifier;
  setSyncFrequency = () => {};
  setBondDistance = () => {};
  stop = () => true;
  cancel = () => {};
  setPaused = () => {};
  isPaused = () => false;
  runCommand = () => {};
}

function noModifier(): LMPModifier {
  throw new Error("LMP modifiers are not exercised by these tests");
}

function fakeHost(
  options: { console?: string[]; uiUpdateFrequency?: number } = {},
) {
  return {
    beginFreshRun: vi.fn<RunHost["beginFreshRun"]>(),
    applyAtomifyCommands: vi.fn<RunHost["applyAtomifyCommands"]>(),
    setRunning: vi.fn<RunHost["setRunning"]>(),
    setLastError: vi.fn<RunHost["setLastError"]>(),
    processFrame: vi.fn<RunHost["processFrame"]>(),
    publishFinalFrame: vi.fn<RunHost["publishFinalFrame"]>(),
    uiUpdateFrequency: () => options.uiUpdateFrequency ?? 15,
    computeNames: () => ["thermo_temp"],
    clearLastCommand: vi.fn<RunHost["clearLastCommand"]>(),
    notice: vi.fn<RunHost["notice"]>(),
    fullConsole: () => options.console ?? [],
    captureFrame: vi.fn<RunHost["captureFrame"]>(
      async () => new Uint8Array([137, 80, 78, 71]),
    ),
  } satisfies RunHost;
}

/**
 * A run claimed the way the projects layer claims one: snapshot inputs in
 * runs/run-001 and a "running" run.json.
 */
async function claimedRun(
  overrides: {
    inputScript?: string;
    vars?: Record<string, number>;
    continuation?: RunPlan["continuation"];
  } = {},
): Promise<{ plan: RunPlan; storage: ProjectStorage }> {
  const storage = createMemoryProjectStorage();
  const { dirName } = await storage.createProject({ displayName: "proj" });
  expect(dirName).toBe("proj");
  const inputFiles = ["data.txt", "in.lmp"];
  await storage.write(dirName, `${RUNS_DIR}/run-001/data.txt`, "1 2 3\n");
  await storage.write(dirName, `${RUNS_DIR}/run-001/in.lmp`, SCRIPT);
  const meta: RunMeta = {
    schemaVersion: 1,
    id: "run-001",
    inputScript: overrides.inputScript ?? "in.lmp",
    vars: overrides.vars,
    inputFiles,
    status: "running",
    startedAt: new Date().toISOString(),
    origin: "app",
  };
  await writeRunMeta(storage, dirName, meta);
  return {
    storage,
    plan: {
      storage,
      dirName,
      meta,
      useKokkos: false,
      continuation: overrides.continuation,
      projectName: "Project",
    },
  };
}

/** track() payloads for one event name, in call order. */
function byName(name: string): unknown[] {
  return vi
    .mocked(track)
    .mock.calls.filter(([event]) => event === name)
    .map(([, payload]) => payload);
}
