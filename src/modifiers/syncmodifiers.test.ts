import { describe, it, expect, beforeEach, vi } from "vitest";
import SyncParticlesModifier from "./syncparticlesmodifier";
import SyncBondsModifier from "./syncbondsmodifier";
import SyncComputesModifier from "./synccomputesmodifier";
import SyncFixesModifier from "./syncfixesmodifier";
import SyncVariablesModifier from "./syncvariablesmodifier";
import { ModifierInput, ModifierOutput } from "./types";
import type { LammpsWeb, LMPModifier, ModifierType } from "../types";
import type { AtomifyWasmModule } from "../wasm/types";

// Shared mock helpers at the bottom of the file; declared here for use in tests.

describe("SyncParticlesModifier", () => {
  let modifier: SyncParticlesModifier;
  let input: Partial<ModifierInput>;
  let output: Partial<ModifierOutput>;

  beforeEach(() => {
    modifier = new SyncParticlesModifier({ name: "Particles", active: true });

    const heapf32 = new Float32Array(100);
    const heap32 = new Int32Array(100);

    input = {
      lammps: createMockLammps({
        computeParticles: vi.fn(() => 3),
        getPositionsPointer: vi.fn(() => 0),
        getTypePointer: vi.fn(() => 40),
        getIdPointer: vi.fn(() => 52),
      }),
      wasm: {
        HEAPF32: heapf32,
        HEAP32: heap32,
      } as Partial<AtomifyWasmModule> as AtomifyWasmModule,
    };

    // Write position data: 3 particles × 3 floats = 9 values starting at byte offset 0 → index 0
    heapf32.set([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0], 0);
    // Types at byte offset 40 → int32 index 10
    heap32.set([1, 2, 1], 10);
    // Ids at byte offset 52 → int32 index 13
    heap32.set([10, 20, 30], 13);

    output = {
      particles: undefined,
      colorsDirty: false,
    };
  });

  it("should set particle count to 0 and mesh count to 0 when inactive", () => {
    modifier.active = false;
    const mockMesh = { count: 5 };
    output.particles = {
      count: 5,
      mesh: mockMesh,
    } as Partial<ModifierOutput["particles"]> as NonNullable<
      ModifierOutput["particles"]
    >;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(output.particles!.count).toBe(0);
    expect(mockMesh.count).toBe(0);
  });

  it("should do nothing when inactive and particles is undefined", () => {
    modifier.active = false;
    output.particles = undefined;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(output.particles).toBeUndefined();
  });

  it("should create new Particles and populate positions/types/ids from WASM buffers", () => {
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(output.particles).toBeDefined();
    expect(output.particles!.count).toBe(3);

    // Positions: 3 particles × 3 components
    expect(output.particles!.positions[0]).toBe(1.0);
    expect(output.particles!.positions[1]).toBe(2.0);
    expect(output.particles!.positions[8]).toBe(9.0);

    // Types
    expect(output.particles!.types[0]).toBe(1);
    expect(output.particles!.types[1]).toBe(2);
    expect(output.particles!.types[2]).toBe(1);

    // Ids
    expect(output.particles!.indices[0]).toBe(10);
    expect(output.particles!.indices[1]).toBe(20);
    expect(output.particles!.indices[2]).toBe(30);
  });

  it("should set colorsDirty when creating new particles", () => {
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(output.colorsDirty).toBe(true);
  });

  it("should reuse existing particles when capacity is sufficient", () => {
    // First run creates particles
    modifier.run(input as ModifierInput, output as ModifierOutput);
    const firstParticles = output.particles;

    // Second run with same count should reuse
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(output.particles).toBe(firstParticles);
  });

  it("should set mesh count when mesh exists", () => {
    // First run to create particles
    modifier.run(input as ModifierInput, output as ModifierOutput);

    // Add a mock mesh
    const mockMesh = { count: 0 };
    output.particles!.mesh =
      mockMesh as Partial<ModifierOutput["particles"]> as NonNullable<
        ModifierOutput["particles"]
      >["mesh"];

    // Run again
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(mockMesh.count).toBe(3);
  });
});

