import { LammpsWeb } from "../types";
import { Particles, Bonds } from "omovi";
import { Compute, Fix, Variable } from "../types";
import { AtomifyWasmModule } from "../wasm/types";

export type ModifierInput = {
  wasm: AtomifyWasmModule;
  lammps: LammpsWeb;
  renderState: any;
  hasSynchronized: boolean;
  computes: { [key: string]: Compute };
  fixes: { [key: string]: Fix };
  variables: { [key: string]: Variable };
};

export type ModifierOutput = {
  particles: Particles;
  bonds: Bonds;
  colorsDirty: boolean;
  computes: { [key: string]: Compute };
  fixes: { [key: string]: Fix };
  variables: { [key: string]: Variable };
};
