import { describe, it, expect, vi } from "vitest";
import type {
  BufferView,
  LAMMPSWeb as NativeLammps,
  LammpsModule,
  ModifierInfo,
  ModifierSnapshot,
} from "lammps.js";
import { LammpsAdapter } from "./lammpsAdapter";

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

/** A float view at a byte offset into the fake heap. */
const view = (ptr: number, length: number): BufferView => ({
  ptr,
  length,
  components: 1,
  type: 0 as BufferView["type"],
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
    const module: Partial<LammpsModule> = {
      HEAPF32: new Float32Array(0),
      HEAPF64: new Float64Array(0),
    };
    const adapter = new LammpsAdapter(
      module as LammpsModule,
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

  it("copies series and per-atom values out of the heap into owned typed arrays", () => {
    // Arrange: an RDF series (x at float 0, y at float 3) and a per-atom
    // compute (3 float64 values at double 2) in the fake wasm heap.
    const heapF32 = new Float32Array(16);
    heapF32.set([0.5, 1.5, 2.5], 0);
    heapF32.set([0, 1.2, 0.9], 3);
    const heapF64 = new Float64Array(8);
    heapF64.set([7, 8, 9], 2);
    const rdf = info("compute", "rdf", "rdf");
    const ke = { ...info("compute", "ke", "ke/atom"), isPerAtom: true };
    const native: Partial<NativeLammps> = {
      setAsyncStepCallback: vi.fn(),
      syncModifiers: vi.fn(),
      listModifiers: vi.fn(() => [rdf, ke]),
      syncModifier: vi.fn((_category, name: string) =>
        name === "rdf"
          ? {
              ...snapshot(rdf, 0),
              series: [
                { name: "g", label: "g(r)", x: view(0, 3), y: view(12, 3) },
              ],
            }
          : name === "ke"
            ? snapshot(ke, 0)
            : null,
      ),
      getModifierPerAtom: vi.fn(() => view(16, 3)),
    };
    const adapter = new LammpsAdapter(
      { HEAPF32: heapF32, HEAPF64: heapF64 } as unknown as LammpsModule,
      native as NativeLammps,
    );

    // Act
    const { modifiers, perAtom } = adapter.snapshotModifiers(
      { category: "compute", name: "ke" },
      3,
    );

    // Assert: values match the heap, but live in fresh buffers the worker
    // can transfer (never views into the wasm heap).
    const series = modifiers.find((m) => m.name === "rdf")!.series[0];
    expect(series.label).toBe("g(r)");
    expect(series.x).toBeInstanceOf(Float32Array);
    expect(Array.from(series.x)).toEqual([0.5, 1.5, 2.5]);
    expect(Array.from(series.y)).toEqual([0, heapF32[4], heapF32[5]]);
    expect(series.x.buffer).not.toBe(heapF32.buffer);
    expect(perAtom).toMatchObject({ category: "compute", name: "ke" });
    expect(Array.from(perAtom!.values)).toEqual([7, 8, 9]);
    expect(perAtom!.values.buffer).not.toBe(heapF64.buffer);
  });
});

describe("LammpsAdapter run control", () => {
  const setup = () => {
    let onStep: () => Promise<void> = () => Promise.resolve();
    const native: Partial<NativeLammps> = {
      setAsyncStepCallback: vi.fn((callback: () => Promise<void>) => {
        onStep = callback;
      }) as unknown as NativeLammps["setAsyncStepCallback"],
      stop: vi.fn(),
      getLastErrorMessage: vi.fn(() => ""),
    };
    const adapter = new LammpsAdapter(
      {} as LammpsModule,
      native as NativeLammps,
    );
    return { adapter, native, step: () => onStep() };
  };
  const settled = (promise: Promise<void>) => {
    let done = false;
    void promise.then(() => (done = true));
    return () => done;
  };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  it("holds the step while paused and releases it on resume", async () => {
    const { adapter, step } = setup();
    adapter.setPaused(true);
    const released = settled(step());
    await wait(150);
    expect(released()).toBe(false);

    adapter.setPaused(false);
    await wait(150);
    expect(released()).toBe(true);
  });

  it("cancel releases a paused step and stops the run at the next one", async () => {
    const { adapter, native, step } = setup();
    adapter.setPaused(true);
    const paused = step();
    adapter.cancel();
    await paused;
    expect(native.stop).not.toHaveBeenCalled();

    await step();
    expect(native.stop).toHaveBeenCalledTimes(1);
    expect(adapter.getErrorMessage()).toBe("Atomify::canceled");
  });
});
