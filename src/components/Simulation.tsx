import { useCallback, useEffect, useRef } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import createModule from "lammps.js";
import { LammpsAdapter } from "../wasm/lammpsAdapter";
import { AtomifyWasmModule } from "../wasm/types";
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
  const adapterRef = useRef<LammpsAdapter>(undefined);

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
  // loop reads between timesteps.
  useEffect(() => {
    setPausedFlag(paused);
  }, [paused]);

  useEffect(() => {
    // Runs synchronously once per synced timestep, while the wasm module is
    // safe to touch (see LammpsAdapter.setStepListener). Pause and cancel are
    // handled by the adapter itself via the wasmInstance flags.
    adapterRef.current?.setStepListener(() => {
      if (paused) {
        return;
      }
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
    paused,
    runPostTimestep,
    runPostTimestepRendering,
    setHasSynchronized,
    simulationSettings,
  ]);

  useEffect(() => {
    if (!getWasmOrNull()) {
      setStatus({
        title: "Downloading LAMMPS ...",
        text: "",
        progress: 0.3,
      });
      setTimeout(() => {
        time_event("WASM.Load");
        const printLine = (...args: unknown[]) => onPrint(args.join(" "));
        createModule({
          print: printLine,
          printErr: printLine,
        }).then((Module) => {
          track("WASM.Load");
          setStatus({
            title: "Downloading LAMMPS ...",
            text: "",
            progress: 0.6,
          });
          const wasmModule = Module as AtomifyWasmModule;
          const lammps = new LammpsAdapter(
            wasmModule,
            new wasmModule.LAMMPSWeb(),
          );
          adapterRef.current = lammps;
          setLammps(lammps);
          setWasm(wasmModule);
          setSyncFrequency(1);
          setStatus(undefined);
        });
      }, 100);
    }
  }, [onPrint, setLammps, setStatus]);
  return <></>;
};
export default SimulationComponent;
