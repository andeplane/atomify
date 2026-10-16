import ColorModifierSettings from "../modifiers/ColorModifierSettings";
import ContinueRunModal from "./modals/ContinueRunModal";
/**
 * Run detail (ADR-003 §4): live 3D viewport + following console + status
 * panel while running; frame.png (or a designed placeholder with Run again)
 * plus the persisted log for finished runs — never a silent black canvas.
 */

import { useState } from "react";
import { useStoreState } from "../hooks";
import RunConsole from "./RunConsole";
import RunDetailHeader from "./RunDetailHeader";
import RunSidePanel from "./RunSidePanel";
import RunViewport from "./RunViewport";
import { useRunOutputs } from "./useRunOutputs";

const RunDetail = ({ runId }: { runId: string }) => {
  const [colorsOpen, setColorsOpen] = useState(false);
  const active = useStoreState((state) => state.projects.active);
  const loadedWorkdir = useStoreState((s) => s.simulation.loadedWorkdir);
  const [continueOpen, setContinueOpen] = useState(false);
  const residentRun = useStoreState((s) => s.projects.residentRun);
  const runQueue = useStoreState((s) => s.projects.runQueue);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const lammpsOutput = useStoreState((state) => state.simulation.lammpsOutput);

  const dirName = active?.meta.dirName;
  const entry = active?.runs.find((run) => run.runId === runId);
  const meta = entry?.meta ?? null;
  const live = activeRun?.runId === runId && activeRun?.dirName === dirName;

  const canContinue =
    meta?.status === "completed" &&
    !meta.viewOnly &&
    !activeRun &&
    !runQueue.length &&
    residentRun?.dirName === dirName &&
    residentRun?.runId === runId &&
    residentRun?.quick === active?.quick;

  const viewStructure =
    meta?.viewOnly &&
    meta.status === "completed" &&
    !activeRun &&
    loadedWorkdir === `${dirName}/runs/${runId}`;

  const { log, frameUrl, outputs } = useRunOutputs({ live, dirName, runId });

  // Following console.
  const consoleLines = live ? lammpsOutput : (log ?? []);

  if (!active || !dirName) {
    return null;
  }

  return (
    <div
      data-testid="run-detail"
      style={{ flex: 1, display: "flex", overflow: "hidden" }}
    >
      {colorsOpen && (
        <ColorModifierSettings open onClose={() => setColorsOpen(false)} />
      )}
      {continueOpen && meta && (
        <ContinueRunModal meta={meta} onClose={() => setContinueOpen(false)} />
      )}
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
        <RunDetailHeader
          runId={runId}
          dirName={dirName}
          quick={active.quick}
          meta={meta}
          live={live}
          viewStructure={viewStructure}
          canContinue={canContinue}
          onColorAtoms={() => setColorsOpen(true)}
          onContinue={() => setContinueOpen(true)}
        />

        {/* Viewport */}
        <RunViewport
          live={live}
          viewStructure={viewStructure}
          frameUrl={frameUrl}
          meta={meta}
        />

        {/* Console strip (collapsible: the header bar always stays visible,
            the log body folds away and the viewport flexes into the space). */}
        <RunConsole live={live} lines={consoleLines} />
      </div>

      {/* Right panel */}
      <RunSidePanel
        dirName={dirName}
        meta={meta}
        live={live}
        outputs={outputs}
      />
    </div>
  );
};

export default RunDetail;
