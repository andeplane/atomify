import { action, Action } from "easy-peasy";
import { Particles, Bonds, Visualizer } from "omovi";
import { AtomType } from "../utils/atomtypes";
import { track } from "../utils/metrics";

interface ParticleStyle {
  index: number;
  atomType: AtomType;
}

export interface RenderModel {
  particleStyles: AtomType[];
  particleStylesUpdated: boolean;
  bondRadius: number;
  visualizer?: Visualizer;
  particleRadius: number;
  particles?: Particles;
  bonds?: Bonds;
  setVisualizer: Action<RenderModel, Visualizer>;
  setParticles: Action<RenderModel, Particles>;
  setBonds: Action<RenderModel, Bonds>;
  setBondRadius: Action<RenderModel, number>;
  setParticleRadius: Action<RenderModel, number>;
  setParticleStylesUpdated: Action<RenderModel, boolean>;
  resetParticleStyles: Action<RenderModel, void>;
  addParticleStyle: Action<RenderModel, ParticleStyle>;
}

export const renderModel: RenderModel = {
  particleStyles: [],
  particleStylesUpdated: true,
  bondRadius: 1,
  particleRadius: 1,
  addParticleStyle: action((state, value: ParticleStyle) => {
    const particleStyles = { ...state.particleStyles };
    particleStyles[value.index] = value.atomType;
    state.particleStyles = particleStyles;
    state.particleStylesUpdated = true;
  }),
  setVisualizer: action((state, value: Visualizer) => {
    state.visualizer = value;
    state.particleStylesUpdated = true;
  }),
  setParticles: action((state, value: Particles) => {
    state.particles = value;
  }),
  setParticleStylesUpdated: action((state, value: boolean) => {
    state.particleStylesUpdated = value;
  }),
  setBonds: action((state, value: Bonds) => {
    state.bonds = value;
  }),
  setBondRadius: action((state, value: number) => {
    track("Settings.Render.BondRadius", { value });
    state.bondRadius = value;
  }),
  setParticleRadius: action((state, value: number) => {
    track("Settings.Render.ParticleRadius", { value });
    state.particleRadius = value;
  }),
  resetParticleStyles: action((state) => {
    if (state.particles) {
      state.particles.count = 0;
      state.particles.markNeedsUpdate();
    }
    if (state.bonds) {
      state.bonds.count = 0;
      state.bonds.markNeedsUpdate();
    }
    state.particleStyles = [];
    state.particleStylesUpdated = true;
  }),
};
