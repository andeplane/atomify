import { useCallback, useEffect, useRef } from "react";
import {
  useEngine,
  useEngineState,
  useStoreActions,
  useStoreState,
} from "../hooks";
// The atomify wasm build is a multithreaded KOKKOS/pthreads module that must
// run inside a Web Worker (it cannot initialize on the main thread). It is
// owned by LammpsWorkerProxy, which spawns the worker (lammps.worker.ts) and
// keeps the latest streamed frame; the run pipeline (RunController) feeds
// each run's frames into the modifier/render pipeline. The proxy is
// registered in the EngineRegistry, not the store.
// See src/wasm/LammpsWorkerProxy.ts.
import { LammpsWorkerProxy } from "../wasm/LammpsWorkerProxy";
import { useShellUI } from "../shell/ShellContext";
import { time_event, track } from "../utils/metrics";

const SimulationComponent = () => {
  const engine = useEngine();
  const lammps = useEngineState((objects) => objects.lammps);
  const setPaused = useStoreActions((actions) => actions.simulation.setPaused);
  const simulationSettings = useStoreState(
    (state) => state.settings.simulation,
  );
  const setSimulationSettings = useStoreActions(
    (actions) => actions.settings.setSimulation,
  );
  const running = useStoreState((state) => state.simulation.running);
  const addLammpsOutput = useStoreActions(
    (actions) => actions.simulation.addLammpsOutput,
  );
  const liveViewportVisible = useStoreState(
    (state) => state.app.liveViewportVisible,
  );
  const visualizer = useEngineState((objects) => objects.visualizer);
  // Hook-based toasts: antd's static notification functions don't render
  // under React 19 (see ShellContext.tsx). Mounted inside ShellUIContext.
  const { notify } = useShellUI();
  const panMode = useStoreState((state) => state.render.panMode);
  const setPanMode = useStoreActions((actions) => actions.render.setPanMode);
  const setEngineError = useStoreActions(
    (actions) => actions.app.setEngineError,
  );
  const setStatus = useStoreActions((actions) => actions.app.setStatus);
  const loadStartedRef = useRef(false);

  const onPrint = useCallback(
    (text: string) => {
      if (
        text.includes("Atomify::canceled") ||
        text.includes("JS async step callback rejected")
      ) {
        // Stop-button aborts, not real errors
        return;
      }
      addLammpsOutput(text);
      console.log(text);
    },
    [addLammpsOutput],
  );

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      // Shortcuts belong to the viewport, not text entry or modal controls.
      const path = ev.composedPath();
      const interacting = path.some(
        (target) =>
          target instanceof HTMLElement &&
          (target.isContentEditable ||
            target.matches(
              'input, textarea, select, button, a[href], [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="spinbutton"]',
            )),
      );
      if (
        !liveViewportVisible ||
        interacting ||
        ev.defaultPrevented ||
        ev.isComposing ||
        ev.repeat ||
        ev.ctrlKey ||
        ev.metaKey ||
        ev.altKey ||
        document.querySelector(
          '[role="dialog"][aria-modal="true"], dialog[open]',
        )
      ) {
        return;
      }

      const syncFrequencyMap = {
        "1": 1,
        "2": 2,
        "3": 4,
        "4": 6,
        "5": 10,
        "6": 20,
        "7": 50,
        "8": 100,
        "9": 200,
      };
      if (Object.keys(syncFrequencyMap).indexOf(ev.key) >= 0) {
        const value: number =
          syncFrequencyMap[ev.key as keyof typeof syncFrequencyMap];
        setSimulationSettings({ ...simulationSettings, speed: value });
        notify.info({
          message: `Setting simulation speed to ${value}.`,
        });
      }

      if (running && ev.key === " ") {
        ev.preventDefault();
        // The engine proxy owns the paused state; toggle what it reports.
        setPaused(!(lammps?.isPaused() ?? false));
      }

      if (ev.key === "c" && !ev.metaKey && !ev.ctrlKey) {
        if (!visualizer) return;
        const cameraPosition = visualizer.getCameraPosition();
        const cameraTarget = visualizer.getCameraTarget();
        const output = `#/camera position ${cameraPosition.x.toFixed(1)} ${cameraPosition.y.toFixed(1)} ${cameraPosition.z.toFixed(1)}\n#/camera target ${cameraTarget.x.toFixed(1)} ${cameraTarget.y.toFixed(1)} ${cameraTarget.z.toFixed(1)}`;
        void navigator.clipboard.writeText(output);
        notify.info({
          message: "Copied camera position and target to clipboard.",
        });
      }

      if (ev.key === "p" || ev.key === "P") {
        setPanMode(!panMode);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    lammps,
    running,
    liveViewportVisible,
    visualizer,
    notify,
    setPaused,
    panMode,
    setPanMode,
    setSimulationSettings,
    simulationSettings,
  ]);

  // P only works while the live viewport is visible, so leave pan mode
  // there too: otherwise a view-only run's 3D view would keep panning on
  // left-drag with no way to switch it back.
  useEffect(() => {
    if (!liveViewportVisible && panMode) setPanMode(false);
  }, [liveViewportVisible, panMode, setPanMode]);

  // The speed setting is how often the engine syncs (and streams a frame).
  // The proxy owns the value and forwards changes to the worker.
  useEffect(() => {
    lammps?.setSyncFrequency(simulationSettings.speed);
  }, [lammps, simulationSettings.speed]);

  useEffect(() => {
    // The registered engine outlives this component, so a remount doesn't
    // spawn a second one; the ref covers the window before the load finishes.
    if (lammps || loadStartedRef.current) {
      return;
    }
    loadStartedRef.current = true;
    setEngineError(undefined);
    // Safari and other WebKit browsers (including iOS browsers) cannot run
    // our credentialless / SharedArrayBuffer engine configuration.
    const isWebKit =
      /AppleWebKit/i.test(navigator.userAgent) &&
      !/Chrome\/|Chromium\/|Edg\/|OPR\/|Android/i.test(navigator.userAgent);
    if (isWebKit) {
      setEngineError(
        "Safari is not supported for simulations. Use Chrome or Firefox on a desktop computer.",
      );
      return;
    }
    if (
      !window.crossOriginIsolated ||
      typeof SharedArrayBuffer === "undefined"
    ) {
      setEngineError(
        "The simulation engine requires cross-origin isolation. Reload the page; if this persists, check browser settings or try another browser.",
      );
      return;
    }
    setStatus({
      title: "Downloading LAMMPS ...",
      text: "",
      progress: 0.3,
    });
    time_event("WASM.Load");
    // The atomify wasm build is a multithreaded KOKKOS/pthreads + ASYNCIFY
    // module. A pthreads module cannot initialize on the browser main thread
    // (its thread-pool handshake blocks on Atomics.wait, forbidden off a
    // Worker), so it runs inside a Web Worker. The proxy owns that worker and
    // is the app's LammpsWeb: the modifier/render pipeline reads the typed
    // arrays of its latest streamed frame, and engine-FS writes are forwarded
    // to the worker as commands. The run pipeline (RunController) owns the
    // proxy's step listener while a run streams.
    Promise.resolve()
      .then(async () => {
        const proxy = new LammpsWorkerProxy();
        proxy.onPrint(onPrint);
        proxy.onError((message) => onPrint(message));
        // A crashed worker can't be restarted in place: flag the engine as
        // unavailable (sidebar chip, run buttons disabled) until a reload.
        // Any in-flight run has already been failed by the proxy.
        proxy.onCrash((message) => {
          setEngineError(`${message}. Reload the page to restart the engine.`);
          notify.error({
            message: "The simulation engine crashed",
            description: "Reload the page to restart the engine.",
          });
        });
        await proxy.load();
        return proxy;
      })
      .then((proxy) => {
        track("WASM.Load");
        setStatus({
          title: "Downloading LAMMPS ...",
          text: "",
          progress: 0.6,
        });
        engine.setLammps(proxy);
        setStatus(undefined);
      })
      .catch((error: unknown) => {
        // The module failed to load — don't leave the UI stuck on the
        // "Downloading LAMMPS …" spinner with no explanation.
        const message = error instanceof Error ? error.message : String(error);
        setEngineError(message);
        onPrint(`Failed to load LAMMPS: ${message}`);
        setStatus(undefined);
        notify.error({
          message: "Failed to load LAMMPS",
          description: message,
        });
      });
  }, [engine, lammps, onPrint, setStatus, setEngineError, notify]);
  return <></>;
};
export default SimulationComponent;
