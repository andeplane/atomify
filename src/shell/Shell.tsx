/**
 * The Atomify shell (ADR-003): sidebar + typed-screen main area, theme
 * wiring, deep links, autosave flushing on visibility changes, notice
 * toasts, and the run launcher. The legacy embedded-mode path renders the
 * old Main/menu flow instead (src/EmbeddedApp.tsx).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ConfigProvider, notification } from "antd";
import { useStore, useStoreActions, useStoreState } from "../hooks";
import { useExamples, type Example } from "../hooks/useExamples";
import { useSimulationNotifications } from "../hooks/useSimulationNotifications";
import Simulation from "../components/Simulation";
import ShareSimulation from "../containers/ShareSimulation";
import type { Simulation as SimulationType } from "../store/simulation";
import { isScriptFile } from "../store/projects";
import { scriptOptsIntoKokkos } from "../utils/kokkos";
import { setCancel } from "../wasm/wasmInstance";
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
import NewRunModal from "./modals/NewRunModal";
import NewProjectModal from "./modals/NewProjectModal";
import SettingsModal from "./modals/SettingsModal";
import RenameModal from "./modals/RenameModal";
import DeleteProjectModal from "./modals/DeleteProjectModal";
import { exampleProjectFiles } from "./modals/NewProjectModal";
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
  const lammps = useStoreState((state) => state.simulation.lammps);

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
  const setPaused = useStoreActions((actions) => actions.simulation.setPaused);
  const setSelectedMenu = useStoreActions(
    (actions) => actions.app.setSelectedMenu,
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
  const [shareSimulation, setShareSimulation] =
    useState<SimulationType | null>(null);
  const [linkResolved, setLinkResolved] = useState(false);

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
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", next);
    }
  }, [screen, linkResolved]);

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
  // The processing pipeline only pushes particles into the render model when
  // selectedMenu === "view" (legacy gate). The live run-detail screen IS the
  // view now; this also enables the viewport keyboard shortcuts there.
  const liveDetailVisible =
    screen.name === "project" &&
    screen.tab === "runs" &&
    !!screen.runId &&
    activeRun?.runId === screen.runId &&
    activeRun?.dirName === screen.dirName;
  useEffect(() => {
    setSelectedMenu(liveDetailVisible ? "view" : "shell");
  }, [liveDetailVisible, setSelectedMenu]);

  // --- Run launcher ----------------------------------------------------------------
  const launch = useCallback(
    async (inputScript: string, vars: Record<string, number>) => {
      let useKokkos = false;
      try {
        useKokkos = scriptOptsIntoKokkos(await readFile(inputScript));
      } catch {
        // unreadable script: let the engine report the real error
      }
      await startRuns([
        { inputScript, vars, useKokkos, threads: defaultThreadCount() },
      ]);
    },
    [readFile, startRuns],
  );

  const runProject = useCallback(async () => {
    const current = store.getState().projects.active;
    if (!current) {
      return;
    }
    const scripts = current.files.filter(
      (file) => file.type !== "directory" && isScriptFile(file.path),
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
  }, [store, setInputScript, launch]);

  const quickRunExample = useCallback(
    (example: Example) => {
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

  const openShare = useCallback(async () => {
    const current = store.getState().projects.active;
    if (!current || !current.meta.inputScript) {
      notify.info({
        message: "Set an input script before sharing the project.",
      });
      return;
    }
    const files: { fileName: string; content: string }[] = [];
    for (const file of current.files) {
      if (
        file.type === "directory" ||
        file.format === "base64" ||
        file.path.endsWith(".ipynb")
      ) {
        continue;
      }
      files.push({
        fileName: file.path,
        content: await readFile(file.path),
      });
    }
    setShareSimulation({
      id: current.meta.dirName,
      files,
      inputScript: current.meta.inputScript,
      start: true,
    });
  }, [store, readFile, notify]);

  const ui = useMemo<ShellUI>(
    () => ({
      notify,
      openNewProject: (exampleId) => setNewProject({ open: true, exampleId }),
      openSettings: (tab) => setSettingsTab(tab ?? "general"),
      openDeleteProject: (dirName) => setDeleteTarget(dirName),
      openRename: () => setRenameOpen(true),
      openNewRun: (options) =>
        setRunModal({ choosingInput: options?.choosingInput ?? false }),
      openShare: () => void openShare(),
      quickRunExample,
      useExampleAsProject: (example) =>
        setNewProject({ open: true, exampleId: example.id }),
      runProject,
      runFile: (path) => launch(path, {}),
      runAgain: (inputScript, vars) => launch(inputScript, vars),
      stopRun: () => {
        // Same path as the legacy Stop menu item: unpause, then cancel.
        setPaused(false);
        setCancel(true);
      },
      engineReady: lammps !== undefined,
      examples,
    }),
    [
      notify,
      quickRunExample,
      runProject,
      launch,
      openShare,
      setPaused,
      lammps,
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
          </main>
        </div>

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
        {shareSimulation && (
          <ShareSimulation
            visible
            onClose={() => setShareSimulation(null)}
            simulation={shareSimulation}
          />
        )}
      </ShellUIContext.Provider>
    </ConfigProvider>
  );
};

export default Shell;
