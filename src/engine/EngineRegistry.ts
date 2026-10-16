/**
 * The live engine and renderer objects, owned outside the easy-peasy store.
 *
 * The engine proxy, the omovi visualizer, the rendered Particles and Bonds
 * (three.js meshes and GPU buffers) and the post-timestep modifier instances
 * are mutable objects with identity and resources. Inside immer state they
 * were mutated in place behind its back (resetting `particles.count` inside a
 * draft), which also made DevTools and HMR fragile. The store keeps only the
 * UI state around them; this registry holds the objects themselves.
 *
 * One registry belongs to one app: store/index.ts creates it, passes it to
 * the store's thunks as an injection (StoreInjections.engine) and to React
 * through EngineContext (useEngine / useEngineState). Tests build their own.
 */

import type { Bonds, Particles, Visualizer } from "omovi";
import type { LammpsWeb } from "../types";
import type Modifier from "../modifiers/modifier";
import ColorModifier from "../modifiers/colormodifier";
import SliceModifier from "../modifiers/slicemodifier";
import SyncBondsModifier from "../modifiers/syncbondsmodifier";
import SyncComputesModifier from "../modifiers/synccomputesmodifier";
import SyncFixesModifier from "../modifiers/syncfixesmodifier";
import SyncParticlesModifier from "../modifiers/syncparticlesmodifier";
import SyncVariablesModifier from "../modifiers/syncvariablesmodifier";

/** The replaceable objects. A change replaces the snapshot, never mutates it. */
export interface EngineObjects {
  /** The engine proxy (LammpsWorkerProxy), once the wasm module has loaded. */
  readonly lammps?: LammpsWeb;
  /** The viewport's renderer while a View is mounted. */
  readonly visualizer?: Visualizer;
  /** The rendered atoms, synced from engine frames by the modifiers. */
  readonly particles?: Particles;
  /** The rendered bonds, synced from engine frames by the modifiers. */
  readonly bonds?: Bonds;
}

/** The post-timestep pipeline, in the order it runs on every frame. */
export function createDefaultModifiers(): Modifier[] {
  return [
    new SyncParticlesModifier({ name: "Particles", active: true }),
    new SyncBondsModifier({ name: "Bonds", active: true }),
    new ColorModifier({ name: "Colors", active: true }),
    // After Particles/Bonds/Colors: it hides atoms those just restyled.
    new SliceModifier({ name: "Slice", active: false }),
    new SyncComputesModifier({ name: "Computes", active: true }),
    new SyncFixesModifier({ name: "Fixes", active: true }),
    new SyncVariablesModifier({ name: "Variables", active: true }),
  ];
}

export class EngineRegistry {
  /**
   * The modifier instances, for the registry's lifetime. Their settings
   * (active, color-by compute, colormap, range) are edited in place by the
   * settings UI and read by the pipeline on the next frame.
   */
  readonly modifiers: readonly Modifier[];
  private objects: EngineObjects = {};
  private readonly listeners = new Set<() => void>();

  constructor(modifiers: Modifier[] = createDefaultModifiers()) {
    this.modifiers = modifiers;
  }

  get lammps(): LammpsWeb | undefined {
    return this.objects.lammps;
  }

  get visualizer(): Visualizer | undefined {
    return this.objects.visualizer;
  }

  get particles(): Particles | undefined {
    return this.objects.particles;
  }

  get bonds(): Bonds | undefined {
    return this.objects.bonds;
  }

  /** The pipeline's color modifier (color by type, compute or group). */
  get colorModifier(): ColorModifier | undefined {
    return this.modifiers.find(
      (modifier): modifier is ColorModifier =>
        modifier instanceof ColorModifier,
    );
  }

  /** The current objects; the same reference until one of them changes. */
  getSnapshot = (): EngineObjects => this.objects;

  /** Called after every change (the useSyncExternalStore contract). */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setLammps(lammps: LammpsWeb | undefined): void {
    this.update({ lammps });
  }

  /** Undefined releases it, so a remounting View can create a new one. */
  setVisualizer(visualizer: Visualizer | undefined): void {
    this.update({ visualizer });
  }

  setParticles(particles: Particles | undefined): void {
    this.update({ particles });
  }

  setBonds(bonds: Bonds | undefined): void {
    this.update({ bonds });
  }

  /**
   * Empty the rendered atoms and bonds for a fresh run, keeping their
   * buffers for the next frames to refill.
   */
  clearGeometry(): void {
    const { particles, bonds } = this.objects;
    if (particles) {
      particles.count = 0;
      particles.markNeedsUpdate();
    }
    if (bonds) {
      bonds.count = 0;
      bonds.markNeedsUpdate();
    }
  }

  private update(patch: EngineObjects): void {
    const keys = Object.keys(patch) as (keyof EngineObjects)[];
    if (keys.every((key) => this.objects[key] === patch[key])) {
      return;
    }
    this.objects = { ...this.objects, ...patch };
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}
