import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import Figure from "./Figure";
import { Compute, Fix, Variable, PlotData, LMPModifier, ModifierType } from "../types";

// Mock useStoreState hook
vi.mock("../hooks", () => ({
  useStoreState: vi.fn(() => 0), // Return timesteps = 0
}));

// Mock Dygraph constructor
vi.mock("dygraphs", () => {
  const MockDygraph = vi.fn(function (this: { updateOptions: ReturnType<typeof vi.fn> }) {
    this.updateOptions = vi.fn();
    return this;
  });
  return {
    default: MockDygraph,
  };
});

// Mock antd Modal and Empty components
vi.mock("antd", () => ({
  Modal: ({ children, open, onCancel }: { children: React.ReactNode; open: boolean; onCancel: () => void }) => (
    open ? <div data-testid="modal" onClick={onCancel}>{children}</div> : null
  ),
  Empty: () => <div data-testid="empty">Empty</div>,
}));

describe("Figure", () => {
  let mockOnClose: () => void;
  let mockOnToggleSyncDataPoints: (
    name: string,
    type: "compute" | "fix" | "variable",
    value: boolean,
  ) => void;

  beforeEach(() => {
    mockOnClose = vi.fn(() => {});
    mockOnToggleSyncDataPoints = vi.fn(() => {});
  });

  const createMockLMPModifier = (): LMPModifier => ({
    getName: vi.fn(() => "mock-name"),
    getType: vi.fn(() => 61),
    getPerAtomData: vi.fn(() => 0),
    getIsPerAtom: vi.fn(() => false),
    hasScalarData: vi.fn(() => false),
    getClearPerSync: vi.fn(() => false),
    getScalarValue: vi.fn(() => 0),
    sync: vi.fn(),
    getXLabel: vi.fn(() => "Time"),
    getYLabel: vi.fn(() => "Value"),
    getData1DNames: vi.fn(() => ({
      get: vi.fn(),
      size: vi.fn(() => 0),
      delete: vi.fn(),
    })),
    getData1D: vi.fn(() => ({
      get: vi.fn(),
      size: vi.fn(() => 0),
      delete: vi.fn(),
    })),
    execute: vi.fn(() => true),
    delete: vi.fn(),
  });

  const createMockCompute = (overrides?: Partial<Compute>): Compute => {
    const mock: Partial<Compute> = {
      name: "test-compute",
      type: ModifierType.ComputeOther,
      isPerAtom: false,
      hasScalarData: true,
      scalarValue: 1.0,
      data1D: {
        data: [[0, 1], [1, 2]],
        labels: ["x", "y"],
      },
      xLabel: "Time",
      yLabel: "Value",
      clearPerSync: false,
      syncDataPoints: false,
      hasData1D: true,
      lmpCompute: createMockLMPModifier(),
      ...overrides,
    };
    return mock as Compute;
  };

  const createMockFix = (overrides?: Partial<Fix>): Fix => {
    const mock: Partial<Fix> = {
      name: "test-fix",
      type: ModifierType.FixOther,
      isPerAtom: false,
      hasScalarData: true,
      scalarValue: 1.0,
      data1D: {
        data: [[0, 1], [1, 2]],
        labels: ["x", "y"],
      },
      xLabel: "Time",
      yLabel: "Value",
      clearPerSync: false,
      syncDataPoints: false,
      hasData1D: true,
      lmpFix: createMockLMPModifier(),
      ...overrides,
    };
    return mock as Fix;
  };

  const createMockVariable = (overrides?: Partial<Variable>): Variable => {
    const mock: Partial<Variable> = {
      name: "test-variable",
      type: ModifierType.VariableOther,
      isPerAtom: false,
      hasScalarData: true,
      scalarValue: 1.0,
      data1D: {
        data: [[0, 1], [1, 2]],
        labels: ["x", "y"],
      },
      xLabel: "Time",
      yLabel: "Value",
      clearPerSync: false,
      syncDataPoints: false,
      hasData1D: true,
      lmpVariable: createMockLMPModifier(),
      ...overrides,
    };
    return mock as Variable;
  };

  const createMockPlotData = (overrides?: Partial<PlotData>): PlotData => ({
    name: "test-plot",
    data1D: {
      data: [[0, 1], [1, 2]],
      labels: ["x", "y"],
    },
    xLabel: "Time",
    yLabel: "Value",
    ...overrides,
  });

  describe("onToggleSyncDataPoints callback", () => {
    it("should call callback with true when compute modifier is mounted", () => {
      // Arrange
      const modifier = createMockCompute({ name: "my-compute" });

      // Act
      render(
        <Figure
          modifier={modifier}
          modifierType="compute"
          onToggleSyncDataPoints={mockOnToggleSyncDataPoints}
          onClose={mockOnClose}
        />
      );

      // Assert
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledTimes(1);
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledWith("my-compute", "compute", true);
    });

    it("should call callback with true when fix modifier is mounted", () => {
      // Arrange
      const modifier = createMockFix({ name: "my-fix" });

      // Act
      render(
        <Figure
          modifier={modifier}
          modifierType="fix"
          onToggleSyncDataPoints={mockOnToggleSyncDataPoints}
          onClose={mockOnClose}
        />
      );

      // Assert
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledTimes(1);
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledWith("my-fix", "fix", true);
    });

    it("should call callback with true when variable modifier is mounted", () => {
      // Arrange
      const modifier = createMockVariable({ name: "my-variable" });

      // Act
      render(
        <Figure
          modifier={modifier}
          modifierType="variable"
          onToggleSyncDataPoints={mockOnToggleSyncDataPoints}
          onClose={mockOnClose}
        />
      );

      // Assert
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledTimes(1);
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledWith("my-variable", "variable", true);
    });

    it("should call callback with false when component unmounts", () => {
      // Arrange
      const modifier = createMockCompute({ name: "unmount-test" });

      // Act
      const { unmount } = render(
        <Figure
          modifier={modifier}
          modifierType="compute"
          onToggleSyncDataPoints={mockOnToggleSyncDataPoints}
          onClose={mockOnClose}
        />
      );

      // Verify initial call
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledTimes(1);
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledWith("unmount-test", "compute", true);

      // Unmount
      act(() => {
        unmount();
      });

      // Assert cleanup was called
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledTimes(2);
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledWith("unmount-test", "compute", false);
    });

    it("should not call callback when plotData is provided instead of modifier", () => {
      // Arrange
      const plotData = createMockPlotData();

      // Act
      render(
        <Figure
          plotData={plotData}
          onClose={mockOnClose}
        />
      );

      // Assert
      expect(mockOnToggleSyncDataPoints).not.toHaveBeenCalled();
    });

    it("should not call callback when onToggleSyncDataPoints is not provided", () => {
      // Arrange
      const modifier = createMockCompute();

      // Act
      render(
        <Figure
          modifier={modifier}
          modifierType="compute"
          onClose={mockOnClose}
        />
      );

      // Assert
      expect(mockOnToggleSyncDataPoints).not.toHaveBeenCalled();
    });

    it("should update callback when modifier changes", () => {
      // Arrange
      const modifier1 = createMockCompute({ name: "compute-1" });
      const modifier2 = createMockCompute({ name: "compute-2" });

      // Act
      const { rerender } = render(
        <Figure
          modifier={modifier1}
          modifierType="compute"
          onToggleSyncDataPoints={mockOnToggleSyncDataPoints}
          onClose={mockOnClose}
        />
      );

      // Assert initial call
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledTimes(1);
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledWith("compute-1", "compute", true);

      // Rerender with different modifier
      act(() => {
        rerender(
          <Figure
            modifier={modifier2}
            modifierType="compute"
            onToggleSyncDataPoints={mockOnToggleSyncDataPoints}
            onClose={mockOnClose}
          />
        );
      });

      // Assert: cleanup for old modifier, then call for new modifier
      expect(mockOnToggleSyncDataPoints).toHaveBeenCalledTimes(3);
      expect(mockOnToggleSyncDataPoints).toHaveBeenNthCalledWith(2, "compute-1", "compute", false);
      expect(mockOnToggleSyncDataPoints).toHaveBeenNthCalledWith(3, "compute-2", "compute", true);
    });
  });

  describe("rendering", () => {
    it("should render modal when open", () => {
      // Arrange
      const plotData = createMockPlotData();

      // Act
      render(<Figure plotData={plotData} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    it("should render empty state when graph is not initialized", () => {
      // Arrange
      const plotData = createMockPlotData({
        data1D: undefined,
      });

      // Act
      render(<Figure plotData={plotData} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByTestId("empty")).toBeInTheDocument();
    });
  });
});

