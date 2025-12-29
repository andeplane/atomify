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
  const options = {
    selectOnLineNumbers: true,
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
    <Editor
      height="100vh"
      language="lammps"
      theme="vs-dark"
      value={selectedFile.content}
      options={options}
      onChange={onEditorChange}
      onMount={handleEditorDidMount}
    />
  );
};

export default Edit;
