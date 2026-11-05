/**
 * Run orchestration: the run queue (single runs and sweeps), run deletion,
 * and the executor that claims a run directory with its snapshot and initial
 * run.json, hands the run to the run pipeline (engine/RunController.ts),
 * keeps the resident run a continuation needs, and advances the queue.
 */

import { thunk, State } from "easy-peasy";
import type { StoreModel } from "../model";
import { createStoreRunHost } from "../runHost";
import { RunController, storageFullNotice } from "../../engine/RunController";
import type { RunMeta } from "../../storage";
import {
  allocateRunDir,
  readRunMeta,
  RUNS_DIR,
  snapshotWorkingTree,
  writeRunMeta,
} from "../../storage";
import {
  continuationScript,
  validContinuationSteps,
} from "../../utils/continuation";
import { track } from "../../utils/metrics";
import { storageFor } from "./helpers";
import type { ProjectsModel, RunRequest } from "./types";

export const runThunks: Pick<
  ProjectsModel,
  "startRuns" | "cancelQueuedRuns" | "deleteRun" | "executeNextRun"
> = {
  startRuns: thunk(async (actions, requests, { getState }) => {
    const active = getState().active;
    if (!active || requests.length === 0) {
      return;
    }
    const sweepId =
      requests.length > 1
        ? `sweep-${Math.random().toString(36).slice(2, 8)}`
        : undefined;
    if (sweepId) {
      // varCount = variables actually swept (taking >1 distinct value).
      const values = new Map<string, Set<number>>();
      for (const request of requests) {
        for (const [name, value] of Object.entries(request.vars)) {
          const set = values.get(name) ?? new Set<number>();
          set.add(value);
          values.set(name, set);
        }
      }
      track("Sweep.Create", {
        varCount: [...values.values()].filter((set) => set.size > 1).length,
        runCount: requests.length,
      });
    }
    const queue: RunRequest[] = requests.map((request) => ({
      ...request,
      dirName: active.meta.dirName,
      quick: active.quick,
      sweepId,
      exampleId:
        active.meta.source?.type === "example"
          ? active.meta.source.exampleId
          : undefined,
    }));
    actions.setRunQueue([...getState().runQueue, ...queue]);
    await actions.executeNextRun();
  }),

  cancelQueuedRuns: thunk((actions) => {
    actions.setRunQueue([]);
  }),

  deleteRun: thunk(async (actions, runId, { getState, injections }) => {
    const active = getState().active;
    if (!active) {
      return;
    }
    const activeRun = getState().activeRun;
    if (activeRun && activeRun.runId === runId) {
      actions.setNotice("This run is in progress — stop it first.");
      return;
    }
    await storageFor(injections, active.quick).remove(
      active.meta.dirName,
      `${RUNS_DIR}/${runId}`,
    );
    await actions.refreshActive();
  }),

  executeNextRun: thunk(async (actions, _, helpers) => {
    const { getState, getStoreState, getStoreActions, injections } = helpers;
    if (getState().activeRun) {
      return;
    }
    const request = getState().runQueue[0];
    if (!request) {
      return;
    }
    actions.shiftRunQueue();
    // Claim the executor slot SYNCHRONOUSLY (no await since the guard above):
    // a concurrent executeNextRun (double-click Run, queue advance racing a
    // new startRuns) must see activeRun set, or two engines' worth of state
    // fight over one wasm instance and one run-NNN id.
    actions.setActiveRun({
      dirName: request.dirName,
      runId: "pending",
      quick: request.quick,
    });

    const storage = storageFor(injections, request.quick);
    const lammps = injections.engine.lammps;
    if (!lammps) {
      actions.setNotice("The simulation engine is still loading.");
      actions.setRunQueue([]);
      actions.setActiveRun(undefined);
      return;
    }

    const resident = getState().residentRun;
    const loadedWorkdir = (getStoreState() as State<StoreModel>).simulation
      .loadedWorkdir;
    const continuation = request.continueFrom;
    if (
      continuation &&
      (!validContinuationSteps(continuation.steps) ||
        !resident ||
        resident.dirName !== request.dirName ||
        resident.quick !== request.quick ||
        resident.runId !== continuation.runId ||
        loadedWorkdir !== resident.workdirId ||
        lammps.getIsRunning() ||
        lammps.getNumAtoms() === 0)
    ) {
      actions.setNotice(
        "This run is no longer loaded in the engine. Run it again before continuing.",
      );
      actions.setActiveRun(undefined);
      actions.setRunQueue([]);
      return;
    }
    const sourceRunId = continuation?.runId ?? request.replayOf;
    const parentMeta = sourceRunId
      ? await readRunMeta(storage, request.dirName, sourceRunId)
      : null;
    if (
      sourceRunId &&
      (parentMeta?.status !== "completed" ||
        parentMeta.viewOnly ||
        (request.replayOf && !parentMeta.inputFiles))
    ) {
      actions.setNotice("Only a completed simulation can be continued.");
      actions.setActiveRun(undefined);
      actions.setRunQueue([]);
      return;
    }
    const startTimestep = continuation ? lammps.getTimesteps() : undefined;
    actions.setResidentRun(undefined);
    await actions.flushPendingSaves();

    // 1. Claim the run directory and snapshot the working tree (ADR-001 §5).
    const runId = await allocateRunDir(storage, request.dirName);
    // Record the real run id immediately: reconcileRuns (window focus, tab
    // clicks) builds its owned set from activeRun.runId, and the snapshot
    // below can take seconds — "pending" would leave run-NNN unowned and
    // zombie-marked mid-claim.
    actions.setActiveRun({
      dirName: request.dirName,
      runId,
      quick: request.quick,
    });
    let copied: string[], gaps: RunMeta["snapshotGaps"];
    let inputScript = request.inputScript;
    let vars = request.vars;
    if (sourceRunId && parentMeta) {
      copied = [
        ...(continuation ? resident!.inputFiles : parentMeta.inputFiles!),
      ];
      gaps = parentMeta.snapshotGaps;
      vars = parentMeta.vars ?? {};
      // Copy the parent inputs, never today's working tree. Outputs continue
      // in the resident worker directory and are copied only into the child.
      for (const path of copied) {
        await storage.write(
          request.dirName,
          `${RUNS_DIR}/${runId}/${path}`,
          await storage.read(
            request.dirName,
            `${RUNS_DIR}/${sourceRunId}/${path}`,
          ),
        );
      }
      inputScript = parentMeta.inputScript;
      if (continuation) {
        const parentInput = await storage.read(
          request.dirName,
          `${RUNS_DIR}/${continuation.runId}/${parentMeta.inputScript}`,
        );
        if (typeof parentInput !== "string")
          throw new Error("The parent input script is not text.");
        inputScript = `in.continue-${runId}`;
        while (copied.includes(inputScript)) inputScript = `_${inputScript}`;
        await storage.write(
          request.dirName,
          `${RUNS_DIR}/${runId}/${inputScript}`,
          `${parentInput}\n# Additional steps after ${continuation.runId}\n${continuationScript(continuation.steps)}`,
        );
        copied.push(inputScript);
      }
    } else {
      ({ copied, gaps } = await snapshotWorkingTree(
        storage,
        request.dirName,
        runId,
      ));
    }
    let runMeta: RunMeta = {
      ...(request.viewOnly ? { viewOnly: true } : {}),
      schemaVersion: 1,
      id: runId,
      inputScript,
      vars: Object.keys(vars).length ? vars : undefined,
      continuationOf: continuation?.runId,
      replayOf: request.replayOf,
      inputFiles: copied,
      continuedFromTimestep: startTimestep,
      sweepId: request.sweepId,
      status: "running",
      startedAt: new Date().toISOString(),
      snapshotGaps: gaps && gaps.length ? gaps : undefined,
      origin: request.sweepId ? "sweep" : "app",
    };
    await writeRunMeta(storage, request.dirName, runMeta);
    track("Run.Start", {
      origin: request.sweepId ? "sweep" : (request.origin ?? "button"),
      kokkos: request.useKokkos,
      hasVars: Object.keys(request.vars).length > 0,
      exampleId: request.exampleId,
    });
    actions.setScreen({
      name: "project",
      dirName: request.dirName,
      tab: "runs",
      runId,
    });
    await actions.refreshActive();

    // 2. Everything from loading the snapshot into the engine to the final
    //    run.json and frame.png is the run pipeline's (RunController).
    const projectName =
      getState().projects.find((p) => p.dirName === request.dirName)
        ?.displayName ?? request.dirName;
    const outcome = await new RunController(
      lammps,
      createStoreRunHost(getStoreState, getStoreActions, injections.engine),
    ).execute({
      storage,
      dirName: request.dirName,
      meta: runMeta,
      useKokkos: request.useKokkos,
      continuation:
        continuation && resident
          ? { workdirId: resident.workdirId, steps: continuation.steps }
          : undefined,
      exampleId: request.exampleId,
      projectName,
    });
    const { storageFull, workdirId } = outcome;
    runMeta = outcome.meta;
    track("Run.Finish", {
      status: runMeta.status,
      wallSeconds: runMeta.stats?.wallSeconds,
      timesteps: runMeta.stats?.timesteps,
      exampleId: request.exampleId,
    });

    if (
      runMeta.status === "completed" &&
      !runMeta.viewOnly &&
      lammps.getNumAtoms() > 0
    ) {
      actions.setResidentRun({
        dirName: request.dirName,
        runId,
        quick: request.quick,
        workdirId,
        inputFiles: copied,
      });
    }
    actions.setActiveRun(undefined);
    await actions.refreshActive();
    const state = getState();
    if (storageFull) {
      // Queued sweep runs would hit the same wall; stop them here.
      actions.setRunQueue([]);
      actions.setNotice(storageFullNotice(runId, projectName));
    } else if (
      state.screen.name !== "project" ||
      state.screen.runId !== runId
    ) {
      actions.setNotice(
        `Run #${runId.replace(/^run-0*/, "")} ${runMeta.status}.`,
      );
    }
    if ((getStoreState() as State<StoreModel>).simulation.running) {
      // Defensive: the store still reports a run after the pipeline settled.
      return;
    }
    // 3. Advance the sweep queue.
    await actions.executeNextRun();
  }),
};
