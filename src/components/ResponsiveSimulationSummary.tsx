import SimulationSummaryOverlay from "./SimulationSummaryOverlay";

interface ResponsiveSimulationSummaryProps {
  isEmbeddedMode: boolean;
  showSimulationSummary: boolean;
  isMobile: boolean;
  isOverlayCollapsed: boolean;
  showAnalyze: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onShowMore: () => void;
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
}: ResponsiveSimulationSummaryProps) => {
  const isDesktop = !isMobile;

  // In embedded mode: show overlay only if showSimulationSummary=true
  if (isEmbeddedMode) {
    if (showSimulationSummary) {
      return (
        <SimulationSummaryOverlay
          isCollapsed={isOverlayCollapsed}
          onExpand={onExpand}
          onCollapse={onCollapse}
        />
      );
    }
    return null;
  }

  // In non-embedded mode: overlay can be collapsed/expanded
  // Desktop shows "Show more" button when expanded, mobile doesn't
  if (!showAnalyze) {
    return (
      <SimulationSummaryOverlay
        isCollapsed={isOverlayCollapsed}
        onExpand={onExpand}
        onCollapse={onCollapse}
        onShowMore={isDesktop ? onShowMore : undefined}
      />
    );
  }

  return null;
};

export default ResponsiveSimulationSummary;

