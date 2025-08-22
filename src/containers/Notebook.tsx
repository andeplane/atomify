import Iframe from "react-iframe";
import { useStoreState } from "../hooks";
import { useEffect, useState } from "react";
import localforage from "localforage";

const Notebook = () => {
  const simulation = useStoreState((state) => state.simulation.simulation);
  const [notebookUrl, setNotebookUrl] = useState<string>("/atomify/jupyter/lab/index.html");

  useEffect(() => {
    const determineNotebookUrl = async () => {
      let url = "/atomify/jupyter/lab/index.html";

      if (simulation?.analysisScript) {
        // If simulation has a specific analysis script, use that
        const analysisScriptPath = `${simulation.id}/${simulation.analysisScript}`;
        try {
          const analysisNotebook = await localforage.getItem(analysisScriptPath);
          if (analysisNotebook) {
            url = `/atomify/jupyter/lab/index.html?path=${analysisScriptPath}`;
          }
        } catch (error) {
          console.log("Could not check for analysis script existence:", error);
        }
      } else {
        // Check if analyze.ipynb exists in localforage before using it
        try {
          const analyzeNotebook = await localforage.getItem("analyze.ipynb");
          if (analyzeNotebook) {
            url = "/atomify/jupyter/lab/index.html?path=analyze.ipynb";
          }
          // If analyze.ipynb doesn't exist, just use the base JupyterLab URL
        } catch (error) {
          console.log("Could not check for analyze.ipynb existence:", error);
          // Fall back to base URL without specific path
        }
      }

      setNotebookUrl(url);
    };

    determineNotebookUrl();
  }, [simulation]);

  return (
    <>
      <div style={{ height: "100vh", width: "100%" }}>
        <Iframe
          url={notebookUrl}
          width="100%"
          height="100%"
          id=""
          className=""
          display="block"
          position="relative"
        />
      </div>
    </>
  );
};
export default Notebook;
