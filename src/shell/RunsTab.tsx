/**
 * Runs tab (ADR-003 §4): newest-first run rows with status icon, #NNN,
 * script, summary, vars, and a live progress bar; queued sweep entries from
 * the in-memory queue; sweep group headers with "Cancel remaining".
 */

import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import type { RunListEntry, RunMeta } from "../storage";
import type { RunRequest } from "../store/projects";
import { formatBytes, formatDuration, relativeTime, runNumber } from "./format";
import {
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FolderOutlineIcon,
  MinusCircleIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from "./icons";
import { Chip, ConfirmModal, MONO, PulseDot, RowIconButton } from "./ui";

type RunItem =
  | { kind: "queued"; request: RunRequest; queueIndex: number }
  | { kind: "run"; entry: RunListEntry };

function itemSweepId(item: RunItem): string | undefined {
  return item.kind === "queued" ? item.request.sweepId : item.entry.meta?.sweepId;
}

function varsLabel(vars: Record<string, number> | undefined): string | null {
  if (!vars || Object.keys(vars).length === 0) {
    return null;
  }
  return Object.entries(vars)
    .map(([name, value]) => `${name} = ${Number(value.toFixed(3))}`)
    .join(", ");
}

function statusIcon(status: RunMeta["status"] | "queued" | "external"): {
  bg: string;
  color: string;
  icon: ReactNode;
} {
  switch (status) {
    case "running":
      return { bg: "var(--good-soft)", color: "var(--good)", icon: <PulseDot size={8} /> };
    case "completed":
      return { bg: "var(--chip)", color: "var(--text-2)", icon: <CheckIcon /> };
    case "failed":
      return { bg: "var(--bad-soft)", color: "var(--bad)", icon: <XIcon size={13} /> };
    case "queued":
      return { bg: "var(--chip)", color: "var(--text-3)", icon: <ClockIcon size={14} /> };
    case "canceled":
      return { bg: "var(--chip)", color: "var(--text-3)", icon: <MinusCircleIcon /> };
    case "interrupted":
      return { bg: "var(--chip)", color: "var(--warn)", icon: <WarningIcon size={14} /> };
    case "external":
      return { bg: "var(--chip)", color: "var(--text-3)", icon: <FolderOutlineIcon /> };
  }
}

function runSummary(
  entry: RunListEntry,
  live: boolean,
): string {
  const meta = entry.meta;
  if (!meta) {
    return "external run — no metadata recorded";
  }
  if (meta.status === "running") {
    return live
      ? `started ${relativeTime(meta.startedAt)}`
      : "recorded as running";
  }
  if (meta.status === "failed") {
    return meta.error ?? "failed";
  }
  if (meta.status === "interrupted") {
    return "interrupted — partial outputs kept";
  }
  const parts: string[] = [];
  if (meta.stats?.numAtoms) {
    parts.push(`${meta.stats.numAtoms.toLocaleString()} atoms`);
  }
  if (meta.stats?.wallSeconds !== undefined) {
    parts.push(formatDuration(meta.stats.wallSeconds));
  }
  if (meta.stats?.timesteps) {
    parts.push(`${meta.stats.timesteps.toLocaleString()} steps`);
  }
  return parts.length ? parts.join(" · ") : meta.status;
}

const RunsTab = () => {
  const active = useStoreState((state) => state.projects.active);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const runQueue = useStoreState((state) => state.projects.runQueue);
  const runTimesteps = useStoreState(
    (state) => state.simulationStatus.runTimesteps,
  );
  const runTotalTimesteps = useStoreState(
    (state) => state.simulationStatus.runTotalTimesteps,
  );
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const cancelQueuedRuns = useStoreActions(
    (actions) => actions.projects.cancelQueuedRuns,
  );
  const deleteRun = useStoreActions((actions) => actions.projects.deleteRun);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const dirName = active?.meta.dirName;
  const items = useMemo<RunItem[]>(() => {
    const queued: RunItem[] = runQueue
      .map((request, index) => ({ request, index }))
      .filter(({ request }) => request.dirName === dirName)
      .map(({ request, index }) => ({
        kind: "queued" as const,
        request,
        queueIndex: index,
      }));
    const runs: RunItem[] = (active?.runs ?? []).map((entry) => ({
      kind: "run" as const,
      entry,
    }));
    // Queue entries are upcoming — they sit above the history.
    return [...queued, ...runs];
  }, [runQueue, active?.runs, dirName]);

  if (!active || !dirName) {
    return null;
  }

  const percent =
    runTotalTimesteps > 0
      ? Math.min(100, Math.round((100 * runTimesteps) / runTotalTimesteps))
      : 0;

  const rows: ReactNode[] = [];
  items.forEach((item, index) => {
    const sweepId = itemSweepId(item);
    const previousSweepId = index > 0 ? itemSweepId(items[index - 1]) : undefined;
    if (sweepId && sweepId !== previousSweepId) {
      const groupSize = items.filter((i) => itemSweepId(i) === sweepId).length;
      const remaining = runQueue.filter(
        (request) => request.sweepId === sweepId,
      ).length;
      rows.push(
        <div
          key={`header-${sweepId}-${index}`}
          data-testid={`sweep-header-${sweepId}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 20px 0",
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-3)",
              flexShrink: 0,
            }}
          >
            Sweep · {groupSize} runs
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          {remaining > 0 && (
            <button
              onClick={() => cancelQueuedRuns()}
              data-testid="cancel-remaining"
              className="shell-outline-danger-hover"
              style={{
                padding: "4px 10px",
                borderRadius: 7,
                border: "1px solid var(--border-strong)",
                background: "transparent",
                color: "var(--text-2)",
                fontWeight: 600,
                fontSize: 11.5,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              Cancel remaining ({remaining})
            </button>
          )}
        </div>,
      );
    }

    if (item.kind === "queued") {
      const icon = statusIcon("queued");
      const params = varsLabel(item.request.vars);
      rows.push(
        <div
          key={`queued-${item.queueIndex}`}
          data-testid={`queued-run-${item.queueIndex}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "15px 20px",
            borderRadius: 14,
            border: "1px dashed var(--border-strong)",
            background: "var(--surface)",
            opacity: 0.75,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: icon.bg,
              color: icon.color,
            }}
          >
            {icon.icon}
          </span>
          <div style={{ width: 64, flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-3)" }}>
              queued
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.request.inputScript}
              </span>
              {params && (
                <Chip accent mono>
                  {params}
                </Chip>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
              starts when the current run finishes
            </div>
          </div>
        </div>,
      );
      return;
    }

    const entry = item.entry;
    const meta = entry.meta;
    const live =
      activeRun?.runId === entry.runId && activeRun.dirName === dirName;
    const status = meta ? meta.status : "external";
    const icon = statusIcon(status);
    const params = varsLabel(meta?.vars);
    rows.push(
      <div
        key={entry.runId}
        onClick={() =>
          setScreen({
            name: "project",
            dirName,
            tab: "runs",
            runId: entry.runId,
          })
        }
        data-testid={`run-row-${entry.runId}`}
        className="shell-card-hover"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "15px 20px",
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: icon.bg,
            color: icon.color,
          }}
        >
          {icon.icon}
        </span>
        <div style={{ width: 64, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            #{runNumber(entry.runId)}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
            {relativeTime(entry.lastModified)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meta?.inputScript ?? entry.runId}
            </span>
            {params && (
              <Chip accent mono>
                {params}
              </Chip>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: status === "failed" ? "var(--bad)" : "var(--text-2)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {runSummary(entry, live)}
          </div>
        </div>
        {live && (
          <div style={{ width: 180, flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--text-2)",
                marginBottom: 5,
              }}
            >
              <span>step {runTimesteps.toLocaleString()}</span>
              <span>{percent}%</span>
            </div>
            <div
              style={{
                height: 5,
                borderRadius: 999,
                background: "var(--border-strong)",
                overflow: "hidden",
              }}
            >
              <div
                data-testid="run-progress-bar"
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "var(--good)",
                }}
              />
            </div>
          </div>
        )}
        <div
          style={{
            width: 130,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--text-2)",
          }}
        >
          <FolderOutlineIcon />
          <span style={{ fontFamily: MONO }}>runs/{entry.runId}</span>
        </div>
        {!live && (
          <span onClick={(event) => event.stopPropagation()}>
            <RowIconButton
              title="Delete run…"
              hover="shell-icon-hover-bad"
              data-testid={`delete-run-${entry.runId}`}
              onClick={() => setDeleteTarget(entry.runId)}
            >
              <TrashIcon />
            </RowIconButton>
          </span>
        )}
        <span style={{ color: "var(--text-3)", display: "flex", flexShrink: 0 }}>
          <ChevronRightIcon />
        </span>
      </div>,
    );
  });

  return (
    <div
      data-testid="runs-tab"
      style={{ flex: 1, overflowY: "auto", padding: "24px 32px 48px" }}
    >
      <div style={{ maxWidth: 980 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length === 0 && (
            <div
              data-testid="runs-empty"
              style={{
                border: "1.5px dashed var(--border-strong)",
                borderRadius: 14,
                padding: "44px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>
                No runs yet
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                Press Run simulation to create run-001 — every run gets its own
                directory under <span style={{ fontFamily: MONO }}>runs/</span>.
              </div>
            </div>
          )}
          {rows.map((row, index) => (
            <Fragment key={index}>{row}</Fragment>
          ))}
        </div>
      </div>
      <ConfirmModal
        open={deleteTarget !== null}
        title={`Delete run #${deleteTarget ? runNumber(deleteTarget) : ""}?`}
        body={
          <>
            Deletes <span style={{ fontFamily: MONO }}>runs/{deleteTarget}</span>{" "}
            with its snapshot and outputs. This cannot be undone.
          </>
        }
        confirmLabel="Delete run"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const runId = deleteTarget;
          setDeleteTarget(null);
          if (runId) {
            void deleteRun(runId);
          }
        }}
      />
    </div>
  );
};

export default RunsTab;
