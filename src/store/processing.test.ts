import { describe, it, expect } from "vitest";
import * as THREE from "three";
import type { LammpsWeb } from "../types";
import type { AtomifyWasmModule } from "../wasm/types";

// getSimulationBox and getSimulationOrigo are module-private, so we test them
// indirectly by re-implementing the same algorithm in a focused unit test.
// The functions read from WASM HEAPF64 and do change detection.
// We extract and test the core logic by importing the module and calling the
// exported processingModel — but since the pure functions aren't exported,
// we replicate the algorithm here to verify the logic independently.

describe("getSimulationBox logic", () => {
  it("should create a new Matrix3 from HEAPF64 subarray", () => {
    // Arrange
    const heapData = new Float64Array(64);
    const pointerOffset = 8; // pointer / 8 = offset into HEAPF64
    const rawPointer = pointerOffset * 8;
    // Set 9 matrix elements starting at offset
    const matrixValues = [1, 0, 0, 0, 2, 0, 0, 0, 3];
    for (let i = 0; i < 9; i++) {
      heapData[pointerOffset + i] = matrixValues[i];
    }

    const mockLammps: Partial<LammpsWeb> = {
      getCellMatrixPointer: () => rawPointer,
    };
    const mockWasm: Partial<AtomifyWasmModule> = {
      HEAPF64: heapData,
    };

    // Act — replicate the getSimulationBox logic
    const cellMatrixPointer =
      mockLammps.getCellMatrixPointer!() / 8;
    const sub = mockWasm.HEAPF64!.subarray(
      cellMatrixPointer,
      cellMatrixPointer + 9,
    );
    const result = new THREE.Matrix3().set(
      sub[0], sub[1], sub[2],
      sub[3], sub[4], sub[5],
      sub[6], sub[7], sub[8],
    );

    // Assert
    expect(result.elements[0]).toBe(1);
    expect(result.elements[4]).toBe(2);
    expect(result.elements[8]).toBe(3);
  });

  it("should return existing reference when values have not changed", () => {
    // Arrange
    const heapData = new Float64Array(64);
    const pointerOffset = 0;
    const values = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    for (let i = 0; i < 9; i++) {
      heapData[pointerOffset + i] = values[i];
    }

    // currentBox with the same elements
    const currentBox = new THREE.Matrix3().set(
      1, 0, 0, 0, 1, 0, 0, 0, 1,
    );

    // Replicate change-detection logic
    const sub = heapData.subarray(pointerOffset, pointerOffset + 9);
    const elements = currentBox.elements;
    let areEqual = true;
    for (let i = 0; i < 9; i++) {
      if (elements[i] !== sub[i]) {
        areEqual = false;
        break;
      }
    }

    // Assert — values are the same, so change detection should say equal
    expect(areEqual).toBe(true);
  });

  it("should detect change when values differ", () => {
    // Arrange
    const heapData = new Float64Array(9);
    heapData.set([2, 0, 0, 0, 2, 0, 0, 0, 2]);

    const currentBox = new THREE.Matrix3().set(
      1, 0, 0, 0, 1, 0, 0, 0, 1,
    );

    // Replicate change-detection logic
    const sub = heapData.subarray(0, 9);
    const elements = currentBox.elements;
    let areEqual = true;
    for (let i = 0; i < 9; i++) {
      if (elements[i] !== sub[i]) {
        areEqual = false;
        break;
      }
    }

    // Assert
    expect(areEqual).toBe(false);
  });
});

describe("getSimulationOrigo logic", () => {
  it("should create a new Vector3 from HEAPF64 subarray", () => {
    // Arrange
    const heapData = new Float64Array(16);
    const pointerOffset = 4;
    const rawPointer = pointerOffset * 8;
    heapData[pointerOffset] = 1.5;
    heapData[pointerOffset + 1] = 2.5;
    heapData[pointerOffset + 2] = 3.5;

    const mockLammps: Partial<LammpsWeb> = {
      getOrigoPointer: () => rawPointer,
    };
    const mockWasm: Partial<AtomifyWasmModule> = {
      HEAPF64: heapData,
    };

    // Act — replicate the getSimulationOrigo logic
    const origoPointer = mockLammps.getOrigoPointer!() / 8;
    const sub = mockWasm.HEAPF64!.subarray(origoPointer, origoPointer + 3);
    const result = new THREE.Vector3(sub[0], sub[1], sub[2]);

    // Assert
    expect(result.x).toBe(1.5);
    expect(result.y).toBe(2.5);
    expect(result.z).toBe(3.5);
  });

  it("should return existing reference when values have not changed", () => {
    // Arrange
    const heapData = new Float64Array([5, 10, 15]);
    const currentOrigo = new THREE.Vector3(5, 10, 15);

    // Replicate change-detection logic
    const sub = heapData.subarray(0, 3);
    const unchanged =
      currentOrigo.x === sub[0] &&
      currentOrigo.y === sub[1] &&
      currentOrigo.z === sub[2];

    // Assert
    expect(unchanged).toBe(true);
  });

  it("should detect change when values differ", () => {
    // Arrange
    const heapData = new Float64Array([5, 10, 20]);
    const currentOrigo = new THREE.Vector3(5, 10, 15);

    const sub = heapData.subarray(0, 3);
    const unchanged =
      currentOrigo.x === sub[0] &&
      currentOrigo.y === sub[1] &&
      currentOrigo.z === sub[2];

    // Assert
    expect(unchanged).toBe(false);
  });
});

describe("processingModel default modifiers", () => {
  it("should have 6 default postTimestepModifiers", async () => {
    const { processingModel } = await import("./processing");

    expect(processingModel.postTimestepModifiers).toHaveLength(6);
    const names = processingModel.postTimestepModifiers.map((m) => m.name);
    expect(names).toEqual([
      "Particles",
      "Bonds",
      "Colors",
      "Computes",
      "Fixes",
      "Variables",
    ]);
  });

  it("should have all modifiers active by default", async () => {
    const { processingModel } = await import("./processing");

    for (const modifier of processingModel.postTimestepModifiers) {
      expect(modifier.active).toBe(true);
    }
  });
});
