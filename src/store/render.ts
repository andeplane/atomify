import { action, Action } from 'easy-peasy';
import {Particles, Bonds} from 'omovi'

export interface RenderModel {
  particles?: Particles
  bonds?: Bonds
  setParticles: Action<RenderModel, Particles>
  setBonds: Action<RenderModel, Bonds>
}

export const renderModel: RenderModel = {
  setParticles: action((state, value: Particles) => {
    state.particles = value
  }),
  setBonds: action((state, value: Bonds) => {
    state.particles = value
  })
};
