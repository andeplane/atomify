import { describe, expect, it } from "vitest";
import {
  applyVariableOverrides,
  linspace,
  parseScriptVariables,
} from "./scriptVariables";

describe("parseScriptVariables", () => {
  it("lists plain-number variables once, with line and comment label", () => {
    const script = [
      "variable T equal 1.44 # temperature",
      "variable L equal $(2*v_T)",
      "variable N equal 10",
      "variable T equal 3",
    ].join("\n");
    expect(parseScriptVariables(script)).toEqual([
      { name: "T", value: 1.44, line: 1, label: "temperature" },
      { name: "N", value: 10, line: 3, label: undefined },
    ]);
  });
});

describe("applyVariableOverrides", () => {
  it("rewrites the definition line instead of prepending", () => {
    const script = 'variable T equal 1.44\nprint "T=${T}"\n';
    expect(applyVariableOverrides(script, { T: 2 })).toBe(
      'variable T equal 2\nprint "T=${T}"\n',
    );
  });

  it("keeps indentation and the trailing comment", () => {
    expect(
      applyVariableOverrides("  variable T equal 1.44   # temp", { T: 0.5 }),
    ).toBe("  variable T equal 0.5 # temp");
  });

  it("rewrites only the first definition, leaving later stages alone", () => {
    const script = "variable T equal 1\nrun 10\nvariable T equal 3\nrun 10";
    expect(applyVariableOverrides(script, { T: 2 })).toBe(
      "variable T equal 2\nrun 10\nvariable T equal 3\nrun 10",
    );
  });

  it("leaves other variables and derived expressions untouched", () => {
    const script =
      "variable N equal 10\nvariable T equal 1\nvariable L equal $(2*v_T)";
    expect(applyVariableOverrides(script, { T: 4 })).toBe(
      "variable N equal 10\nvariable T equal 4\nvariable L equal $(2*v_T)",
    );
  });

  it("prepends a variable the script does not define", () => {
    expect(applyVariableOverrides("run 10", { seed: 42 })).toBe(
      "variable seed equal 42\nrun 10",
    );
  });
});

describe("linspace", () => {
  it("spans from..to inclusive", () => {
    expect(linspace(1, 2, 3)).toEqual([1, 1.5, 2]);
    expect(linspace(1, 2, 1)).toEqual([1]);
  });
});
