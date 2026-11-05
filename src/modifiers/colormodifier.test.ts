import { describe, it, expect, beforeEach, vi } from "vitest";
import ColorModifier from "./colormodifier";
import { ModifierInput, ModifierOutput } from "./types";
import { emptyEngineFrame, type EngineFrame } from "../wasm/engineFrame";
import { GROUP_LABEL_PREFIX } from "../utils/lammpsGroups";

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
    /** A frame streaming `values` as c_test's per-atom data. */
    const perAtomFrame = (values: number[], name = "c_test"): EngineFrame => ({
      ...emptyEngineFrame(),
      count: values.length,
      perAtom: { category: "compute", name, values: new Float64Array(values) },
    });

    const setup = (count: number, frame: EngineFrame) => {
      const mockVisualizer = {
        setColor: vi.fn(),
      };
      const mockCompute = { name: "c_test", isPerAtom: true };
      const input: Partial<ModifierInput> = {
        renderState: {
          visualizer: mockVisualizer,
        } as unknown as ModifierInput["renderState"],
        computes: {
          c_test: mockCompute as unknown as ModifierInput["computes"][string],
        },
        frame,
      };
      const output: Partial<ModifierOutput> = {
        particles: {
          count,
          indices: Array.from({ length: count }, (_, i) => i),
        } as unknown as ModifierOutput["particles"],
      };
      colorModifier.computeName = "c_test";
      return { mockVisualizer, input, output };
    };

    it("should update global min/max values", () => {
      // Arrange
      const { input, output } = setup(5, perAtomFrame([1, 2, 3, 4, 5]));

      // Act
      colorModifier.runByProperty(
        input as ModifierInput,
        output as ModifierOutput,
      );

      // Assert
      expect(colorModifier.globalMinValue).toBe(1.0);
      expect(colorModifier.globalMaxValue).toBe(5.0);
    });

    it("should keep global min/max values over multiple timesteps", () => {
      // Arrange
      const { input, output } = setup(3, perAtomFrame([1, 2, 3]));

      // First timestep
      colorModifier.runByProperty(
        input as ModifierInput,
        output as ModifierOutput,
      );

      expect(colorModifier.globalMinValue).toBe(1.0);
      expect(colorModifier.globalMaxValue).toBe(3.0);

      // Second timestep with new range
      input.frame = perAtomFrame([0.5, 2.5, 4.0]);

      // Act
      colorModifier.runByProperty(
        input as ModifierInput,
        output as ModifierOutput,
      );

      // Assert - should keep the extremes from both timesteps
      expect(colorModifier.globalMinValue).toBe(0.5);
      expect(colorModifier.globalMaxValue).toBe(4.0);
    });

    it("should reset global min/max when resetMinMax flag is set", () => {
      // Arrange
      const { input, output } = setup(2, perAtomFrame([10, 20]));
      colorModifier.globalMinValue = 5.0;
      colorModifier.globalMaxValue = 100.0;
      colorModifier.resetMinMax = true;

      // Act
      colorModifier.runByProperty(
        input as ModifierInput,
        output as ModifierOutput,
      );

      // Assert
      expect(colorModifier.globalMinValue).toBe(10.0);
      expect(colorModifier.globalMaxValue).toBe(20.0);
      expect(colorModifier.resetMinMax).toBe(false);
    });

    it("should use custom min/max for coloring when set", () => {
      // Arrange
      const { mockVisualizer, input, output } = setup(
        3,
        perAtomFrame([1, 5, 10]),
      );
      colorModifier.customMinValue = 0;
      colorModifier.customMaxValue = 20;

      // Act
      colorModifier.runByProperty(
        input as ModifierInput,
        output as ModifierOutput,
      );

      // Assert - should have called setColor for each particle
      expect(mockVisualizer.setColor).toHaveBeenCalledTimes(3);
      // Values should be scaled based on custom range (0-20)
      // The specific colors aren't crucial to test, just that setColor was called
    });

    it("does not color by another compute's streamed values", () => {
      // Arrange: the selection just changed; the latest frame still carries
      // the previous target's per-atom values.
      const { mockVisualizer, input, output } = setup(
        3,
        perAtomFrame([1, 2, 3], "c_previous"),
      );

      // Act
      colorModifier.runByProperty(
        input as ModifierInput,
        output as ModifierOutput,
      );

      // Assert
      expect(mockVisualizer.setColor).not.toHaveBeenCalled();
      expect(colorModifier.globalMinValue).toBe(Infinity);
    });

    it("colors a group label by membership from the frame's bitsets", () => {
      // Arrange: atoms 0 and 2 are in group bit 1 ("mobile").
      const label = `${GROUP_LABEL_PREFIX}mobile`;
      const frame: EngineFrame = {
        ...emptyEngineFrame(),
        count: 3,
        groups: {
          names: [`${GROUP_LABEL_PREFIX}all`, label],
          masks: new Uint32Array([0b11, 0b01, 0b11]),
        },
      };
      const { mockVisualizer, input, output } = setup(3, frame);
      input.computes = {
        [label]: {
          name: label,
          isPerAtom: true,
        } as unknown as ModifierInput["computes"][string],
      };
      colorModifier.computeName = label;

      // Act
      colorModifier.runByProperty(
        input as ModifierInput,
        output as ModifierOutput,
      );

      // Assert: members get the top of the fixed 0..1 range, others the
      // bottom.
      const colors = mockVisualizer.setColor.mock.calls.map(([, c]) => c);
      expect(colors).toHaveLength(3);
      expect(colors[0]).toEqual(colors[2]);
      expect(colors[1]).not.toEqual(colors[0]);
    });
  });

  describe("runByType", () => {
    it("scales the frame's native radii by the user's particle radius", () => {
      // Arrange
      const visualizer = { setRadius: vi.fn(), setColor: vi.fn() };
      const input = {
        renderState: {
          visualizer,
          particleStyles: [],
          particleRadius: 2,
        },
        frame: {
          ...emptyEngineFrame(),
          count: 2,
          radii: new Float32Array([0.5, 1.5]),
        },
      } as unknown as ModifierInput;
      const output = {
        colorsDirty: true,
        particles: { count: 2, indices: [7, 9], types: [1, 2] },
      } as unknown as ModifierOutput;

      // Act
      colorModifier.runByType(input, output);

      // Assert
      expect(visualizer.setRadius.mock.calls).toEqual([
        [7, 1],
        [9, 3],
      ]);
    });
  });
});
