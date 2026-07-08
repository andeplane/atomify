import { useCallback, useEffect, useRef } from "react";
import { useStoreActions, useStoreState } from "../hooks";
// The atomify wasm build is a multithreaded KOKKOS/pthreads module that must
// run inside a Web Worker (it cannot initialize on the main thread). It is
// owned by LammpsWorkerProxy, which spawns the worker (lammps.worker.ts) and
// bridges its streamed particle/box data back into the store's usual
// heap-pointer path. See src/wasm/LammpsWorkerProxy.ts.
import { LammpsWorkerProxy } from "../wasm/LammpsWorkerProxy";
import { notification } from "antd";
import { time_event, track } from "../utils/metrics";
import {
  getWasmOrNull,
  setWasm,
  getSyncFrequency,
  setSyncFrequency,
  setPausedFlag,
} from "../wasm/wasmInstance";

const SimulationComponent = () => {
  const wasm = getWasmOrNull();
  const lammps = useStoreState((state) => state.simulation.lammps);
  const simulation = useStoreState((state) => state.simulation.simulation);
  const paused = useStoreState((state) => state.simulation.paused);
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
  const selectedMenu = useStoreState((state) => state.app.selectedMenu);
  const setLammps = useStoreActions((actions) => actions.simulation.setLammps);
  const setStatus = useStoreActions((actions) => actions.app.setStatus);
  const runPostTimestep = useStoreActions(
    (actions) => actions.processing.runPostTimestep,
  );
  const runPostTimestepRendering = useStoreActions(
    (actions) => actions.processing.runPostTimestepRendering,
  );
  const setHasSynchronized = useStoreActions(
    (actions) => actions.simulationStatus.setHasSynchronized,
  );
  const renderCycleCounter = useRef(0);
  const proxyRef = useRef<LammpsWorkerProxy>(undefined);
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
      if (selectedMenu !== "view") {
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
        notification.info({
          message: `Setting simulation speed to ${value}.`,
        });
      }

      if (running && ev.key === " ") {
        setPaused(!paused);
      }

      if (ev.key === "c" && !ev.metaKey && !ev.ctrlKey) {
        if (!window.visualizer) return;
        const cameraPosition = window.visualizer.getCameraPosition();
        const cameraTarget = window.visualizer.getCameraTarget();
        const output = `#/camera position ${cameraPosition.x.toFixed(1)} ${cameraPosition.y.toFixed(1)} ${cameraPosition.z.toFixed(1)}\n#/camera target ${cameraTarget.x.toFixed(1)} ${cameraTarget.y.toFixed(1)} ${cameraTarget.z.toFixed(1)}`;
        navigator.clipboard.writeText(output);
        notification.info({
          message: "Copied camera position and target to clipboard.",
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    lammps,
    running,
    selectedMenu,
    paused,
    setPaused,
    setSimulationSettings,
    simulation,
    simulationSettings,
  ]);

  // Mirror the store's paused state into the flag the adapter's pause-wait
  // loop reads between timesteps. The adapter lives in the worker, so the flag
  // must be forwarded there via the proxy; the main-thread flag is kept in sync
  // too for any code that reads it locally.
  useEffect(() => {
    setPausedFlag(paused);
    proxyRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    // Runs synchronously once per synced timestep, while the wasm module is
    // safe to touch (see LammpsAdapter.setStepListener). Pause and cancel are
    // handled by the adapter itself via the wasmInstance flags; rendering
    // still runs here on the pausing step so the display matches the state
    // the simulation actually pauses at.
    proxyRef.current?.setStepListener(() => {
      if (lammps && wasm && simulation) {
        setHasSynchronized(true);

        // Always update 3D rendering (high frequency)
        runPostTimestepRendering();

        // Update UI state only every Nth cycle (low frequency)
        renderCycleCounter.current += 1;
        const uiUpdateFrequency = simulationSettings.uiUpdateFrequency || 15;
        if (renderCycleCounter.current >= uiUpdateFrequency) {
          renderCycleCounter.current = 0;
          runPostTimestep(false);
        }

        const freq = getSyncFrequency();
        if (freq !== undefined) {
          lammps.setSyncFrequency(freq);
        }
      }
    });
  }, [
    wasm,
    lammps,
    simulation,
    runPostTimestep,
    runPostTimestepRendering,
    setHasSynchronized,
    simulationSettings,
  ]);

  useEffect(() => {
    if (getWasmOrNull() || loadStartedRef.current) {
      return;
    }
    loadStartedRef.current = true;
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
    // exposes a wasm-module-shaped bridge (getModule) plus the LammpsWeb
    // interface; the store and modifier/render pipeline keep reading data
    // through the usual heap-pointer path, now backed by the streamed bridge
    // heap instead of a real main-thread module.
    // ?kokkos=false starts LAMMPS serially (no Kokkos runtime) so a run can be
    // compared against the multithreaded default; any other value enables it.
    const kokkosEnabled =
      new URLSearchParams(window.location.search).get("kokkos") !== "false";
    const proxy = new LammpsWorkerProxy();
    proxy.onPrint(onPrint);
    // Surface worker/LAMMPS errors in the console panel rather than only the
    // devtools console.
    proxy.onError((message) => onPrint(message));
    proxyRef.current = proxy;
    proxy
      .load(kokkosEnabled)
      .then(() => {
        track("WASM.Load");
        setStatus({
          title: "Downloading LAMMPS ...",
          text: "",
          progress: 0.6,
        });
        setWasm(proxy.getModule());
        setLammps(proxy);
        setSyncFrequency(1);
        setStatus(undefined);
      })
      .catch((error: unknown) => {
        // The module failed to load — don't leave the UI stuck on the
        // "Downloading LAMMPS …" spinner with no explanation.
        const message = error instanceof Error ? error.message : String(error);
        onPrint(`Failed to load LAMMPS: ${message}`);
        setStatus(undefined);
        notification.error({
          message: "Failed to load LAMMPS",
          description: message,
        });
      });
  }, [onPrint, setLammps, setStatus]);
  return <></>;
};
export default SimulationComponent;
