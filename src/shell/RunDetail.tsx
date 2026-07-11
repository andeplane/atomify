/**
 * Run detail (ADR-003 §4): live 3D viewport + following console + status
 * panel while running; frame.png (or a designed placeholder with Run again)
 * plus the persisted log for finished runs — never a silent black canvas.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import View from "../containers/View";
import type { FileStat } from "../storage";
import { useShellUI } from "./ShellContext";
import { formatBytes, formatDuration, runNumber } from "./format";
import { BackIcon, ChartIcon, FileIcon, PlayIcon, StopIcon } from "./icons";
import { Chip, GhostButton, MONO, PulseDot, StatusPill } from "./ui";

const RunDetail = ({ runId }: { runId: string }) => {
  const active = useStoreState((state) => state.projects.active);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const lammpsOutput = useStoreState((state) => state.simulation.lammpsOutput);
  const runTimesteps = useStoreState(
    (state) => state.simulationStatus.runTimesteps,
  );
  const runTotalTimesteps = useStoreState(
    (state) => state.simulationStatus.runTotalTimesteps,
  );
  const numAtoms = useStoreState((state) => state.simulationStatus.numAtoms);
  const runType = useStoreState((state) => state.simulationStatus.runType);
  const remainingTime = useStoreState(
    (state) => state.simulationStatus.remainingTime,
  );
  const timestepsPerSecond = useStoreState(
    (state) => state.simulationStatus.timestepsPerSecond,
  );
  const memoryUsage = useStoreState(
    (state) => state.simulationStatus.memoryUsage,
  );
  const simulationSettings = useStoreState(
    (state) => state.settings.simulation,
  );
  const setSimulationSettings = useStoreActions(
    (actions) => actions.settings.setSimulation,
  );
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const readFile = useStoreActions((actions) => actions.projects.readFile);
  const readFileRaw = useStoreActions(
    (actions) => actions.projects.readFileRaw,
  );
  const listFiles = useStoreActions((actions) => actions.projects.listFiles);
  const ui = useShellUI();

  const dirName = active?.meta.dirName;
  const entry = active?.runs.find((run) => run.runId === runId);
  const meta = entry?.meta ?? null;
  const live = activeRun?.runId === runId && activeRun?.dirName === dirName;

  const [log, setLog] = useState<string[] | null>(null);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<FileStat[]>([]);
  const consoleRef = useRef<HTMLDivElement | null>(null);

  // Finished runs: persisted log + frame + output list from storage.
  useEffect(() => {
    if (live || !dirName) {
      return;
    }
    let mounted = true;
    let objectUrl: string | null = null;
    (async () => {
      const [logText, frame, files] = await Promise.all([
        readFile(`runs/${runId}/log.lammps`).catch(() => ""),
        readFileRaw({ path: `runs/${runId}/.atomify/frame.png` }),
        listFiles({ subdir: `runs/${runId}` }),
      ]);
      if (!mounted) {
        return;
      }
      setLog(logText ? logText.split("\n") : []);
      if (frame instanceof Uint8Array && frame.length > 0) {
        const bytes = new Uint8Array(frame);
        objectUrl = URL.createObjectURL(
          new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" }),
        );
        setFrameUrl(objectUrl);
      } else {
        setFrameUrl(null);
      }
      setOutputs(
        files.filter(
          (file) =>
            file.type !== "directory" &&
            !file.path.includes("/.atomify"),
        ),
      );
    })().catch(() => {});
    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [live, dirName, runId, readFile, readFileRaw, listFiles]);

  // Live runs: list outputs on an interval so the panel fills in as the
  // mid-run copies land.
  useEffect(() => {
    if (!live || !dirName) {
      return;
    }
    let mounted = true;
    const refresh = () => {
      listFiles({ subdir: `runs/${runId}` })
        .then((files) => {
          if (mounted) {
            setOutputs(
              files.filter(
                (file) =>
                  file.type !== "directory" &&
                  !file.path.includes("/.atomify"),
              ),
            );
          }
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [live, dirName, runId, listFiles]);

  // Following console.
  const consoleLines = live ? lammpsOutput : (log ?? []);
  useEffect(() => {
    const element = consoleRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [consoleLines.length]);

  const stats = useMemo(() => {
    if (live) {
      return [
        { k: "Run type", v: runType || "—" },
        { k: "Atoms", v: numAtoms.toLocaleString() },
        {
          k: "Step",
          v: `${runTimesteps.toLocaleString()} / ${runTotalTimesteps.toLocaleString()}`,
        },
        { k: "Remaining", v: formatDuration(remainingTime) },
        { k: "Steps / second", v: Math.round(timestepsPerSecond).toLocaleString() },
        { k: "Memory", v: formatBytes(memoryUsage) },
      ];
    }
    return [
      { k: "Status", v: meta ? meta.status : "external" },
      { k: "Atoms", v: meta?.stats?.numAtoms?.toLocaleString() ?? "—" },
      { k: "Total steps", v: meta?.stats?.timesteps?.toLocaleString() ?? "—" },
      { k: "Duration", v: formatDuration(meta?.stats?.wallSeconds) },
      { k: "Output files", v: String(outputs.length) },
    ];
  }, [
    live,
    runType,
    numAtoms,
    runTimesteps,
    runTotalTimesteps,
    remainingTime,
    timestepsPerSecond,
    memoryUsage,
    meta,
    outputs.length,
  ]);

  if (!active || !dirName) {
    return null;
  }

  const percent =
    runTotalTimesteps > 0
      ? Math.min(100, Math.round((100 * runTimesteps) / runTotalTimesteps))
      : 0;
  const paramsLabel =
    meta?.vars && Object.keys(meta.vars).length > 0
      ? Object.entries(meta.vars)
          .map(([name, value]) => `${name} = ${Number(value.toFixed(3))}`)
          .join(", ")
      : null;

  const backToRuns = () =>
    setScreen({ name: "project", dirName, tab: "runs" });

  return (
    <div
      data-testid="run-detail"
      style={{ flex: 1, display: "flex", overflow: "hidden" }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Sub-header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            rowGap: 8,
            flexWrap: "wrap",
            minWidth: 0,
            padding: "12px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={backToRuns}
            data-testid="run-detail-back"
            className="shell-hoverable shell-hoverable-text"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--text-2)",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <BackIcon />
            Runs
          </button>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--text)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Run #{runNumber(runId)}
          </span>
          <StatusPill status={live ? "running" : (meta?.status ?? "external")} />
          {paramsLabel && (
            <Chip accent mono style={{ fontSize: 11.5 }}>
              {paramsLabel}
            </Chip>
          )}
          <span
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: "var(--text-3)",
              minWidth: 64,
              flexShrink: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            runs/{runId}
          </span>
          <div style={{ flex: 1 }} />
          {live && (
            <button
              onClick={() => ui.stopRun()}
              data-testid="stop-run"
              className="shell-danger-hover"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 14px",
                borderRadius: 9,
                border: "none",
                background: "var(--bad)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              <StopIcon />
              Stop
            </button>
          )}
          {!active.quick && (
            <GhostButton
              data-testid="analyze-in-notebook"
              style={{ padding: "7px 14px", borderRadius: 9, fontSize: 12.5 }}
              onClick={() =>
                setScreen({ name: "project", dirName, tab: "notebook" })
              }
            >
              <ChartIcon size={14} />
              Analyze in notebook
            </GhostButton>
          )}
        </div>

        {/* Viewport */}
        <div
          data-testid="run-viewport"
          style={{
            flex: 1,
            position: "relative",
            background: "var(--viewport)",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {live ? (
            <View visible pane />
          ) : frameUrl ? (
            <img
              src={frameUrl}
              alt="Final frame"
              data-testid="run-frame"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              data-testid="run-placeholder"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                backgroundImage:
                  "radial-gradient(circle at 50% 40%, rgba(63,110,255,0.10), transparent 60%)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                No frame was captured for this run
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>
                Trajectories aren't replayed yet — run again to watch it live.
              </div>
              {meta?.inputScript && (
                <button
                  data-testid="run-again"
                  disabled={!ui.engineReady}
                  onClick={() =>
                    void ui.runAgain(meta.inputScript, meta.vars ?? {})
                  }
                  className="shell-primary-hover"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: ui.engineReady ? "pointer" : "not-allowed",
                    opacity: ui.engineReady ? 1 : 0.6,
                    fontFamily: "inherit",
                  }}
                >
                  <PlayIcon />
                  Run again
                </button>
              )}
            </div>
          )}
          {/* Script overlay */}
          <div style={{ position: "absolute", top: 18, left: 22, pointerEvents: "none" }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {meta?.inputScript ?? ""}
            </div>
            {live && (
              <>
                <div
                  style={{
                    marginTop: 9,
                    width: 200,
                    height: 5,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.14)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 7,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  step {runTimesteps.toLocaleString()} of{" "}
                  {runTotalTimesteps.toLocaleString()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Console strip */}
        <div
          data-testid="run-console"
          style={{
            height: 190,
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
            background: "#0A0C11",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11.5,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              console — log.lammps
            </span>
            <div style={{ flex: 1 }} />
            {live && (
              <>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  following
                </span>
                <PulseDot size={6} />
              </>
            )}
          </div>
          <div
            ref={consoleRef}
            style={{
              flex: 1,
              overflow: "auto",
              padding: "10px 18px",
              fontFamily: MONO,
              fontSize: 12,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            {consoleLines.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.35)" }}>
                {live ? "waiting for output…" : "no log recorded"}
              </div>
            ) : (
              consoleLines.map((line, index) => (
                <div key={index} style={{ whiteSpace: "pre" }}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div
        data-testid="run-side-panel"
        style={{
          width: 300,
          flexShrink: 0,
          borderLeft: "1px solid var(--border)",
          background: "var(--surface)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "16px 18px 4px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-3)",
          }}
        >
          Status
        </div>
        <div style={{ padding: "6px 18px 8px" }}>
          {stats.map((stat) => (
            <div
              key={stat.k}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                {stat.k}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stat.v}
              </span>
            </div>
          ))}
          {meta?.status === "failed" && meta.error && (
            <div
              data-testid="run-error"
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 9,
                background: "var(--bad-soft)",
                color: "var(--bad)",
                fontSize: 12.5,
                lineHeight: 1.5,
                fontFamily: MONO,
                wordBreak: "break-word",
              }}
            >
              {meta.error}
            </div>
          )}
        </div>

        {live && (
          <>
            <div
              style={{
                padding: "10px 18px 4px",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-3)",
              }}
            >
              Simulation speed
            </div>
            <div style={{ padding: "6px 18px 4px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12.5,
                  color: "var(--text-2)",
                  marginBottom: 7,
                }}
              >
                <span>Speed</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                  {simulationSettings.speed}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={200}
                data-testid="speed-slider"
                value={simulationSettings.speed}
                onChange={(event) =>
                  setSimulationSettings({
                    ...simulationSettings,
                    speed: Number(event.target.value),
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
          </>
        )}

        <div
          style={{
            padding: "14px 18px 4px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-3)",
          }}
        >
          Output files
        </div>
        <div
          data-testid="run-outputs"
          style={{
            padding: "6px 12px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {outputs.length === 0 && (
            <div style={{ padding: "7px 8px", fontSize: 12, color: "var(--text-3)" }}>
              {live ? "outputs appear as the run writes them" : "no output files"}
            </div>
          )}
          {outputs.map((file) => {
            const name = file.path.slice(file.path.lastIndexOf("/") + 1);
            return (
              <div
                key={file.path}
                onClick={() => {
                  if (file.format !== "base64") {
                    setScreen({
                      name: "project",
                      dirName,
                      tab: "files",
                      filePath: file.path,
                    });
                  }
                }}
                className="shell-row-hover"
                data-testid={`run-output-${name}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 8px",
                  borderRadius: 8,
                  cursor: file.format === "base64" ? "default" : "pointer",
                }}
              >
                <span style={{ color: "var(--text-3)", display: "flex" }}>
                  <FileIcon size={14} />
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: MONO,
                    fontSize: 12,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-3)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatBytes(file.size)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RunDetail;
