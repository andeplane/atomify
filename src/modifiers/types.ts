import { LammpsWeb } from "../types";
import { Particles, Bonds } from "omovi";
import { Compute, Fix, Variable } from "../types";
import type { EngineFrame } from "../wasm/engineFrame";
import type { RenderModel } from "../store/render";
import type { EngineObjects } from "../engine/EngineRegistry";

/** The store's render settings plus the registry's live render objects. */
type RenderState = Pick<
  RenderModel,
  "particleStyles" | "particleStylesUpdated" | "bondRadius" | "particleRadius"
> &
  Pick<EngineObjects, "visualizer" | "particles" | "bonds">;

export type ModifierInput = {
  /** The engine's latest streamed step; modifiers read its arrays in place. */
  frame: EngineFrame;
  lammps: LammpsWeb;
  renderState: RenderState;
  hasSynchronized: boolean;
  computes: { [key: string]: Compute };
  fixes: { [key: string]: Fix };
  variables: { [key: string]: Variable };
};

export type ModifierOutput = {
  particles?: Particles;
  bonds?: Bonds;
  // Periodic image translations (xyz triples, zero shift first) applied by
  // SyncParticlesModifier; later modifiers replicate or skip images with it.
  imageShifts?: number[];
  colorsDirty: boolean;
  computes: { [key: string]: Compute };
  fixes: { [key: string]: Fix };
  variables: { [key: string]: Variable };
};
