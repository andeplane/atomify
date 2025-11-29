import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { useStoreState } from "../hooks";
import type * as Monaco from "monaco-editor";

interface ConsoleProps {
  width?: number | string;
  height?: number | string;
}
const Console = ({ width, height }: ConsoleProps) => {
  if (!height) {
    height = "100vh";
  }

  const lammpsOutput = useStoreState((state) => state.simulation.lammpsOutput);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const options = {
    selectOnLineNumbers: true,
    readOnly: true,
  };
  
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const model = editor.getModel();
      if (model) {
        editor.revealLine(model.getLineCount());
      }
    }
  }, [lammpsOutput]);

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  return (
    <Editor
      width={width}
      height={height}
      language="javascript"
      theme="vs-dark"
      value={lammpsOutput.join("\n")}
      options={options}
      onMount={handleEditorDidMount}
    />
  );
};
export default Console;
