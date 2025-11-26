import MonacoEditor, { MonacoEditorProps } from "react-monaco-editor";
import { useEffect, useRef } from "react";
import { useStoreState } from "../hooks";

interface ConsoleProps {
  width?: number | string;
  height?: number | string;
}
const Console = ({ width, height }: ConsoleProps) => {
  if (!height) {
    height = "100vh";
  }

  const lammpsOutput = useStoreState((state) => state.simulation.lammpsOutput);
  const editorRef = useRef<MonacoEditor | null>(null);
  const options = {
    selectOnLineNumbers: true,
    readOnly: true,
  };
  useEffect(() => {
    const editor = editorRef.current?.editor;
    if (editor) {
      editor.revealLine(editor.getModel().getLineCount());
    }
  }, [lammpsOutput]);

  return (
    <MonacoEditor
      width={width}
      height={height}
      language="javascript"
      theme="vs-dark"
      value={lammpsOutput.join("\n")}
      options={options}
      ref={editorRef}
    />
  );
};
export default Console;
