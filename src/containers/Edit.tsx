import { useCallback } from "react";
import type { CSSProperties } from "react";
import { useStoreState } from "../hooks";
import Editor, { loader } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { registerLammpsLanguage } from "../utils/lammpsLanguage";

// Initialize Monaco with LAMMPS language support
loader.init().then((monaco) => {
  registerLammpsLanguage(monaco);
});

const bannerStyle: CSSProperties = {
  backgroundColor: "#3a3a3a",
  color: "#ffa500",
  padding: "8px 16px",
  fontSize: "12px",
  borderBottom: "1px solid #555",
  fontFamily: "monospace",
};

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
};

const editorWrapperStyle: CSSProperties = {
  flex: 1,
  position: "relative",
};

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
    <div style={containerStyle}>
      {isRunning && (
        <div style={bannerStyle}>
          ⓘ File editing is disabled while simulation is running
        </div>
      )}
      <div style={editorWrapperStyle}>
        <Editor
          height="100%"
          language="lammps"
          theme="vs-dark"
          value={selectedFile.content}
          options={options}
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};

export default Edit;
