import { action, Action } from 'easy-peasy';
import {Particles, Bonds} from 'omovi'

export interface RenderModel {
  bondRadius: number
  particles?: Particles
  bonds?: Bonds
  setParticles: Action<RenderModel, Particles>
  setBonds: Action<RenderModel, Bonds>
  setBondRadius: Action<RenderModel, number>
}

export const renderModel: RenderModel = {
  bondRadius: 1,
  setParticles: action((state, value: Particles) => {
    state.particles = value
  }),
  setBonds: action((state, value: Bonds) => {
    state.bonds = value
  }),
  setBondRadius: action((state, value: number) => {
    state.bondRadius = value
  })
};