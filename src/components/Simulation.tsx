import {useCallback, useEffect} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import * as THREE from 'three'
import createModule from "../wasm/lammps.mjs";
import { LammpsWeb } from '../types';
import { notification } from 'antd';
import {SimulationStatus} from '../store/simulation'
import { ModifierInput, ModifierOutput } from '../modifiers/types';
import { time_event, track } from '../utils/metrics';

const cellMatrix = new THREE.Matrix3()
const origo = new THREE.Vector3()

const getSimulationBox = (lammps: LammpsWeb, wasm: any) => {
  const cellMatrixPointer = lammps.getCellMatrixPointer() / 8;
  const cellMatrixSubArray = wasm.HEAPF64.subarray(cellMatrixPointer, cellMatrixPointer + 9) as Float64Array
  cellMatrix.set(cellMatrixSubArray[0], cellMatrixSubArray[1], cellMatrixSubArray[2],
                 cellMatrixSubArray[3], cellMatrixSubArray[4], cellMatrixSubArray[5],
                 cellMatrixSubArray[6], cellMatrixSubArray[7], cellMatrixSubArray[8])
  return cellMatrix
}

const getSimulationOrigo = (lammps: LammpsWeb, wasm: any) => {
  const origoPointer = lammps.getOrigoPointer() / 8;
  const origoPointerSubArray = wasm.HEAPF64.subarray(origoPointer, origoPointer + 3) as Float64Array
  origo.set(origoPointerSubArray[0], origoPointerSubArray[1], origoPointerSubArray[2])
  return origo
}

