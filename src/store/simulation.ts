import { action, Action, thunk, Thunk, Actions, State } from "easy-peasy";
import { StoreModel } from "./model";
import { LammpsWeb } from "../types";
import { AtomTypes, AtomType, hexToRgb } from "../utils/atomtypes";
import { track, time_event } from "../utils/metrics";
import {
  scriptOptsIntoKokkos,
  prepareScriptForSerialStyles,
} from "../utils/kokkos";
import * as THREE from "three";
import ColorModifier from "../modifiers/colormodifier";
import Modifier from "../modifiers/modifier";
import { SimulationFile } from "./app";
import {
  parseCameraPosition,
  parseCameraTarget,
  parseAtomType,
  parseBond,
  parseAtomSizeAndColor,
} from "../utils/parsers";
import { getWasm } from "../wasm/wasmInstance";

/**
 * Builds a LAMMPS variable-injection script from a vars map, writes
 * both the vars file and the wrapper file to the WASM filesystem,
 * and returns the script filename that should be executed.
 */
export function prepareVarsScript(
  simulation: Pick<Simulation, "id" | "inputScript" | "vars">,
  inputScriptContent: string,
  wasm: { FS: { writeFile(path: string, data: string): void } },
): string {
  if (!simulation.vars || Object.keys(simulation.vars).length === 0) {
    return simulation.inputScript;
  }

  const varsScript =
    Object.entries(simulation.vars)
      .map(([name, value]) => `variable ${name} equal ${value}`)
      .join("\n") + "\n\n";

  const varsFileName = `_vars_${simulation.inputScript}`;
  wasm.FS.writeFile(`/${simulation.id}/${varsFileName}`, varsScript);

  const wrapperScript = varsScript + inputScriptContent;
  const wrapperFileName = `_wrapper_${simulation.inputScript}`;
  wasm.FS.writeFile(`/${simulation.id}/${wrapperFileName}`, wrapperScript);

  return wrapperFileName;
}

/**
 * Collects post-run metrics from LAMMPS and computes state.
 */
export function collectRunMetrics(
  lammps: Pick<LammpsWeb, "getTimesteps" | "getNumAtoms">,
  durationSeconds: number,
  computeNames: string[],
): {
  timesteps: number;
  timestepsPerSecond: string;
  numAtoms: number;
  computes: string[];
} {
  const timesteps = lammps.getTimesteps();
  return {
    timesteps,
    timestepsPerSecond:
      durationSeconds > 0 ? (timesteps / durationSeconds).toFixed(3) : "0.000",
    numAtoms: lammps.getNumAtoms(),
    computes: computeNames,
  };
}

export type StopReason = "canceled" | "failed" | "completed";

export interface RunResultContext {
  errorMessage: string | undefined;
  simulationId: string;
  metricsData: {
    timesteps: number;
    timestepsPerSecond: string;
    numAtoms: number;
    computes: string[];
  };
  actions: {
    setRunning: (running: boolean) => void;
    setShowConsole: (show: boolean) => void;
    setLastError: (error: string | undefined) => void;
  };
  allActions: {
    processing: { runPostTimestep: (value: boolean) => void };
  };
}

/**
 * Routes a run result to the appropriate canceled / failed / completed path,
 * fires side-effects (error state, tracking), and returns the stop reason.
 */
export function handleRunResult(ctx: RunResultContext): StopReason {
  const { errorMessage, simulationId, metricsData, actions, allActions } = ctx;

  // runPostTimestep is a thunk (returns a promise); a rejection (e.g. wasm
  // gone) must surface in the console, not as an unhandled rejection.
  const runPostTimestep = () =>
    void Promise.resolve(allActions.processing.runPostTimestep(true)).catch(
      (error) => console.error("Post-timestep processing failed:", error),
    );

  if (errorMessage) {
    if (errorMessage.includes("Atomify::canceled")) {
      runPostTimestep();
      actions.setRunning(false);
      actions.setShowConsole(true);
      track("Simulation.Stop", {
        simulationId,
        stopReason: "canceled",
        ...metricsData,
      });
      return "canceled";
    } else {
      actions.setLastError(errorMessage);
      actions.setRunning(false);
      actions.setShowConsole(true);
      track("Simulation.Stop", {
        simulationId,
        stopReason: "failed",
        errorMessage,
        ...metricsData,
      });
      return "failed";
    }
  } else {
    runPostTimestep();
    actions.setRunning(false);
    actions.setShowConsole(true);
    track("Simulation.Stop", {
      simulationId,
      stopReason: "completed",
      ...metricsData,
    });
    return "completed";
  }
}

