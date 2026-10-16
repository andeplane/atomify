/**
 * The run detail viewport: the live 3D view (or a view-only run's loaded
 * structure), otherwise frame.png or a designed placeholder with Run again,
 * under the script/progress overlay and the fullscreen controls.
 */

import View from "../containers/View";
import { useStoreState } from "../hooks";
import type { RunMeta } from "../storage";
import { useShellUI } from "./ShellContext";
import { CompressIcon, ExpandIcon, PlayIcon, StopIcon } from "./icons";
import { MONO } from "./ui";
import { useViewportFullscreen } from "./useViewportFullscreen";

const RunViewport = ({
  live,
  viewStructure,
  frameUrl,
  meta,
}: {
  live: boolean;
  viewStructure?: boolean;
  frameUrl: string | null;
  meta: RunMeta | null;
}) => {
  const runTimesteps = useStoreState(
    (state) => state.simulationStatus.runTimesteps,
  );
  const runTotalTimesteps = useStoreState(
    (state) => state.simulationStatus.runTotalTimesteps,
  );
  const ui = useShellUI();
  const { viewportRef, immersive, expanded, toggleFullscreen } =
    useViewportFullscreen(live);

  const percent =
    runTotalTimesteps > 0
      ? Math.min(100, Math.round((100 * runTimesteps) / runTotalTimesteps))
      : 0;

  return (
    <div
      ref={viewportRef}
      data-testid="run-viewport"
      style={
        immersive
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "var(--viewport)",
              overflow: "hidden",
            }
          : {
              flex: 1,
              position: "relative",
              background: "var(--viewport)",
              overflow: "hidden",
              minHeight: 0,
            }
      }
    >
      {live || viewStructure ? (
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
              "radial-gradient(circle at 50% 40%, var(--viewport-glow), transparent 60%)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--media-text)",
            }}
          >
            No frame was captured for this run
          </div>
          <div style={{ fontSize: 12.5, color: "var(--media-text-3)" }}>
            Trajectories aren't replayed yet — run again to watch it live.
          </div>
          {meta?.inputScript && !meta.continuationOf && !meta.replayOf && (
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
                borderRadius: "var(--radius)",
                border: "none",
                background: "var(--accent)",
                color: "var(--on-accent)",
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
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 22,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 13,
            color: "var(--media-text)",
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
                borderRadius: "var(--radius-pill)",
                background: "var(--media-track)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--accent)",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 7,
                fontSize: 12,
                color: "var(--media-text-2)",
              }}
            >
              step {runTimesteps.toLocaleString()} of{" "}
              {runTotalTimesteps.toLocaleString()}
            </div>
          </>
        )}
      </div>
      {/* Stop stays reachable while the run screen chrome is hidden. */}
      {expanded && live && (
        <button
          onClick={() => ui.stopRun()}
          data-testid="viewport-stop"
          title="Stop the run"
          aria-label="Stop the run"
          className="shell-danger-hover"
          style={{
            position: "absolute",
            top: 14,
            right: 58,
            height: 32,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "0 12px",
            border: "none",
            borderRadius: 9,
            background: "var(--bad)",
            color: "var(--on-accent)",
            fontWeight: 700,
            fontSize: 12.5,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <StopIcon />
          Stop
        </button>
      )}
      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        data-testid="viewport-fullscreen"
        title={expanded ? "Exit full screen (Esc)" : "Full screen"}
        aria-label={expanded ? "Exit full screen" : "Full screen"}
        style={{
          position: "absolute",
          top: 14,
          right: 16,
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          border: "1px solid var(--media-control-border)",
          borderRadius: 9,
          background: "var(--media-control-bg)",
          color: "var(--media-text)",
          cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        {expanded ? <CompressIcon /> : <ExpandIcon />}
      </button>
    </div>
  );
};

export default RunViewport;
