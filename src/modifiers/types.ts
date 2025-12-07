import type { Bonds, Particles } from "omovi";
import type { RenderModel } from "../store/render";
import type { Compute, Fix, LammpsWeb, Variable } from "../types";
import type { AtomifyWasmModule } from "../wasm/types";

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
  wasm: AtomifyWasmModule;
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
