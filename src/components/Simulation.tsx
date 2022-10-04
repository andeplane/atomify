import {useCallback, useEffect} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import createModule from "../wasm/lammps.mjs";

const Simulation = () => {
  const setWasm = useStoreActions(actions => actions.lammps.setWasm)

  const onPrint = useCallback( (text: string) => {
    // setLammpsOutput(state => [...state, text])
  }, [])

  useEffect(
    () => {
      createModule({print: onPrint, printErr: onPrint}).then((Module: any) => {
        setWasm(Module)
      });
    },
    [setWasm, onPrint]
  );
  return (<></>)
}
export default Simulation