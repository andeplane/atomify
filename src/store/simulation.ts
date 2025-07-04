import { action, Action, thunk, Thunk } from "easy-peasy";
import { LammpsWeb } from "../types";
import { notification } from "antd";
import { AtomTypes, AtomType, hexToRgb } from "../utils/atomtypes";
import AnalyzeNotebook from "../utils/AnalyzeNotebook";
import { track, time_event } from "../utils/metrics";
import * as THREE from "three";
import localforage from "localforage";
import ColorModifier from "../modifiers/colormodifier";
import { SimulationFile } from "./app";

localforage.config({
  driver: localforage.INDEXEDDB,
  name: "JupyterLite Storage",
  storeName: "files", // Should be alphanumeric, with underscores.
  description: "some description",
});
//@ts-ignore
window.localforage = localforage;
const parseCameraPosition = (line: string) => {
  const splitted = line.split(" ");
  if (
    splitted[0] === "camera" &&
    splitted[1] === "position" &&
    splitted.length === 5
  ) {
    const x = parseFloat(splitted[2]);
    const y = parseFloat(splitted[3]);
    const z = parseFloat(splitted[4]);
    return new THREE.Vector3(x, y, z);
  }
};

const parseCameraTarget = (line: string) => {
  const splitted = line.split(" ");
  if (
    splitted[0] === "camera" &&
    splitted[1] === "target" &&
    splitted.length === 5
  ) {
    const x = parseFloat(splitted[2]);
    const y = parseFloat(splitted[3]);
    const z = parseFloat(splitted[4]);
    return new THREE.Vector3(x, y, z);
  }
};

const parseAtomType = (line: string) => {
  const regex = /^(?:atom)(?:\s*|\t*)(\d*)(?:\s*|\t*)(\w*)$/;
  const matches = line.match(regex);
  if (matches) {
    return {
      atomType: parseInt(matches[1]),
      atomName: matches[2],
    };
  }
};

const parseBond = (line: string) => {
  const regex =
    /^(?:bond)(?:\s*|\t*)(\d*)(?:\s*|\t*)(\d*)(?:\s*|\t*)(\d*.\d*)$/;
  const matches = line.match(regex);
  if (matches) {
    return {
      atomType1: parseInt(matches[1]),
      atomType2: parseInt(matches[2]),
      distance: parseFloat(matches[3]),
    };
  }
};

