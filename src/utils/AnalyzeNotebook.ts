import type { ICodeCell, IMarkdownCell, INotebookContent } from "@jupyterlab/nbformat";
import type { Simulation } from "../store/simulation";

const AnalyzeNotebook = (simulation: Simulation): INotebookContent => {
  const cells: ICodeCell[] = [
    {
      cell_type: "code",
      source: "%pip install pandas",
      metadata: {
        trusted: true,
      },
      execution_count: null,
      outputs: [],
    },
    {
      cell_type: "code",
      source:
        'import lammps_logfile\nimport matplotlib.pyplot as plt\n\nlog = lammps_logfile.File("###SIMULATIONID###/log.lammps")\nstep = log.get("Step")\n\nfor keyword in log.keywords:\n    plt.figure()\n    plt.plot(step, log.get(keyword), label=keyword)\n    plt.xlabel(\'Timestep\')\n    plt.title(keyword)\n    plt.show()',
      metadata: {
        trusted: true,
      },
      execution_count: null,
      outputs: [],
    },
    {
      cell_type: "code",
      source: "",
      metadata: {},
      execution_count: null,
      outputs: [],
    },
  ];

  const notebook: INotebookContent = {
    metadata: {
      language_info: {
        codemirror_mode: {
          name: "python",
          version: 3,
        },
        file_extension: ".py",
        mimetype: "text/x-python",
        name: "python",
        nbconvert_exporter: "python",
        pygments_lexer: "ipython3",
        version: "3.12",
      },
      kernelspec: {
        name: "python",
        display_name: "Python (Pyodide)",
        language: "python",
      },
    },
    nbformat_minor: 4,
    nbformat: 4,
    cells,
  };

  const cell = notebook.cells[1];
  if (cell.cell_type === "code") {
    const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source;
    cell.source = source.replace("###SIMULATIONID###", simulation.id);
  }
  if (simulation.analysisDescription) {
    const markdownCell: IMarkdownCell = {
      cell_type: "markdown",
      source: simulation.analysisDescription,
      metadata: {},
    };
    notebook.cells.splice(0, 0, markdownCell);
  }
  return notebook;
};

export default AnalyzeNotebook;