const SimulationComponent = () => {
  // @ts-ignore
  const wasm = window.wasm
  const lammps = useStoreState(state => state.simulation.lammps)
  const particles = useStoreState(state => state.render.particles)
  const bonds = useStoreState(state => state.render.bonds)
  const simulation = useStoreState(state => state.simulation.simulation)
  const paused = useStoreState(state => state.simulation.paused)
  const setPaused = useStoreActions(actions => actions.simulation.setPaused)
  const renderState = useStoreState(state => state.render)
  const simulationSettings = useStoreState(state => state.settings.simulation)
  const postTimestepModifiers = useStoreState(state => state.processing.postTimestepModifiers)
  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)
  const running = useStoreState(state => state.simulation.running)
  const addLammpsOutput = useStoreActions(actions => actions.simulation.addLammpsOutput)
  const selectedMenu = useStoreState(state => state.simulation.selectedMenu)
  const setParticles = useStoreActions(actions => actions.render.setParticles)
  const setBonds = useStoreActions(actions => actions.render.setBonds)
  const setLammps = useStoreActions(actions => actions.simulation.setLammps)
  const setStatus = useStoreActions(actions => actions.simulation.setStatus)
  const setTimesteps = useStoreActions(actions => actions.simulationStatus.setTimesteps)
  const setRunTimesteps = useStoreActions(actions => actions.simulationStatus.setRunTimesteps)
  const setSimulationStatus = useStoreActions(actions => actions.simulation.setSimulationStatus)
  const setRunTotalTimesteps = useStoreActions(actions => actions.simulationStatus.setRunTotalTimesteps)
  const setLastCommand = useStoreActions(actions => actions.simulationStatus.setLastCommand)
  const computes = useStoreState(state => state.simulationStatus.computes)
  const setComputes = useStoreActions(actions => actions.simulationStatus.setComputes)
  const fixes = useStoreState(state => state.simulationStatus.fixes)
  const setFixes = useStoreActions(actions => actions.simulationStatus.setFixes)
  const setParticleStylesUpdated = useStoreActions(actions => actions.render.setParticleStylesUpdated)

  
  const onPrint = useCallback( (text: string) => {
    if (text.includes('Atomify::canceled')) {
      // Ignore this one
      return
    }
    //@ts-ignore
    addLammpsOutput(text)
    console.log(text)
  }, [addLammpsOutput])

  useEffect(() => {
    window.onkeydown = (ev) => {
      if (selectedMenu !== 'view') {
        return
      }
      
      if (running && ev.key === " ") {
        setPaused(!paused)
      }

      if (ev.key === "c" && !ev.metaKey && !ev.ctrlKey) {
        //@ts-ignore
        const cameraPosition = window.visualizer.getCameraPosition()
        //@ts-ignore
        const cameraTarget = window.visualizer.getCameraTarget()
        const output = `#/camera position ${cameraPosition.x.toFixed(1)} ${cameraPosition.y.toFixed(1)} ${cameraPosition.z.toFixed(1)}\n#/camera target ${cameraTarget.x.toFixed(1)} ${cameraTarget.y.toFixed(1)} ${cameraTarget.z.toFixed(1)}`
        navigator.clipboard.writeText(output);
        notification.info({
          message: "Copied camera position and target to clipboard."
        })
      }
    }
  }, [lammps, running, selectedMenu, paused, setPaused, setSimulationSettings, simulation, simulationSettings])

  useEffect(() => {
    //@ts-ignore
    window.postStepCallback = () => {
      // @ts-ignore
      if (paused && !window.cancel) {
        // Gah this state hack is growing. 
        return true
      }
      if (lammps && wasm && simulation) {
        const modifierInput: ModifierInput = {
          lammps,
          wasm,
          renderState: renderState,
          computes,
          fixes
        }
        
        const modifierOutput: ModifierOutput = {
          particles,
          bonds,
          colorsUpdated: false,
          computes: {},
          fixes: {},
        }
        // @ts-ignore
        postTimestepModifiers.forEach(modifier => modifier.run(modifierInput, modifierOutput))
        if (modifierOutput.colorsUpdated) {
          setParticleStylesUpdated(false)
        }
        setComputes(modifierOutput.computes)
        
        if (selectedMenu === 'view') {
          if (modifierOutput.particles !== particles) {
            setParticles(modifierOutput.particles)
          }
          if (modifierOutput.bonds !== bonds) {
            setBonds(modifierOutput.bonds)
          }
        }

        const whichFlag = lammps.getWhichFlag()
        let runType = ""

        if (whichFlag) {
          runType = whichFlag===1 ? "Dynamics" : "Minimization"
        }
        const simulationStatus: SimulationStatus = {
          remainingTime: lammps.getCPURemain(),
          timestepsPerSecond: lammps.getTimestepsPerSecond(),
          runType,
          origo: getSimulationOrigo(lammps, wasm),
          box: getSimulationBox(lammps, wasm),
          numAtoms: lammps.getNumAtoms()
        }
        setSimulationStatus(simulationStatus)

        // @ts-ignore
        lammps.setSyncFrequency(window.syncFrequency)
        // @ts-ignore
        if (window.cancel) {
          // @ts-ignore
          window.cancel = false;
          lammps.setPaused(false)
          setPaused(false)
          lammps.cancel()
        } else {
          lammps.setPaused(paused)
        }

        setTimesteps(lammps.getTimesteps())
        setRunTimesteps(lammps.getRunTimesteps())
        setRunTotalTimesteps(lammps.getRunTotalTimesteps())
        setLastCommand(lammps.getLastCommand())
      }
      return false
    }
  }, [wasm, lammps, particles, bonds, simulation, selectedMenu, renderState,
    running, simulationSettings, postTimestepModifiers, 
    setParticles, setParticleStylesUpdated, setBonds, setPaused,
    setRunTimesteps, setRunTotalTimesteps, setLastCommand,
    setSimulationStatus, setComputes, setFixes, 
    setSimulationSettings, setTimesteps, computes, fixes, paused
    ])

  useEffect(
    () => {
      // @ts-ignore
      if (!window.wasm) {
        setStatus({
          title: 'Downloading LAMMPS ...',
          text: '',
          progress: 0.3
        })
        setTimeout(() => {
          time_event("WASM.Load")
          createModule({
            print: onPrint, 
            printErr: onPrint,
          }).then((Module: any) => {
            track("WASM.Load")
            setStatus({
              title: 'Downloading LAMMPS ...',
              text: '',
              progress: 0.6
            })
            // setWasm(Module)
            const lammps = (new Module.LAMMPSWeb()) as LammpsWeb
            setLammps(lammps)
            // @ts-ignore
            window.wasm = Module
            // @ts-ignore
            window.lammps = lammps
            // @ts-ignore
            window.syncFrequency = 1
            setStatus(undefined)
          });
        }, 100)
      }
    },
    [onPrint, setLammps, setStatus]
  );
  return (<></>)
}
export default SimulationComponent