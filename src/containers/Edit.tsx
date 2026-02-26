import { useCallback } from "react";
import { useStoreActions, useStoreState } from "../hooks";
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
  const updateFileContent = useStoreActions(
    (actions) => actions.simulation.updateFileContent,
  );
  const currentFile =
    simulation?.files.find(
      (file) => selectedFile && file.fileName === selectedFile.fileName,
    ) ?? selectedFile;
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
      if (newValue === undefined || !selectedFile?.fileName) return;
      updateFileContent({ fileName: selectedFile.fileName, content: newValue });
    },
    [selectedFile?.fileName, updateFileContent],
  );

  if (!selectedFile) {
    return <>No file selected</>;
  }

  return (
    <Editor
      height="100vh"
      language="lammps"
      theme="vs-dark"
      value={currentFile?.content}
      options={options}
      onChange={onEditorChange}
      onMount={handleEditorDidMount}
    />
  );
};

export default Edit;
