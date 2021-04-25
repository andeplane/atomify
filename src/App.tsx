import React, {useState, useEffect, useCallback} from 'react';
import logo from './logo.svg';
import lammps from './wasm/lammps'

function App() {
  useEffect(() => {
    const wasm = lammps({
      onRuntimeInitialized: async () => {
        wasm.then(async (obj: any) => {
          // @ts-ignore
          window.atomify = obj;
          return;
        })
      },
      // This overrides the default path used by the wasm/hello.js wrapper
      locateFile: () => require("./wasm/lammps.wasm"),
    });
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        Hei
      </header>
    </div>
  );
}

export default App;