describe("SyncBondsModifier", () => {
  let modifier: SyncBondsModifier;
  let input: Partial<ModifierInput>;
  let output: Partial<ModifierOutput>;

  beforeEach(() => {
    modifier = new SyncBondsModifier({ name: "Bonds", active: true });

    const heapf32 = new Float32Array(100);

    input = {
      lammps: createMockLammps({
        computeBonds: vi.fn(() => 2),
        getBondsPosition1Pointer: vi.fn(() => 0),
        getBondsPosition2Pointer: vi.fn(() => 24),
      }),
      wasm: {
        HEAPF32: heapf32,
      } as Partial<AtomifyWasmModule> as AtomifyWasmModule,
      renderState: {
        bondRadius: 0.5,
      } as Partial<ModifierInput["renderState"]> as ModifierInput["renderState"],
    };

    // Bond positions1: 2 bonds × 3 floats at byte 0 → index 0
    heapf32.set([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], 0);
    // Bond positions2: 2 bonds × 3 floats at byte 24 → index 6
    heapf32.set([7.0, 8.0, 9.0, 10.0, 11.0, 12.0], 6);

    output = {
      bonds: undefined,
      colorsDirty: false,
    };
  });

  it("should set bond count to 0 and mesh count to 0 when inactive", () => {
    modifier.active = false;
    const mockMesh = { count: 3 };
    output.bonds = {
      count: 3,
      mesh: mockMesh,
    } as Partial<ModifierOutput["bonds"]> as NonNullable<
      ModifierOutput["bonds"]
    >;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(output.bonds!.count).toBe(0);
    expect(mockMesh.count).toBe(0);
  });

  it("should create new Bonds and populate positions from WASM buffers", () => {
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(output.bonds).toBeDefined();
    expect(output.bonds!.count).toBe(2);

    // Positions1
    expect(output.bonds!.positions1[0]).toBe(1.0);
    expect(output.bonds!.positions1[5]).toBe(6.0);

    // Positions2
    expect(output.bonds!.positions2[0]).toBe(7.0);
    expect(output.bonds!.positions2[5]).toBe(12.0);
  });

  it("should handle zero bonds by setting count to 0", () => {
    vi.mocked(input.lammps!.computeBonds).mockReturnValue(0);

    // Need an existing bonds object for the zero-bonds path
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(output.bonds!.count).toBe(0);
  });

  it("should set mesh count when mesh exists and bonds > 0", () => {
    modifier.run(input as ModifierInput, output as ModifierOutput);

    const mockMesh = { count: 0 };
    output.bonds!.mesh =
      mockMesh as Partial<ModifierOutput["bonds"]> as NonNullable<
        ModifierOutput["bonds"]
      >["mesh"];

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(mockMesh.count).toBe(2);
  });

  it("should fill radii based on bondRadius from renderState", () => {
    modifier.run(input as ModifierInput, output as ModifierOutput);

    // bondRadius * 0.25 = 0.5 * 0.25 = 0.125
    expect(output.bonds!.radii[0]).toBe(0.125);
    expect(output.bonds!.radii[1]).toBe(0.125);
  });
});

