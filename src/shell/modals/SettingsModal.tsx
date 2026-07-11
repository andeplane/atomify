/**
 * Settings modal (ADR-003 §5–6): General (theme), Rendering (existing render
 * settings on the new tokens), Storage (navigator.storage estimate + persist
 * toggle + per-project sizes with delete).
 */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useStoreActions, useStoreState } from "../../hooks";
import { track } from "../../utils/metrics";
import { useShellUI, type SettingsTab } from "../ShellContext";
import { formatBytes } from "../format";
import { CheckIcon, TrashIcon } from "../icons";
import { ColorDot, ModalShell, MONO, ToggleSwitch } from "../ui";

interface SettingsModalProps {
  open: boolean;
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onClose: () => void;
}

const SettingsModal = ({
  open,
  tab,
  onTabChange,
  onClose,
}: SettingsModalProps) => {
  const theme = useStoreState((state) => state.settings.theme);
  const renderSettings = useStoreState((state) => state.settings.render);
  const projects = useStoreState((state) => state.projects.projects);
  const setTheme = useStoreActions((actions) => actions.settings.setTheme);
  const changeTheme = (next: typeof theme) => {
    track("Theme.Change", { theme: next });
    setTheme(next);
  };
  const setRenderSettings = useStoreActions(
    (actions) => actions.settings.setRender,
  );
  const projectSizes = useStoreActions(
    (actions) => actions.projects.projectSizes,
  );
  const ui = useShellUI();

  const [estimate, setEstimate] = useState<{
    usage?: number;
    quota?: number;
  } | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [sizes, setSizes] = useState<
    Record<string, { bytes: number; runs: number }>
  >({});

  useEffect(() => {
    if (!open || tab !== "storage") {
      return;
    }
    let mounted = true;
    if (navigator.storage?.estimate) {
      navigator.storage
        .estimate()
        .then((result) => {
          if (mounted) {
            setEstimate({ usage: result.usage, quota: result.quota });
          }
        })
        .catch(() => {});
    }
    if (navigator.storage?.persisted) {
      navigator.storage
        .persisted()
        .then((value) => {
          if (mounted) {
            setPersisted(value);
          }
        })
        .catch(() => {});
    }
    projectSizes()
      .then((result) => {
        if (mounted) {
          setSizes(result);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [open, tab, projectSizes]);

  const togglePersist = async () => {
    if (!navigator.storage?.persist) {
      return;
    }
    // The Storage API has no "unpersist"; the toggle can only request it.
    const granted = await navigator.storage.persist();
    setPersisted(granted);
    track("Settings.Storage.Persist", { granted });
  };

  const tabStyle = (key: SettingsTab): CSSProperties => ({
    padding: "11px 2px",
    marginRight: 22,
    border: "none",
    borderBottom: `2px solid ${tab === key ? "var(--accent)" : "transparent"}`,
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: tab === key ? 700 : 500,
    color: tab === key ? "var(--text)" : "var(--text-2)",
  });

  const themeCardStyle = (mode: "dark" | "light"): CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    cursor: "pointer",
    border: `1.5px solid ${theme === mode ? "var(--accent)" : "var(--border)"}`,
    background: theme === mode ? "var(--accent-soft)" : "var(--surface-2)",
  });

  const checkboxRow = (
    key: "showSimulationBox" | "showWalls" | "orthographic",
    label: string,
  ) => {
    const on = renderSettings[key];
    return (
      <label
        key={key}
        onClick={() => setRenderSettings({ ...renderSettings, [key]: !on })}
        data-testid={`render-${key}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "9px 0",
          fontSize: 14,
          color: "var(--text)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            flexShrink: 0,
            borderRadius: 5,
            border: on ? "none" : "1.5px solid var(--border-strong)",
            background: on ? "var(--accent)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          {on && <CheckIcon size={11} strokeWidth={3.5} />}
        </span>
        {label}
      </label>
    );
  };

  const usage = estimate?.usage ?? 0;
  const quota = estimate?.quota ?? 0;
  const usagePercent = quota > 0 ? Math.min(100, (100 * usage) / quota) : 0;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Settings"
      maxWidth={600}
      testId="settings-modal"
    >
      <div
        style={{
          display: "flex",
          padding: "4px 24px 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => onTabChange("general")}
          style={tabStyle("general")}
          data-testid="settings-tab-general"
        >
          General
        </button>
        <button
          onClick={() => onTabChange("rendering")}
          style={tabStyle("rendering")}
          data-testid="settings-tab-rendering"
        >
          Rendering
        </button>
        <button
          onClick={() => onTabChange("storage")}
          style={tabStyle("storage")}
          data-testid="settings-tab-storage"
        >
          Storage
        </button>
      </div>
      <div style={{ padding: "20px 24px 24px" }}>
        {tab === "general" && (
          <>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 10,
              }}
            >
              Theme
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                onClick={() => changeTheme("dark")}
                style={themeCardStyle("dark")}
                data-testid="theme-card-dark"
              >
                <span
                  style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 8,
                    background: "#0B0D12",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Dark
                </span>
              </div>
              <div
                onClick={() => changeTheme("light")}
                style={themeCardStyle("light")}
                data-testid="theme-card-light"
              >
                <span
                  style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 8,
                    background: "#F3F5F9",
                    border: "1px solid rgba(0,0,0,0.08)",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Light
                </span>
              </div>
            </div>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                fontSize: 12,
                color: "var(--text-2)",
                lineHeight: 1.55,
              }}
            >
              Files autosave as you type. The notebook (JupyterLite) keeps its
              own theme setting.
            </div>
          </>
        )}

        {tab === "rendering" && (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                marginBottom: 16,
              }}
            >
              {checkboxRow("showSimulationBox", "Show simulation box")}
              {checkboxRow("showWalls", "Show walls")}
              {checkboxRow("orthographic", "Orthographic camera")}
            </div>
            <div
              style={{ paddingTop: 14, borderTop: "1px solid var(--border)" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "var(--text-2)",
                  marginBottom: 9,
                }}
              >
                <span>Ambient light intensity</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                  {renderSettings.ambientLightIntensity.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                data-testid="ambient-light-slider"
                value={Math.round(renderSettings.ambientLightIntensity * 100)}
                onChange={(event) =>
                  setRenderSettings({
                    ...renderSettings,
                    ambientLightIntensity: Number(event.target.value) / 100,
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "var(--text-2)",
                  marginBottom: 9,
                }}
              >
                <span>Point light intensity</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                  {renderSettings.pointLightIntensity.toFixed(0)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                data-testid="point-light-slider"
                value={renderSettings.pointLightIntensity}
                onChange={(event) =>
                  setRenderSettings({
                    ...renderSettings,
                    pointLightIntensity: Number(event.target.value),
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
          </>
        )}

        {tab === "storage" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              <span style={{ color: "var(--text-2)" }}>
                Browser storage used
              </span>
              <span
                style={{ color: "var(--text)", fontWeight: 600 }}
                data-testid="storage-used"
              >
                {estimate
                  ? `${formatBytes(usage)} of ~${formatBytes(quota)}`
                  : "…"}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--border-strong)",
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: `${usagePercent}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "var(--accent)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 11,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                marginBottom: 18,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Protect from eviction
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-3)",
                    marginTop: 2,
                  }}
                >
                  Asks the browser to never clear this site's storage
                </div>
              </div>
              <ToggleSwitch
                on={persisted === true}
                onToggle={() => void togglePersist()}
                disabled={persisted === null || persisted === true}
                data-testid="persist-toggle"
              />
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-3)",
                marginBottom: 8,
              }}
            >
              Per project
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {projects.length === 0 && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-3)",
                    padding: "8px 0",
                  }}
                >
                  No projects yet.
                </div>
              )}
              {projects.map((project) => {
                const size = sizes[project.dirName];
                return (
                  <div
                    key={project.dirName}
                    data-testid={`storage-row-${project.dirName}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "9px 2px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <ColorDot color={project.color} />
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {project.displayName}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-3)",
                        fontFamily: MONO,
                        flexShrink: 0,
                      }}
                    >
                      {project.dirName}/
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-2)",
                        width: 58,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {size ? `${size.runs} runs` : "…"}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text)",
                        fontWeight: 600,
                        width: 62,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                      }}
                    >
                      {size ? formatBytes(size.bytes) : "…"}
                    </span>
                    <button
                      onClick={() => ui.openDeleteProject(project.dirName)}
                      title="Delete project…"
                      data-testid={`storage-delete-${project.dirName}`}
                      className="shell-icon-hover-bad"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        border: "none",
                        background: "transparent",
                        color: "var(--text-3)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
};

export default SettingsModal;
