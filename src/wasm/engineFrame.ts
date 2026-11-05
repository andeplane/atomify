/**
 * One synced LAMMPS timestep, as streamed from the engine worker.
 *
 * The worker copies every array out of the wasm heap inside the
 * (asyncify-safe) step callback and transfers the copies' buffers to the main
 * thread, which then owns them: LammpsWorkerProxy keeps the latest frame and
 * the modifier/render pipeline reads its typed arrays in place. There are no
 * heap pointers on the main thread — the wasm module lives only in the worker.
 */

import type { ModifierCategory } from "lammps.js";
import type { ModifierType, Wall } from "../types";
import type { UnitStyle } from "../utils/units";

/** One 1D series of a compute/fix/variable (a time series or a histogram). */
export interface EngineSeries {
  name: string;
  label: string;
  /** float32 x values. */
  x: Float32Array;
  /** float32 y values, one per x value. */
  y: Float32Array;
}

/** One compute/fix/variable's state at this step: scalar + 1D series. */
export interface EngineModifier {
  name: string;
  category: ModifierCategory;
  /** Atomify's UI classification, derived from category + LAMMPS style. */
  type: ModifierType;
  style: string;
  isPerAtom: boolean;
  hasScalar: boolean;
  clearPerSync: boolean;
  xLabel: string;
  yLabel: string;
  scalar: number;
  series: EngineSeries[];
}

/** Per-atom values of the compute the main thread is coloring by. */
export interface EnginePerAtom {
  category: ModifierCategory;
  name: string;
  /** One float64 value per atom, ordered like the frame's positions. */
  values: Float64Array;
}

export interface EngineFrame {
  step: number;
  /** Number of atoms; every per-atom array below is sized from it. */
  count: number;
  /** 3 * count float32 xyz positions. */
  positions: Float32Array;
  /** count atom types. */
  types: Int32Array;
  /** count persistent LAMMPS atom tags (not array offsets). */
  ids: Int32Array;
  /** Native radii in simulation length units; null for atomic styles. */
  radii: Float32Array | null;
  /** Number of rendered bonds (0 when none). */
  bondCount: number;
  /** 3 * bondCount float32 xyz of each bond's first endpoint. */
  bondFirst: Float32Array;
  /** 3 * bondCount float32 xyz of each bond's second endpoint. */
  bondSecond: Float32Array;
  /** 9 float32, row-major cell matrix. */
  boxMatrix: Float32Array;
  /** 3 float32 box origin. */
  origin: Float32Array;
  dimension: number;
  unitStyle?: UnitStyle;
  /** 0 = idle, 1 = dynamics, 2 = minimization. */
  runMode: number;
  runStepsDone: number;
  runStepsTotal: number;
  /** Every tracked compute/fix/variable (plus group-membership entries). */
  modifiers: EngineModifier[];
  /**
   * Group membership as one bitset per atom: bit i of masks[atom] is set when
   * the atom belongs to names[i]. Lets the group coloring change while paused
   * without entering the (asyncify-suspended) engine.
   */
  groups: { names: string[]; masks: Uint32Array };
  /** Per-atom values for the active coloring compute, or null. */
  perAtom: EnginePerAtom | null;
  /** LAMMPS memory usage estimate in bytes. */
  memoryUsage: number;
  /** Timesteps/second (thermo "spcpu"). */
  timestepsPerSecond: number;
  /** Estimated CPU seconds remaining (thermo "cpuremain"). */
  cpuRemain: number;
  /** Renderable wall fixes (EDGE/CONSTANT). */
  walls: Wall[];
}

/** The frame before the engine has streamed anything: no atoms, unit box. */
export function emptyEngineFrame(): EngineFrame {
  return {
    step: 0,
    count: 0,
    positions: new Float32Array(0),
    types: new Int32Array(0),
    ids: new Int32Array(0),
    radii: null,
    bondCount: 0,
    bondFirst: new Float32Array(0),
    bondSecond: new Float32Array(0),
    boxMatrix: new Float32Array(9),
    origin: new Float32Array(3),
    dimension: 3,
    unitStyle: undefined,
    runMode: 0,
    runStepsDone: 0,
    runStepsTotal: 0,
    modifiers: [],
    groups: { names: [], masks: new Uint32Array(0) },
    perAtom: null,
    memoryUsage: 0,
    timestepsPerSecond: 0,
    cpuRemain: 0,
    walls: [],
  };
}

/**
 * Every buffer backing the frame's arrays, for postMessage's transfer list
 * (zero-copy hand-off to the main thread). The worker allocates each array
 * fresh per step; the Set guards against listing a shared buffer twice,
 * which postMessage rejects.
 */
export function frameTransferables(frame: EngineFrame): ArrayBuffer[] {
  const arrays: ArrayBufferView[] = [
    frame.positions,
    frame.types,
    frame.ids,
    frame.bondFirst,
    frame.bondSecond,
    frame.boxMatrix,
    frame.origin,
    frame.groups.masks,
  ];
  if (frame.radii) arrays.push(frame.radii);
  if (frame.perAtom) arrays.push(frame.perAtom.values);
  for (const modifier of frame.modifiers) {
    for (const series of modifier.series) arrays.push(series.x, series.y);
  }
  return [...new Set(arrays.map((array) => array.buffer as ArrayBuffer))];
}

// Group membership derived per frame and name. Frames are never mutated once
// streamed, so a derived array stays valid for the frame's lifetime; the
// render and UI passes over one step then share a single expansion.
const groupValues = new WeakMap<EngineFrame, Map<string, Float64Array>>();

/**
 * Per-atom values for coloring by `name` (a compute or a group label): a
 * group's 0/1 membership derived from the frame's bitsets, or the streamed
 * per-atom values when they belong to that compute. Empty when the frame
 * carries neither (e.g. the worker has not streamed a newly selected compute
 * yet), so callers never color by another compute's values.
 */
export function perAtomValues(frame: EngineFrame, name: string): Float64Array {
  const bit = frame.groups.names.indexOf(name);
  if (bit >= 0) {
    let cache = groupValues.get(frame);
    if (!cache) {
      cache = new Map();
      groupValues.set(frame, cache);
    }
    let values = cache.get(name);
    if (!values) {
      const masks = frame.groups.masks;
      values = new Float64Array(masks.length);
      for (let i = 0; i < masks.length; i++) values[i] = (masks[i] >>> bit) & 1;
      cache.set(name, values);
    }
    return values;
  }
  if (frame.perAtom?.category === "compute" && frame.perAtom.name === name) {
    return frame.perAtom.values;
  }
  return new Float64Array(0);
}
