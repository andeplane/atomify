/**
 * The run pipeline: the one path from a claimed project run to the LAMMPS
 * engine and back.
 *
 * The projects layer (store/projects.ts) owns what comes before a run touches
 * the engine — the queue, the run directory, its snapshot and the initial
 * run.json (ADR-001 §5) — and what comes after: the resident run that can be
 * continued, and queue advancement. A RunController owns everything between:
 *
 *  1. Load the snapshot's inputs into the run's engine workdir (KOKKOS or
 *     serial-styles preprocessing, group inspection, the vars wrapper), or for
 *     a continuation write the `run N` wrapper into the resident workdir.
 *  2. Start the run and stream every delivered frame into the processing
 *     pipeline: the renderer every frame, the status every Nth.
 *  3. Settle it as completed, canceled or failed — a LAMMPS error, an input
 *     script missing from the snapshot, or a crashed engine worker.
 *  4. Persist the results into the run directory: outputs (throttled while
 *     running so the notebook can analyze a run in flight, ADR-002 §4, and in
 *     full at the end), the console as log.lammps, the final run.json and
 *     frame.png. A full quota fails the run with a clear reason and keeps what
 *     was copied (ADR-001 Consequences: never silent loss).
 *
 * Run control (cancel, pause, sync frequency) is not here: the engine proxy is
 * its only owner (see LammpsWorkerProxy).
 *
 * The controller reaches the engine only through LammpsWeb and the app around
 * it (store state, toasts, the viewport) only through {@link RunHost}, so both
 * sides can be faked in tests (RunController.test.ts).
 */

import type { LammpsWeb } from "../types";
import {
  bytesToWriteContent,
  isQuotaExceededError,
  readRunMeta,
  RUNS_DIR,
  writeRunMeta,
  type ProjectStorage,
  type RunMeta,
} from "../storage";
import { continuationScript } from "../utils/continuation";
import {
  injectKokkosOptIn,
  prepareScriptForSerialStyles,
  scriptOptsIntoKokkos,
} from "../utils/kokkos";
import { prepareGroupInspection } from "../utils/lammpsGroups";
import { time_event, track } from "../utils/metrics";
import { CANCEL_MESSAGE } from "../wasm/LammpsWorkerProxy";

/** A claimed run, ready to execute. */
export interface RunPlan {
  storage: ProjectStorage;
  dirName: string;
  /**
   * run.json as written when the run directory was claimed (status
   * "running"). Its id, inputScript, vars and inputFiles describe the run;
   * the final run.json is this plus the outcome.
   */
  meta: RunMeta;
  /**
   * The New Run modal's Multithreading toggle. On, the `suffix kk` opt-in is
   * injected into the engine's copy of the input script when it lacks one;
   * off leaves opted-in scripts alone (the toggle defaults from the script,
   * so "off" only means "don't inject"). The run snapshot keeps the
   * original text. See utils/kokkos.ts.
   */
  useKokkos: boolean;
  /**
   * Continue the engine's resident state for `steps` more steps in its own
   * workdir, instead of loading the run's snapshot into a fresh engine.
   */
  continuation?: { workdirId: string; steps: number };
  /** Curated example id when the project came from the example library. */
  exampleId?: string;
  /** The project's display name, for the storage-full notice. */
  projectName: string;
}

export interface RunOutcome {
  /** The final run.json (persisted, unless not even it fit in storage). */
  meta: RunMeta;
  /** Outputs, the log or run.json hit the storage quota. */
  storageFull: boolean;
  /** Engine workdir holding the run's state; a continuation keeps its parent's. */
  workdirId: string;
}

