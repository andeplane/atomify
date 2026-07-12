import type { ProjectMeta } from "../storage/types";
import type {
  INotebookContent,
  ICell,
  ICodeCell,
  IMarkdownCell,
} from "@jupyterlab/nbformat";

/**
 * The starter `analysis.ipynb` generated once per project (ADR-002 §2). The
 * notebook's cwd is the project directory, so runs are discovered by glob at
 * execution time — the file never needs regeneration and is owned by the
 * user after creation.
 */

const code = (source: string): ICodeCell => ({
  cell_type: "code",
  source,
  metadata: { trusted: true },
  execution_count: null,
  outputs: [],
});

const markdown = (source: string): IMarkdownCell => ({
  cell_type: "markdown",
  source,
  metadata: {},
});

export function projectAnalysisNotebook(
  meta: Pick<ProjectMeta, "displayName" | "dirName"> & {
    description?: string;
  },
): INotebookContent {
  const cells: ICell[] = [
    markdown(
      `# ${meta.displayName} — analysis\n\n` +
        (meta.description ? `${meta.description}\n\n` : "") +
        `This notebook shares the project's files: every run of *${meta.displayName}* ` +
        "appears under `runs/` with its input snapshot, `log.lammps`, and outputs. " +
        "Re-run the cells below after new runs — they discover runs by glob.",
    ),
    code("%pip install -q lammps-logfile pandas"),
    code(
      [
        "import glob, json, os",
        "import lammps_logfile",
        "import matplotlib.pyplot as plt",
        "",
        "# Every run, oldest first. Each entry: (run directory, metadata dict or None).",
        "runs = []",
        'for rundir in sorted(glob.glob("runs/*")):',
        '    meta_path = os.path.join(rundir, ".atomify", "run.json")',
        "    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else None",
        "    runs.append((rundir, meta))",
        "",
        'print(f"{len(runs)} runs")',
        "for rundir, meta in runs:",
        '    vars_ = (meta or {}).get("vars") or {}',
        '    status = (meta or {}).get("status", "?")',
        '    print(f"  {rundir}  [{status}]  {vars_}")',
      ].join("\n"),
    ),
    code(
      [
        "# Thermo output of the latest run.",
        'logs = sorted(glob.glob("runs/*/log.lammps"))',
        "if logs:",
        "    log = lammps_logfile.File(logs[-1])",
        '    step = log.get("Step")',
        "    for keyword in log.keywords:",
        '        if keyword == "Step":',
        "            continue",
        "        plt.figure()",
        "        plt.plot(step, log.get(keyword))",
        '        plt.xlabel("Timestep")',
        "        plt.title(f\"{keyword} — {logs[-1].split('/')[1]}\")",
        "        plt.show()",
        "else:",
        '    print("No runs yet — press Run simulation in Atomify first.")',
      ].join("\n"),
    ),
    code(
      [
        "# Compare a thermo quantity across every run (great for sweeps: the",
        "# swept variable values live in each run's metadata).",
        'quantity = "Temp"  # any column from log.keywords',
        "plt.figure()",
        'for path in sorted(glob.glob("runs/*/log.lammps")):',
        "    log = lammps_logfile.File(path)",
        "    if quantity not in log.keywords:",
        "        continue",
        "    rundir = os.path.dirname(path)",
        '    meta_path = os.path.join(rundir, ".atomify", "run.json")',
        "    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}",
        '    label = ", ".join(f"{k}={v}" for k, v in (meta.get("vars") or {}).items()) or os.path.basename(rundir)',
        '    plt.plot(log.get("Step"), log.get(quantity), label=label)',
        'plt.xlabel("Timestep"); plt.ylabel(quantity); plt.legend(); plt.show()',
      ].join("\n"),
    ),
    code(
      [
        "# Optional: drive LAMMPS from Python (runs in this browser tab).",
        "# Files written below land in this project — the app lists runs/<name>",
        "# directories automatically. Note: the in-notebook engine covers the",
        "# MOLECULE package set (+KOKKOS); packages beyond that run in the app only.",
        "#",
        "# %pip install -q lammps-js",
        "# from lammps import lammps",
        "# import os",
        "# home = os.getcwd()",
        "# for T in [1.0, 2.0, 3.0]:",
        '#     rundir = f"runs/run-T{T}"',
        "#     os.makedirs(rundir, exist_ok=True)",
        "#     os.chdir(rundir)      # outputs land in the run, not the working tree",
        "#     try:",
        "#         lmp = await lammps()",
        '#         lmp.command(f"variable T equal {T}")',
        '#         lmp.file("../../in.script")   # your input script',
        "#         lmp.close()",
        "#     finally:",
        "#         os.chdir(home)",
      ].join("\n"),
    ),
    code(""),
  ];

  return {
    metadata: {
      language_info: {
        codemirror_mode: { name: "python", version: 3 },
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
}

export default projectAnalysisNotebook;
