import { LammpsWeb } from "../types"
import {Particles, Bonds, Visualizer} from 'omovi'

export type ModifierInput = {
  wasm: any
  lammps: LammpsWeb
}

export type ModifierOutput = {
  particles: Particles
  bonds: Bonds
  visualizer: Visualizer
}