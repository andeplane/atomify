/**
 * The run detail's right panel: status figures, the live run's speed slider
 * and analysis, and the run's output files.
 */

import { useMemo } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import type { FileStat, RunMeta } from "../storage";
import RunAnalysis from "./RunAnalysis";
import { formatBytes, formatDuration } from "./format";
import { FileIcon } from "./icons";
import { MONO } from "./ui";

const RunSidePanel = ({
  dirName,
  meta,
  live,
  outputs,
}: {
  dirName: string;
  meta: RunMeta | null;
  live: boolean;
  outputs: FileStat[];
}) => {
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
        {
          k: "Steps / second",
          v: Math.round(timestepsPerSecond).toLocaleString(),
        },
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

  return (
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
          <div data-tour="simulation-speed">
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
          </div>
          {/* Live computes/fixes/variables with real-time figures. Finished
                runs have no live data — outputs and the log are the record. */}
          <RunAnalysis />
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
          <div
            style={{
              padding: "7px 8px",
              fontSize: 12,
              color: "var(--text-3)",
            }}
          >
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
  );
};

export default RunSidePanel;
