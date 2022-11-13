import { LammpsWeb } from "../types"
import {Particles, Bonds} from 'omovi'
import {Compute, Fix} from '../types'

export type ModifierInput = {
  wasm: any
  lammps: LammpsWeb
  renderState: any
  computes: {[key: string]: Compute}
  fixes: {[key: string]: Fix}
  hasSynchronized: boolean
}

export type ModifierOutput = {
  particles: Particles
  bonds: Bonds
  colorsDirty: boolean
  computes: {[key: string]: Compute}
  fixes: {[key: string]: Fix}
}