/** What the run pipeline needs from the app around it (the store, in production). */
export interface RunHost {
  /**
   * A fresh run is being loaded into `workdirId`: drop the previous run's
   * status, console, particle styles and color-by compute, and record the
   * workdir as the run the engine holds.
   */
  beginFreshRun(workdirId: string): void;
  /** Apply the input script's `#/` directives (atom styles, bonds, camera). */
  applyAtomifyCommands(script: string): void;
  setRunning(running: boolean): void;
  /** Error toast; undefined clears it. */
  setLastError(message: string | undefined): void;
  /**
   * One delivered frame into the processing pipeline: the rendering modifiers
   * always, every modifier plus the status snapshot when `publish`.
   */
  processFrame(publish: boolean): void;
  /** The whole pipeline once more after a run settles: its final state. */
  publishFinalFrame(): void;
  /** Delivered frames per status publication (the UI update frequency). */
  uiUpdateFrequency(): number;
  /** Computes the run has published, for Simulation.Stop metrics. */
  computeNames(): string[];
  /** The status bar's current command ends with the run. */
  clearLastCommand(): void;
  /** One-shot toast. */
  notice(message: string): void;
  /** The run's uncapped console, persisted as log.lammps. */
  fullConsole(): readonly string[];
  /** Best-effort viewport capture for frame.png. */
  captureFrame(): Promise<Uint8Array | null>;
}

export type StopReason = "canceled" | "failed" | "completed";

/** Files ≤ this size stream to storage during the run; larger wait for the end. */
const MID_RUN_COPY_CAP = 4 * 1024 * 1024;
const MID_RUN_COPY_INTERVAL_MS = 3000;

/** Status publications fall back to every 15th frame (the settings default). */
const DEFAULT_UI_UPDATE_FREQUENCY = 15;

/** Wrapper artifacts from the vars-injection mechanism — engine detail. */
const RUN_INTERNAL_FILE = /^(_vars_|_wrapper_)/;

/** The script a continuation runs in the resident workdir. */
const CONTINUE_WRAPPER = "_wrapper_continue.lmp";

/** run.json `error` for a run whose outputs hit the quota (ADR-001
 *  Consequences). Settings > Storage lists per-project usage with delete. */
export const STORAGE_FULL_RUN_ERROR =
  "Browser storage is full — free space in Settings > Storage.";

/** The toast for a run that hit the storage quota. */
export function storageFullNotice(runId: string, projectName: string): string {
  return (
    `Browser storage is full: run #${runId.replace(/^run-0*/, "")} of ` +
    `"${projectName}" failed and kept partial outputs. Free space in ` +
    `Settings > Storage.`
  );
}

/** The engine workdir of a fresh run: its own run directory, by construction. */
export function runWorkdirId(dirName: string, runId: string): string {
  return `${dirName}/${RUNS_DIR}/${runId}`;
}

/** One input file of a run, as read from its snapshot. */
export interface RunInputFile {
  fileName: string;
  content: string | Uint8Array;
}

/**
 * The files a fresh run writes into its engine workdir.
 *
 * KOKKOS is opt-in per simulation (a `suffix kk` line in the input script,
 * see utils/kokkos.ts). Scripts that don't opt in get every text input
 * preprocessed so their styles run serially under the always-on `-sf kk`
 * module, and every text input gets the group-inspection hooks. Binary inputs
 * (restart files, .npy…) are written byte-exact. Returns null when the input
 * script is not among the inputs (or is not text).
 */
export function prepareEngineInputs(
  inputs: RunInputFile[],
  inputScript: string,
  useKokkos: boolean,
): {
  files: RunInputFile[];
  /** The input script as the user wrote it (plus an injected opt-in). */
  script: string;
  /** The input script as the engine runs it. */
  runScript: string;
} | null {
  const main = inputs.find((file) => file.fileName === inputScript);
  if (!main || typeof main.content !== "string") {
    return null;
  }
  const script = useKokkos ? injectKokkosOptIn(main.content) : main.content;
  const kokkos = scriptOptsIntoKokkos(script);
  const engineText = (content: string, isMainScript: boolean) =>
    prepareGroupInspection(
      kokkos
        ? content
        : prepareScriptForSerialStyles(content, { isMainScript }),
    );
  const files = inputs.map((file): RunInputFile => {
    if (file === main) {
      return { fileName: file.fileName, content: engineText(script, true) };
    }
    return typeof file.content === "string"
      ? { fileName: file.fileName, content: engineText(file.content, false) }
      : file;
  });
  return { files, script, runScript: engineText(script, true) };
}

