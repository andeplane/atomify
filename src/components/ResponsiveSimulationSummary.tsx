import SimulationSummary from "./SimulationSummary";
import SimulationSummaryExpanded from "./SimulationSummaryExpanded";

interface ResponsiveSimulationSummaryProps {
  isEmbeddedMode: boolean;
  showSimulationSummary: boolean;
  isMobile: boolean;
  isOverlayCollapsed: boolean;
  showAnalyze: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onShowMore: () => void;
  onShowLess?: () => void;
}

const ResponsiveSimulationSummary = ({
  isEmbeddedMode,
  showSimulationSummary,
  isMobile,
  isOverlayCollapsed,
  showAnalyze,
  onExpand,
  onCollapse,
  onShowMore,
  onShowLess,
}: ResponsiveSimulationSummaryProps) => {
  const isDesktop = !isMobile;

  // In embedded mode: show overlay only if showSimulationSummary=true
  if (isEmbeddedMode) {
    if (showSimulationSummary) {
      return (
        <SimulationSummary
          isCollapsed={isOverlayCollapsed}
          onExpand={onExpand}
          onCollapse={onCollapse}
        />
      );
    }
    return null;
  }

  // In non-embedded mode: show expanded overlay when showAnalyze is true
  if (showAnalyze) {
    return (
      <SimulationSummaryExpanded
        onShowLess={onShowLess}
      />
    );
  }

  // Show regular overlay with Expand button
  return (
    <SimulationSummary
      isCollapsed={isOverlayCollapsed}
      onExpand={onExpand}
      onCollapse={onCollapse}
      onShowMore={isDesktop ? onShowMore : undefined}
    />
  );
};

export default ResponsiveSimulationSummary;

