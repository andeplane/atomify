import { beforeEach, describe, expect, it, vi } from "vitest";
import ColorModifier from "./colormodifier";
import type { ModifierInput, ModifierOutput } from "./types";

describe("ColorModifier", () => {
  let colorModifier: ColorModifier;

  beforeEach(() => {
    colorModifier = new ColorModifier({ name: "Colors", active: true });
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      // Assert
      expect(colorModifier.name).toBe("Colors");
      expect(colorModifier.active).toBe(true);
      expect(colorModifier.computeName).toBeUndefined();
      expect(colorModifier.globalMinValue).toBe(Infinity);
      expect(colorModifier.globalMaxValue).toBe(-Infinity);
      expect(colorModifier.customMinValue).toBeUndefined();
      expect(colorModifier.customMaxValue).toBeUndefined();
      expect(colorModifier.resetMinMax).toBe(false);
    });
  });

  describe("getEffectiveMinValue", () => {
    it("should return custom min value when set", () => {
      // Arrange
      colorModifier.globalMinValue = 0;
      colorModifier.customMinValue = 10;

      // Act
      const result = colorModifier.getEffectiveMinValue();

      // Assert
      expect(result).toBe(10);
    });

    it("should return global min value when custom is not set", () => {
      // Arrange
      colorModifier.globalMinValue = 5;
      colorModifier.customMinValue = undefined;

      // Act
      const result = colorModifier.getEffectiveMinValue();

      // Assert
      expect(result).toBe(5);
    });
  });

  describe("getEffectiveMaxValue", () => {
    it("should return custom max value when set", () => {
      // Arrange
      colorModifier.globalMaxValue = 100;
      colorModifier.customMaxValue = 50;

      // Act
      const result = colorModifier.getEffectiveMaxValue();

      // Assert
      expect(result).toBe(50);
    });

    it("should return global max value when custom is not set", () => {
      // Arrange
      colorModifier.globalMaxValue = 75;
      colorModifier.customMaxValue = undefined;

      // Act
      const result = colorModifier.getEffectiveMaxValue();

      // Assert
      expect(result).toBe(75);
    });
  });

  describe("resetGlobalMinMax", () => {
    it("should reset global min/max values", () => {
      // Arrange
      colorModifier.globalMinValue = 10;
      colorModifier.globalMaxValue = 100;
      colorModifier.resetMinMax = true;

      // Act
      colorModifier.resetGlobalMinMax();

      // Assert
      expect(colorModifier.globalMinValue).toBe(Infinity);
      expect(colorModifier.globalMaxValue).toBe(-Infinity);
      expect(colorModifier.resetMinMax).toBe(false);
    });
  });

  describe("runByProperty", () => {
    it("should update global min/max values", () => {
      // Arrange
      const mockVisualizer = {
        setColor: vi.fn(),
      };

      const mockCompute = {
        isPerAtom: true,
        lmpCompute: {
          execute: vi.fn(() => true),
          sync: vi.fn(),
          getPerAtomData: vi.fn(() => 0),
        },
      };

      const mockWasm = {
        HEAPF64: {
          subarray: vi.fn(() => new Float64Array([1.0, 2.0, 3.0, 4.0, 5.0])),
        },
      };

      const input: Partial<ModifierInput> = {
        renderState: {
          visualizer: mockVisualizer,
        } as unknown as ModifierInput["renderState"],
        computes: {
          c_test: mockCompute as unknown as ModifierInput["computes"][string],
        },
        wasm: mockWasm as unknown as ModifierInput["wasm"],
      };

      const output: Partial<ModifierOutput> = {
        particles: {
          count: 5,
          indices: [0, 1, 2, 3, 4],
        } as unknown as ModifierOutput["particles"],
      };

      colorModifier.computeName = "c_test";

      // Act
      colorModifier.runByProperty(input as ModifierInput, output as ModifierOutput);

      // Assert
      expect(colorModifier.globalMinValue).toBe(1.0);
      expect(colorModifier.globalMaxValue).toBe(5.0);
    });

    it("should keep global min/max values over multiple timesteps", () => {
      // Arrange
      const mockVisualizer = {
        setColor: vi.fn(),
      };

      const mockCompute = {
        isPerAtom: true,
        lmpCompute: {
          execute: vi.fn(() => true),
          sync: vi.fn(),
          getPerAtomData: vi.fn(() => 0),
        },
      };

      const input: Partial<ModifierInput> = {
        renderState: {
          visualizer: mockVisualizer,
        } as unknown as ModifierInput["renderState"],
        computes: {
          c_test: mockCompute as unknown as ModifierInput["computes"][string],
        },
        wasm: {} as unknown as ModifierInput["wasm"],
      };

      const output: Partial<ModifierOutput> = {
        particles: {
          count: 3,
          indices: [0, 1, 2],
        } as unknown as ModifierOutput["particles"],
      };

      colorModifier.computeName = "c_test";

      // First timestep
      input.wasm = {
        HEAPF64: {
          subarray: vi.fn(() => new Float64Array([1.0, 2.0, 3.0])),
        },
      } as unknown as ModifierInput["wasm"];

      colorModifier.runByProperty(input as ModifierInput, output as ModifierOutput);

      expect(colorModifier.globalMinValue).toBe(1.0);
      expect(colorModifier.globalMaxValue).toBe(3.0);

      // Second timestep with new range
      input.wasm = {
        HEAPF64: {
          subarray: vi.fn(() => new Float64Array([0.5, 2.5, 4.0])),
        },
      } as unknown as ModifierInput["wasm"];

      // Act
      colorModifier.runByProperty(input as ModifierInput, output as ModifierOutput);

      // Assert - should keep the extremes from both timesteps
      expect(colorModifier.globalMinValue).toBe(0.5);
      expect(colorModifier.globalMaxValue).toBe(4.0);
    });

    it("should reset global min/max when resetMinMax flag is set", () => {
      // Arrange
      const mockVisualizer = {
        setColor: vi.fn(),
      };

      const mockCompute = {
        isPerAtom: true,
        lmpCompute: {
          execute: vi.fn(() => true),
          sync: vi.fn(),
          getPerAtomData: vi.fn(() => 0),
        },
      };

      const mockWasm = {
        HEAPF64: {
          subarray: vi.fn(() => new Float64Array([10.0, 20.0])),
        },
      };

      const input: Partial<ModifierInput> = {
        renderState: {
          visualizer: mockVisualizer,
        } as unknown as ModifierInput["renderState"],
        computes: {
          c_test: mockCompute as unknown as ModifierInput["computes"][string],
        },
        wasm: mockWasm as unknown as ModifierInput["wasm"],
      };

      const output: Partial<ModifierOutput> = {
        particles: {
          count: 2,
          indices: [0, 1],
        } as unknown as ModifierOutput["particles"],
      };

      colorModifier.computeName = "c_test";
      colorModifier.globalMinValue = 5.0;
      colorModifier.globalMaxValue = 100.0;
      colorModifier.resetMinMax = true;

      // Act
      colorModifier.runByProperty(input as ModifierInput, output as ModifierOutput);

      // Assert
      expect(colorModifier.globalMinValue).toBe(10.0);
      expect(colorModifier.globalMaxValue).toBe(20.0);
      expect(colorModifier.resetMinMax).toBe(false);
    });

    it("should use custom min/max for coloring when set", () => {
      // Arrange
      const mockVisualizer = {
        setColor: vi.fn(),
      };

      const mockCompute = {
        isPerAtom: true,
        lmpCompute: {
          execute: vi.fn(() => true),
          sync: vi.fn(),
          getPerAtomData: vi.fn(() => 0),
        },
      };

      const mockWasm = {
        HEAPF64: {
          subarray: vi.fn(() => new Float64Array([1.0, 5.0, 10.0])),
        },
      };

      const input: Partial<ModifierInput> = {
        renderState: {
          visualizer: mockVisualizer,
        } as unknown as ModifierInput["renderState"],
        computes: {
          c_test: mockCompute as unknown as ModifierInput["computes"][string],
        },
        wasm: mockWasm as unknown as ModifierInput["wasm"],
      };

      const output: Partial<ModifierOutput> = {
        particles: {
          count: 3,
          indices: [0, 1, 2],
        } as unknown as ModifierOutput["particles"],
      };

      colorModifier.computeName = "c_test";
      colorModifier.customMinValue = 0;
      colorModifier.customMaxValue = 20;

      // Act
      colorModifier.runByProperty(input as ModifierInput, output as ModifierOutput);

      // Assert - should have called setColor for each particle
      expect(mockVisualizer.setColor).toHaveBeenCalledTimes(3);
      // Values should be scaled based on custom range (0-20)
      // The specific colors aren't crucial to test, just that setColor was called
    });
  });
});
