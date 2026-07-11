/**
 * Notebook tab (ADR-002/003): the JupyterLite iframe opened on the project's
 * notebook. JupyterLite mounts the same contents store the project lives in,
 * so runs/ outputs are readable directly — no sync. Hidden for quick
 * projects (scratch storage is invisible to Jupyter).
 */

import { useMemo } from "react";
import { useStoreState } from "../hooks";
import { notebookUrlFor } from "../containers/Notebook";
import { ExternalIcon } from "./icons";
import { GhostButton, MONO } from "./ui";

const NotebookTab = () => {
  const active = useStoreState((state) => state.projects.active);

  const url = useMemo(() => {
    if (!active) {
      return notebookUrlFor(undefined, undefined);
    }
    const notebook = active.files.find(
      (file) => file.type !== "directory" && file.path.endsWith(".ipynb"),
    );
    return notebookUrlFor(active.meta.dirName, notebook?.path);
  }, [active]);

  if (!active || active.quick) {
    return null;
  }

  return (
    <div
      data-testid="notebook-tab"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 32px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-2)",
        }}
      >
        <span style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
          JupyterLite runs fully in your browser and mounts this project's
          filesystem — outputs in{" "}
          <span style={{ fontFamily: MONO, color: "var(--text)" }}>runs/</span>{" "}
          are readable directly.
        </span>
        <div style={{ flex: 1 }} />
        <GhostButton
          data-testid="notebook-open-new-tab"
          style={{ padding: "7px 13px", borderRadius: 9, fontSize: 12.5 }}
          onClick={() => window.open(url, "_blank", "noopener")}
        >
          <ExternalIcon />
          Open in new tab
        </GhostButton>
      </div>
      <iframe
        title="Notebook"
        src={url}
        data-testid="notebook-iframe"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          background: "var(--surface)",
          minHeight: 0,
        }}
      />
    </div>
  );
};

export default NotebookTab;
