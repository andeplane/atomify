import React, { useState, useEffect, useCallback } from "react";
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
  const [autoStart, setAutoStart] = useState<boolean>(false);

  const generateShareUrl = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const encodedData = await encodeSimulation(simulation);
      
      // Track with file details
      const fileNames = simulation.files.map(f => f.fileName);
      track("ShareSimulation.Generate", { 
        simulationId: simulation.id,
        embedMode,
        autoStart,
        fileNames,
        fileCount: simulation.files.length,
        urlLength: encodedData.length  // Just the encoded data part
      });
      
      // Get the base URL (without query parameters)
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const embedParam = embedMode ? '&embed=true' : '';
      // When embedMode is true, autoStart is always true
      const effectiveAutoStart = embedMode || autoStart;
      const autoStartParam = effectiveAutoStart ? '&autostart=true' : '';
      const url = `${baseUrl}?data=${encodedData}${embedParam}${autoStartParam}`;
      
      setShareUrl(url);
      
      // Warn if URL is too long (GitHub Pages has a ~2KB limit)
      if (url.length >= 2000) {
        setError(
          `Warning: The generated URL is ${Math.round(url.length / 1024)}KB. GitHub Pages has a ~2KB URL limit, so this may not work. Consider reducing simulation size or number of files.`
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
  }, [simulation, embedMode, autoStart]);

  useEffect(() => {
    if (visible && simulation) {
      track("ShareSimulation.Open", { simulationId: simulation.id });
      generateShareUrl();
    }
  }, [visible, simulation, generateShareUrl]);

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
          checked={embedMode || autoStart}
          onChange={(e) => setAutoStart(e.target.checked)}
          disabled={embedMode}
        >
          <strong>Auto-start simulation</strong> when opened
        </Checkbox>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Checkbox
          checked={embedMode}
          onChange={(e) => setEmbedMode(e.target.checked)}
        >
          <strong>Embedded mode:</strong> Share in full screen, embedded mode. Use this for presentations, 
          embedding in websites, or sharing with users who just want to view 
          the simulation.
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
              shareUrl.length < 2000
                ? "This URL should work on GitHub Pages."
                : "This URL may not work on GitHub Pages (has ~2KB limit). Consider reducing simulation size or number of files."
            }
            type={shareUrl.length < 2000 ? "success" : "warning"}
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