describe("SyncComputesModifier", () => {
  let modifier: SyncComputesModifier;
  let input: Partial<ModifierInput>;
  let output: Partial<ModifierOutput>;

  beforeEach(() => {
    modifier = new SyncComputesModifier({ name: "Computes", active: true });

    input = {
      lammps: createMockLammps({
        syncComputes: vi.fn(),
        getComputeNames: vi.fn(() => createMockCPPArray(["c_temp"])),
        getCompute: vi.fn(() =>
          createMockLMPModifier({
            getName: vi.fn(() => "c_temp"),
            getType: vi.fn(() => 1 as ModifierType),
            getIsPerAtom: vi.fn(() => false),
            getXLabel: vi.fn(() => "Timestep"),
            getYLabel: vi.fn(() => "Temperature"),
            hasScalarData: vi.fn(() => true),
            getClearPerSync: vi.fn(() => false),
            execute: vi.fn(() => true),
            sync: vi.fn(),
            getScalarValue: vi.fn(() => 300.0),
            getData1DNames: vi.fn(() => createMockCPPArray([])),
          }),
        ),
      }),
      wasm: {} as Partial<AtomifyWasmModule> as AtomifyWasmModule,
      hasSynchronized: true,
      computes: {},
    };

    output = {
      computes: {},
    };
  });

  it("should return early when inactive", () => {
    modifier.active = false;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncComputes).not.toHaveBeenCalled();
    expect(output.computes).toEqual({});
  });

  it("should return early when hasSynchronized is false", () => {
    input.hasSynchronized = false;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncComputes).not.toHaveBeenCalled();
  });

  it("should create a new compute from lammps data", () => {
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncComputes).toHaveBeenCalled();
    expect(output.computes!["c_temp"]).toBeDefined();
    expect(output.computes!["c_temp"].name).toBe("c_temp");
    expect(output.computes!["c_temp"].scalarValue).toBe(300.0);
    expect(output.computes!["c_temp"].hasScalarData).toBe(true);
  });

  it("should reuse existing compute from input.computes", () => {
    const existingLmpCompute = createMockLMPModifier({
      execute: vi.fn(() => true),
      sync: vi.fn(),
      getXLabel: vi.fn(() => "Step"),
      getYLabel: vi.fn(() => "Temp"),
      getScalarValue: vi.fn(() => 350.0),
      getData1DNames: vi.fn(() => createMockCPPArray([])),
    });

    input.computes = {
      c_temp: {
        name: "c_temp",
        type: 1 as ModifierType,
        isPerAtom: false,
        xLabel: "Timestep",
        yLabel: "Temperature",
        hasScalarData: true,
        clearPerSync: false,
        scalarValue: 300.0,
        syncDataPoints: false,
        hasData1D: false,
        lmpCompute: existingLmpCompute,
      },
    };

    modifier.run(input as ModifierInput, output as ModifierOutput);

    // Should NOT call getCompute since compute already exists
    expect(input.lammps!.getCompute).not.toHaveBeenCalled();
    expect(output.computes!["c_temp"].scalarValue).toBe(350.0);
  });

  it("should handle compute with 1D data", () => {
    const heapf32 = new Float32Array(100);
    // x values at byte offset 0 → index 0
    heapf32.set([1.0, 2.0, 3.0], 0);
    // y values at byte offset 12 → index 3
    heapf32.set([10.0, 20.0, 30.0], 3);

    input.wasm = {
      HEAPF32: heapf32,
    } as Partial<AtomifyWasmModule> as AtomifyWasmModule;

    const mockLmpCompute = createMockLMPModifier({
      getName: vi.fn(() => "c_rdf"),
      getType: vi.fn(() => 4 as ModifierType),
      getIsPerAtom: vi.fn(() => false),
      getXLabel: vi.fn(() => "r"),
      getYLabel: vi.fn(() => "g(r)"),
      hasScalarData: vi.fn(() => false),
      getClearPerSync: vi.fn(() => true),
      execute: vi.fn(() => true),
      sync: vi.fn(),
      getScalarValue: vi.fn(() => 0),
      getData1DNames: vi.fn(() => createMockCPPArray(["rdf"])),
      getData1D: vi.fn(() =>
        createMockCPPArray([
          {
            getLabel: vi.fn(() => "g(r)"),
            getXValuesPointer: vi.fn(() => 0),
            getYValuesPointer: vi.fn(() => 12),
            getNumPoints: vi.fn(() => 3),
            delete: vi.fn(),
          },
        ]),
      ),
    });

    vi.mocked(input.lammps!.getComputeNames).mockReturnValue(
      createMockCPPArray(["c_rdf"]),
    );
    vi.mocked(input.lammps!.getCompute).mockReturnValue(
      mockLmpCompute,
    );

    // Set syncDataPoints to trigger data reading via the "everything" param
    modifier.run(input as ModifierInput, output as ModifierOutput, true);

    const compute = output.computes!["c_rdf"];
    expect(compute).toBeDefined();
    expect(compute.hasData1D).toBe(true);
    expect(compute.data1D).toBeDefined();
    expect(compute.data1D!.data).toEqual([[1.0, 10.0], [2.0, 20.0], [3.0, 30.0]]);
    expect(compute.data1D!.labels).toEqual(["x", "g(r)"]);
  });
});

