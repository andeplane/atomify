/**
 * Detect overridable LAMMPS variables in an input script (ADR-003 §4.5).
 *
 * A variable is a run parameter when it is defined with a plain numeric
 * literal: `variable T equal 3.0`. Derived expressions
 * (`variable Lhalf equal $(0.5*v_L)`) recompute from the overrides and are
 * not editable themselves. Overrides work because LAMMPS ignores a
 * `variable` command whose name is already defined — the documented pattern
 * for command-line/-var-style defaults — so injected definitions win.
 */

export interface ScriptVariable {
  name: string;
  /** The literal value in the script. */
  value: number;
  /** 1-based line number of the definition. */
  line: number;
  /** Human hint from a trailing `# comment` on the line, if any. */
  label?: string;
}

const VARIABLE_LINE =
  /^\s*variable\s+(\w+)\s+equal\s+(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*(?:#\s*(.*))?$/;

export function parseScriptVariables(script: string): ScriptVariable[] {
  const seen = new Set<string>();
  const variables: ScriptVariable[] = [];
  script.split("\n").forEach((text, index) => {
    const match = VARIABLE_LINE.exec(text);
    if (!match) {
      return;
    }
    const [, name, literal, comment] = match;
    // Only the first definition is overridable — LAMMPS ignores later ones.
    if (seen.has(name)) {
      return;
    }
    seen.add(name);
    variables.push({
      name,
      value: Number(literal),
      line: index + 1,
      label: comment?.trim() || undefined,
    });
  });
  return variables;
}

/** Evenly spaced values from `from` to `to` inclusive (design's sweep rows). */
export function linspace(from: number, to: number, count: number): number[] {
  const n = Math.max(1, Math.floor(count));
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return [];
  }
  if (n === 1) {
    return [from];
  }
  return Array.from(
    { length: n },
    (_, i) => Number((from + ((to - from) * i) / (n - 1)).toPrecision(12)),
  );
}
