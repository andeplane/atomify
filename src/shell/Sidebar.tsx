/**
 * Global sidebar (ADR-003 §2): Home, Example library, the PROJECTS list with
 * color dots + running pulse, New project, and a footer with the theme
 * toggle, Settings, and the engine-loading chip (loading never blocks
 * browsing — ADR-003 §6).
 */

import type { CSSProperties, ReactNode } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import type { ThemeName } from "../store/settings";
import { track } from "../utils/metrics";
import { useShellUI } from "./ShellContext";
import {
  AtomLogo,
  GridIcon,
  HomeIcon,
  MoonIcon,
  PlusIcon,
  SlidersIcon,
  SunIcon,
} from "./icons";
import { ColorDot, PulseDot } from "./ui";

const navButtonStyle = (active: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 11,
  width: "100%",
  padding: "8px 12px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  background: active ? "var(--accent-soft)" : "transparent",
  color: active ? "var(--accent)" : "var(--text-2)",
  fontWeight: active ? 700 : 500,
  fontSize: 13.5,
  fontFamily: "inherit",
  textAlign: "left",
});

const NavButton = ({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  testId?: string;
}) => (
  <button
    onClick={onClick}
    data-testid={testId}
    className={active ? undefined : "shell-hoverable"}
    style={navButtonStyle(active)}
  >
    {children}
  </button>
);

const Sidebar = () => {
  const screen = useStoreState((state) => state.projects.screen);
  const projects = useStoreState((state) => state.projects.projects);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const theme = useStoreState((state) => state.settings.theme);
  const status = useStoreState((state) => state.app.status);
  const setTheme = useStoreActions((actions) => actions.settings.setTheme);
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const changeTheme = (next: ThemeName) => {
    track("Theme.Change", { theme: next });
    setTheme(next);
  };
  const openProject = useStoreActions(
    (actions) => actions.projects.openProject,
  );
  const ui = useShellUI();

  const themeButtonStyle = (mode: "dark" | "light"): CSSProperties => ({
    width: 30,
    height: 28,
    borderRadius: 7,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: theme === mode ? "var(--accent)" : "transparent",
    color: theme === mode ? "#fff" : "var(--text-3)",
  });

  return (
    <aside
      data-testid="sidebar"
      style={{
        width: 252,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div
        onClick={() => setScreen({ name: "home" })}
        data-testid="sidebar-logo"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "20px 18px 16px",
          cursor: "pointer",
        }}
      >
        <AtomLogo />
        <span
          style={{
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          Atomify
        </span>
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <NavButton
          active={screen.name === "home"}
          onClick={() => setScreen({ name: "home" })}
          testId="nav-home"
        >
          <HomeIcon />
          Home
        </NavButton>
        <NavButton
          active={screen.name === "examples"}
          onClick={() => setScreen({ name: "examples" })}
          testId="nav-examples"
        >
          <GridIcon />
          Example library
        </NavButton>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 12px 7px",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--text-3)",
            }}
          >
            Projects
          </span>
          <button
            onClick={() => ui.openNewProject()}
            title="New project"
            data-testid="sidebar-new-project-plus"
            className="shell-hoverable shell-hoverable-text"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlusIcon />
          </button>
        </div>

        {projects.map((project) => {
          const active =
            screen.name === "project" && screen.dirName === project.dirName;
          const running = activeRun?.dirName === project.dirName;
          return (
            <button
              key={project.dirName}
              onClick={() => openProject({ dirName: project.dirName })}
              data-testid={`sidebar-project-${project.dirName}`}
              className={active ? undefined : "shell-hoverable"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "7px 12px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                background: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--text)" : "var(--text-2)",
                fontWeight: active ? 700 : 500,
                fontSize: 13.5,
                fontFamily: "inherit",
              }}
            >
              <ColorDot color={project.color} />
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
              >
                {project.displayName}
              </span>
              {running && <PulseDot />}
            </button>
          );
        })}

        <button
          onClick={() => ui.openNewProject()}
          data-testid="sidebar-new-project"
          className="shell-dashed-hover"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px dashed var(--border-strong)",
            background: "transparent",
            color: "var(--text-3)",
            fontWeight: 600,
            fontSize: 13,
            fontFamily: "inherit",
            cursor: "pointer",
            marginTop: 6,
          }}
        >
          <PlusIcon />
          New project
        </button>
      </nav>

      {!ui.engineReady && (
        <div
          data-testid="engine-loading-chip"
          style={{
            margin: "0 12px 10px",
            padding: "8px 12px",
            borderRadius: 9,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: 12,
            color: "var(--text-2)",
          }}
        >
          <PulseDot size={7} />
          <span style={{ flex: 1 }}>
            Engine loading…
            {status ? ` ${Math.ceil(100 * status.progress)}%` : ""}
          </span>
        </div>
      )}

      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "var(--surface-2)",
            borderRadius: 9,
            padding: 3,
            gap: 2,
          }}
        >
          <button
            onClick={() => changeTheme("dark")}
            title="Dark"
            data-testid="theme-dark"
            style={themeButtonStyle("dark")}
          >
            <MoonIcon />
          </button>
          <button
            onClick={() => changeTheme("light")}
            title="Light"
            data-testid="theme-light"
            style={themeButtonStyle("light")}
          >
            <SunIcon />
          </button>
        </div>
        <button
          onClick={() => ui.openSettings()}
          data-testid="sidebar-settings"
          className="shell-hoverable shell-hoverable-text"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            padding: "8px 10px",
            borderRadius: 9,
            border: "none",
            background: "transparent",
            color: "var(--text-2)",
            fontWeight: 500,
            fontSize: 13.5,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <SlidersIcon />
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
