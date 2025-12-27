import { useCallback, useEffect, useRef } from "react";
import { useStoreActions, useStoreState } from "../hooks";
import createModule from "../wasm/lammps.mjs";
import { LammpsWeb } from "../types";
import { AtomifyWasmModule } from "../wasm/types";
import { notification } from "antd";
import { time_event, track } from "../utils/metrics";

const SimulationComponent = () => {
  const wasm = window.wasm;
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

  const onPrint = useCallback(
    (text: string) => {
      if (text.includes("Atomify::canceled")) {
        // Ignore this one
        return;
      }
      addLammpsOutput(text);
      console.log(text);
    },
    [addLammpsOutput],
  );

  useEffect(() => {
    window.onkeydown = (ev) => {
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

  useEffect(() => {
    window.postStepCallback = () => {
      if (paused && !window.cancel) {
        // Gah this state hack is growing.
        return true;
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

        if (window.syncFrequency !== undefined) {
          lammps.setSyncFrequency(window.syncFrequency);
        }
        if (window.cancel) {
          window.cancel = false;
          setPaused(false);
          lammps.cancel();
        }
      }
      return false;
    };
  }, [
    wasm,
    lammps,
    simulation,
    paused,
    runPostTimestep,
    runPostTimestepRendering,
    setPaused,
    setHasSynchronized,
    simulationSettings,
  ]);

  useEffect(() => {
    if (!window.wasm) {
      setStatus({
        title: "Downloading LAMMPS ...",
        text: "",
        progress: 0.3,
      });
      setTimeout(() => {
        time_event("WASM.Load");
        createModule({
          print: onPrint,
          printErr: onPrint,
          locateFile: (path: string) => {
            if (path.endsWith(".wasm")) {
              return import.meta.env.BASE_URL + path;
            }
            return path;
          },
        }).then((Module) => {
          track("WASM.Load");
          setStatus({
            title: "Downloading LAMMPS ...",
            text: "",
            progress: 0.6,
          });
          // setWasm(Module)
          const lammps = new Module.LAMMPSWeb();
          setLammps(lammps);
          window.wasm = Module;
          window.lammps = lammps;
          window.syncFrequency = 1;
          setStatus(undefined);
        });
      }, 100);
    }
  }, [onPrint, setLammps, setStatus]);
  return <></>;
};
export default SimulationComponent;