/**
 * Builds a LAMMPS variable-injection script from a vars map, writes both the
 * vars file and the wrapper file into the engine workdir, and returns the
 * name of the script to execute (the input script itself without vars).
 */
export function prepareVarsScript(
  run: {
    workdirId: string;
    inputScript: string;
    vars?: Record<string, number>;
  },
  inputScriptContent: string,
  engine: Pick<LammpsWeb, "writeFile">,
): string {
  if (!run.vars || Object.keys(run.vars).length === 0) {
    return run.inputScript;
  }

  const varsScript =
    Object.entries(run.vars)
      .map(([name, value]) => `variable ${name} equal ${value}`)
      .join("\n") + "\n\n";

  const varsFileName = `_vars_${run.inputScript}`;
  engine.writeFile(`/${run.workdirId}/${varsFileName}`, varsScript);

  const wrapperScript = varsScript + inputScriptContent;
  const wrapperFileName = `_wrapper_${run.inputScript}`;
  engine.writeFile(`/${run.workdirId}/${wrapperFileName}`, wrapperScript);

  return wrapperFileName;
}

/** Post-run metrics for Simulation.Stop. */
export function collectRunMetrics(
  engine: Pick<LammpsWeb, "getTimesteps" | "getNumAtoms">,
  durationSeconds: number,
  computeNames: string[],
): {
  timesteps: number;
  timestepsPerSecond: string;
  numAtoms: number;
  computes: string[];
} {
  const timesteps = engine.getTimesteps();
  return {
    timesteps,
    timestepsPerSecond:
      durationSeconds > 0 ? (timesteps / durationSeconds).toFixed(3) : "0.000",
    numAtoms: engine.getNumAtoms(),
    computes: computeNames,
  };
}

