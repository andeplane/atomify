/**
 * Live analysis panel for the run detail (ADR-003 §4): lists the computes,
 * fixes and variables the engine reports through the simulationStatus store
 * (updated per synced timestep), with scalar values inline. Entries with 1D
 * data open the real-time dygraphs figure (components/Figure.tsx) in a
 * token-styled modal. Only meaningful while a run is live — RunDetail mounts
 * it for the active run only.
 */

import { useCallback, useState } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import type { Compute, Fix, Variable } from "../types";
import { FigureGraph, figureCsvFilename } from "../components/Figure";
import { exportPlotDataToCsv } from "../utils/exportCsv";
import { ChartIcon } from "./icons";
import { GhostButton, ModalShell } from "./ui";

type EntryType = "compute" | "fix" | "variable";
type Entry = Compute | Fix | Variable;

const GROUPS: { type: EntryType; label: string }[] = [
  { type: "compute", label: "Computes" },
  { type: "fix", label: "Fixes" },
  { type: "variable", label: "Variables" },
];

const groupLabelStyle = {
  padding: "10px 18px 4px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  color: "var(--text-3)",
};

const EntryRow = ({
  entry,
  onOpen,
}: {
  entry: Entry;
  onOpen?: () => void;
}) => {
  const clickable = onOpen !== undefined;
  return (
    <div
      onClick={onOpen}
      className={clickable ? "shell-row-hover" : undefined}
      data-testid={`analysis-entry-${entry.name}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 8,
        cursor: clickable ? "pointer" : "default",
      }}
    >
      {clickable && (
        <span style={{ color: "var(--accent)", display: "flex", flexShrink: 0 }}>
          <ChartIcon size={13} />
        </span>
      )}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: clickable ? 600 : 500,
          color: clickable ? "var(--accent)" : "var(--text-2)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.name}
      </span>
      {entry.hasScalarData && (
        <span
          style={{
            fontSize: 12,
            color: "var(--text)",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {entry.scalarValue.toPrecision(5)}
        </span>
      )}
    </div>
  );
};

const RunAnalysis = () => {
  const computes = useStoreState((state) => state.simulationStatus.computes);
  const fixes = useStoreState((state) => state.simulationStatus.fixes);
  const variables = useStoreState((state) => state.simulationStatus.variables);
  const setModifierSyncDataPoints = useStoreActions(
    (actions) => actions.simulationStatus.setModifierSyncDataPoints,
  );

  const [selected, setSelected] = useState<
    { type: EntryType; name: string } | undefined
  >(undefined);

  const handleToggleSyncDataPoints = useCallback(
    (name: string, type: EntryType, value: boolean) => {
      setModifierSyncDataPoints({ name, type, value });
    },
    [setModifierSyncDataPoints],
  );

  const maps: Record<EntryType, { [key: string]: Entry }> = {
    compute: computes,
    fix: fixes,
    variable: variables,
  };
  // Resolve the open entry from the live map each render: the sync modifiers
  // mutate entries in place and republish the maps every synced timestep.
  const selectedEntry = selected ? maps[selected.type][selected.name] : undefined;
  const empty = GROUPS.every(
    (group) => Object.keys(maps[group.type]).length === 0,
  );

  // Keep the graph readable inside the 880px modal on any window size.
  const figureWidth = Math.max(
    320,
    Math.min(window.innerWidth - 160, 800),
  );
  const figureHeight = Math.round(figureWidth * 0.62);

  return (
    <div data-testid="run-analysis-section">
      {empty && (
        <>
          <div style={groupLabelStyle}>Analysis</div>
          <div
            style={{
              padding: "4px 18px 8px",
              fontSize: 12,
              color: "var(--text-3)",
              lineHeight: 1.5,
            }}
          >
            Computes, fixes and variables appear once the run synchronizes.
          </div>
        </>
      )}
      {GROUPS.map((group) => {
        const entries = Object.values(maps[group.type]);
        if (entries.length === 0) {
          return null;
        }
        return (
          <div key={group.type}>
            <div style={groupLabelStyle}>{group.label}</div>
            <div
              style={{
                padding: "2px 12px 6px",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {entries.map((entry) => (
                <EntryRow
                  key={entry.name}
                  entry={entry}
                  onOpen={
                    entry.hasData1D
                      ? () => setSelected({ type: group.type, name: entry.name })
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
      {selected && selectedEntry && (
        <ModalShell
          open
          onClose={() => setSelected(undefined)}
          title={selectedEntry.name}
          maxWidth={880}
          testId="analysis-figure"
        >
          <div className="shell-figure" style={{ padding: "12px 24px 20px" }}>
            <FigureGraph
              modifier={selectedEntry}
              modifierType={selected.type}
              onToggleSyncDataPoints={handleToggleSyncDataPoints}
              width={figureWidth}
              height={figureHeight}
              placeholder={
                <div
                  style={{
                    padding: "48px 0",
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--text-3)",
                  }}
                >
                  Waiting for the first synced data points…
                </div>
              }
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 14,
              }}
            >
              <GhostButton
                disabled={
                  !selectedEntry.data1D ||
                  selectedEntry.data1D.data.length === 0
                }
                onClick={() => {
                  if (selectedEntry.data1D) {
                    exportPlotDataToCsv(
                      selectedEntry.data1D,
                      figureCsvFilename(selectedEntry.name),
                    );
                  }
                }}
                style={{ padding: "7px 12px", fontSize: 12.5 }}
              >
                Export CSV
              </GhostButton>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default RunAnalysis;
