import Iframe from "react-iframe";
import { useStoreState } from "../hooks";
import { useEffect, useState } from "react";
import localforage from "localforage";

const Notebook = () => {
  const simulation = useStoreState((state) => state.simulation.simulation);
  const [notebookUrl, setNotebookUrl] = useState<string>("/atomify/jupyter/lab/index.html");

  useEffect(() => {
    let isMounted = true;
    const determineNotebookUrl = async () => {
      const baseUrl = "/atomify/jupyter/lab/index.html";
      let url = baseUrl;

      const path = simulation?.analysisScript
        ? `${simulation.id}/${simulation.analysisScript}`
        : "analyze.ipynb";

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
