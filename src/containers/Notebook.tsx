/**
 * JupyterLite iframe (ADR-001 §3, ADR-002): projects live in JupyterLite's
 * own contents store, so the notebook simply opens
 * <dirName>/analysis.ipynb — no localforage probing, no sync.
 *
 * The legacy flat-path logic (analyze.ipynb + one-way syncFilesJupyterLite)
 * is gone with the project-scoped storage. In embedded mode there is no
 * active project; the iframe then opens the JupyterLite workspace root.
 */

import { useStoreState } from "../hooks";

const JUPYTER_BASE = "/atomify/jupyter/lab/index.html";

export function notebookUrlFor(
  dirName: string | undefined,
  notebookPath: string | undefined,
): string {
  if (!dirName) {
    return JUPYTER_BASE;
  }
  const path = `${dirName}/${notebookPath ?? "analysis.ipynb"}`;
  return `${JUPYTER_BASE}?path=${encodeURIComponent(path)}`;
}

const Notebook = () => {
  const active = useStoreState((state) => state.projects.active);
  const notebook = active?.files.find(
    (file) => file.type !== "directory" && file.path.endsWith(".ipynb"),
  );
  // Quick projects live on scratch storage which Jupyter cannot see; the
  // shell hides the tab entirely, so this only guards the embedded path.
  const dirName = active && !active.quick ? active.meta.dirName : undefined;
  const url = notebookUrlFor(dirName, notebook?.path);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <iframe
        title="Notebook"
        src={url}
        width="100%"
        height="100%"
        style={{ border: "none", display: "block", position: "relative" }}
      />
    </div>
  );
};
export default Notebook;
