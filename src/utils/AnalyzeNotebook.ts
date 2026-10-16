import type { ProjectMeta } from "../storage/types";
import type {
  ICell,
  INotebookContent,
  MultilineString,
} from "@jupyterlab/nbformat";
import template from "../notebooks/analysis.template.ipynb?raw";

/**
 * The starter `analysis.ipynb` generated once per project (ADR-002 §2). The
 * notebook's cwd is the project directory, so runs are discovered by glob at
 * execution time — the file never needs regeneration and is owned by the
 * user after creation.
 *
 * The cells live in a real notebook, src/notebooks/analysis.template.ipynb
 * (edit it in Jupyter; CI syntax-checks its code cells via
 * scripts/check_notebook_template.py). Its `{{placeholders}}` are filled in
 * per project:
 *   - `{{displayName}}`: the project's display name;
 *   - `{{description}}`: the description followed by a blank line, or
 *     nothing when the project has none.
 */

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

const joinSource = (source: MultilineString): string =>
  Array.isArray(source) ? source.join("") : source;

export function projectAnalysisNotebook(
  meta: Pick<ProjectMeta, "displayName" | "dirName"> & {
    description?: string;
  },
): INotebookContent {
  const values: Record<string, string> = {
    displayName: meta.displayName,
    description: meta.description ? `${meta.description}\n\n` : "",
  };
  // One pass with a replacer function: substituted values are never
  // re-scanned for placeholders and `$` sequences in them stay literal.
  const fill = (source: string): string =>
    source.replace(PLACEHOLDER, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
    );

  const notebook = JSON.parse(template) as INotebookContent;
  return {
    ...notebook,
    // Sources are stored as line arrays in the template (the nbformat
    // convention) but emitted as single strings, as before the move.
    cells: notebook.cells.map((cell): ICell => ({
      ...cell,
      source: fill(joinSource(cell.source)),
    })),
  };
}

export default projectAnalysisNotebook;
