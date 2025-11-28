import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { useStoreState } from "../hooks";
import * as monaco from "monaco-editor";

interface ConsoleProps {
  width?: number | string;
  height?: number | string;
}
const Console = ({ width, height }: ConsoleProps) => {
  if (!height) {
    height = "100vh";
  }

  const lammpsOutput = useStoreState((state) => state.simulation.lammpsOutput);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const options = {
    selectOnLineNumbers: true,
    readOnly: true,
  };
  
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
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
