import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Alert, Spin, message, Checkbox } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { Simulation } from "../store/simulation";
import { encodeSimulation } from "../utils/embed/codec";
import { track } from "../utils/metrics";

interface ShareSimulationProps {
  visible: boolean;
  onClose: () => void;
  simulation: Simulation;
}

const ShareSimulation: React.FC<ShareSimulationProps> = ({
  visible,
  onClose,
  simulation,
}) => {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [embedMode, setEmbedMode] = useState<boolean>(false);
  const [autoStart, setAutoStart] = useState<boolean>(true);

  useEffect(() => {
    if (visible && simulation) {
      generateShareUrl();
    }
  }, [visible, simulation, embedMode, autoStart]);

  const generateShareUrl = async () => {
    setLoading(true);
    setError(undefined);
    try {
      track("ShareSimulation.Generate", { simulationId: simulation.id, embedMode, autoStart });
      const encodedData = await encodeSimulation(simulation);
      
      // Get the base URL (without query parameters)
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const embedParam = embedMode ? '&embed=true' : '';
      const autoStartParam = autoStart ? '&autostart=true' : '';
      const url = `${baseUrl}?data=${encodedData}${embedParam}${autoStartParam}`;
      
      setShareUrl(url);
      
      // Warn if URL is too long (Firefox has a ~65KB limit, so we warn at 50KB to be safe)
      if (url.length > 50000) {
        setError(
          `Warning: The generated URL is ${Math.round(url.length / 1024)}KB. Firefox has a ~65KB URL limit, so this may not work in Firefox. Consider reducing simulation size or number of files.`
        );
      }
    } catch (err) {
      console.error("Error generating share URL:", err);
      setError(`Failed to generate share URL: ${err instanceof Error ? err.message : String(err)}`);
      track("ShareSimulation.Error", { 
        simulationId: simulation.id,
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      message.success("URL copied to clipboard!");
      track("ShareSimulation.Copy", { simulationId: simulation.id });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      message.error("Failed to copy URL to clipboard");
      console.error("Copy failed:", err);
    }
  };

  const handleClose = () => {
    setCopied(false);
    setError(undefined);
    onClose();
  };

  const urlSizeKB = shareUrl ? Math.round(shareUrl.length / 1024) : 0;

  return (
    <Modal
      title="Share Simulation"
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Close
        </Button>,
      ]}
      width={700}
    >
      <div style={{ marginBottom: 16 }}>
        <p>
          Share this simulation by copying the URL below. The entire simulation
          (including all files) is encoded in the URL, so no external hosting is
          required.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Checkbox
          checked={embedMode}
          onChange={(e) => setEmbedMode(e.target.checked)}
        >
          Share in full screen, <strong>embedded mode</strong>. Use this for presentations, 
          embedding in websites, or sharing with users who just want to view 
          the simulation.
        </Checkbox>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Checkbox
          checked={autoStart}
          onChange={(e) => setAutoStart(e.target.checked)}
        >
          <strong>Auto-start simulation</strong> when opened
        </Checkbox>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Encoding simulation...</p>
        </div>
      )}

      {!loading && shareUrl && (
        <>
          <Input.TextArea
            value={shareUrl}
            readOnly
            rows={4}
            style={{ marginBottom: 16, fontFamily: "monospace", fontSize: 12 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={copyToClipboard}
              block
            >
              {copied ? "Copied!" : "Copy URL to Clipboard"}
            </Button>
          </div>

          <Alert
            message={`URL size: ${urlSizeKB} KB`}
            description={
              urlSizeKB < 50
                ? "This URL should work in all browsers including Firefox."
                : "This URL may not work in Firefox (has ~65KB limit). Chrome and Safari support larger URLs."
            }
            type={urlSizeKB < 50 ? "success" : "warning"}
            showIcon
          />

          {error && (
            <Alert
              message="Warning"
              description={error}
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}

      {!loading && !shareUrl && error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      )}
    </Modal>
  );
};

export default ShareSimulation;

