/**
 * Project workspace (ADR-003 §2): quick-run banner, header (breadcrumb,
 * displayName + dirName/, Running pill, Share, Run split-button with
 * dropdown, project ⋯ menu), the Files | Runs | Notebook tabs, and the
 * per-tab content including the editor and run-detail sub-screens.
 */

import { useState } from "react";
import type { CSSProperties } from "react";
import { Tooltip } from "antd";
import { useStoreActions, useStoreState } from "../hooks";
import type { Screen } from "../store/projects";
import { useShellUI } from "./ShellContext";
import FilesTab from "./FilesTab";
import EditorScreen from "./EditorScreen";
import RunsTab from "./RunsTab";
import RunDetail from "./RunDetail";
import NotebookTab from "./NotebookTab";
import { ChevronDownIcon, DotsIcon, InfoIcon, PlayIcon, ShareIcon } from "./icons";
import {
  GhostButton,
  MenuDivider,
  MenuItem,
  MONO,
  Popover,
  RunningPill,
} from "./ui";

const ProjectWorkspace = ({ screen }: { screen: Screen & { name: "project" } }) => {
  const active = useStoreState((state) => state.projects.active);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const refreshActive = useStoreActions(
    (actions) => actions.projects.refreshActive,
  );
  const duplicateProject = useStoreActions(
    (actions) => actions.projects.duplicateProject,
  );
  const saveQuickAsProject = useStoreActions(
    (actions) => actions.projects.saveQuickAsProject,
  );
  const ui = useShellUI();

  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  if (!active || active.meta.dirName !== screen.dirName) {
    return (
      <div
        data-testid="workspace-loading"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-3)",
          fontSize: 13,
        }}
      >
        Opening project…
      </div>
    );
  }

  const meta = active.meta;
  const running = activeRun?.dirName === meta.dirName;
  const fileCount = active.files.filter(
    (file) => !file.path.startsWith(".atomify") && file.type !== "directory",
  ).length;

  const tabs: {
    key: "files" | "runs" | "notebook";
    label: string;
    count: string | null;
  }[] = [
    { key: "files", label: "Files", count: String(fileCount) },
    { key: "runs", label: "Runs", count: String(active.runs.length) },
  ];
  if (!active.quick) {
    tabs.push({ key: "notebook", label: "Notebook", count: null });
  }

  const tabStyle = (key: string): CSSProperties => {
    const isActive = screen.tab === key;
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 14px",
      border: "none",
      borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
      background: "transparent",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: isActive ? 700 : 500,
      color: isActive ? "var(--text)" : "var(--text-2)",
    };
  };

  const goTab = (tab: "files" | "runs" | "notebook") => {
    setScreen({ name: "project", dirName: meta.dirName, tab });
    void refreshActive();
  };

  const content =
    screen.tab === "files" && screen.filePath ? (
      <EditorScreen filePath={screen.filePath} />
    ) : screen.tab === "files" ? (
      <FilesTab />
    ) : screen.tab === "runs" && screen.runId ? (
      <RunDetail runId={screen.runId} />
    ) : screen.tab === "runs" ? (
      <RunsTab />
    ) : (
      <NotebookTab />
    );

  return (
    <>
      {/* Header */}
      <div
        data-testid="project-header"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-2)",
          padding: "0 32px",
        }}
      >
        {active.quick && (
          <div
            data-testid="quick-run-banner"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "16px 0 0",
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-line)",
              fontSize: 13,
              color: "var(--text)",
            }}
          >
            <span style={{ color: "var(--accent)", display: "flex", flexShrink: 0 }}>
              <InfoIcon />
            </span>
            <span style={{ flex: 1 }}>
              This is a quick run — files are temporary and will be discarded.
            </span>
            <button
              onClick={() => void saveQuickAsProject()}
              data-testid="save-as-project"
              className="shell-primary-hover"
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Save as project
            </button>
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 0 0",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "var(--text-3)",
                marginBottom: 4,
              }}
            >
              <a
                href="#"
                data-testid="breadcrumb-projects"
                onClick={(event) => {
                  event.preventDefault();
                  setScreen({ name: "home" });
                }}
                style={{ color: "var(--text-3)" }}
              >
                Projects
              </a>
              <span>/</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <h1
                data-testid="project-title"
                style={{
                  margin: 0,
                  fontSize: 21,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {meta.displayName}
              </h1>
              <span
                title="Folder name — what the Jupyter file browser shows. Never changes."
                data-testid="project-dirname"
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: "var(--text-3)",
                  flexShrink: 0,
                }}
              >
                {meta.dirName}/
              </span>
              {running && <RunningPill />}
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
            {!active.quick && (
              <GhostButton data-testid="share-button" onClick={() => ui.openShare()}>
                <ShareIcon />
                Share
              </GhostButton>
            )}
            <div style={{ position: "relative", display: "flex" }}>
              <Tooltip title={ui.engineReady ? "" : "Engine loading…"}>
                <button
                  onClick={() => void ui.runProject()}
                  disabled={!ui.engineReady || running}
                  data-testid="run-simulation"
                  className="shell-primary-hover"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    borderRadius: "10px 0 0 10px",
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor:
                      ui.engineReady && !running ? "pointer" : "not-allowed",
                    opacity: ui.engineReady && !running ? 1 : 0.6,
                    fontFamily: "inherit",
                  }}
                >
                  <PlayIcon />
                  Run simulation
                </button>
              </Tooltip>
              <button
                onClick={() => setRunMenuOpen((open) => !open)}
                title="Run options"
                data-testid="run-menu-toggle"
                className="shell-primary-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  borderRadius: "0 10px 10px 0",
                  border: "none",
                  borderLeft: "1px solid rgba(255,255,255,0.28)",
                  background: "var(--accent)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <ChevronDownIcon />
              </button>
              <Popover
                open={runMenuOpen}
                onClose={() => setRunMenuOpen(false)}
                minWidth={236}
                testId="run-menu"
              >
                <MenuItem
                  label="Run simulation"
                  hint="uses current variable values"
                  testId="run-menu-run"
                  onClick={() => {
                    setRunMenuOpen(false);
                    void ui.runProject();
                  }}
                />
                <MenuItem
                  label="Sweep variables…"
                  hint="one run per value, run sequentially"
                  testId="run-menu-sweep"
                  onClick={() => {
                    setRunMenuOpen(false);
                    ui.openNewRun();
                  }}
                />
                <MenuDivider />
                <MenuItem
                  label="Choose input script…"
                  testId="run-menu-choose-input"
                  onClick={() => {
                    setRunMenuOpen(false);
                    ui.openNewRun({ choosingInput: true });
                  }}
                />
              </Popover>
            </div>
            {!active.quick && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setProjectMenuOpen((open) => !open)}
                  title="Project actions"
                  data-testid="project-menu-toggle"
                  className="shell-hoverable shell-hoverable-text"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1px solid var(--border-strong)",
                    background: "transparent",
                    color: "var(--text-2)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DotsIcon />
                </button>
                <Popover
                  open={projectMenuOpen}
                  onClose={() => setProjectMenuOpen(false)}
                  testId="project-menu"
                >
                  <MenuItem
                    label="Rename…"
                    testId="project-menu-rename"
                    onClick={() => {
                      setProjectMenuOpen(false);
                      ui.openRename();
                    }}
                  />
                  <MenuItem
                    label="Duplicate"
                    hint="copies files + notebook, not runs"
                    testId="project-menu-duplicate"
                    onClick={() => {
                      setProjectMenuOpen(false);
                      void duplicateProject();
                    }}
                  />
                  <MenuDivider />
                  <MenuItem
                    label="Delete project…"
                    danger
                    testId="project-menu-delete"
                    onClick={() => {
                      setProjectMenuOpen(false);
                      ui.openDeleteProject(meta.dirName);
                    }}
                  />
                </Popover>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => goTab(tab.key)}
              style={tabStyle(tab.key)}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: 999,
                    background: "var(--chip)",
                    color: "var(--text-3)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {content}
    </>
  );
};

export default ProjectWorkspace;
