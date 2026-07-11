/**
 * Home (ADR-003 §2): greeting, continue-where-you-left-off card (live run
 * status / last frame), Create new project + Quick-run cards, the recent
 * projects grid, and a start-from-example row.
 */

import { useEffect, useMemo, useState } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import type { Example } from "../hooks/useExamples";
import { useShellUI } from "./ShellContext";
import { formatBytes, greeting, relativeTime, runNumber } from "./format";
import { ChartIcon, ClockIcon, PlayIcon, PlusIcon } from "./icons";
import { ColorDot, PulseDot, StatusPill } from "./ui";

export const LAST_PROJECT_KEY = "atomify_last_project";

const cardBase = {
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  boxShadow: "var(--shadow)",
} as const;

const ExampleCard = ({ example }: { example: Example }) => {
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

const HomeScreen = () => {
  const projects = useStoreState((state) => state.projects.projects);
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
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const projectSizes = useStoreActions(
    (actions) => actions.projects.projectSizes,
  );
  const readFileRaw = useStoreActions(
    (actions) => actions.projects.readFileRaw,
  );
  const listFiles = useStoreActions((actions) => actions.projects.listFiles);
  const ui = useShellUI();

  const [sizes, setSizes] = useState<
    Record<string, { bytes: number; runs: number }>
  >({});
  const [frameUrl, setFrameUrl] = useState<string | null>(null);

  const lastDirName = useMemo(() => {
    try {
      return localStorage.getItem(LAST_PROJECT_KEY);
    } catch {
      return null;
    }
  }, []);
  const continueProject = useMemo(() => {
    if (activeRun && !activeRun.quick) {
      const running = projects.find((p) => p.dirName === activeRun.dirName);
      if (running) {
        return running;
      }
    }
    return (
      projects.find((p) => p.dirName === lastDirName) ??
      [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    );
  }, [projects, lastDirName, activeRun]);

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
    [projects],
  );

  useEffect(() => {
    let mounted = true;
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
  }, [projectSizes, projects]);

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
    <div style={{ flex: 1, overflowY: "auto" }} data-testid="home-screen">
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "44px 40px 64px" }}>
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--text)",
          }}
        >
          {greeting()}
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 15, color: "var(--text-2)" }}>
          Pick up where you left off, or start something new.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {continueProject ? (
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
                    : `linear-gradient(120deg, ${continueProject.color ?? "#3F6EFF"}33, var(--viewport) 70%)`,
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
                      borderRadius: 999,
                      background: "rgba(8,10,14,0.72)",
                      backdropFilter: "blur(6px)",
                      color: "#fff",
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
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                  {continueProject.displayName}
                </div>
                <div
                  style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 3 }}
                >
                  {continueRunning && runTotalTimesteps > 0
                    ? `${continueProject.inputScript ?? ""} · step ${runTimesteps.toLocaleString()} of ${runTotalTimesteps.toLocaleString()}`
                    : (continueProject.inputScript ??
                      `${continueProject.dirName}/`)}
                </div>
              </div>
            </div>
          ) : (
            <div
              data-testid="welcome-card"
              style={{
                ...cardBase,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>
                Welcome to Atomify
              </span>
              <span
                style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}
              >
                Run LAMMPS molecular dynamics right here in your browser.
                Create a project or quick-run an example to get started.
              </span>
            </div>
          )}

          <button
            onClick={() => ui.openNewProject()}
            className="shell-card-hover"
            data-testid="create-project-card"
            style={{
              ...cardBase,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "var(--accent)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 18px var(--accent-soft)",
              }}
            >
              <PlusIcon size={21} />
            </span>
            <span>
              <span
                style={{
                  display: "block",
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Create new project
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 12.5,
                  color: "var(--text-2)",
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                Start blank, from a template, or upload your own scripts.
              </span>
            </span>
          </button>

          <button
            onClick={() => {
              const featured = ui.examples.examples[0];
              if (featured) {
                ui.quickRunExample(featured);
              }
            }}
            disabled={!ui.engineReady || ui.examples.examples.length === 0}
            className="shell-card-hover"
            data-testid="quick-run-card"
            title={ui.engineReady ? undefined : "Engine loading…"}
            style={{
              ...cardBase,
              cursor:
                ui.engineReady && ui.examples.examples.length > 0
                  ? "pointer"
                  : "not-allowed",
              opacity: ui.engineReady ? 1 : 0.6,
              fontFamily: "inherit",
              textAlign: "left",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "var(--good-soft)",
                color: "var(--good)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlayIcon size={19} />
            </span>
            <span>
              <span
                style={{
                  display: "block",
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Quick-run an example
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 12.5,
                  color: "var(--text-2)",
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                Watch a simulation live in seconds — no project needed.
              </span>
            </span>
          </button>
        </div>

        {recentProjects.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--text)",
                }}
              >
                Recent projects
              </h2>
            </div>
            <div
              data-testid="recent-projects"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 16,
                marginBottom: 44,
              }}
            >
              {recentProjects.map((project) => {
                const size = sizes[project.dirName];
                const running = activeRun?.dirName === project.dirName;
                return (
                  <div
                    key={project.dirName}
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
                        {size
                          ? `${size.runs} ${size.runs === 1 ? "run" : "runs"}`
                          : "…"}
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
                        <span style={{ marginLeft: "auto" }}>
                          {formatBytes(size.bytes)}
                        </span>
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
                            borderRadius: 999,
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
              })}
            </div>
          </>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--text)",
            }}
          >
            Start from an example
          </h2>
          <a
            href="#"
            data-testid="browse-library-link"
            onClick={(event) => {
              event.preventDefault();
              setScreen({ name: "examples" });
            }}
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            Browse the library
          </a>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {ui.examples.examples.slice(0, 4).map((example) => (
            <ExampleCard key={example.id} example={example} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
