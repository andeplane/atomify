import { action, Action } from 'easy-peasy';
import {Particles, Bonds} from 'omovi'
import {AtomType} from '../utils/atomtypes'

interface ParticleStyle {
  index: number,
  atomType: AtomType
}

export interface RenderModel {
  particleStyles: AtomType[],
  particleStylesUpdated: boolean
  bondRadius: number
  particleRadius: number
  particles?: Particles
  bonds?: Bonds
  setParticles: Action<RenderModel, Particles>
  setBonds: Action<RenderModel, Bonds>
  setBondRadius: Action<RenderModel, number>
  setParticleRadius: Action<RenderModel, number>
  setParticleStylesUpdated: Action<RenderModel, boolean>
  resetParticleStyle: Action<RenderModel, void>
  addParticleStyle: Action<RenderModel, ParticleStyle>
}

export const renderModel: RenderModel = {
  particleStyles: [],
  particleStylesUpdated: true,
  bondRadius: 1,
  particleRadius: 1,
  addParticleStyle: action((state, value: ParticleStyle) => {
    const particleStyles = {...state.particleStyles}
    particleStyles[value.index] = value.atomType
    state.particleStyles = particleStyles
    state.particleStylesUpdated = true
  }),
  setParticles: action((state, value: Particles) => {
    state.particles = value
  }),
  setParticleStylesUpdated: action((state, value: boolean) => {
    state.particleStylesUpdated = value
  }),
  setBonds: action((state, value: Bonds) => {
    state.bonds = value
  }),
  setBondRadius: action((state, value: number) => {
    state.bondRadius = value
  }),
  setParticleRadius: action((state, value: number) => {
    state.particleRadius = value
  }),
  resetParticleStyle: action((state) => {
    console.log("Did reset")
    state.particleStyles = []
    state.particleStylesUpdated = true
  })
};
