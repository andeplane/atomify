/**
 * Detect overridable LAMMPS variables in an input script (ADR-003 §4.5).
 *
 * A variable is a run parameter when it is defined with a plain numeric
 * literal: `variable T equal 3.0`. Derived expressions
 * (`variable Lhalf equal $(0.5*v_L)`) recompute from the overrides and are
 * not editable themselves.
 *
 * Overrides are applied by rewriting the definition line in the engine's
 * copy of the script (see applyVariableOverrides). Prepending a definition
 * would not work: LAMMPS lets a later `variable ... equal` redefine an
 * equal-style variable (only index/loop-style ones are skipped when already
 * defined), so the script's own line would win.
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
    // Only the first definition is listed as the parameter's default.
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

/**
 * Returns `script` with each overridden variable's first plain-number
 * definition (the one parseScriptVariables lists) rewritten to the override
 * value; a trailing `# comment` is kept. Later redefinitions are left alone,
 * since they are deliberate changes inside the script (e.g. a second stage).
 * A variable with no such definition in the script is prepended instead.
 */
export function applyVariableOverrides(
  script: string,
  vars: Record<string, number>,
): string {
  const found = new Set<string>();
  const lines = script.split("\n").map((text) => {
    const match = VARIABLE_LINE.exec(text);
    if (!match || !Object.hasOwn(vars, match[1]) || found.has(match[1])) {
      return text;
    }
    const [, name, , comment] = match;
    found.add(name);
    const indent = /^\s*/.exec(text)![0];
    const suffix = comment !== undefined ? ` # ${comment.trim()}` : "";
    return `${indent}variable ${name} equal ${vars[name]}${suffix}`;
  });
  const missing = Object.entries(vars)
    .filter(([name]) => !found.has(name))
    .map(([name, value]) => `variable ${name} equal ${value}\n`)
    .join("");
  return missing + lines.join("\n");
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
  return Array.from({ length: n }, (_, i) =>
    Number((from + ((to - from) * i) / (n - 1)).toPrecision(12)),
  );
}
