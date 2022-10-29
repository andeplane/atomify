import { LammpsWeb } from "../types"
import {Particles, Bonds} from 'omovi'
import {Compute, Fix} from '../types'

export type ModifierInput = {
  wasm: any
  lammps: LammpsWeb
  renderState: any
  computes: Compute[]
  fixes: Fix[]
}

export type ModifierOutput = {
  particles: Particles
  bonds: Bonds
  colorsUpdated: boolean
}