/** Stop-button aborts settle with the cancel marker; any other message failed. */
export function stopReasonOf(errorMessage: string | undefined): StopReason {
  if (!errorMessage) {
    return "completed";
  }
  return errorMessage.includes(CANCEL_MESSAGE) ? "canceled" : "failed";
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface EngineResult {
  stopReason: StopReason;
  errorMessage?: string;
}

export class RunController {
  constructor(
    private readonly engine: LammpsWeb,
    private readonly host: RunHost,
  ) {}

  /**
   * Execute a claimed run end to end and persist its results. Never rejects
   * over the run itself (engine errors and crashes become a failed run); only
   * an unexpected storage error writing the final run.json propagates.
   */
  async execute(plan: RunPlan): Promise<RunOutcome> {
    const { engine, host } = this;
    const { storage, dirName } = plan;
    const runId = plan.meta.id;
    const runDir = `${RUNS_DIR}/${runId}`;
    const workdirId =
      plan.continuation?.workdirId ?? runWorkdirId(dirName, runId);
    // The engine wrote the snapshotted inputs into its FS itself — possibly
    // preprocessed (kokkos suffix rewriting) — so copying them back would
    // overwrite the pristine snapshot with mangled text and break run
    // provenance (ADR-001 §2). Only genuine outputs come back. (Trade-off: a
    // run that MODIFIES an input file in place keeps the authored version in
    // the snapshot — provenance wins.)
    const inputFiles = new Set(plan.meta.inputFiles ?? []);
    let storageFull = false;

    // Copy outputs out of the worker FS into the run directory. A quota error
    // fails the run with a clear reason and keeps what was copied.
    const copyOutputs = async (maxBytes?: number) => {
      if (!engine.snapshotWorkdir) {
        return;
      }
      try {
        const snapshot = await engine.snapshotWorkdir(
          `/${workdirId}`,
          maxBytes,
        );
        for (const file of snapshot.files) {
          if (RUN_INTERNAL_FILE.test(file.path) || inputFiles.has(file.path)) {
            continue;
          }
          await storage.write(
            dirName,
            `${runDir}/${file.path}`,
            bytesToWriteContent(file.path, file.bytes),
          );
        }
      } catch (error) {
        if (isQuotaExceededError(error)) {
          storageFull = true;
          host.notice(storageFullNotice(runId, plan.projectName));
          return;
        }
        host.notice(
          `Could not copy run outputs to storage: ${errorText(error)}`,
        );
      }
    };

    let result: EngineResult;
    const interval = setInterval(() => {
      void copyOutputs(MID_RUN_COPY_CAP);
    }, MID_RUN_COPY_INTERVAL_MS);
    try {
      result = await this.runInEngine(plan, workdirId);
    } catch (error) {
      // Unexpected (e.g. the snapshot could not be read): the run never ran.
      result = { stopReason: "failed", errorMessage: errorText(error) };
    } finally {
      clearInterval(interval);
    }

    await copyOutputs(undefined);
    // This wasm build streams LAMMPS output to stdout instead of writing a
    // log file; persist the captured console as the run's log.lammps
    // (ADR-003 §4.6 renders finished-run consoles from it). A log the engine
    // did write itself wins. The source is the UNCAPPED console, not the
    // display buffer (capped at 2000 lines): long runs must keep their header
    // and thermo columns.
    try {
      const logPath = `${runDir}/log.lammps`;
      const engineLog = await storage.stat(dirName, logPath);
      const fullLog = host.fullConsole();
      if (!engineLog && fullLog.length > 0) {
        await storage.write(dirName, logPath, fullLog.join("\n") + "\n");
      }
    } catch (error) {
      // The log is a convenience copy; never fail the run over it — unless
      // storage is full, in which case the outputs are incomplete too.
      storageFull ||= isQuotaExceededError(error);
    }

    const { stopReason, errorMessage } = result;
    const existing = await readRunMeta(storage, dirName, runId);
    let meta: RunMeta = {
      ...(existing ?? plan.meta),
      status: storageFull ? "failed" : stopReason,
      finishedAt: new Date().toISOString(),
      error: storageFull
        ? STORAGE_FULL_RUN_ERROR
        : stopReason === "failed"
          ? errorMessage
          : undefined,
      stats: {
        timesteps: engine.getTimesteps(),
        numAtoms: engine.getNumAtoms(),
        wallSeconds:
          (Date.now() - new Date(plan.meta.startedAt).getTime()) / 1000,
      },
    };
    try {
      await writeRunMeta(storage, dirName, meta);
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        throw error;
      }
      // Not even run.json fits: it stays "running" on disk until
      // reconcileRuns marks it interrupted; the caller's notice says why.
      storageFull = true;
      meta = { ...meta, status: "failed", error: STORAGE_FULL_RUN_ERROR };
    }

    const frame = storageFull ? null : await host.captureFrame();
    if (frame) {
      try {
        await storage.write(dirName, `${runDir}/.atomify/frame.png`, frame);
      } catch {
        // Frame capture is decorative; never fail the run over it.
      }
    }
    return { meta, storageFull, workdirId };
  }

  /** Load the run into the engine, run it, and settle the UI state. */
  private async runInEngine(
    plan: RunPlan,
    workdirId: string,
  ): Promise<EngineResult> {
    const { engine, host } = this;
    const workdir = `/${workdirId}`;
    if (engine.getIsRunning()) {
      return {
        stopReason: "failed",
        errorMessage: "The engine did not start this run.",
      };
    }
    // Metrics identity: the curated example id or the project dir name — the
    // Mixpanel dashboard breaks simulations down by it, so never a per-run
    // path (#395).
    const simulationId = plan.exampleId ?? plan.dirName;

    let scriptPath: string;
    let script: string | undefined;
    if (plan.continuation) {
      // Throws on an invalid step count (the projects layer validates first).
      const wrapper = continuationScript(plan.continuation.steps);
      host.setLastError(undefined);
      scriptPath = `${workdir}/${CONTINUE_WRAPPER}`;
      engine.writeFile(scriptPath, wrapper);
    } else {
      const inputs: RunInputFile[] = [];
      for (const fileName of plan.meta.inputFiles ?? []) {
        inputs.push({
          fileName,
          content: await plan.storage.read(
            plan.dirName,
            `${RUNS_DIR}/${plan.meta.id}/${fileName}`,
          ),
        });
      }
      host.setLastError(undefined);
      const prepared = prepareEngineInputs(
        inputs,
        plan.meta.inputScript,
        plan.useKokkos,
      );
      if (!prepared) {
        // Guard before Simulation.Start/time_event fire: an aborted run must
        // not leave an unmatched Start or a stale Stop timer that would be
        // charged to the next run.
        const message = `Input script ${plan.meta.inputScript} was not found among the simulation files.`;
        host.setLastError(message);
        return { stopReason: "failed", errorMessage: message };
      }
      host.beginFreshRun(workdirId);
      // mkdir -p in the engine FS: an existing directory is fine.
      engine.mkdir(workdir);
      // Dynamic bonds are per simulation; the script's `#/bond` directives
      // register them again below.
      engine.clearBondDistances();
      engine.setBuildNeighborlist(false);
      engine.chdir(workdir);
      for (const file of prepared.files) {
        engine.writeFile(`${workdir}/${file.fileName}`, file.content);
      }
      track("Simulation.New", { simulationId });
      // `start` resets LAMMPS for the new simulation (runFile itself starts
      // the run unpaused: the proxy owns run control).
      engine.start();
      script = prepared.script;
      scriptPath = `${workdir}/${prepareVarsScript(
        {
          workdirId,
          inputScript: plan.meta.inputScript,
          vars: plan.meta.vars,
        },
        prepared.runScript,
        engine,
      )}`;
    }

    host.setRunning(true);
    track("Simulation.Start", { simulationId });
    time_event("Simulation.Stop");

    let errorMessage: string | undefined;
    const startTime = performance.now();
    // Everything from here settles below, so a started run always stops.
    try {
      if (script) {
        host.applyAtomifyCommands(script);
      }
      // Stream the run's frames into the processing pipeline: the renderer
      // on every delivered frame, the status every Nth. Frames only arrive
      // while runFile is pending — the worker delivers a run's last frame
      // before it settles — so the listener is this run's alone. A paused
      // run still delivers the frame of the step it pauses at, so the
      // display matches the state it actually paused in.
      let cycle = 0;
      engine.setStepListener(() => {
        cycle += 1;
        // || covers settings persisted before the frequency existed.
        const every = host.uiUpdateFrequency() || DEFAULT_UI_UPDATE_FREQUENCY;
        const publish = cycle >= every;
        if (publish) {
          cycle = 0;
        }
        host.processFrame(publish);
      });
      await engine.runFile(scriptPath);
    } catch (exception: unknown) {
      console.log("Got exception: ", exception);
      if (typeof exception === "number") {
        errorMessage = engine.getExceptionMessage(exception);
      } else {
        // e.g. the proxy's "The simulation engine crashed: …" rejection.
        errorMessage = errorText(exception);
      }
      console.log("Got error running LAMMPS: ", errorMessage);
    } finally {
      engine.setStepListener(undefined);
    }
    if (!errorMessage) {
      errorMessage = engine.getErrorMessage();
    }

    const durationSeconds = (performance.now() - startTime) / 1000;
    const metrics = collectRunMetrics(
      engine,
      durationSeconds,
      host.computeNames(),
    );
    const stopReason = stopReasonOf(errorMessage);
    if (stopReason === "failed") {
      host.setLastError(errorMessage);
    } else {
      host.publishFinalFrame();
    }
    host.setRunning(false);
    // Metrics carry no errorMessage: it quotes script content.
    track("Simulation.Stop", { stopReason, ...metrics, simulationId });
    host.clearLastCommand();
    return { stopReason, errorMessage };
  }
}