describe("SyncFixesModifier", () => {
  let modifier: SyncFixesModifier;
  let input: Partial<ModifierInput>;
  let output: Partial<ModifierOutput>;

  beforeEach(() => {
    modifier = new SyncFixesModifier({ name: "Fixes", active: true });

    const mockLmpFix = createMockLMPModifier({
      getName: vi.fn(() => "f_ave"),
      getType: vi.fn(() => 14 as ModifierType),
      getIsPerAtom: vi.fn(() => false),
      getXLabel: vi.fn(() => "Timestep"),
      getYLabel: vi.fn(() => "Value"),
      hasScalarData: vi.fn(() => true),
      getClearPerSync: vi.fn(() => false),
      sync: vi.fn(),
      getScalarValue: vi.fn(() => 42.0),
      getData1DNames: vi.fn(() => createMockCPPArray([])),
    });

    input = {
      lammps: createMockLammps({
        syncFixes: vi.fn(),
        getFixNames: vi.fn(() => createMockCPPArray(["f_ave"])),
        getFix: vi.fn(
          () => mockLmpFix,
        ),
      }),
      wasm: {} as Partial<AtomifyWasmModule> as AtomifyWasmModule,
      hasSynchronized: true,
      fixes: {},
    };

    output = {
      fixes: {},
    };
  });

  it("should return early when inactive", () => {
    modifier.active = false;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncFixes).not.toHaveBeenCalled();
    expect(output.fixes).toEqual({});
  });

  it("should return early when hasSynchronized is false", () => {
    input.hasSynchronized = false;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncFixes).not.toHaveBeenCalled();
  });

  it("should create a new fix from lammps data", () => {
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncFixes).toHaveBeenCalled();
    expect(output.fixes!["f_ave"]).toBeDefined();
    expect(output.fixes!["f_ave"].name).toBe("f_ave");
    expect(output.fixes!["f_ave"].scalarValue).toBe(42.0);
  });

  it("should reuse existing fix from input.fixes", () => {
    const existingLmpFix = createMockLMPModifier({
      sync: vi.fn(),
      getXLabel: vi.fn(() => "Step"),
      getYLabel: vi.fn(() => "Val"),
      getScalarValue: vi.fn(() => 99.0),
      getData1DNames: vi.fn(() => createMockCPPArray([])),
    });

    input.fixes = {
      f_ave: {
        name: "f_ave",
        type: 14 as ModifierType,
        isPerAtom: false,
        xLabel: "Timestep",
        yLabel: "Value",
        hasScalarData: true,
        clearPerSync: false,
        scalarValue: 42.0,
        syncDataPoints: false,
        hasData1D: false,
        lmpFix: existingLmpFix,
      },
    };

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.getFix).not.toHaveBeenCalled();
    expect(output.fixes!["f_ave"].scalarValue).toBe(99.0);
  });
});

describe("SyncVariablesModifier", () => {
  let modifier: SyncVariablesModifier;
  let input: Partial<ModifierInput>;
  let output: Partial<ModifierOutput>;

  beforeEach(() => {
    modifier = new SyncVariablesModifier({
      name: "Variables",
      active: true,
    });

    const mockLmpVariable = createMockLMPModifier({
      getName: vi.fn(() => "v_temp"),
      getType: vi.fn(() => 18 as ModifierType),
      getIsPerAtom: vi.fn(() => false),
      getXLabel: vi.fn(() => "Timestep"),
      getYLabel: vi.fn(() => "Temp"),
      hasScalarData: vi.fn(() => true),
      getClearPerSync: vi.fn(() => false),
      sync: vi.fn(),
      getScalarValue: vi.fn(() => 273.15),
      getData1DNames: vi.fn(() => createMockCPPArray([])),
    });

    input = {
      lammps: createMockLammps({
        syncVariables: vi.fn(),
        getVariableNames: vi.fn(() => createMockCPPArray(["v_temp"])),
        getVariable: vi.fn(
          () => mockLmpVariable,
        ),
      }),
      wasm: {} as Partial<AtomifyWasmModule> as AtomifyWasmModule,
      hasSynchronized: true,
      variables: {},
    };

    output = {
      variables: {},
    };
  });

  it("should return early when inactive", () => {
    modifier.active = false;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncVariables).not.toHaveBeenCalled();
    expect(output.variables).toEqual({});
  });

  it("should return early when hasSynchronized is false", () => {
    input.hasSynchronized = false;

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncVariables).not.toHaveBeenCalled();
  });

  it("should create a new variable from lammps data", () => {
    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.syncVariables).toHaveBeenCalled();
    expect(output.variables!["v_temp"]).toBeDefined();
    expect(output.variables!["v_temp"].name).toBe("v_temp");
    expect(output.variables!["v_temp"].scalarValue).toBe(273.15);
    expect(output.variables!["v_temp"].hasScalarData).toBe(true);
  });

  it("should reuse existing variable from input.variables", () => {
    const existingLmpVariable = createMockLMPModifier({
      sync: vi.fn(),
      getXLabel: vi.fn(() => "Step"),
      getYLabel: vi.fn(() => "T"),
      getScalarValue: vi.fn(() => 500.0),
      hasScalarData: vi.fn(() => true),
      getData1DNames: vi.fn(() => createMockCPPArray([])),
    });

    input.variables = {
      v_temp: {
        name: "v_temp",
        type: 18 as ModifierType,
        isPerAtom: false,
        xLabel: "Timestep",
        yLabel: "Temp",
        hasScalarData: true,
        clearPerSync: false,
        scalarValue: 273.15,
        syncDataPoints: false,
        hasData1D: false,
        lmpVariable:
          existingLmpVariable,
      },
    };

    modifier.run(input as ModifierInput, output as ModifierOutput);

    expect(input.lammps!.getVariable).not.toHaveBeenCalled();
    expect(output.variables!["v_temp"].scalarValue).toBe(500.0);
  });

  it("should handle variable with 1D data and everything=true", () => {
    const heapf32 = new Float32Array(100);
    heapf32.set([0.0, 1.0], 0); // x values
    heapf32.set([100.0, 200.0], 2); // y values

    input.wasm = {
      HEAPF32: heapf32,
    } as Partial<AtomifyWasmModule> as AtomifyWasmModule;

    const mockLmpVariable = createMockLMPModifier({
      getName: vi.fn(() => "v_data"),
      getType: vi.fn(() => 18 as ModifierType),
      getIsPerAtom: vi.fn(() => false),
      getXLabel: vi.fn(() => "Step"),
      getYLabel: vi.fn(() => "Data"),
      hasScalarData: vi.fn(() => false),
      getClearPerSync: vi.fn(() => false),
      sync: vi.fn(),
      getScalarValue: vi.fn(() => 0),
      getData1DNames: vi.fn(() => createMockCPPArray(["series1"])),
      getData1D: vi.fn(() =>
        createMockCPPArray([
          {
            getLabel: vi.fn(() => "series1"),
            getXValuesPointer: vi.fn(() => 0),
            getYValuesPointer: vi.fn(() => 8),
            getNumPoints: vi.fn(() => 2),
            delete: vi.fn(),
          },
        ]),
      ),
    });

    vi.mocked(input.lammps!.getVariableNames).mockReturnValue(
      createMockCPPArray(["v_data"]),
    );
    vi.mocked(input.lammps!.getVariable).mockReturnValue(
      mockLmpVariable,
    );

    modifier.run(input as ModifierInput, output as ModifierOutput, true);

    const variable = output.variables!["v_data"];
    expect(variable.hasData1D).toBe(true);
    expect(variable.data1D).toBeDefined();
    expect(variable.data1D!.data).toEqual([[0.0, 100.0], [1.0, 200.0]]);
    expect(variable.data1D!.labels).toEqual(["x", "series1"]);
  });
});