export interface Simulation {
  id: string;
  files: SimulationFile[];
  inputScript: string;
  analysisDescription?: string;
  analysisScript?: string;
  start: boolean;
  vars?: Record<string, number>;
}

export interface SimulationModel {
  running: boolean;
  paused: boolean;
  showConsole: boolean;
  simulation?: Simulation;
  files: string[];
  lammpsOutput: string[];
  cameraPosition?: THREE.Vector3;
  cameraTarget?: THREE.Vector3;
  resetLammpsOutput: Action<SimulationModel, void>;
  addLammpsOutput: Action<SimulationModel, string>;
  setShowConsole: Action<SimulationModel, boolean>;
  setPaused: Action<SimulationModel, boolean>;
  setCameraPosition: Action<SimulationModel, THREE.Vector3 | undefined>;
  setCameraTarget: Action<SimulationModel, THREE.Vector3 | undefined>;
  setSimulation: Action<SimulationModel, Simulation>;
  setRunning: Action<SimulationModel, boolean>;
  setFiles: Action<SimulationModel, string[]>;
  setLammps: Action<SimulationModel, LammpsWeb>;
  extractAndApplyAtomifyCommands: Thunk<SimulationModel, string>;
  syncFilesWasm: Thunk<SimulationModel, string | undefined>;
  run: Thunk<
    SimulationModel,
    undefined | void,
    unknown,
    StoreModel,
    Promise<
      { stopReason: StopReason; errorMessage: string | undefined } | undefined
    >
  >;
  newSimulation: Thunk<SimulationModel, Simulation>;
  lammps?: LammpsWeb;
  lastError?: string;
  lastWarning?: string;
  setLastError: Action<SimulationModel, string | undefined>;
  setLastWarning: Action<SimulationModel, string | undefined>;
  reset: Action<SimulationModel, undefined>;
}

