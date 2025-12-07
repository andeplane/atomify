import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResponsiveSimulationSummary from "./ResponsiveSimulationSummary";
import type SimulationSummary from "./SimulationSummary";
import type SimulationSummaryExpanded from "./SimulationSummaryExpanded";

// Mock the child components
// Note: Using string paths for vi.mock as it's more reliable with JSX in mock factories
// Type safety is maintained through ComponentProps<typeof Component> for prop types
vi.mock("./SimulationSummary", () => ({
  default: ({
    isCollapsed,
    onShowMore,
    onExpand,
    onCollapse,
  }: ComponentProps<typeof SimulationSummary>) => (
    <div data-testid="simulation-summary">
      {isCollapsed && <div data-testid="collapsed">Collapsed</div>}
      {onShowMore && (
        <button type="button" data-testid="expand-button">
          Expand
        </button>
      )}
      {onExpand && (
        <button type="button" data-testid="expand-handler" onClick={onExpand}>
          Expand Handler
        </button>
      )}
      {onCollapse && (
        <button type="button" data-testid="collapse-handler" onClick={onCollapse}>
          Collapse Handler
        </button>
      )}
    </div>
  ),
}));

vi.mock("./SimulationSummaryExpanded", () => ({
  default: ({ onShowLess }: ComponentProps<typeof SimulationSummaryExpanded>) => (
    <div data-testid="simulation-summary-expanded">
      {onShowLess && (
        <button type="button" data-testid="show-less-button" onClick={onShowLess}>
          Show Less
        </button>
      )}
    </div>
  ),
}));

describe("ResponsiveSimulationSummary", () => {
  const defaultProps = {
    isEmbeddedMode: false,
    showSimulationSummary: true,
    isMobile: false,
    isOverlayCollapsed: false,
    showAnalyze: false,
    onExpand: vi.fn(),
    onCollapse: vi.fn(),
    onShowMore: vi.fn(),
    onShowLess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("non-embedded mode", () => {
    it("should render SimulationSummary when showAnalyze is false", () => {
      // Arrange & Act
      render(<ResponsiveSimulationSummary {...defaultProps} showAnalyze={false} />);

      // Assert
      expect(screen.getByTestId("simulation-summary")).toBeInTheDocument();
      expect(screen.queryByTestId("simulation-summary-expanded")).not.toBeInTheDocument();
    });

    it("should render SimulationSummaryExpanded when showAnalyze is true", () => {
      // Arrange & Act
      render(<ResponsiveSimulationSummary {...defaultProps} showAnalyze={true} />);

      // Assert
      expect(screen.getByTestId("simulation-summary-expanded")).toBeInTheDocument();
      expect(screen.queryByTestId("simulation-summary")).not.toBeInTheDocument();
    });

    it("should pass onShowLess to SimulationSummaryExpanded when showAnalyze is true", () => {
      // Arrange & Act
      render(<ResponsiveSimulationSummary {...defaultProps} showAnalyze={true} />);

      // Assert
      expect(screen.getByTestId("show-less-button")).toBeInTheDocument();
    });

    it("should pass onShowMore to SimulationSummary only on desktop (not mobile)", () => {
      // Arrange & Act - Desktop
      const { rerender } = render(
        <ResponsiveSimulationSummary {...defaultProps} isMobile={false} showAnalyze={false} />
      );

      // Assert - Desktop should have Expand button
      expect(screen.getByTestId("expand-button")).toBeInTheDocument();

      // Act - Mobile
      rerender(
        <ResponsiveSimulationSummary {...defaultProps} isMobile={true} showAnalyze={false} />
      );

      // Assert - Mobile should NOT have Expand button
      expect(screen.queryByTestId("expand-button")).not.toBeInTheDocument();
    });
  });

  describe("embedded mode", () => {
    it("should return null when showSimulationSummary is false", () => {
      // Arrange & Act
      const { container } = render(
        <ResponsiveSimulationSummary
          {...defaultProps}
          isEmbeddedMode={true}
          showSimulationSummary={false}
        />
      );

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("should render SimulationSummary when showSimulationSummary is true", () => {
      // Arrange & Act
      render(
        <ResponsiveSimulationSummary
          {...defaultProps}
          isEmbeddedMode={true}
          showSimulationSummary={true}
        />
      );

      // Assert
      expect(screen.getByTestId("simulation-summary")).toBeInTheDocument();
      expect(screen.queryByTestId("simulation-summary-expanded")).not.toBeInTheDocument();
    });

    it("should not show expanded view in embedded mode even when showAnalyze is true", () => {
      // Arrange & Act
      render(
        <ResponsiveSimulationSummary
          {...defaultProps}
          isEmbeddedMode={true}
          showSimulationSummary={true}
          showAnalyze={true}
        />
      );

      // Assert - Embedded mode ignores showAnalyze
      expect(screen.getByTestId("simulation-summary")).toBeInTheDocument();
      expect(screen.queryByTestId("simulation-summary-expanded")).not.toBeInTheDocument();
    });
  });

  describe("collapsed state", () => {
    it("should pass isCollapsed prop to SimulationSummary", () => {
      // Arrange & Act
      render(
        <ResponsiveSimulationSummary
          {...defaultProps}
          isOverlayCollapsed={true}
          showAnalyze={false}
        />
      );

      // Assert
      expect(screen.getByTestId("collapsed")).toBeInTheDocument();
    });

    it("should pass onExpand and onCollapse handlers", () => {
      // Arrange
      const onExpand = vi.fn();
      const onCollapse = vi.fn();

      // Act
      render(
        <ResponsiveSimulationSummary
          {...defaultProps}
          onExpand={onExpand}
          onCollapse={onCollapse}
          showAnalyze={false}
        />
      );

      // Assert
      expect(screen.getByTestId("expand-handler")).toBeInTheDocument();
      expect(screen.getByTestId("collapse-handler")).toBeInTheDocument();
    });
  });
});