// --- Helper functions ---

function createMockLammps(
  overrides: Partial<LammpsWeb> = {},
): LammpsWeb {
  return {
    getNumAtoms: vi.fn(() => 0),
    computeParticles: vi.fn(() => 0),
    computeBonds: vi.fn(() => 0),
    getPositionsPointer: vi.fn(() => 0),
    getTypePointer: vi.fn(() => 0),
    getIdPointer: vi.fn(() => 0),
    getBondsPosition1Pointer: vi.fn(() => 0),
    getBondsPosition2Pointer: vi.fn(() => 0),
    syncComputes: vi.fn(),
    syncFixes: vi.fn(),
    syncVariables: vi.fn(),
    getComputeNames: vi.fn(() => createMockCPPArray([])),
    getFixNames: vi.fn(() => createMockCPPArray([])),
    getVariableNames: vi.fn(() => createMockCPPArray([])),
    getCompute: vi.fn(),
    getFix: vi.fn(),
    getVariable: vi.fn(),
    ...overrides,
  } as LammpsWeb;
}

function createMockCPPArray<T>(items: T[]): {
  get: (index: number) => T;
  size: () => number;
  delete: () => void;
} {
  return {
    get: vi.fn((index: number) => items[index]),
    size: vi.fn(() => items.length),
    delete: vi.fn(),
  };
}

function createMockLMPModifier(
  overrides: Partial<LMPModifier> = {},
): LMPModifier {
  return {
    getName: vi.fn(() => ""),
    getType: vi.fn(() => 0 as ModifierType),
    getIsPerAtom: vi.fn(() => false),
    getPerAtomData: vi.fn(() => 0),
    hasScalarData: vi.fn(() => false),
    getClearPerSync: vi.fn(() => false),
    getScalarValue: vi.fn(() => 0),
    sync: vi.fn(),
    getXLabel: vi.fn(() => ""),
    getYLabel: vi.fn(() => ""),
    getData1DNames: vi.fn(() => createMockCPPArray([])),
    getData1D: vi.fn(() => createMockCPPArray([])),
    execute: vi.fn(() => false),
    delete: vi.fn(),
    ...overrides,
  } as LMPModifier;
}
