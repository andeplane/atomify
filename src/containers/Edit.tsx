import { useCallback } from "react";
import { useStoreState } from "../hooks";
import Editor, { loader } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { registerLammpsLanguage } from "../utils/lammpsLanguage";

// Initialize Monaco with LAMMPS language support
loader.init().then((monaco) => {
  registerLammpsLanguage(monaco);
});

const Edit = () => {
  const selectedFile = useStoreState((state) => state.app.selectedFile);
  const simulation = useStoreState((state) => state.simulation.simulation);
  const isRunning = useStoreState((state) => state.simulation.running);
  const options = {
    selectOnLineNumbers: true,
    readOnly: isRunning,
  };

  const handleEditorDidMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      editor.focus();
    },
    [],
  );

  const onEditorChange = useCallback(
    (newValue: string | undefined) => {
      if (!newValue) return;
      const file = simulation?.files.find(
        (file) => file.fileName === selectedFile?.fileName,
      );
      if (file) {
        file.content = newValue;
      }
    },
    [selectedFile?.fileName, simulation?.files],
  );

  if (!selectedFile) {
    return <>No file selected</>;
  }

  return (
    <>
      {isRunning && (
        <div
          style={{
            backgroundColor: "#3a3a3a",
            color: "#ffa500",
            padding: "8px 16px",
            fontSize: "12px",
            borderBottom: "1px solid #555",
            fontFamily: "monospace",
          }}
        >
          ⓘ File editing is disabled while simulation is running
        </div>
      )}
      <Editor
        height={isRunning ? "calc(100vh - 33px)" : "100vh"}
        language="lammps"
        theme="vs-dark"
        value={selectedFile.content}
        options={options}
        onChange={onEditorChange}
        onMount={handleEditorDidMount}
      />
    </>
  );
};

export default Edit;
