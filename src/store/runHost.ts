/**
 * The store's side of the run pipeline: a RunHost (engine/RunController.ts)
 * over the easy-peasy store, built by the projects model for every run.
 */

import type { Actions, State } from "easy-peasy";
import type { RunHost } from "../engine/RunController";
import ColorModifier from "../modifiers/colormodifier";
import type { StoreModel } from "./model";
import { getFullLammpsOutput } from "./simulation";

export function createStoreRunHost(
  getState: () => State<StoreModel>,
  getActions: () => Actions<StoreModel>,
): RunHost {
  // The processing thunks are async; a rejection (e.g. the engine gone) must
  // surface in the console, not as an unhandled rejection.
  const settle = (work: unknown, what: string) =>
    void Promise.resolve(work).catch((error) =>
      console.error(`${what} failed:`, error),
    );

  return {
    beginFreshRun(workdirId) {
      const actions = getActions();
      actions.simulationStatus.reset();
      actions.simulation.resetLammpsOutput();
      actions.simulation.setLoadedWorkdir(workdirId);
      // A per-atom coloring belongs to the previous run's computes.
      const colorModifier = getState().processing.postTimestepModifiers.find(
        (modifier) => modifier instanceof ColorModifier,
      ) as ColorModifier | undefined;
      if (colorModifier) {
        colorModifier.computeName = undefined;
      }
      actions.render.resetParticleStyles();
    },
    applyAtomifyCommands(script) {
      getActions().simulation.extractAndApplyAtomifyCommands(script);
    },
    setRunning(running) {
      getActions().simulation.setRunning(running);
    },
    setLastError(message) {
      getActions().simulation.setLastError(message);
    },
    processFrame(publish) {
      const actions = getActions();
      actions.simulationStatus.setHasSynchronized(true);
      // 3D rendering on every frame; the full pipeline (status snapshot,
      // computes, plots) only when publishing.
      settle(actions.processing.runPostTimestepRendering(), "Frame rendering");
      if (publish) {
        settle(
          actions.processing.runPostTimestep(false),
          "Post-timestep processing",
        );
      }
    },
    publishFinalFrame() {
      settle(
        getActions().processing.runPostTimestep(true),
        "Post-timestep processing",
      );
    },
    uiUpdateFrequency() {
      return getState().settings.simulation.uiUpdateFrequency;
    },
    computeNames() {
      return Object.keys(getState().simulationStatus.computes);
    },
    clearLastCommand() {
      getActions().simulationStatus.setLastCommand(undefined);
    },
    notice(message) {
      getActions().projects.setNotice(message);
    },
    fullConsole: getFullLammpsOutput,
    captureFrame: captureViewport,
  };
}

/** Best-effort viewport capture for `frame.png` (ADR-003 §2). */
async function captureViewport(): Promise<Uint8Array | null> {
  try {
    // Only the simulation viewport (the container View renders the
    // visualizer into) counts. A bare `canvas` query would grab whatever
    // canvas happens to be first — Monaco's minimap, a notebook chart —
    // once the user navigates away and View unmounts.
    const canvas = document.querySelector<HTMLCanvasElement>(
      "#canvas-container canvas",
    );
    if (!canvas || canvas.width === 0) {
      return null;
    }
    // The visualizer renders in its own rAF loop and WebGL drawing buffers
    // (preserveDrawingBuffer: false) are invalidated after compositing.
    // Waiting two frames and reading the pixels synchronously right after the
    // rAF callback — before this frame composites — captures real pixels
    // instead of a black frame. toDataURL is used over toBlob because it is
    // synchronous: toBlob's callback lands after compositing.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    if (!base64) {
      return null;
    }
    const binary = atob(base64);
    if (binary.length < 200) {
      // Empty/cleared buffers compress to nearly nothing; skip those.
      return null;
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}
