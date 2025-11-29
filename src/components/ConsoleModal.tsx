import { Modal, Button } from "antd";
import { useState, useEffect } from "react";
import Console from "../containers/Console";
import { useStoreActions, useStoreState } from "../hooks";

const ConsoleModal = () => {
  const showConsole = useStoreState((state) => state.simulation.showConsole);
  const lammpsOutput = useStoreState((state) => state.simulation.lammpsOutput);
  const [consoleKey, setConsoleKey] = useState(0);
  const setShowConsole = useStoreActions(
    (actions) => actions.simulation.setShowConsole,
  );
  const setPreferredView = useStoreActions(
    (actions) => actions.app.setPreferredView,
  );

  // Update console key when modal opens
  useEffect(() => {
    if (showConsole) {
      setConsoleKey(Date.now());
    }
  }, [showConsole]);

  // Handle download logs
  const handleDownloadLogs = () => {
    const logsText = lammpsOutput.join("\n");
    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lammps-logs-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle copy logs
  const handleCopyLogs = async () => {
    const logsText = lammpsOutput.join("\n");
    try {
      await navigator.clipboard.writeText(logsText);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = logsText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  // Handle analyze in notebook
  const handleAnalyzeInNotebook = () => {
    setShowConsole(false);
    setPreferredView(undefined);
    setPreferredView("notebook");
  };

  // Handle close
  const handleClose = () => {
    setShowConsole(false);
  };

  if (!showConsole) {
    return null;
  }

  return (
    <Modal
      className="console-modal"
      bodyStyle={{ backgroundColor: "#1E1E1E" }}
      width={"80%"}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <Button
              key="download"
              onClick={handleDownloadLogs}
            >
              Download logs
            </Button>
            <Button
              key="copy"
              onClick={handleCopyLogs}
              style={{ marginLeft: 8 }}
            >
              Copy logs
            </Button>
          </div>
          <div>
            <Button
              key="analyze"
              onClick={handleAnalyzeInNotebook}
            >
              Analyze in notebook
            </Button>
            <Button
              key="close"
              onClick={handleClose}
              style={{ marginLeft: 8 }}
            >
              Close
            </Button>
          </div>
        </div>
      }
      closable={false}
      open
      onCancel={handleClose}
    >
      <Console key={consoleKey} width={"100%"} height={"70vh"} />
    </Modal>
  );
};

export default ConsoleModal;
