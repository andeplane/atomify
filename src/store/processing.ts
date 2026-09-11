import { action, thunk, Action, Thunk, State, Actions } from "easy-peasy";
import Modifier from "../modifiers/modifier";
import SyncParticlesModifier from "../modifiers/syncparticlesmodifier";
import SyncBondsModifier from "../modifiers/syncbondsmodifier";
import ColorModifier from "../modifiers/colormodifier";
import SyncComputesModifier from "../modifiers/synccomputesmodifier";
import { ModifierInput, ModifierOutput } from "../modifiers/types";
import { LammpsWeb, Wall } from "../types";
import { AtomifyWasmModule } from "../wasm/types";
import { getWasm } from "../wasm/wasmInstance";
import * as THREE from "three";
import SyncFixesModifier from "../modifiers/syncfixesmodifier";
import SyncVariablesModifier from "../modifiers/syncvariablesmodifier";
import { StoreModel } from "./model";
import type { SimulationStatusData } from "./simulationstatus";

const getSimulationBox = (
  lammps: LammpsWeb,
  wasm: AtomifyWasmModule,
  currentBox?: THREE.Matrix3,
) => {
  // lammps.js exposes the box as float32 (the old wasm used float64)
  const cellMatrixPointer = lammps.getCellMatrixPointer() / 4;
  const cellMatrixSubArray = wasm.HEAPF32.subarray(
    cellMatrixPointer,
    cellMatrixPointer + 9,
  ) as Float32Array;

  // Check if values changed
  if (currentBox) {
    const elements = currentBox.elements;
    let areEqual = true;
    for (let i = 0; i < 9; i++) {
      // THREE stores column-major elements; the engine sends row-major.
      const columnMajorIndex = (i % 3) * 3 + Math.floor(i / 3);
      if (elements[columnMajorIndex] !== cellMatrixSubArray[i]) {
        areEqual = false;
        break;
      }
    }
    if (areEqual) {
      // No change, return existing reference
      return currentBox;
    }
  }

  // Values changed, return new Matrix3
  return new THREE.Matrix3().set(
    cellMatrixSubArray[0],
    cellMatrixSubArray[1],
    cellMatrixSubArray[2],
    cellMatrixSubArray[3],
    cellMatrixSubArray[4],
    cellMatrixSubArray[5],
    cellMatrixSubArray[6],
    cellMatrixSubArray[7],
    cellMatrixSubArray[8],
  );
};

const getSimulationOrigo = (
  lammps: LammpsWeb,
  wasm: AtomifyWasmModule,
  currentOrigo?: THREE.Vector3,
) => {
  // lammps.js exposes the box origin as float32 (the old wasm used float64)
  const origoPointer = lammps.getOrigoPointer() / 4;
  const origoPointerSubArray = wasm.HEAPF32.subarray(
    origoPointer,
    origoPointer + 3,
  ) as Float32Array;

  // Check if values changed
  if (currentOrigo) {
    if (
      currentOrigo.x === origoPointerSubArray[0] &&
      currentOrigo.y === origoPointerSubArray[1] &&
      currentOrigo.z === origoPointerSubArray[2]
    ) {
      // No change, return existing reference
      return currentOrigo;
    }
  }

  // Values changed, return new Vector3
  return new THREE.Vector3(
    origoPointerSubArray[0],
    origoPointerSubArray[1],
    origoPointerSubArray[2],
  );
};

const getModifierContext = (
  getStoreState: () => State<StoreModel>,
  getStoreActions: () => Actions<StoreModel>,
) => {
  const wasm = getWasm();
  const lammps = getStoreState().simulation.lammps;
  if (!lammps) {
    throw new Error("Lammps instance is not initialized");
  }
  const renderState = getStoreState().render;
  const computes = getStoreState().simulationStatus.computes;
  const fixes = getStoreState().simulationStatus.fixes;
  const variables = getStoreState().simulationStatus.variables;
  const hasSynchronized = getStoreState().simulationStatus.hasSynchronized;
  const particles = renderState.particles;
  const bonds = renderState.bonds;
  const allActions = getStoreActions();

  const modifierInput: ModifierInput = {
    lammps,
    wasm,
    renderState,
    variables,
    computes,
    fixes,
    hasSynchronized,
  };

  const modifierOutput: ModifierOutput = {
    particles,
    bonds,
    colorsDirty: getStoreState().render.particleStylesUpdated,
    computes: {},
    fixes: {},
    variables: {},
  };

  return {
    modifierInput,
    modifierOutput,
    allActions,
    particles,
    bonds,
    lammps,
    wasm,
  };
};

export interface ProcessingModel {
  postTimestepModifiers: Modifier[];
  setPostTimestepModifiers: Action<ProcessingModel, Modifier[]>;
  runPostTimestep: Thunk<ProcessingModel, boolean, undefined, StoreModel>;
  runPostTimestepRendering: Thunk<ProcessingModel, void, undefined, StoreModel>;
}

