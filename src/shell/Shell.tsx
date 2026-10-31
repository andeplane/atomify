/**
 * The Atomify shell (ADR-003): sidebar + typed-screen main area, theme
 * wiring, deep links, autosave flushing on visibility changes, notice
 * toasts, and the run launcher. This IS the app — the legacy embedded-mode
 * shell was removed 2026-07-11.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ConfigProvider, notification } from "antd";
import {
  useEngineState,
  useStore,
  useStoreActions,
  useStoreState,
} from "../hooks";
import { useExamples, type Example } from "../hooks/useExamples";
import { useSimulationNotifications } from "../hooks/useSimulationNotifications";
import Simulation from "../components/Simulation";
import { isScriptFile } from "../store/projects";
import { scriptOptsIntoKokkos } from "../utils/kokkos";
import { track } from "../utils/metrics";
import { shellThemeConfig } from "../theme";
import { parseDeepLink, screenToSearch } from "./deepLink";
import { defaultThreadCount } from "./runPlan";
import { runNumber } from "./format";
import { LAST_PROJECT_KEY } from "./HomeScreen";
import { ShellUIContext, type SettingsTab, type ShellUI } from "./ShellContext";
import Sidebar from "./Sidebar";
import HomeScreen from "./HomeScreen";
import ExamplesScreen from "./ExamplesScreen";
import ProjectWorkspace from "./ProjectWorkspace";
import NotebookTab from "./NotebookTab";
import NewRunModal from "./modals/NewRunModal";
import NewProjectModal from "./modals/NewProjectModal";
import SettingsModal from "./modals/SettingsModal";
import RenameModal from "./modals/RenameModal";
import DeleteProjectModal from "./modals/DeleteProjectModal";
import { exampleProjectFiles } from "./modals/NewProjectModal";
import TourController from "./tour/TourController";
import { markTourSeen, shouldAutoStartTour } from "./tour/tourStorage";
import "./tokens.css";

/** Model notices that the rich run-finished toast already covers. */
const RUN_NOTICE = /^Run #\S+ (completed|failed|canceled|interrupted)\.$/;

