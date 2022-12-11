import { action, thunk, Action, Thunk } from 'easy-peasy';
import Modifier from '../modifiers/modifier'
import SyncParticlesModifier from '../modifiers/syncparticlesmodifier'
import SyncBondsModifier from '../modifiers/syncbondsmodifier'
import ColorModifier from '../modifiers/colormodifier'
import SyncComputesModifier from '../modifiers/synccomputesmodifier';
import { ModifierInput, ModifierOutput } from '../modifiers/types';
import { LammpsWeb } from '../types';
import * as THREE from 'three'
import SyncFixesModifier from '../modifiers/syncfixesmodifier';
import SyncVariablesModifier from '../modifiers/syncvariablesmodifier';

const cellMatrix = new THREE.Matrix3()
const origo = new THREE.Vector3()

const getSimulationBox = (lammps: LammpsWeb, wasm: any) => {
  const cellMatrixPointer = lammps.getCellMatrixPointer() / 8;
  const cellMatrixSubArray = wasm.HEAPF64.subarray(cellMatrixPointer, cellMatrixPointer + 9) as Float64Array
  cellMatrix.set(cellMatrixSubArray[0], cellMatrixSubArray[1], cellMatrixSubArray[2],
                 cellMatrixSubArray[3], cellMatrixSubArray[4], cellMatrixSubArray[5],
                 cellMatrixSubArray[6], cellMatrixSubArray[7], cellMatrixSubArray[8])
  return cellMatrix
}

const getSimulationOrigo = (lammps: LammpsWeb, wasm: any) => {
  const origoPointer = lammps.getOrigoPointer() / 8;
  const origoPointerSubArray = wasm.HEAPF64.subarray(origoPointer, origoPointer + 3) as Float64Array
  origo.set(origoPointerSubArray[0], origoPointerSubArray[1], origoPointerSubArray[2])
  return origo
}

export interface ProcessingModel {
  postTimestepModifiers: Modifier[]
  setPostTimestepModifiers: Action<ProcessingModel, Modifier[]>
  runPostTimestep: Thunk<ProcessingModel, boolean>
}

export const processingModel: ProcessingModel = {
  postTimestepModifiers: [
    new SyncParticlesModifier({
      name: 'Particles',
      active: true
    }),
    new SyncBondsModifier({
      name: 'Bonds',
      active: true
    }),
    new ColorModifier({
      name: 'Colors',
      active: true
    }),
    new SyncComputesModifier({
      name: 'Computes',
      active: true
    }),
    new SyncFixesModifier({
      name: 'Fixes',
      active: true
    }),
    new SyncVariablesModifier({
      name: 'Variables',
      active: true
    })
  ],
  setPostTimestepModifiers: action((state, value: Modifier[]) => {
    state.postTimestepModifiers = value
  }),
  runPostTimestep: thunk(async (actions, everything: boolean, {getStoreState, getStoreActions}) => {
    // @ts-ignore
    const wasm = window.wasm
    // @ts-ignore
    const lammps = getStoreState().simulation.lammps
    // @ts-ignore
    const renderState = getStoreState().render
    // @ts-ignore
    const computes = getStoreState().simulationStatus.computes
    // @ts-ignore
    const fixes = getStoreState().simulationStatus.fixes
    // @ts-ignore
    const variables = getStoreState().simulationStatus.variables
    // @ts-ignore
    const hasSynchronized = getStoreState().simulationStatus.hasSynchronized
    const particles = renderState.particles
    const bonds = renderState.bonds
    const allActions = getStoreActions() as any

    const modifierInput: ModifierInput = {
      lammps,
      wasm,
      renderState,
      variables,
      computes,
      fixes,
      hasSynchronized
    }
    
    const modifierOutput: ModifierOutput = {
      particles,
      bonds,
      // @ts-ignore
      colorsDirty: getStoreState().render.particleStylesUpdated,
      computes: {},
      fixes: {},
      variables: {},
    }
    // @ts-ignore
    getStoreState().processing.postTimestepModifiers.forEach(modifier => modifier.run(modifierInput, modifierOutput, true))
    allActions.render.setParticleStylesUpdated(false)

    allActions.simulationStatus.setComputes(modifierOutput.computes)
    allActions.simulationStatus.setFixes(modifierOutput.fixes)
    allActions.simulationStatus.setVariables(modifierOutput.variables)
    if (modifierOutput.bonds) {
      allActions.simulationStatus.setNumBonds(modifierOutput.bonds.count)
    } else {
      allActions.simulationStatus.setNumBonds(0)
    }

    // @ts-ignore
    if (everything || getStoreState().app.selectedMenu === 'view') {
      if (modifierOutput.particles !== particles) {
        allActions.render.setParticles(modifierOutput.particles)
      }
      if (modifierOutput.bonds !== bonds) {
        allActions.render.setBonds(modifierOutput.bonds)
      }
    }

    allActions.simulationStatus.setBox(getSimulationBox(lammps, wasm))
    allActions.simulationStatus.setOrigo(getSimulationOrigo(lammps, wasm))
    allActions.simulationStatus.setTimesteps(lammps.getTimesteps())
    allActions.simulationStatus.setNumAtoms(lammps.getNumAtoms())
    allActions.simulationStatus.setRunTimesteps(lammps.getRunTimesteps())
    allActions.simulationStatus.setRunTotalTimesteps(lammps.getRunTotalTimesteps())
    allActions.simulationStatus.setLastCommand(lammps.getLastCommand())
    
    const whichFlag = lammps.getWhichFlag()
    allActions.simulationStatus.setRunType(whichFlag===1 ? "Dynamics" : "Minimization")
    
    if (whichFlag !== 0) {
      // We are not allowed to ask for these values unless whichFlag is 0
      allActions.simulationStatus.setTimestepsPerSecond(lammps.getTimestepsPerSecond())
      allActions.simulationStatus.setRemainingTime(lammps.getCPURemain())
    }
  })
};