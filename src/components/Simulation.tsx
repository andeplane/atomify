import {useCallback, useEffect} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import * as THREE from 'three'
import createModule from "../wasm/lammps.mjs";
import { LammpsWeb, Compute, Fix } from '../types';
import { notification } from 'antd';
import {SimulationStatus} from '../store/simulation'
import { ModifierInput, ModifierOutput } from '../modifiers/types';

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
  const state = useStoreState(state => state)
  // @ts-ignore
  const wasm = window.wasm
  const lammps = useStoreState(state => state.simulation.lammps)
  const particles = useStoreState(state => state.render.particles)
  const bonds = useStoreState(state => state.render.bonds)
  const simulation = useStoreState(state => state.simulation.simulation)
  const simulationSettings = useStoreState(state => state.settings.simulation)
  const postTimestepModifiers = useStoreState(state => state.processing.postTimestepModifiers)
  const setSimulationSettings = useStoreActions(actions => actions.settings.setSimulation)
  const running = useStoreState(state => state.simulation.running)
  const selectedMenu = useStoreState(state => state.simulation.selectedMenu)
  const atomTypes = useStoreState(state => state.simulation.atomTypes)
  const setParticles = useStoreActions(actions => actions.render.setParticles)
  const setBonds = useStoreActions(actions => actions.render.setBonds)
  const setLammps = useStoreActions(actions => actions.simulation.setLammps)
  const setStatus = useStoreActions(actions => actions.simulation.setStatus)
  const addLammpsOutput = useStoreActions(actions => actions.simulation.addLammpsOutput)
  const setTimesteps = useStoreActions(actions => actions.simulation.setTimesteps)
  const setRunTimesteps = useStoreActions(actions => actions.simulation.setRunTimesteps)
  const setSimulationStatus = useStoreActions(actions => actions.simulation.setSimulationStatus)
  const setRunTotalTimesteps = useStoreActions(actions => actions.simulation.setRunTotalTimesteps)
  const setLastCommand = useStoreActions(actions => actions.simulation.setLastCommand)
  const setComputes = useStoreActions(actions => actions.simulationStatus.setComputes)
  const setFixes = useStoreActions(actions => actions.simulationStatus.setFixes)
  
  const onPrint = useCallback( (text: string) => {
    //@ts-ignore
    addLammpsOutput(text)
    console.log(text)
  }, [addLammpsOutput])

  useEffect(() => {
    window.onkeydown = (ev) => {
      if (selectedMenu !== 'view') {
        return
      }
      
      if (lammps != null && simulation != null && !running && ev.key === " ") {
        setSimulationSettings({...simulationSettings, speed: 1})
        lammps.setSyncFrequency(1)
        //@ts-ignore
        lammps.step()
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

    //@ts-ignore
    window.postStepCallback = () => {
      if (lammps && wasm && simulation) {
        const modifierInput: ModifierInput = {
          lammps,
          wasm,
        }
        const modifierOutput: ModifierOutput = {
          particles,
          bonds,
          // @ts-ignore
          visualizer: window.visualizer
        }
        // @ts-ignore
        postTimestepModifiers.forEach(modifier => modifier.run(state, modifierInput, modifierOutput))
        
        if (selectedMenu === 'view') {
          if (modifierOutput.particles !== particles) {
            setParticles(modifierOutput.particles)
          }
          if (modifierOutput.bonds !== bonds) {
            setBonds(modifierOutput.bonds)
          }
          
          const lmpComputes = lammps.getComputes()
          const lmpFixes = lammps.getFixes()
          const computes: Compute[] = []
          for (let i = 0; i < lmpComputes.size(); i++) {
            // This is a hack because we can't pass these functions to other objects for some reason,
            // and we can't call the c++ functions outside main sync thread, so want to resolve name and type 
            // so UI can render them
            const lmpCompute = (lmpComputes.get(i) as unknown) as Compute
            lmpCompute.name = lmpCompute.getName()
            lmpCompute.type = lmpCompute.getType()
            computes.push(lmpCompute)
          }
          const fixes: Fix[] = []
          for (let i = 0; i < lmpFixes.size(); i++) {
            const lmpFix = lmpFixes.get(i)

            fixes.push({
              name: lmpFix.getName(),
              type: lmpFix.getType()
            })
          }
          setComputes(computes)
          setFixes(fixes)
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
          lammps.cancel()
        }

        setTimesteps(lammps.getTimesteps())
        setRunTimesteps(lammps.getRunTimesteps())
        setRunTotalTimesteps(lammps.getRunTotalTimesteps())
        setLastCommand(lammps.getLastCommand())
      }
    }
  }, [wasm, lammps, particles, bonds, setBonds, 
    setParticles,
    setRunTimesteps, setRunTotalTimesteps, setLastCommand,
    atomTypes, setSimulationStatus, selectedMenu, running, 
    setSimulationSettings, setTimesteps, simulation, 
    postTimestepModifiers, state, simulationSettings, setComputes, setFixes])

  useEffect(
    () => {
      // @ts-ignore
      if (!window.wasm) {
        setStatus({
          title: 'Downloading LAMMPS ...',
          text: '',
          progress: 0.3
        })
        createModule({
          print: onPrint, 
          printErr: onPrint,
        }).then((Module: any) => {
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
      }
    },
    [onPrint, setLammps, setStatus]
  );
  return (<></>)
}
export default SimulationComponent