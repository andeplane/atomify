import { thunk, Thunk, State, Actions } from "easy-peasy";
import Modifier from "../modifiers/modifier";
import SyncParticlesModifier from "../modifiers/syncparticlesmodifier";
import SyncBondsModifier from "../modifiers/syncbondsmodifier";
import ColorModifier from "../modifiers/colormodifier";
import { ModifierInput, ModifierOutput } from "../modifiers/types";
import { Wall } from "../types";
import * as THREE from "three";
import type { EngineRegistry } from "../engine/EngineRegistry";
import { StoreModel } from "./model";
import { realParticleCount } from "../modifiers/periodicImages";
import type { StoreInjections } from "./projects";
import type { SimulationStatusData } from "./simulationstatus";

const getSimulationBox = (
  // The frame's 9 float32 row-major cell matrix (lammps.js exposes the box
  // as float32; the old wasm used float64).
  cellMatrix: Float32Array,
  currentBox?: THREE.Matrix3,
) => {
  // Check if values changed
  if (currentBox) {
    const elements = currentBox.elements;
    let areEqual = true;
    for (let i = 0; i < 9; i++) {
      // THREE stores column-major elements; the engine sends row-major.
      const columnMajorIndex = (i % 3) * 3 + Math.floor(i / 3);
      if (elements[columnMajorIndex] !== cellMatrix[i]) {
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
    cellMatrix[0],
    cellMatrix[1],
    cellMatrix[2],
    cellMatrix[3],
    cellMatrix[4],
    cellMatrix[5],
    cellMatrix[6],
    cellMatrix[7],
    cellMatrix[8],
  );
};

const getSimulationOrigo = (
  // The frame's 3 float32 box origin.
  origin: Float32Array,
  currentOrigo?: THREE.Vector3,
) => {
  // Check if values changed
  if (currentOrigo) {
    if (
      currentOrigo.x === origin[0] &&
      currentOrigo.y === origin[1] &&
      currentOrigo.z === origin[2]
    ) {
      // No change, return existing reference
      return currentOrigo;
    }
  }

  // Values changed, return new Vector3
  return new THREE.Vector3(origin[0], origin[1], origin[2]);
};

const getModifierContext = (
  getStoreState: () => State<StoreModel>,
  getStoreActions: () => Actions<StoreModel>,
  engine: EngineRegistry,
) => {
  const lammps = engine.lammps;
  if (!lammps) {
    throw new Error("Lammps instance is not initialized");
  }
  // One frame for the whole pass, so every modifier sees the same step.
  const frame = lammps.latestFrame;
  const computes = getStoreState().simulationStatus.computes;
  const fixes = getStoreState().simulationStatus.fixes;
  const variables = getStoreState().simulationStatus.variables;
  const hasSynchronized = getStoreState().simulationStatus.hasSynchronized;
  const { particleStyles, particleStylesUpdated, bondRadius, particleRadius } =
    getStoreState().render;
  const { visualizer, particles, bonds } = engine;
  const allActions = getStoreActions();

  const modifierInput: ModifierInput = {
    frame,
    lammps,
    // The store's render settings with the registry's live render objects.
    renderState: {
      particleStyles,
      particleStylesUpdated,
      bondRadius,
      particleRadius,
      visualizer,
      particles,
      bonds,
    },
    variables,
    computes,
    fixes,
    hasSynchronized,
  };

  const modifierOutput: ModifierOutput = {
    particles,
    bonds,
    colorsDirty: particleStylesUpdated,
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
    frame,
  };
};

/**
 * The post-timestep pipeline over the EngineRegistry's modifiers (the
 * registry comes in as the store's `engine` injection). The modifier
 * instances, particles and bonds are the registry's; the store receives the
 * status snapshot.
 */
export interface ProcessingModel {
  runPostTimestep: Thunk<ProcessingModel, boolean, StoreInjections, StoreModel>;
  runPostTimestepRendering: Thunk<
    ProcessingModel,
    void,
    StoreInjections,
    StoreModel
  >;
}

export const processingModel: ProcessingModel = {
  runPostTimestep: thunk(
    async (
      actions,
      everything: boolean,
      { getStoreState, getStoreActions, injections: { engine } },
    ) => {
      const {
        modifierInput,
        modifierOutput,
        allActions,
        particles,
        bonds,
        lammps,
        frame,
      } = getModifierContext(getStoreState, getStoreActions, engine);

      engine.modifiers.forEach((modifier) =>
        modifier.run(modifierInput, modifierOutput, true),
      );
      allActions.render.setParticleStylesUpdated(false);

      if (everything || getStoreState().app.liveViewportVisible) {
        if (
          modifierOutput.particles &&
          modifierOutput.particles !== particles
        ) {
          engine.setParticles(modifierOutput.particles);
        }
        if (modifierOutput.bonds && modifierOutput.bonds !== bonds) {
          engine.setBonds(modifierOutput.bonds);
        }
      }

      const currentStatus = getStoreState().simulationStatus;
      const snapshot: Partial<SimulationStatusData> = {
        computes: modifierOutput.computes,
        fixes: modifierOutput.fixes,
        variables: modifierOutput.variables,
        numBonds: realParticleCount(
          modifierOutput.bonds?.count ?? 0,
          modifierOutput.imageShifts,
        ),
        box: getSimulationBox(frame.boxMatrix, currentStatus.box),
        origo: getSimulationOrigo(frame.origin, currentStatus.origo),
        dimension: frame.dimension,
        unitStyle: frame.unitStyle,
        timesteps: lammps.getTimesteps(),
        numAtoms: lammps.getNumAtoms(),
        runTimesteps: lammps.getRunTimesteps(),
        runTotalTimesteps: lammps.getRunTotalTimesteps(),
        lastCommand: lammps.getLastCommand(),
        memoryUsage: lammps.getMemoryUsage(),
      };
      snapshot.walls = frame.walls.map((wall): Wall => ({
        which: wall.which,
        style: wall.style,
        position: wall.position,
        cutoff: wall.cutoff,
      }));
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
    async (
      actions,
      payload: void,
      { getStoreState, getStoreActions, injections: { engine } },
    ) => {
      const { modifierInput, modifierOutput, allActions, particles, bonds } =
        getModifierContext(getStoreState, getStoreActions, engine);

      // Only run rendering-related modifiers (Particles, Bonds, Colors)
      const renderingModifiers = engine.modifiers.filter(
        (modifier: Modifier) =>
          modifier instanceof SyncParticlesModifier ||
          modifier instanceof SyncBondsModifier ||
          modifier instanceof ColorModifier,
      );

      renderingModifiers.forEach((modifier: Modifier) =>
        modifier.run(modifierInput, modifierOutput, true),
      );
      allActions.render.setParticleStylesUpdated(false);

      // Only update rendering state, skip UI state updates
      if (getStoreState().app.liveViewportVisible) {
        if (
          modifierOutput.particles &&
          modifierOutput.particles !== particles
        ) {
          engine.setParticles(modifierOutput.particles);
        }
        if (modifierOutput.bonds && modifierOutput.bonds !== bonds) {
          engine.setBonds(modifierOutput.bonds);
        }
      }
    },
  ),
};
