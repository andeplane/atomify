import { action, Action } from "easy-peasy";
import { AtomType } from "../utils/atomtypes";
import { track } from "../utils/metrics";

interface ParticleStyle {
  index: number;
  atomType: AtomType;
}

/**
 * Render settings and styles. The visualizer and the rendered Particles and
 * Bonds themselves live in the EngineRegistry (engine/EngineRegistry.ts).
 */
export interface RenderModel {
  particleStyles: AtomType[];
  /** Colors and radii must be reapplied on the next frame. */
  particleStylesUpdated: boolean;
  bondRadius: number;
  particleRadius: number;
  /** Left-drag pans instead of rotating the camera (toggled with P). */
  panMode: boolean;
  setBondRadius: Action<RenderModel, number>;
  setParticleRadius: Action<RenderModel, number>;
  setPanMode: Action<RenderModel, boolean>;
  setParticleStylesUpdated: Action<RenderModel, boolean>;
  resetParticleStyles: Action<RenderModel, void>;
  addParticleStyle: Action<RenderModel, ParticleStyle>;
}

export const renderModel: RenderModel = {
  particleStyles: [],
  particleStylesUpdated: true,
  bondRadius: 1,
  particleRadius: 1,
  panMode: false,
  addParticleStyle: action((state, value: ParticleStyle) => {
    const particleStyles = [...state.particleStyles];
    particleStyles[value.index] = value.atomType;
    state.particleStyles = particleStyles;
    state.particleStylesUpdated = true;
  }),
  setParticleStylesUpdated: action((state, value: boolean) => {
    state.particleStylesUpdated = value;
  }),
  setBondRadius: action((state, value: number) => {
    track("Settings.Render.BondRadius", { value });
    state.bondRadius = value;
  }),
  setParticleRadius: action((state, value: number) => {
    track("Settings.Render.ParticleRadius", { value });
    state.particleRadius = value;
  }),
  setPanMode: action((state, value: boolean) => {
    state.panMode = value;
  }),
  resetParticleStyles: action((state) => {
    state.particleStyles = [];
    state.particleStylesUpdated = true;
  }),
};
