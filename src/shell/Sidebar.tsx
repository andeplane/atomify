/**
 * Global sidebar (ADR-003 §2): Home, Example library, the PROJECTS list with
 * color dots + running pulse, New project, a scrollable EXAMPLES list (click
 * to use as a project, play to quick-run), and a footer with the theme
 * toggle, Settings, and the engine-loading chip (loading never blocks
 * browsing — ADR-003 §6). Collapsible to a narrow icon rail (persisted) so
 * the simulation gets the horizontal room.
 */

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import type { ThemeName } from "../store/settings";
import { track } from "../utils/metrics";
import { useShellUI } from "./ShellContext";
import {
  AtomLogo,
  ChevronRightIcon,
  CompassIcon,
  PlayIcon,
  GridIcon,
  HelpIcon,
  HomeIcon,
  InfoIcon,
  MoonIcon,
  PlusIcon,
  SlidersIcon,
  SunIcon,
} from "./icons";
import { HELP_URL } from "./helpUrl";
import AboutModal, { AUTHOR_NAME, AUTHOR_URL } from "./modals/AboutModal";
import { ColorDot, PulseDot } from "./ui";
import type { Example } from "../hooks/useExamples";

/** Persisted collapse choice — the rail should survive reloads. */
const SIDEBAR_COLLAPSED_KEY = "atomify_sidebar_collapsed";

const navButtonStyle = (
  active: boolean,
  collapsed: boolean,
): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: collapsed ? "center" : "flex-start",
  gap: collapsed ? 0 : 11,
  width: "100%",
  padding: collapsed ? "9px 0" : "8px 12px",
  borderRadius: "var(--radius)",
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
  collapsed,
  onClick,
  icon,
  label,
  testId,
}: {
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  testId?: string;
}) => (
  <button
    onClick={onClick}
    data-testid={testId}
    title={collapsed ? label : undefined}
    className={active ? undefined : "shell-hoverable"}
    style={navButtonStyle(active, collapsed)}
  >
    {icon}
    {!collapsed && label}
  </button>
);

const sectionLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "var(--text-3)",
};

/**
 * One row of the sidebar examples list: thumbnail + title opens the
 * "use as project" flow; the play button quick-runs it.
 */
