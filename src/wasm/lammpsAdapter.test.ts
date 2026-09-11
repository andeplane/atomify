import { describe, it, expect, vi } from "vitest";
import type {
  LAMMPSWeb as NativeLammps,
  ModifierInfo,
  ModifierSnapshot,
} from "lammps.js";
import { LammpsAdapter } from "./lammpsAdapter";
import type { AtomifyWasmModule } from "./types";

const info = (
  category: ModifierInfo["category"],
  name: string,
  style: string,
): ModifierInfo => ({
  name,
  category,
  style,
  isPerAtom: false,
  hasScalar: true,
  clearPerSync: false,
  xLabel: "",
  yLabel: "",
});

const snapshot = (base: ModifierInfo, scalar: number): ModifierSnapshot => ({
  ...base,
  scalar,
  series: [],
});

describe("LammpsAdapter.snapshotModifiers", () => {
  it("skips a modifier LAMMPS cannot invoke yet and keeps the rest", () => {
    // Arrange: a script that defined `compute rdf` but never ran, so LAMMPS
    // never initialized it. Invoking it throws (embind surfaces LAMMPS
    // errors as a raw exception pointer) — the post-run snapshot must not
    // let that error fail the run.
    const rdf = info("compute", "rdf", "rdf");
    const temp = info("compute", "thermo_temp", "temp");
    const syncModifier = vi.fn(
      (category: ModifierInfo["category"], name: string) => {
        if (name === "rdf") throw 2665104;
        if (name === "thermo_temp") return snapshot(temp, 300);
        return null;
      },
    );
    const native: Partial<NativeLammps> = {
      setAsyncStepCallback: vi.fn(),
      syncModifiers: vi.fn(),
      listModifiers: vi.fn(() => [rdf, temp]),
      syncModifier,
    };
    const module: Partial<AtomifyWasmModule> = {
      HEAPF32: new Float32Array(0),
      HEAPF64: new Float64Array(0),
    };
    const adapter = new LammpsAdapter(
      module as AtomifyWasmModule,
      native as NativeLammps,
    );

    // Act
    const { modifiers } = adapter.snapshotModifiers(null, 0);

    // Assert: both are reported; the uninitialized one falls back to its
    // static info with no data, the other carries its synced value.
    expect(modifiers.map((m) => m.name)).toEqual(["rdf", "thermo_temp"]);
    expect(modifiers[0]).toMatchObject({ scalar: 0, series: [] });
    expect(modifiers[1]).toMatchObject({ scalar: 300 });
    expect(syncModifier).toHaveBeenCalledWith("compute", "rdf");
    expect(syncModifier).toHaveBeenCalledWith("compute", "thermo_temp");
  });
});
