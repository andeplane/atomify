/**
 * Pure logic behind the New Run modal (ADR-003 §4.5): per-variable drafts
 * (fixed value or from/to/steps sweep), cartesian expansion with the first
 * variable varying slowest, the command preview, and the summary line.
 *
 * The vars passed to a run are ONLY the overrides: fixed values that differ
 * from the script literal, plus every swept value. Unchanged fixed values are
 * omitted — the script's own definition already provides them.
 */

import { linspace, type ScriptVariable } from "../utils/scriptVariables";
import { KOKKOS_THREADS } from "../utils/kokkos";

export interface VarDraft {
  mode: "fixed" | "sweep";
  value: string;
  from: string;
  to: string;
  steps: string;
}

export type VarDrafts = Record<string, VarDraft>;

export function defaultDraft(variable: ScriptVariable): VarDraft {
  return {
    mode: "fixed",
    value: String(variable.value),
    from: String(variable.value),
    to: String(variable.value),
    steps: "3",
  };
}

export function fmt(value: number): string {
  return String(Number(value.toFixed(3)));
}

export function sweepValues(draft: VarDraft): number[] {
  const steps = Math.max(1, Math.floor(Number(draft.steps)) || 1);
  return linspace(Number(draft.from), Number(draft.to), steps);
}

export interface RunPlan {
  /** One vars map per run; a single entry means a plain run. */
  runs: Record<string, number>[];
  count: number;
  summary: string;
  cta: string;
}

export function buildRunPlan(
  variables: ScriptVariable[],
  drafts: VarDrafts,
  nextRunNumber: number,
): RunPlan {
  const swept = variables.filter(
    (variable) => drafts[variable.name]?.mode === "sweep",
  );

  const base: Record<string, number> = {};
  for (const variable of variables) {
    const draft = drafts[variable.name];
    if (!draft || draft.mode !== "fixed") {
      continue;
    }
    const value = Number(draft.value);
    if (Number.isFinite(value) && value !== variable.value) {
      base[variable.name] = value;
    }
  }

  // Cartesian product; iterating swept variables in order makes the first
  // one vary slowest (design: T = 1.0, 1.0, 1.5, 1.5 …).
  let runs: Record<string, number>[] = [{ ...base }];
  for (const variable of swept) {
    const values = sweepValues(drafts[variable.name]);
    if (values.length === 0) {
      continue;
    }
    runs = runs.flatMap((combo) =>
      values.map((value) => ({ ...combo, [variable.name]: value })),
    );
  }

  const count = runs.length;
  let summary: string;
  if (swept.length === 0) {
    summary = `Creates 1 run in runs/run-${String(nextRunNumber).padStart(3, "0")}`;
  } else {
    const first = swept[0];
    const values = sweepValues(drafts[first.name]).map(fmt);
    summary = `Creates ${count} runs — ${first.name} = ${values.join(", ")}${
      swept.length > 1 ? " × more" : ""
    } · one directory each`;
  }

  return {
    runs,
    count,
    summary,
    cta: count > 1 ? `Start ${count} runs` : "Start run",
  };
}

/**
 * Preview of the equivalent LAMMPS invocation. Shows only the -var flags
 * that will actually be passed (overrides + sweeps).
 */
export function buildCommandPreview(
  inputScript: string | undefined,
  variables: ScriptVariable[],
  drafts: VarDrafts,
  kokkos: { enabled: boolean; threads: number },
): string {
  const parts = [`lmp -in ${inputScript ?? "(select input script)"}`];
  for (const variable of variables) {
    const draft = drafts[variable.name];
    if (!draft) {
      continue;
    }
    if (draft.mode === "sweep") {
      parts.push(
        `-var ${variable.name} {${fmt(Number(draft.from))} … ${fmt(Number(draft.to))}}`,
      );
    } else {
      const value = Number(draft.value);
      if (Number.isFinite(value) && value !== variable.value) {
        parts.push(`-var ${variable.name} ${fmt(value)}`);
      }
    }
  }
  if (kokkos.enabled) {
    parts.push(`-sf kk -k on t ${kokkos.threads}`);
  }
  return parts.join(" ");
}

/**
 * Thread count passed through to startRuns and shown in the command preview.
 * The engine's Kokkos thread pool is fixed at engine load (KOKKOS_THREADS =
 * 4, src/utils/kokkos.ts); a per-run picker would be a lie and is
 * deliberately omitted (deviation from the design mock's thread strip).
 */
export function defaultThreadCount(): number {
  return KOKKOS_THREADS;
}
