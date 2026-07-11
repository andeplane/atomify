import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Input, Alert, Spin, message } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { Simulation } from "../store/simulation";
import { encodeSimulation } from "../utils/embed/codec";
import { track } from "../utils/metrics";

// GitHub Pages has a ~2KB URL length limit
const GITHUB_PAGES_URL_LIMIT = 2000;

interface ShareSimulationProps {
  visible: boolean;
  onClose: () => void;
  simulation: Simulation;
}

/**
 * Produces an embed link for the simulation. Plain (non-embed) share links
 * are no longer supported — without embed=true the app opens the projects
 * shell — so every generated URL bakes in embed=true (which also implies
 * autostart).
 */
const ShareSimulation: React.FC<ShareSimulationProps> = ({
  visible,
  onClose,
  simulation,
}) => {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const generateShareUrl = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const encodedData = await encodeSimulation(simulation);

      // Track with file details
      const fileNames = simulation.files.map((f) => f.fileName);
      track("ShareSimulation.Generate", {
        simulationId: simulation.id,
        embedMode: true,
        autoStart: true,
        fileNames,
        fileCount: simulation.files.length,
        urlLength: encodedData.length, // Just the encoded data part
      });

      // Get the base URL (without query parameters)
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const url = `${baseUrl}?data=${encodedData}&embed=true&autostart=true`;

      setShareUrl(url);
    } catch (err) {
      console.error("Error generating embed URL:", err);
      setError(
        `Failed to generate embed URL: ${err instanceof Error ? err.message : String(err)}`,
      );
      track("ShareSimulation.Error", {
        simulationId: simulation.id,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, [simulation]);

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
      title="Embed link"
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
          Copy the embed link below. It opens the simulation full screen in
          embedded mode and starts it automatically — use it in presentations,
          iframes on other websites, or with viewers who just want to watch the
          simulation. The entire simulation (including all files) is encoded in
          the URL, so no external hosting is required.
        </p>
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
              shareUrl.length < GITHUB_PAGES_URL_LIMIT
                ? "This URL should work on GitHub Pages."
                : "This URL may not work on GitHub Pages (has ~2KB limit). Consider reducing simulation size or number of files."
            }
            type={
              shareUrl.length < GITHUB_PAGES_URL_LIMIT ? "success" : "warning"
            }
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
        <Alert message="Error" description={error} type="error" showIcon />
      )}
    </Modal>
  );
};

export default ShareSimulation;
