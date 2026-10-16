/**
 * The run detail sub-header: back to Runs, the run's number, status and
 * parameters, and its actions (color atoms, continue, replay, stop, analyze
 * in notebook).
 */

import { useStoreActions, useStoreState } from "../hooks";
import type { RunMeta } from "../storage";
import { useShellUI } from "./ShellContext";
import { runNumber } from "./format";
import { BackIcon, ChartIcon, StopIcon } from "./icons";
import { Chip, GhostButton, MONO, StatusPill } from "./ui";

const RunDetailHeader = ({
  runId,
  dirName,
  quick,
  meta,
  live,
  viewStructure,
  canContinue,
  onColorAtoms,
  onContinue,
}: {
  runId: string;
  dirName: string;
  quick: boolean;
  meta: RunMeta | null;
  live: boolean;
  viewStructure?: boolean;
  canContinue: boolean;
  onColorAtoms: () => void;
  onContinue: () => void;
}) => {
  const startRuns = useStoreActions((a) => a.projects.startRuns);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const ui = useShellUI();

  const paramsLabel =
    meta?.vars && Object.keys(meta.vars).length > 0
      ? Object.entries(meta.vars)
          .map(([name, value]) => `${name} = ${Number(value.toFixed(3))}`)
          .join(", ")
      : null;

  const backToRuns = () => setScreen({ name: "project", dirName, tab: "runs" });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        rowGap: 8,
        flexWrap: "wrap",
        minWidth: 0,
        padding: "7px 24px",
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
      {(live || viewStructure) && (
        <GhostButton data-testid="color-atoms" onClick={onColorAtoms}>
          Color atoms
        </GhostButton>
      )}
      {meta?.continuationOf && (
        <Chip>Continued from #{runNumber(meta.continuationOf)}</Chip>
      )}
      {canContinue && (
        <GhostButton data-testid="continue-run" onClick={onContinue}>
          Continue simulation
        </GhostButton>
      )}
      {(meta?.continuationOf || meta?.replayOf) && !activeRun && (
        <GhostButton
          data-testid="replay-continuation"
          onClick={() =>
            void startRuns([
              {
                inputScript: meta.inputScript,
                vars: meta.vars ?? {},
                useKokkos: false,
                threads: 1,
                replayOf: runId,
              },
            ])
          }
        >
          Run full sequence again
        </GhostButton>
      )}
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
      {!quick && (
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
  );
};

export default RunDetailHeader;