const parseAtomSizeAndColor = (line: string) => {
  const regex =
    /^(?:atom)(?:\s*|\t*)(\d*)(?:\s*|\t*)(\d*.\d*)(?:\s*|\t*)(#[0-9a-fA-F]{6,6})$/;
  const matches = line.match(regex);
  if (matches) {
    return {
      atomTypeIndex: parseInt(matches[1]),
      radius: parseFloat(matches[2]),
      color: matches[3],
    };
  }
};

export interface Simulation {
  id: string;
  files: SimulationFile[];
  inputScript: string;
  analysisDescription?: string;
  analysisScript?: string;
  start: boolean;
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
  syncFilesJupyterLite: Thunk<SimulationModel, undefined>;
  run: Thunk<SimulationModel>;
  newSimulation: Thunk<SimulationModel, Simulation>;
  lammps?: LammpsWeb;
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
    state.lammpsOutput = [...state.lammpsOutput, output];
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
  // @ts-ignore
  extractAndApplyAtomifyCommands: thunk(
    (actions, inputScript: string, { getStoreActions, getStoreState }) => {
      const lines = inputScript.split("\n");

      // @ts-ignore
      const wasm = window.wasm;
      // @ts-ignore
      const lammps = getStoreState().simulation.lammps;

      // Reset all settings for dynamic bonds
      const bondsDistanceMapPointer = lammps.getBondsDistanceMapPointer() / 4;
      const bondsDistanceMapSubarray = wasm.HEAPF32.subarray(
        bondsDistanceMapPointer,
        bondsDistanceMapPointer + 10000,
      ) as Float32Array;

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
              // @ts-ignore
              getStoreActions().render.addParticleStyle({
                index: parsedAtomType.atomType,
                atomType: atomType,
              });
            } else {
              notification.warn({
                message: `Atom type '${parsedAtomType.atomName}' does not exist. Ignoring setting radius and color.`,
              });
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
            // @ts-ignore
            getStoreActions().render.addParticleStyle({
              index: atomSizeAndColor.atomTypeIndex,
              atomType: atomType,
            });
          }
          const bond = parseBond(line);
          if (bond) {
            // we map the 2D coordinate into 1D
            bondsDistanceMapSubarray[100 * bond.atomType1 + bond.atomType2] =
              bond.distance;
            bondsDistanceMapSubarray[100 * bond.atomType2 + bond.atomType1] =
              bond.distance;
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
    async (actions, fileName: string | undefined, { getStoreState }) => {
      //@ts-ignore
      const simulation = getStoreState().simulation.simulation as Simulation;
      if (!simulation) {
        return;
      }

      // @ts-ignore
      const wasm = window.wasm;
      for (const file of simulation.files) {
        // Update all files if no fileName is specified
        if (file.fileName === fileName || !fileName) {
          wasm.FS.writeFile(`/${simulation.id}/${file.fileName}`, file.content);
        }
      }
    },
  ),
  syncFilesJupyterLite: thunk(
    async (actions, dummy: undefined, { getStoreState }) => {
      // TODO: deal with the undefined hack
      //@ts-ignore
      const simulation = getStoreState().simulation.simulation as Simulation;
      if (!simulation) {
        return;
      }
      // @ts-ignore
      const wasm = window.wasm;
      const fileNames: string[] = wasm.FS.readdir(`/${simulation.id}`);
      const files: { [key: string]: SimulationFile } = {};
      fileNames.forEach((fileName: string) => {
        if ([".", ".."].includes(fileName)) {
          return;
        }

        const filePath = `/${simulation.id}/${fileName}`;
        files[fileName] = {
          content: wasm.FS.readFile(filePath, { encoding: "utf8" }),
          fileName,
          url: "", // TODO: Deal with this hack
        };
      });

      type JupyterFileType = "directory" | "file" | "notebook";

      const createLocalForageObject = (
        name: string,
        path: string,
        type: JupyterFileType,
        content?: string | Object,
      ) => {
        let mimetype = "text/plain";
        let format = "text";
        let size = 0;
        const now = new Date().toISOString();

        if (
          type === "directory" ||
          type === "notebook" ||
          typeof content === "object"
        ) {
          mimetype = "application/json";
          format = "json";
        }

        if (content) {
          if (typeof content === "string") {
            size = content.length;
          } else {
            size = JSON.stringify(content).length;
          }
        }

        return {
          name,
          path,
          last_modified: now,
          created: now, // TODO(keep created date if it exists)
          format,
          mimetype: mimetype,
          content: content ? content : [],
          size,
          writable: true,
          type,
        };
      };

      // Add an example analysis file
      const analyzeFileName = "analyze.ipynb";
      localforage.setItem(
        analyzeFileName,
        createLocalForageObject(
          analyzeFileName,
          analyzeFileName,
          "notebook",
          AnalyzeNotebook(simulation),
        ),
      );

      await localforage.setItem(
        simulation.id,
        createLocalForageObject(simulation.id, simulation.id, "directory"),
      );
      for (const file of Object.values(files)) {
        let type: JupyterFileType = "file";
        let content: any = file.content;
        const filePath = `${simulation.id}/${file.fileName}`;

        if (file.fileName.endsWith("ipynb")) {
          type = "notebook";
          content = JSON.parse(content);
          const existingNotebook = await localforage.getItem(filePath);
          if (existingNotebook) {
            // We don't want to overwrite the content of the notebook
            continue;
          }
        }
        await localforage.setItem(
          filePath,
          createLocalForageObject(file.fileName, filePath, type, content),
        );
      }
    },
  ),
  run: thunk(async (actions, payload, { getStoreState, getStoreActions }) => {
    // @ts-ignore
    const simulation = getStoreState().simulation.simulation as Simulation;
    if (!simulation) {
      return;
    }
    // @ts-ignore
    const lammps = getStoreState().simulation.lammps as LammpsWeb;
    if (!lammps || lammps.getIsRunning()) {
      return;
    }

    // @ts-ignore
    const allActions = getStoreActions() as any;

    allActions.render.resetParticleStyles();
    allActions.simulationStatus.reset();
    actions.setShowConsole(false);
    actions.resetLammpsOutput();

    await actions.syncFilesWasm(undefined);

    lammps.start();
    actions.setRunning(true);
    track("Simulation.Start", { simulationId: simulation?.id });
    time_event("Simulation.Stop");

    const inputScriptFile = simulation.files.filter(
      (file) => file.fileName === simulation.inputScript,
    )[0];
    if (inputScriptFile.content) {
      actions.extractAndApplyAtomifyCommands(inputScriptFile.content);
    }

    let errorMessage: string | undefined = undefined;
    const startTime = performance.now();
    try {
      await lammps.runFile(`/${simulation.id}/${simulation.inputScript}`);
    } catch (exception: any) {
      console.log("Got exception: ", exception);
      errorMessage = lammps.getExceptionMessage(exception);
      console.log("Got error running LAMMPS: ", errorMessage);
    }

    if (!errorMessage) {
      errorMessage = lammps.getErrorMessage();
    }

    // @ts-ignore
    const computes = getStoreState().simulationStatus.computes as Compute[];

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // seconds
    const metricsData = {
      timesteps: lammps.getTimesteps(),
      timestepsPerSecond: (lammps.getTimesteps() / duration).toFixed(3),
      numAtoms: lammps.getNumAtoms(),
      computes: Object.keys(computes),
    };
    actions.setPaused(false);

    if (errorMessage) {
      if (errorMessage.includes("Atomify::canceled")) {
        allActions.processing.runPostTimestep(true);
        // Simulation got canceled.
        actions.setRunning(false);
        actions.setShowConsole(true);
        track("Simulation.Stop", {
          simulationId: simulation?.id,
          stopReason: "canceled",
          ...metricsData,
        });
      } else {
        notification.error({
          message: errorMessage,
          duration: 5,
        });
        actions.setRunning(false);
        actions.setShowConsole(true);
        track("Simulation.Stop", {
          simulationId: simulation?.id,
          stopReason: "failed",
          errorMessage,
          ...metricsData,
        });
      }
    } else {
      allActions.processing.runPostTimestep(true);
      actions.setRunning(false);
      actions.setShowConsole(true);
      track("Simulation.Stop", {
        simulationId: simulation?.id,
        stopReason: "completed",
        ...metricsData,
      });
    }
    actions.syncFilesJupyterLite();
    allActions.simulationStatus.setLastCommand(undefined);
  }),
  newSimulation: thunk(
    async (
      actions,
      simulation: Simulation,
      { getStoreState, getStoreActions },
    ) => {
      // @ts-ignore
      const allActions = getStoreActions() as any;

      // @ts-ignore
      window.simulation = simulation;
      allActions.simulationStatus.reset();
      actions.setShowConsole(false);
      // We will set the simulation after applying potential localStorage modifications below

      // Reset potentially chosen per atom coloring
      const postTimestepModifiers =
        // @ts-ignore
        getStoreState().processing.postTimestepModifiers;
      const colorModifier = postTimestepModifiers.filter(
        (modifier: any) => modifier.name === "Colors",
      )[0] as ColorModifier;
      if (colorModifier) {
        colorModifier.computeName = undefined;
      }

      // @ts-ignore
      getStoreActions().render.resetParticleStyles();

      // @ts-ignore
      const wasm = window.wasm;
      // @ts-ignore
      const lammps = getStoreState().simulation.lammps;

      if (!wasm.FS.analyzePath(`/${simulation.id}`).exists) {
        wasm.FS.mkdir(`/${simulation.id}`);
      }

      // Reset all settings for dynamic bonds
      const bondsDistanceMapPointer = lammps.getBondsDistanceMapPointer() / 4;
      const bondsDistanceMapSubarray = wasm.HEAPF32.subarray(
        bondsDistanceMapPointer,
        bondsDistanceMapPointer + 10000,
      ) as Float32Array;
      bondsDistanceMapSubarray.fill(0);
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
            const content = await response.text();
            file.content = content;
          } else {
            notification.error({
              message: `Could not download ${file.fileName}. URL is missing.`,
            });
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

      const newSimulationObj = { ...simulation } as Simulation; // ensure we can mutate safely
      // Store the original (unmodified) file contents the first time we load this simulation
      try {
        const originalKey = `simulationOriginal_${newSimulationObj.id}`;
        if (localStorage && !localStorage.getItem(originalKey)) {
          const originalFiles: { [key: string]: string } = {};
          newSimulationObj.files.forEach((file) => {
            originalFiles[file.fileName] = file.content;
          });
          localStorage.setItem(originalKey, JSON.stringify(originalFiles));
        }

        // Apply any saved edits from localStorage if they exist
        const editsKey = `simulationEdits_${newSimulationObj.id}`;
        const editsStr = localStorage ? localStorage.getItem(editsKey) : null;
        if (editsStr) {
          const edits: { [key: string]: string } = JSON.parse(editsStr);
          newSimulationObj.files.forEach((file) => {
            const editedContent = edits[file.fileName];
            if (editedContent !== undefined) {
              file.content = editedContent;
            }
          });
        }
      } catch (e) {
        // If localStorage is not available or fails for some reason, we silently ignore persistence
        console.warn("Could not access localStorage to load/save simulation edits", e);
      }

      actions.setSimulation(newSimulationObj);
      wasm.FS.chdir(`/${simulation.id}`);
      await allActions.app.setStatus(undefined);
      if (simulation.start) {
        actions.run();
      } else {
        const inputScriptFile = simulation.files.filter(
          (file) => file.fileName === simulation.inputScript,
        )[0];
        allActions.app.setSelectedFile(inputScriptFile);
      }
      track("Simulation.New", { simulationId: simulation?.id });
    },
  ),
  reset: action((state) => {
    state.files = [];
    state.lammps = undefined;
  }),
};