const SidebarExample = ({ example }: { example: Example }) => {
  const ui = useShellUI();
  return (
    <div
      className="shell-hoverable"
      data-testid={`sidebar-example-${example.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        borderRadius: 9,
        paddingRight: 4,
      }}
    >
      <button
        onClick={() => {
          track("Sidebar.Example.UseAsProject", { exampleId: example.id });
          ui.useExampleAsProject(example);
        }}
        title={`Use “${example.title}” as a project`}
        data-testid={`sidebar-example-use-${example.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          minWidth: 0,
          padding: "5px 0 5px 8px",
          border: "none",
          background: "transparent",
          color: "var(--text-2)",
          fontWeight: 500,
          fontSize: 13,
          fontFamily: "inherit",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 32,
            height: 24,
            flexShrink: 0,
            borderRadius: 5,
            background: "var(--viewport)",
            backgroundImage: example.imageUrl
              ? `url("${example.imageUrl}")`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid var(--border)",
          }}
        />
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {example.title}
        </span>
      </button>
      <button
        onClick={() => ui.quickRunExample(example)}
        disabled={!ui.engineReady}
        title={ui.engineReady ? "Quick run" : "Engine loading…"}
        aria-label={`Quick run ${example.title}`}
        data-testid={`sidebar-example-quick-${example.id}`}
        className="shell-hoverable-text"
        style={{
          width: 24,
          height: 24,
          flexShrink: 0,
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "var(--text-3)",
          cursor: ui.engineReady ? "pointer" : "not-allowed",
          opacity: ui.engineReady ? 1 : 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PlayIcon size={10} />
      </button>
    </div>
  );
};
/**
 * A NavButton look-alike that is a real link, so it opens in a new tab and
 * middle-click / "copy link" work as users expect.
 */
const NavLink = ({
  href,
  collapsed,
  onClick,
  icon,
  label,
  testId,
}: {
  href: string;
  collapsed: boolean;
  onClick?: () => void;
  icon: ReactNode;
  label: string;
  testId?: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    data-testid={testId}
    title={collapsed ? label : "Opens the documentation in a new tab"}
    className="shell-hoverable"
    style={{ ...navButtonStyle(false, collapsed), textDecoration: "none" }}
  >
    {icon}
    {!collapsed && label}
  </a>
);

const Sidebar = () => {
  const screen = useStoreState((state) => state.projects.screen);
  const projects = useStoreState((state) => state.projects.projects);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const theme = useStoreState((state) => state.settings.theme);
  const engineError = useStoreState((state) => state.app.engineError);
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
  const [aboutOpen, setAboutOpen] = useState(false);
  const examples = ui.examples.examples;

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  // The icon rail has no room for a list; "Example library" still links there.
  const showExamples = !collapsed;
  const toggleCollapsed = () =>
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // best effort
      }
      return next;
    });

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
    color: theme === mode ? "var(--on-accent)" : "var(--text-3)",
  });

  const collapseButton = (
    <button
      onClick={toggleCollapsed}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      data-testid="sidebar-collapse"
      className="shell-hoverable shell-hoverable-text"
      style={{
        width: 24,
        height: 24,
        borderRadius: 7,
        border: "none",
        background: "transparent",
        color: "var(--text-3)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: collapsed ? "none" : "rotate(180deg)",
        flexShrink: 0,
      }}
    >
      <ChevronRightIcon size={15} />
    </button>
  );

  return (
    <aside
      data-testid="sidebar"
      data-collapsed={collapsed ? "true" : "false"}
      style={{
        width: collapsed ? 64 : 252,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: "center",
          gap: collapsed ? 6 : 11,
          padding: collapsed ? "16px 0 10px" : "20px 18px 16px",
        }}
      >
        <div
          onClick={() => setScreen({ name: "home" })}
          data-testid="sidebar-logo"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            cursor: "pointer",
            minWidth: 0,
            flex: collapsed ? undefined : 1,
          }}
        >
          <AtomLogo />
          {!collapsed && (
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
          )}
        </div>
        {collapseButton}
      </div>

      <nav
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Nav + projects: natural height, scrolls only when space is tight. */}
        <div
          data-testid="sidebar-projects-section"
          style={{
            flex: showExamples ? "0 1 auto" : "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: collapsed ? "0 10px 16px" : "0 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <NavButton
            active={screen.name === "home"}
            collapsed={collapsed}
            onClick={() => setScreen({ name: "home" })}
            icon={<HomeIcon />}
            label="Home"
            testId="nav-home"
          />
          <NavButton
            active={screen.name === "examples"}
            collapsed={collapsed}
            onClick={() => setScreen({ name: "examples" })}
            icon={<GridIcon />}
            label="Example library"
            testId="nav-examples"
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              padding: collapsed ? "16px 0 5px" : "18px 12px 7px",
            }}
          >
            {!collapsed && <span style={sectionLabelStyle}>Projects</span>}
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
                title={collapsed ? project.displayName : undefined}
                className={active ? undefined : "shell-hoverable"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? 0 : 10,
                  width: "100%",
                  padding: collapsed ? "9px 0" : "7px 12px",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "var(--text)" : "var(--text-2)",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  fontFamily: "inherit",
                  position: "relative",
                }}
              >
                <ColorDot color={project.color} />
                {!collapsed && (
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
                )}
                {running &&
                  (collapsed ? (
                    <span style={{ position: "absolute", top: 4, right: 8 }}>
                      <PulseDot size={5} />
                    </span>
                  ) : (
                    <PulseDot />
                  ))}
              </button>
            );
          })}

          {!collapsed && (
            <button
              onClick={() => ui.openNewProject()}
              data-testid="sidebar-new-project"
              className="shell-dashed-hover"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: "var(--radius)",
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
          )}
        </div>

        {showExamples && (
          <div
            data-testid="sidebar-examples"
            style={{
              flex: "1 1 0",
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ padding: "14px 24px 7px" }}>
              <span style={sectionLabelStyle}>Examples</span>
            </div>
            <div
              data-testid="sidebar-examples-list"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "0 12px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {examples.map((example) => (
                <SidebarExample key={example.id} example={example} />
              ))}
              {examples.length === 0 && ui.examples.loading && (
                <span
                  style={{
                    padding: "6px 12px",
                    fontSize: 12.5,
                    color: "var(--text-3)",
                  }}
                >
                  Loading examples…
                </span>
              )}
            </div>
          </div>
        )}
      </nav>

      {!ui.engineReady && (
        <div
          data-testid={
            engineError ? "engine-error-chip" : "engine-loading-chip"
          }
          role={engineError ? "alert" : "status"}
          title={
            collapsed
              ? engineError
                ? `Engine unavailable: ${engineError}`
                : `Engine loading…${status ? ` ${Math.ceil(100 * status.progress)}%` : ""}`
              : undefined
          }
          aria-label={
            collapsed && engineError
              ? `Engine unavailable: ${engineError}`
              : undefined
          }
          style={{
            margin: collapsed ? "0 10px 10px" : "0 12px 10px",
            padding: collapsed ? "8px 0" : "8px 12px",
            borderRadius: 9,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 9,
            fontSize: 12,
            color: "var(--text-2)",
          }}
        >
          {engineError ? (
            <span aria-hidden="true">!</span>
          ) : (
            <PulseDot size={7} />
          )}
          {!collapsed && (
            <span style={{ flex: 1 }}>
              {engineError
                ? `Engine unavailable: ${engineError}`
                : `Engine loading…${status ? ` ${Math.ceil(100 * status.progress)}%` : ""}`}
            </span>
          )}
        </div>
      )}

      <div
        style={{
          padding: collapsed ? "0 10px 8px" : "0 12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <NavLink
          href={HELP_URL}
          collapsed={collapsed}
          onClick={() => track("Help.Open")}
          icon={<HelpIcon size={16} />}
          label="Help"
          testId="sidebar-help"
        />
        <NavButton
          active={false}
          collapsed={collapsed}
          onClick={() => {
            track("About.Open");
            setAboutOpen(true);
          }}
          icon={<InfoIcon size={16} />}
          label="About"
          testId="sidebar-about"
        />
        <NavButton
          active={false}
          collapsed={collapsed}
          onClick={() => {
            track("Tour.Replay");
            ui.startTour();
          }}
          icon={<CompassIcon size={16} />}
          label="Take the tour"
          testId="sidebar-tour"
        />
        {!collapsed && (
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="sidebar-credit"
            className="shell-hoverable-text"
            style={{
              padding: "2px 12px 0",
              fontSize: 11.5,
              color: "var(--text-3)",
              textDecoration: "none",
            }}
          >
            Made by {AUTHOR_NAME}
          </a>
        )}
      </div>

      <div
        style={{
          padding: collapsed ? "12px 10px" : 12,
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          gap: 8,
          alignItems: "center",
        }}
      >
        {collapsed ? (
          <button
            onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            data-testid="theme-flip"
            className="shell-hoverable shell-hoverable-text"
            style={{
              width: 30,
              height: 28,
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color: "var(--text-3)",
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        ) : (
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
        )}
        <button
          onClick={() => ui.openSettings()}
          data-testid="sidebar-settings"
          title={collapsed ? "Settings" : undefined}
          className="shell-hoverable shell-hoverable-text"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 10,
            flex: collapsed ? undefined : 1,
            width: collapsed ? 30 : undefined,
            padding: collapsed ? "6px 0" : "8px 10px",
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
          {!collapsed && "Settings"}
        </button>
      </div>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </aside>
  );
};

export default Sidebar;
