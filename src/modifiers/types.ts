import { LammpsWeb } from "../types"
import {Particles, Bonds} from 'omovi'

export type ModifierInput = {
  wasm: any
  lammps: LammpsWeb
}

export type ModifierOutput = {
  particles: Particles
  bonds: Bonds
  colorsUpdated: boolean
}
