import { action, Action, thunk, Thunk, Actions, State } from "easy-peasy";
import { StoreModel } from "./model";
import { LammpsWeb } from "../types";
import { AtomTypes, AtomType, hexToRgb } from "../utils/atomtypes";
import * as THREE from "three";
import {
  parseCameraPosition,
  parseCameraTarget,
  parseAtomType,
  parseBond,
  parseAtomSizeAndColor,
} from "../utils/parsers";

// The full console of the active run, outside the store: state.lammpsOutput
// is a DISPLAY buffer capped at the last 2000 lines, but run persistence
// (runs/<id>/log.lammps, engine/RunController.ts) needs the whole log — a
// capped source would silently drop the header and thermo columns of long
// runs.
// Reset with resetLammpsOutput (every run start), appended with every
// addLammpsOutput.
let fullLammpsOutput: string[] = [];

/** The uncapped console captured since the last resetLammpsOutput. */
export function getFullLammpsOutput(): readonly string[] {
  return fullLammpsOutput;
}

export interface SimulationModel {
  running: boolean;
  /**
   * Engine workdir (`<dirName>/runs/<runId>`) of the last fresh run: the run
   * whose state the engine holds. Set by the run pipeline (RunController) as
   * it loads a run; a continuation keeps its parent's.
   */
  loadedWorkdir?: string;
  lammpsOutput: string[];
  cameraPosition?: THREE.Vector3;
  cameraTarget?: THREE.Vector3;
  resetLammpsOutput: Action<SimulationModel, void>;
  addLammpsOutput: Action<SimulationModel, string>;
  /**
   * Pause or resume the active run. Run control lives on the engine proxy
   * (LammpsWorkerProxy); this only forwards to it — read the state back with
   * `lammps.isPaused()`.
   */
  setPaused: Thunk<SimulationModel, boolean, unknown, StoreModel>;
  setCameraPosition: Action<SimulationModel, THREE.Vector3 | undefined>;
  setCameraTarget: Action<SimulationModel, THREE.Vector3 | undefined>;
  setLoadedWorkdir: Action<SimulationModel, string | undefined>;
  setRunning: Action<SimulationModel, boolean>;
  setLammps: Action<SimulationModel, LammpsWeb>;
  extractAndApplyAtomifyCommands: Thunk<SimulationModel, string>;
  lammps?: LammpsWeb;
  lastError?: string;
  lastWarning?: string;
  setLastError: Action<SimulationModel, string | undefined>;
  setLastWarning: Action<SimulationModel, string | undefined>;
}

export const simulationModel: SimulationModel = {
  running: false,
  lammpsOutput: [],
  resetLammpsOutput: action((state) => {
    state.lammpsOutput = [];
    fullLammpsOutput = [];
  }),
  addLammpsOutput: action((state, output: string) => {
    // Display cap only — the uncapped copy feeds run persistence.
    state.lammpsOutput = [...state.lammpsOutput, output].slice(-2000);
    fullLammpsOutput.push(output);
  }),
  setPaused: thunk((_actions, paused: boolean, { getState }) => {
    getState().lammps?.setPaused(paused);
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
  setLoadedWorkdir: action((state, workdirId: string | undefined) => {
    state.loadedWorkdir = workdirId;
  }),
  setRunning: action((state, running: boolean) => {
    state.running = running;
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
  setLastError: action((state, error: string | undefined) => {
    state.lastError = error;
  }),
  setLastWarning: action((state, warning: string | undefined) => {
    state.lastWarning = warning;
  }),
};
