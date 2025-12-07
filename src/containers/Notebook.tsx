import localforage from "localforage";
import { useEffect, useState } from "react";
import Iframe from "react-iframe";
import { useStoreState } from "../hooks";

const Notebook = () => {
  const simulation = useStoreState((state) => state.simulation.simulation);
  const [notebookUrl, setNotebookUrl] = useState<string>("/atomify/jupyter/lab/index.html");

  useEffect(() => {
    let isMounted = true;
    const determineNotebookUrl = async () => {
      const baseUrl = "/atomify/jupyter/lab/index.html";
      let url = baseUrl;

      let path = "analyze.ipynb";
      if (simulation?.analysisScript) {
        const scriptName = simulation.analysisScript.substring(
          simulation.analysisScript.lastIndexOf("/") + 1
        );
        path = `${simulation.id}/${scriptName}`;
      }

      try {
        if (await localforage.getItem(path)) {
          url = `${baseUrl}?path=${path}`;
        }
      } catch (error) {
        console.log(`Could not check for notebook existence at "${path}":`, error);
      }

      if (isMounted) {
        setNotebookUrl(url);
      }
    };

    determineNotebookUrl();

    return () => {
      isMounted = false;
    };
  }, [simulation]);

  return (
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
  );
};
export default Notebook;
