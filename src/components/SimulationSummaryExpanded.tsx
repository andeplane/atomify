import SimulationSummaryContent from "./SimulationSummaryContent";

interface SimulationSummaryExpandedProps {
  onShowLess?: () => void;
}

/**
 * Expanded (desktop, full-detail) view of the simulation summary overlay.
 * Renders the same content as the overlay/modal view, with the
 * expanded-view chrome (minimize button, wrapper class) via
 * SimulationSummaryContent's expanded prop.
 */
const SimulationSummaryExpanded = ({
  onShowLess,
}: SimulationSummaryExpandedProps) => {
  return <SimulationSummaryContent expanded onShowLess={onShowLess} />;
};

export default SimulationSummaryExpanded;