export const processingModel: ProcessingModel = {
  postTimestepModifiers: [
    new SyncParticlesModifier({
      name: "Particles",
      active: true,
    }),
    new SyncBondsModifier({
      name: "Bonds",
      active: true,
    }),
    new ColorModifier({
      name: "Colors",
      active: true,
    }),
    new SyncComputesModifier({
      name: "Computes",
      active: true,
    }),
    new SyncFixesModifier({
      name: "Fixes",
      active: true,
    }),
    new SyncVariablesModifier({
      name: "Variables",
      active: true,
    }),
  ],
  setPostTimestepModifiers: action((state, value: Modifier[]) => {
    state.postTimestepModifiers = value;
  }),
  runPostTimestep: thunk(
    async (
      actions,
      everything: boolean,
      { getStoreState, getStoreActions },
    ) => {
      const {
        modifierInput,
        modifierOutput,
        allActions,
        particles,
        bonds,
        lammps,
        wasm,
      } = getModifierContext(getStoreState, getStoreActions);

      getStoreState().processing.postTimestepModifiers.forEach((modifier) =>
        modifier.run(modifierInput, modifierOutput, true),
      );
      allActions.render.setParticleStylesUpdated(false);

      if (everything || getStoreState().app.selectedMenu === "view") {
        if (
          modifierOutput.particles &&
          modifierOutput.particles !== particles
        ) {
          allActions.render.setParticles(modifierOutput.particles);
        }
        if (modifierOutput.bonds && modifierOutput.bonds !== bonds) {
          allActions.render.setBonds(modifierOutput.bonds);
        }
      }

      const currentStatus = getStoreState().simulationStatus;
      const snapshot: Partial<SimulationStatusData> = {
        computes: modifierOutput.computes,
        fixes: modifierOutput.fixes,
        variables: modifierOutput.variables,
        numBonds: modifierOutput.bonds?.count ?? 0,
        box: getSimulationBox(lammps, wasm, currentStatus.box),
        origo: getSimulationOrigo(lammps, wasm, currentStatus.origo),
        dimension: lammps.getDimension(),
        timesteps: lammps.getTimesteps(),
        numAtoms: lammps.getNumAtoms(),
        runTimesteps: lammps.getRunTimesteps(),
        runTotalTimesteps: lammps.getRunTotalTimesteps(),
        lastCommand: lammps.getLastCommand(),
        memoryUsage: lammps.getMemoryUsage(),
      };
      const wallsArray = lammps.getWalls();
      const walls: Wall[] = [];
      for (let i = 0; i < wallsArray.size(); i++) {
        const wall = wallsArray.get(i);
        walls.push({
          which: wall.which,
          style: wall.style,
          position: wall.position,
          cutoff: wall.cutoff,
        });
      }
      wallsArray.delete();
      snapshot.walls = walls;
      // Timings are only meaningful during dynamics/minimization. Preserve
      // the last estimate at idle, matching the existing summary behavior.
      const whichFlag = lammps.getWhichFlag();
      snapshot.runType =
        whichFlag === 1 ? "Dynamics" : whichFlag === 2 ? "Minimization" : "";
      if (whichFlag !== 0) {
        snapshot.timestepsPerSecond = lammps.getTimestepsPerSecond();
        snapshot.remainingTime = lammps.getCPURemain();
      }
      // One notification gives every summary subscriber a coherent frame,
      // instead of rerunning selectors for each individual field.
      allActions.simulationStatus.setSnapshot(snapshot);
    },
  ),
  runPostTimestepRendering: thunk(
    async (actions, payload: void, { getStoreState, getStoreActions }) => {
      const { modifierInput, modifierOutput, allActions, particles, bonds } =
        getModifierContext(getStoreState, getStoreActions);

      // Only run rendering-related modifiers (Particles, Bonds, Colors)
      const renderingModifiers =
        getStoreState().processing.postTimestepModifiers.filter(
          (modifier: Modifier) =>
            modifier instanceof SyncParticlesModifier ||
            modifier instanceof SyncBondsModifier ||
            modifier instanceof ColorModifier,
        ) as Modifier[];

      renderingModifiers.forEach((modifier: Modifier) =>
        modifier.run(modifierInput, modifierOutput, true),
      );
      allActions.render.setParticleStylesUpdated(false);

      // Only update rendering state, skip UI state updates
      if (getStoreState().app.selectedMenu === "view") {
        if (
          modifierOutput.particles &&
          modifierOutput.particles !== particles
        ) {
          allActions.render.setParticles(modifierOutput.particles);
        }
        if (modifierOutput.bonds && modifierOutput.bonds !== bonds) {
          allActions.render.setBonds(modifierOutput.bonds);
        }
      }
    },
  ),
};