export const simulationModel: SimulationModel = {
  running: false,
  paused: false,
  showConsole: false,
  files: [],
  lammpsOutput: [],
  resetLammpsOutput: action((state) => {
    state.lammpsOutput = [];
  }),
  addLammpsOutput: action((state, output: string) => {
    state.lammpsOutput = [...state.lammpsOutput, output].slice(-2000);
  }),
  setShowConsole: action((state, showConsole: boolean) => {
    state.showConsole = showConsole;
  }),
  setPaused: action((state, value: boolean) => {
    state.paused = value;
  }),
  setCameraPosition: action((state, cameraPosition: THREE.Vector3) => {
    state.cameraPosition = cameraPosition;
  }),
  setCameraTarget: action((state, cameraTarget: THREE.Vector3) => {
    state.cameraTarget = cameraTarget;
  }),
  setLammps: action((state, lammps: LammpsWeb) => {
    state.lammps = lammps;
  }),
  setSimulation: action((state, simulation: Simulation) => {
    state.simulation = simulation;
  }),
  setRunning: action((state, running: boolean) => {
    state.running = running;
  }),
  setFiles: action((state, files: string[]) => {
    state.files = files;
  }),
  extractAndApplyAtomifyCommands: thunk(
    (
      actions,
      inputScript: string,
      {
        getStoreActions,
        getStoreState,
      }: {
        getStoreActions: () => Actions<StoreModel>;
        getStoreState: () => State<StoreModel>;
      },
    ) => {
      const lines = inputScript.split("\n");

      const lammps = getStoreState().simulation.lammps;
      if (!lammps) {
        return;
      }

      lines.forEach((line) => {
        line = line.trim();
        if (line.startsWith("#/")) {
          // This is an atomify command
          line = line.substring(2);
          const parsedAtomType = parseAtomType(line);
          if (parsedAtomType) {
            const atomType: AtomType | undefined = AtomTypes.filter(
              (at) => at.fullname === parsedAtomType.atomName,
            )[0];

            if (atomType) {
              (
                getStoreActions() as Actions<StoreModel>
              ).render.addParticleStyle({
                index: parsedAtomType.atomType,
                atomType: atomType,
              });
            } else {
              actions.setLastWarning(
                `Atom type '${parsedAtomType.atomName}' does not exist. Ignoring setting radius and color.`,
              );
            }
          }
          const atomSizeAndColor = parseAtomSizeAndColor(line);
          if (atomSizeAndColor) {
            const atomType: AtomType = {
              color: new THREE.Color(...hexToRgb(atomSizeAndColor.color)),
              radius: atomSizeAndColor.radius,
              shortname: atomSizeAndColor.atomTypeIndex.toString(),
              fullname: atomSizeAndColor.atomTypeIndex.toString(),
            };
            (getStoreActions() as Actions<StoreModel>).render.addParticleStyle({
              index: atomSizeAndColor.atomTypeIndex,
              atomType: atomType,
            });
          }
          const bond = parseBond(line);
          if (bond) {
            lammps.setBondDistance(
              bond.atomType1,
              bond.atomType2,
              bond.distance,
            );
            lammps.setBuildNeighborlist(true);
          }
          const cameraPosition = parseCameraPosition(line);
          if (cameraPosition) {
            actions.setCameraPosition(cameraPosition);
          }
          const cameraTarget = parseCameraTarget(line);
          if (cameraTarget) {
            actions.setCameraTarget(cameraTarget);
          }
        }
      });
    },
  ),
  syncFilesWasm: thunk(
    async (
      actions,
      fileName: string | undefined,
      { getStoreState }: { getStoreState: () => State<StoreModel> },
    ) => {
      const simulation = getStoreState().simulation.simulation;
      if (!simulation) {
        return;
      }

      const wasm = getWasm();
      // KOKKOS is opt-in per simulation (a `suffix kk` line in the input
      // script). Non-opted simulations get their command files preprocessed at
      // write time so their styles run serially under the always-on `-sf kk`
      // module; the store/editor keep the original text. See utils/kokkos.ts.
      const inputContent =
        simulation.files.find((f) => f.fileName === simulation.inputScript)
          ?.content ?? "";
      const kokkosOptIn = scriptOptsIntoKokkos(inputContent);
      for (const file of simulation.files) {
        // Update all files if no fileName is specified
        if ((file.fileName === fileName || !fileName) && file.content) {
          const content = kokkosOptIn
            ? file.content
            : prepareScriptForSerialStyles(file.content, {
                isMainScript: file.fileName === simulation.inputScript,
              });
          wasm.FS.writeFile(`/${simulation.id}/${file.fileName}`, content);
        }
      }
    },
  ),
  run: thunk(
    async (
      actions,
      payload,
      {
        getStoreState,
        getStoreActions,
      }: {
        getStoreState: () => State<StoreModel>;
        getStoreActions: () => Actions<StoreModel>;
      },
    ) => {
      const simulation = getStoreState().simulation.simulation;
      if (!simulation) {
        return;
      }
      const lammps = getStoreState().simulation.lammps;
      if (!lammps || lammps.getIsRunning()) {
        return;
      }

      const allActions = getStoreActions() as Actions<StoreModel>;

      allActions.render.resetParticleStyles();
      allActions.simulationStatus.reset();
      actions.setShowConsole(false);
      actions.resetLammpsOutput();

      await actions.syncFilesWasm(undefined);

      lammps.start();
      actions.setRunning(true);
      track("Simulation.Start", {
        simulationId: simulation?.id,
      });
      time_event("Simulation.Stop");

      const inputScriptFile = simulation.files.find(
        (file) => file.fileName === simulation.inputScript,
      );
      if (!inputScriptFile) {
        actions.setLastError(
          `Input script ${simulation.inputScript} was not found among the simulation files.`,
        );
        actions.setRunning(false);
        return;
      }
      if (inputScriptFile.content) {
        actions.extractAndApplyAtomifyCommands(inputScriptFile.content);
      }

      // Inject URL variables and determine script to run. Must feed
      // prepareVarsScript the same (possibly serial-preprocessed) content that
      // syncFilesWasm wrote, so the vars-wrapper path matches the direct path.
      const wasm = getWasm();
      const rawContent = inputScriptFile.content ?? "";
      const runContent = scriptOptsIntoKokkos(rawContent)
        ? rawContent
        : prepareScriptForSerialStyles(rawContent, { isMainScript: true });
      const scriptToRun = prepareVarsScript(simulation, runContent, wasm);

      let errorMessage: string | undefined = undefined;
      const startTime = performance.now();
      try {
        await lammps.runFile(`/${simulation.id}/${scriptToRun}`);
      } catch (exception: unknown) {
        console.log("Got exception: ", exception);
        if (typeof exception === "number") {
          errorMessage = lammps.getExceptionMessage(exception);
        } else {
          errorMessage = String(exception);
        }
        console.log("Got error running LAMMPS: ", errorMessage);
      }

      if (!errorMessage) {
        errorMessage = lammps.getErrorMessage();
      }

      const computes = getStoreState().simulationStatus.computes;
      const endTime = performance.now();
      const durationSeconds = (endTime - startTime) / 1000;
      const metricsData = collectRunMetrics(
        lammps,
        durationSeconds,
        Object.keys(computes),
      );
      actions.setPaused(false);

      const stopReason = handleRunResult({
        errorMessage,
        simulationId: simulation.id,
        metricsData,
        actions,
        allActions,
      });
      allActions.simulationStatus.setLastCommand(undefined);
      // Callers orchestrating project runs (store/projects.ts) record this
      // outcome in the run's metadata.
      return { stopReason, errorMessage };
    },
  ),
  newSimulation: thunk(
    async (
      actions,
      simulation: Simulation,
      {
        getStoreState,
        getStoreActions,
      }: {
        getStoreState: () => State<StoreModel>;
        getStoreActions: () => Actions<StoreModel>;
      },
    ) => {
      const allActions = getStoreActions() as Actions<StoreModel>;

      allActions.simulationStatus.reset();
      actions.setShowConsole(false);
      actions.setSimulation(simulation);
      actions.resetLammpsOutput();

      // Reset potentially chosen per atom coloring
      const postTimestepModifiers =
        getStoreState().processing.postTimestepModifiers;
      const colorModifier = postTimestepModifiers.find(
        (modifier: Modifier) => modifier instanceof ColorModifier,
      ) as ColorModifier | undefined;
      if (colorModifier) {
        colorModifier.computeName = undefined;
      }

      (getStoreActions() as Actions<StoreModel>).render.resetParticleStyles();

      const wasm = getWasm();
      const lammps = getStoreState().simulation.lammps;
      if (!lammps) {
        throw new Error("Lammps instance is not initialized");
      }

      if (!wasm.FS.analyzePath(`/${simulation.id}`).exists) {
        wasm.FS.mkdir(`/${simulation.id}`);
      }

      // Reset all settings for dynamic bonds
      lammps.clearBondDistances();
      lammps.setBuildNeighborlist(false);

      let counter = 0;
      for (const file of simulation.files) {
        await allActions.app.setStatus({
          title: `Downloading file (${counter + 1}/${simulation.files.length})`,
          text: file.fileName,
          progress: 0.2 + (0.8 * counter) / simulation.files.length,
        });

        if (!file.content) {
          if (file.url) {
            const response = await fetch(file.url);
            if (!response.ok) {
              actions.setLastError(
                `Could not download ${file.fileName} (HTTP ${response.status}).`,
              );
              return;
            }
            const content = await response.text();
            file.content = content;
          } else {
            actions.setLastError(
              `Could not download ${file.fileName}. URL is missing.`,
            );
            return;
          }
        }
        counter += 1;
      }
      await allActions.app.setStatus({
        title: `Uploading files to VM ...`,
        text: "",
        progress: 0.9,
      });

      actions.setSimulation(simulation); // Set it again now that files are updated
      wasm.FS.chdir(`/${simulation.id}`);

      await allActions.app.setStatus(undefined);
      if (simulation.start) {
        actions.run();
      } else {
        const inputScriptFile = simulation.files.find(
          (file) => file.fileName === simulation.inputScript,
        );
        if (inputScriptFile) {
          allActions.app.setSelectedFile(inputScriptFile);
        }
      }
      track("Simulation.New", { simulationId: simulation?.id });
    },
  ),
  setLastError: action((state, error: string | undefined) => {
    state.lastError = error;
  }),
  setLastWarning: action((state, warning: string | undefined) => {
    state.lastWarning = warning;
  }),
  reset: action((state) => {
    state.files = [];
    state.lammps = undefined;
  }),
};
