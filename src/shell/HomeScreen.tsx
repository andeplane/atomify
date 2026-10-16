/**
 * Home (ADR-003 §2): greeting, continue-where-you-left-off card (live run
 * status / last frame), Create new project + Quick-run cards, the recent
 * projects grid, and a start-from-example row.
 */

import { useEffect, useMemo, useState } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import {
  cardBase,
  ContinueCard,
  ExampleCard,
  RecentProjectCard,
} from "./HomeCards";
import { useShellUI } from "./ShellContext";
import { greeting } from "./format";
import { PlayIcon, PlusIcon } from "./icons";

export const LAST_PROJECT_KEY = "atomify_last_project";

const HomeScreen = () => {
  const projects = useStoreState((state) => state.projects.projects);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const projectSizes = useStoreActions(
    (actions) => actions.projects.projectSizes,
  );
  const ui = useShellUI();

  const [sizes, setSizes] = useState<
    Record<string, { bytes: number; runs: number }>
  >({});

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

  return (
    <div style={{ flex: 1, overflowY: "auto" }} data-testid="home-screen">
      <div
        style={{ maxWidth: 1120, margin: "0 auto", padding: "44px 40px 64px" }}
      >
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
            <ContinueCard continueProject={continueProject} />
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
              <span
                style={{
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Welcome to Atomify
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--text-2)",
                  lineHeight: 1.5,
                }}
              >
                Run LAMMPS molecular dynamics right here in your browser. Create
                a project or quick-run an example to get started.
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
                color: "var(--on-accent)",
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
                  <RecentProjectCard
                    key={project.dirName}
                    project={project}
                    size={size}
                    running={running}
                  />
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
