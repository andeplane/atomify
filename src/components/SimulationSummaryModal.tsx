import { Modal } from "antd";
import { track } from "../utils/metrics";
import SimulationSummaryContent from "./SimulationSummaryContent";

interface SimulationSummaryModalProps {
  open: boolean;
  onClose: () => void;
}

const SimulationSummaryModal = ({ open, onClose }: SimulationSummaryModalProps) => {
  const handleClose = () => {
    track("SimulationSummary.Modal.Close");
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width="90%"
      style={{ maxWidth: "600px" }}
      title="Simulation Summary"
    >
      <SimulationSummaryContent />
    </Modal>
  );
};

export default SimulationSummaryModal;
