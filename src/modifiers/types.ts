import { LammpsWeb } from "../types";
import { Particles, Bonds } from "omovi";
import { Compute, Fix, Variable } from "../types";
import type { EngineFrame } from "../wasm/engineFrame";
import { RenderModel } from "../store/render";

type RenderState = Pick<
  RenderModel,
  | "particleStyles"
  | "particleStylesUpdated"
  | "bondRadius"
  | "visualizer"
  | "particleRadius"
  | "particles"
  | "bonds"
>;

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
  colorsDirty: boolean;
  computes: { [key: string]: Compute };
  fixes: { [key: string]: Fix };
  variables: { [key: string]: Variable };
};
