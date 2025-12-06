import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ColorLegend from "./ColorLegend";

describe("ColorLegend", () => {
  beforeEach(() => {
    // Mock canvas context
    const mockContext = {
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      fillRect: vi.fn(),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      // Arrange
      const props = {
        computeName: "c_ke",
        minValue: 0,
        maxValue: 100,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("c_ke")).toBeInTheDocument();
    });

    it("should display compute name as title", () => {
      // Arrange
      const props = {
        computeName: "c_potential",
        minValue: -10,
        maxValue: 10,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("c_potential")).toBeInTheDocument();
    });

    it("should display compute name with type when type is provided", () => {
      // Arrange
      const props = {
        computeName: "c_ke",
        minValue: 0,
        maxValue: 100,
        type: "compute" as const,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("c_ke (Compute)")).toBeInTheDocument();
    });

    it("should display fix name with type when type is fix", () => {
      // Arrange
      const props = {
        computeName: "displace",
        minValue: 0,
        maxValue: 10,
        type: "fix" as const,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("displace (Fix)")).toBeInTheDocument();
    });

    it("should display variable name with type when type is variable", () => {
      // Arrange
      const props = {
        computeName: "displace",
        minValue: 0,
        maxValue: 10,
        type: "variable" as const,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("displace (Variable)")).toBeInTheDocument();
    });

    it("should display min and max values", () => {
      // Arrange
      const props = {
        computeName: "c_temp",
        minValue: 273.15,
        maxValue: 373.15,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("Min:")).toBeInTheDocument();
      expect(screen.getByText("Max:")).toBeInTheDocument();
      expect(screen.getByText("273")).toBeInTheDocument();
      expect(screen.getByText("373")).toBeInTheDocument();
    });
  });

  describe("value formatting", () => {
    it("should format small values in exponential notation", () => {
      // Arrange
      const props = {
        computeName: "c_small",
        minValue: 0.0001,
        maxValue: 0.001,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("1.00e-4")).toBeInTheDocument();
      expect(screen.getByText("1.00e-3")).toBeInTheDocument();
    });

    it("should format large values in exponential notation", () => {
      // Arrange
      const props = {
        computeName: "c_large",
        minValue: 10000,
        maxValue: 100000,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("1.00e+4")).toBeInTheDocument();
      expect(screen.getByText("1.00e+5")).toBeInTheDocument();
    });

    it("should format regular values with 3 significant figures", () => {
      // Arrange
      const props = {
        computeName: "c_normal",
        minValue: 1.23456,
        maxValue: 9.87654,
      };

      // Act
      render(<ColorLegend {...props} />);

      // Assert
      expect(screen.getByText("1.23")).toBeInTheDocument();
      expect(screen.getByText("9.88")).toBeInTheDocument();
    });
  });

  describe("canvas gradient", () => {
    it("should create canvas element", () => {
      // Arrange
      const props = {
        computeName: "c_test",
        minValue: 0,
        maxValue: 1,
      };

      // Act
      const { container } = render(<ColorLegend {...props} />);

      // Assert
      const canvas = container.querySelector("canvas");
      expect(canvas).toBeInTheDocument();
    });
  });
});