const Shell = () => {
  // Hook-based notifications: antd v5's static notification API does not
  // render under React 19, so every shell toast goes through this instance.
  const [notify, notificationHolder] = notification.useNotification();
  useSimulationNotifications(notify);
  const store = useStore();
  const theme = useStoreState((state) => state.settings.theme);
  const screen = useStoreState((state) => state.projects.screen);
  const active = useStoreState((state) => state.projects.active);
  const activeRun = useStoreState((state) => state.projects.activeRun);
  const notice = useStoreState((state) => state.projects.notice);
  const lammps = useEngineState((objects) => objects.lammps);
  // Set when the engine failed to load or its worker crashed mid-session.
  const engineError = useStoreState((state) => state.app.engineError);

  const initialize = useStoreActions((actions) => actions.projects.initialize);
  const openProject = useStoreActions(
    (actions) => actions.projects.openProject,
  );
  const setScreen = useStoreActions((actions) => actions.projects.setScreen);
  const setNotice = useStoreActions((actions) => actions.projects.setNotice);
  const refreshActive = useStoreActions(
    (actions) => actions.projects.refreshActive,
  );
  const flushPendingSaves = useStoreActions(
    (actions) => actions.projects.flushPendingSaves,
  );
  const createProject = useStoreActions(
    (actions) => actions.projects.createProject,
  );
  const setInputScript = useStoreActions(
    (actions) => actions.projects.setInputScript,
  );
  const startRuns = useStoreActions((actions) => actions.projects.startRuns);
  const readFile = useStoreActions((actions) => actions.projects.readFile);
  const setLiveViewportVisible = useStoreActions(
    (actions) => actions.app.setLiveViewportVisible,
  );

  const examples = useExamples();

  // --- Modal state -----------------------------------------------------------
  const [newProject, setNewProject] = useState<{
    open: boolean;
    exampleId?: string;
  }>({ open: false });
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [runModal, setRunModal] = useState<{ choosingInput: boolean } | null>(
    null,
  );
  const [linkResolved, setLinkResolved] = useState(false);
  const [tourOn, setTourOn] = useState(false);

  // --- Theme -> document root -------------------------------------------------
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // --- Init + deep link (once) ------------------------------------------------
  const initedRef = useRef(false);
  useEffect(() => {
    if (initedRef.current) {
      return;
    }
    initedRef.current = true;
    void (async () => {
      try {
        await initialize();
        const target = parseDeepLink(window.location.search);
        if (target?.name === "project") {
          await openProject({ dirName: target.dirName, tab: target.tab });
          const current = store.getState().projects.screen;
          if (
            current.name === "project" &&
            current.dirName === target.dirName &&
            (target.runId || target.filePath)
          ) {
            setScreen({
              name: "project",
              dirName: target.dirName,
              tab: target.tab,
              runId: target.runId,
              filePath: target.filePath,
            });
          }
        } else if (target) {
          setScreen(target);
        }
      } finally {
        setLinkResolved(true);
      }
    })();
  }, [initialize, openProject, setScreen, store]);

  // --- URL sync ----------------------------------------------------------------
  useEffect(() => {
    if (!linkResolved) {
      return;
    }
    const search = screenToSearch(screen, window.location.search);
    const next = `${window.location.pathname}${search}${window.location.hash}`;
    if (
      next !==
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    ) {
      window.history.replaceState(null, "", next);
    }
  }, [screen, linkResolved]);

  // --- Onboarding tour ----------------------------------------------------------
  const startTour = useCallback(() => {
    markTourSeen();
    setScreen({ name: "home" });
    setTourOn(true);
  }, [setScreen]);

  // First visit: a brand-new user (no projects, landed on Home) gets the tour.
  const autoTourCheckedRef = useRef(false);
  useEffect(() => {
    if (!linkResolved || autoTourCheckedRef.current) {
      return;
    }
    autoTourCheckedRef.current = true;
    const state = store.getState().projects;
    if (
      state.screen.name === "home" &&
      state.projects.length === 0 &&
      shouldAutoStartTour()
    ) {
      startTour();
    }
  }, [linkResolved, store, startTour]);

  // --- Remember the last opened project for the Home continue card -------------
  useEffect(() => {
    if (screen.name === "project" && active && !active.quick) {
      try {
        localStorage.setItem(LAST_PROJECT_KEY, screen.dirName);
      } catch {
        // best effort
      }
    }
  }, [screen, active]);

  // --- Autosave flush / refresh on visibility + focus (ADR-001 §8) -------------
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushPendingSaves();
      } else {
        void refreshActive();
      }
    };
    const onFocus = () => {
      void refreshActive();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [flushPendingSaves, refreshActive]);

  // --- Notices as toasts --------------------------------------------------------
  useEffect(() => {
    if (!notice) {
      return;
    }
    if (!RUN_NOTICE.test(notice)) {
      notify.info({ message: notice });
    }
    setNotice(undefined);
  }, [notice, setNotice, notify]);

  // --- Rich run-finished toast (ADR-003 §4.3) ------------------------------------
  const previousRunRef = useRef(activeRun);
  useEffect(() => {
    const previous = previousRunRef.current;
    previousRunRef.current = activeRun;
    if (!previous || activeRun) {
      return;
    }
    const { dirName, runId, quick } = previous;
    const current = store.getState().projects.screen;
    if (
      current.name === "project" &&
      current.dirName === dirName &&
      current.runId === runId
    ) {
      return;
    }
    const currentActive = store.getState().projects.active;
    const finished =
      currentActive?.meta.dirName === dirName
        ? currentActive.runs.find((run) => run.runId === runId)
        : undefined;
    // The runs list refresh may not have landed yet when activeRun clears;
    // a still-"running" status here is just stale.
    const rawStatus = finished?.meta?.status;
    const status =
      !rawStatus || rawStatus === "running" ? "finished" : rawStatus;
    const key = `run-finished-${runId}`;
    const goTo = (tab: "runs" | "notebook") => {
      notify.destroy(key);
      void openProject({ dirName, quick, tab }).then(() => {
        if (tab === "runs") {
          setScreen({ name: "project", dirName, tab: "runs", runId });
        }
      });
    };
    notify.info({
      key,
      message: `Run #${runNumber(runId)} ${status}`,
      btn: (
        <span style={{ display: "inline-flex", gap: 8 }}>
          <Button size="small" onClick={() => goTo("runs")}>
            View
          </Button>
          {!quick && (
            <Button size="small" onClick={() => goTo("notebook")}>
              Analyze in notebook
            </Button>
          )}
        </span>
      ),
    });
  }, [activeRun, openProject, setScreen, store, notify]);

  // --- Particle streaming gate --------------------------------------------------
  // The processing pipeline only hands new particles to the renderer while
  // the live run-detail screen (the viewport) is visible; this also enables
  // the viewport keyboard shortcuts there.
  const liveDetailVisible =
    screen.name === "project" &&
    screen.tab === "runs" &&
    !!screen.runId &&
    activeRun?.runId === screen.runId &&
    activeRun?.dirName === screen.dirName;
  useEffect(() => {
    setLiveViewportVisible(liveDetailVisible);
  }, [liveDetailVisible, setLiveViewportVisible]);

  // --- Run launcher ----------------------------------------------------------------
  const launch = useCallback(
    async (
      inputScript: string,
      vars: Record<string, number>,
      origin: "button" | "file" = "button",
    ) => {
      let useKokkos = false;
      try {
        useKokkos = scriptOptsIntoKokkos(await readFile(inputScript));
      } catch {
        // unreadable script: let the engine report the real error
      }
      await startRuns([
        { inputScript, vars, useKokkos, threads: defaultThreadCount(), origin },
      ]);
    },
    [readFile, startRuns],
  );

  const runProject = useCallback(async () => {
    // "Save & run": persist editor changes before the run snapshots the tree.
    await flushPendingSaves();
    const current = store.getState().projects.active;
    if (!current) {
      return;
    }
    const scripts = current.files.filter(
      (file) =>
        file.type !== "directory" &&
        isScriptFile(file.path, current.meta.inputScript),
    );
    let input = current.meta.inputScript;
    if (input && !scripts.some((script) => script.path === input)) {
      input = undefined; // designated script no longer exists
    }
    if (!input) {
      if (scripts.length === 1) {
        await setInputScript(scripts[0].path);
        input = scripts[0].path;
      } else {
        // 0 or >1 candidates: the modal explains / lets the user choose.
        setRunModal({ choosingInput: true });
        return;
      }
    }
    await launch(input, {});
  }, [store, setInputScript, launch, flushPendingSaves]);

  const quickRunExample = useCallback(
    (example: Example) => {
      track("QuickRun.Start", { exampleId: example.id });
      void createProject({
        displayName: `Quick run — ${example.title}`,
        quick: true,
        autoStart: true,
        files: exampleProjectFiles(example),
        inputScript: example.inputScript,
        source: { type: "example", exampleId: example.id },
      }).catch((error: unknown) => {
        notify.error({
          message: "Could not start the quick run",
          description: error instanceof Error ? error.message : String(error),
        });
      });
    },
    [createProject, notify],
  );

  const ui = useMemo<ShellUI>(
    () => ({
      notify,
      openNewProject: (exampleId) => setNewProject({ open: true, exampleId }),
      openSettings: (tab) => setSettingsTab(tab ?? "general"),
      openDeleteProject: (dirName) => setDeleteTarget(dirName),
      openRename: () => setRenameOpen(true),
      openNewRun: (options) =>
        setRunModal({ choosingInput: options?.choosingInput ?? false }),
      quickRunExample,
      useExampleAsProject: (example) => {
        track("Example.UseAsProject", { exampleId: example.id });
        setNewProject({ open: true, exampleId: example.id });
      },
      runProject,
      runFile: (path) => launch(path, {}, "file"),
      runAgain: (inputScript, vars) => launch(inputScript, vars),
      // The engine proxy owns run control; cancel also releases a paused run.
      stopRun: () => lammps?.cancel(),
      engineReady: lammps !== undefined && !engineError,
      examples,
      startTour,
    }),
    [
      startTour,
      notify,
      quickRunExample,
      runProject,
      launch,
      lammps,
      engineError,
      examples,
    ],
  );

  return (
    <ConfigProvider theme={shellThemeConfig(theme)}>
      <ShellUIContext.Provider value={ui}>
        {notificationHolder}
        <Simulation />
        <div
          className="atomify-shell"
          data-testid="shell-root"
          style={{
            height: "100vh",
            display: "flex",
            overflow: "hidden",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 14,
          }}
        >
          <Sidebar />
          <main
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {screen.name === "home" && <HomeScreen />}
            {screen.name === "examples" && <ExamplesScreen />}
            {screen.name === "project" && <ProjectWorkspace screen={screen} />}
            {/* Kept mounted across tabs/screens so JupyterLite never reloads. */}
            <NotebookTab />
          </main>
        </div>

        {tourOn && <TourController onEnd={() => setTourOn(false)} />}
        <NewRunModal
          open={runModal !== null}
          choosingInput={runModal?.choosingInput ?? false}
          onClose={() => setRunModal(null)}
          onGoToFiles={() => {
            setRunModal(null);
            const current = store.getState().projects.screen;
            if (current.name === "project") {
              setScreen({
                name: "project",
                dirName: current.dirName,
                tab: "files",
              });
            }
          }}
        />
        <NewProjectModal
          open={newProject.open}
          initialExampleId={newProject.exampleId}
          onClose={() => setNewProject({ open: false })}
        />
        <SettingsModal
          open={settingsTab !== null}
          tab={settingsTab ?? "general"}
          onTabChange={setSettingsTab}
          onClose={() => setSettingsTab(null)}
        />
        {renameOpen && (
          <RenameModal open={renameOpen} onClose={() => setRenameOpen(false)} />
        )}
        {deleteTarget && (
          <DeleteProjectModal
            dirName={deleteTarget}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </ShellUIContext.Provider>
    </ConfigProvider>
  );
};

export default Shell;
