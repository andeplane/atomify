/**
 * Notebook tab (ADR-002/003): the JupyterLite iframe opened on the project's
 * notebook. JupyterLite mounts the same contents store the project lives in,
 * so runs/ outputs are readable directly — no sync. Hidden for quick
 * projects (scratch storage is invisible to Jupyter).
 *
 * The iframe is kept alive: the Shell renders this host for the whole
 * session, and once a project's notebook has been opened it stays mounted
 * (hidden) while the user is on other tabs or screens. Coming back shows the
 * same JupyterLab session, with its kernel and cell outputs intact, instead
 * of booting JupyterLite again. Opening another project's notebook replaces
 * it.
 */

import { useEffect, useState } from "react";
import { useStoreState } from "../hooks";
import { findProjectNotebook, notebookUrlFor } from "./notebookUrl";
import { track } from "../utils/metrics";
import { ExternalIcon } from "./icons";
import { GhostButton, MONO } from "./ui";

interface LoadedNotebook {
  dirName: string;
  url: string;
}

const NotebookTab = () => {
  const screen = useStoreState((state) => state.projects.screen);
  const active = useStoreState((state) => state.projects.active);

  const wanted =
    screen.name === "project" &&
    screen.tab === "notebook" &&
    active &&
    !active.quick &&
    active.meta.dirName === screen.dirName
      ? active
      : null;

  const [loaded, setLoaded] = useState<LoadedNotebook | null>(null);

  // Load (or switch to) the notebook of the project being shown. The URL is
  // only computed when the notebook is opened, so later file-list refreshes
  // never change the iframe src and never reload it.
  useEffect(() => {
    if (!wanted) {
      return;
    }
    const dirName = wanted.meta.dirName;
    setLoaded((current) => {
      if (current?.dirName === dirName) {
        return current;
      }
      const notebook = findProjectNotebook(wanted.files);
      return { dirName, url: notebookUrlFor(dirName, notebook?.path) };
    });
  }, [wanted]);

  const visible = wanted !== null && loaded?.dirName === wanted.meta.dirName;

  // UI-only event (the store never learns the tab was opened).
  useEffect(() => {
    if (visible) {
      track("Notebook.Open", {});
    }
  }, [visible]);

  if (!loaded) {
    return null;
  }

  return (
    <div
      data-testid="notebook-tab"
      aria-hidden={!visible}
      style={{
        flex: 1,
        display: visible ? "flex" : "none",
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
        <span
          style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}
        >
          JupyterLite runs fully in your browser and mounts this project's
          filesystem — outputs in{" "}
          <span style={{ fontFamily: MONO, color: "var(--text)" }}>runs/</span>{" "}
          are readable directly.
        </span>
        <div style={{ flex: 1 }} />
        <GhostButton
          data-testid="notebook-open-new-tab"
          style={{ padding: "7px 13px", borderRadius: 9, fontSize: 12.5 }}
          onClick={() => window.open(loaded.url, "_blank", "noopener")}
        >
          <ExternalIcon />
          Open in new tab
        </GhostButton>
      </div>
      <iframe
        key={loaded.dirName}
        title="Notebook"
        src={loaded.url}
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
