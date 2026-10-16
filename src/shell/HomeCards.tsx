/**
 * Home screen cards (ADR-003 §2): the continue-where-you-left-off card (live
 * run status / last frame), recent-project cards and example cards.
 */

import { useEffect, useState } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import type { Example } from "../hooks/useExamples";
import { PROJECT_COLORS, type ProjectMeta } from "../storage";
import { useShellUI } from "./ShellContext";
import { formatBytes, relativeTime, runNumber } from "./format";
import { ChartIcon, ClockIcon, PlayIcon } from "./icons";
import { ColorDot, PulseDot, StatusPill } from "./ui";

export const cardBase = {
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  boxShadow: "var(--shadow)",
} as const;

export const ContinueCard = ({
  continueProject,
}: {
  continueProject: ProjectMeta;
}) => {
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const runTimesteps = useStoreState(
    (state) => state.simulationStatus.runTimesteps,
  );
  const runTotalTimesteps = useStoreState(
    (state) => state.simulationStatus.runTotalTimesteps,
  );
  const openProject = useStoreActions(
    (actions) => actions.projects.openProject,
  );
  const readFileRaw = useStoreActions(
    (actions) => actions.projects.readFileRaw,
  );
  const listFiles = useStoreActions((actions) => actions.projects.listFiles);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);

  // Last run's frame.png for the continue card (ADR-003 §2); gradient
  // fallback when absent.
  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;
    (async () => {
      if (!continueProject) {
        return;
      }
      const dirName = continueProject.dirName;
      const runs = await listFiles({ subdir: "runs", dirName });
      const runDirs = runs
        .filter((entry) => entry.type === "directory")
        .map((entry) => entry.path.slice("runs/".length))
        .sort()
        .reverse();
      for (const runId of runDirs.slice(0, 3)) {
        const frame = await readFileRaw({
          path: `runs/${runId}/.atomify/frame.png`,
          dirName,
        });
        if (frame instanceof Uint8Array && frame.length > 0) {
          const bytes = new Uint8Array(frame);
          objectUrl = URL.createObjectURL(
            new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" }),
          );
          if (mounted) {
            setFrameUrl(objectUrl);
          }
          return;
        }
      }
      if (mounted) {
        setFrameUrl(null);
      }
    })().catch(() => {});
    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [continueProject, listFiles, readFileRaw]);

  const continueRunning =
    continueProject !== undefined &&
    activeRun?.dirName === continueProject.dirName;

  return (
    <div
      onClick={() => openProject({ dirName: continueProject.dirName })}
      className="shell-card-hover"
      data-testid="continue-card"
      style={{
        ...cardBase,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 132,
          background: frameUrl
            ? "var(--viewport)"
            : `linear-gradient(120deg, ${continueProject.color ?? PROJECT_COLORS[0]}33, var(--viewport) 70%)`,
          overflow: "hidden",
        }}
      >
        {frameUrl && (
          <img
            src={frameUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.9,
            }}
          />
        )}
        {continueRunning && activeRun && (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "4px 10px",
              borderRadius: "var(--radius-pill)",
              background: "var(--media-badge)",
              backdropFilter: "blur(6px)",
              color: "var(--on-accent)",
              fontSize: 11.5,
              fontWeight: 600,
            }}
          >
            <PulseDot size={6} />
            Run #{runNumber(activeRun.runId)} in progress
          </span>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--accent)",
            marginBottom: 5,
          }}
        >
          Continue where you left off
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {continueProject.displayName}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-2)",
            marginTop: 3,
          }}
        >
          {continueRunning && runTotalTimesteps > 0
            ? `${continueProject.inputScript ?? ""} · step ${runTimesteps.toLocaleString()} of ${runTotalTimesteps.toLocaleString()}`
            : (continueProject.inputScript ?? `${continueProject.dirName}/`)}
        </div>
      </div>
    </div>
  );
};

export const RecentProjectCard = ({
  project,
  size,
  running,
}: {
  project: ProjectMeta;
  size: { bytes: number; runs: number } | undefined;
  running: boolean;
}) => {
  const openProject = useStoreActions(
    (actions) => actions.projects.openProject,
  );
  return (
    <div
      onClick={() => openProject({ dirName: project.dirName })}
      className="shell-card-hover"
      data-testid={`recent-project-${project.dirName}`}
      style={{
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: 16,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <ColorDot color={project.color} size={10} />
        <span
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "var(--text)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project.displayName}
        </span>
        {running && <PulseDot />}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 12.5,
          color: "var(--text-2)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <ChartIcon size={13} />
          {size ? `${size.runs} ${size.runs === 1 ? "run" : "runs"}` : "…"}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <ClockIcon size={13} />
          {relativeTime(project.createdAt)}
        </span>
        {size && (
          <span style={{ marginLeft: "auto" }}>{formatBytes(size.bytes)}</span>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        {running ? (
          <StatusPill status="running" />
        ) : (
          <span
            style={{
              display: "inline-flex",
              padding: "3px 10px",
              borderRadius: "var(--radius-pill)",
              background: "var(--chip)",
              color: "var(--text-2)",
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            {size && size.runs > 0
              ? `${size.runs} ${size.runs === 1 ? "run" : "runs"} recorded`
              : "No runs yet"}
          </span>
        )}
      </div>
    </div>
  );
};

export const ExampleCard = ({ example }: { example: Example }) => {
  const ui = useShellUI();
  return (
    <div
      className="shell-card-hover"
      data-testid={`home-example-${example.id}`}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          background: "var(--viewport)",
          backgroundImage: `url("${example.imageUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 9,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {example.title}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => ui.useExampleAsProject(example)}
            className="shell-use-btn"
            data-testid={`use-example-${example.id}`}
            style={{
              flex: 1,
              padding: "7px 10px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Use as project
          </button>
          <button
            onClick={() => ui.quickRunExample(example)}
            title="Quick run"
            disabled={!ui.engineReady}
            className="shell-quick-btn"
            data-testid={`quick-run-example-${example.id}`}
            style={{
              width: 32,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--border-strong)",
              background: "transparent",
              color: "var(--text-2)",
              cursor: ui.engineReady ? "pointer" : "not-allowed",
              opacity: ui.engineReady ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlayIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
