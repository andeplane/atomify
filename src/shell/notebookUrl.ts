/**
 * Where the Notebook tab points (ADR-001 §3, ADR-002): projects live in
 * JupyterLite's own contents store, so the iframe simply opens
 * <dirName>/<notebook> — no localforage probing, no sync.
 */

import type { FileStat } from "../storage/types";

/**
 * JupyterLite is built into `<base>/jupyter/` (Makefile `jupyter` target), so
 * its URL follows Vite's `base` rather than hard-coding it a second time.
 */
export function jupyterLabUrl(
  baseUrl: string = import.meta.env.BASE_URL,
): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}jupyter/lab/index.html`;
}

/** The project's notebook: the first `.ipynb` file in its working tree. */
export function findProjectNotebook(
  files: readonly FileStat[],
): FileStat | undefined {
  return files.find(
    (file) => file.type !== "directory" && file.path.endsWith(".ipynb"),
  );
}

export function notebookUrlFor(
  dirName: string | undefined,
  notebookPath: string | undefined,
  baseUrl?: string,
): string {
  const lab = jupyterLabUrl(baseUrl);
  if (!dirName) {
    return lab;
  }
  const path = `${dirName}/${notebookPath ?? "analysis.ipynb"}`;
  return `${lab}?path=${encodeURIComponent(path)}`;
}
