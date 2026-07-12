import { describe, it, expect } from "vitest";
import type { ScriptVariable } from "../utils/scriptVariables";
import {
  buildCommandPreview,
  buildRunPlan,
  defaultDraft,
  sweepValues,
  type VarDrafts,
} from "./runPlan";

const T: ScriptVariable = { name: "T", value: 3, line: 12 };
const L: ScriptVariable = { name: "L", value: 15, line: 14, label: "box size" };
const thickness: ScriptVariable = { name: "thickness", value: 2, line: 16 };

function draftsFor(...variables: ScriptVariable[]): VarDrafts {
  const drafts: VarDrafts = {};
  for (const variable of variables) {
    drafts[variable.name] = defaultDraft(variable);
  }
  return drafts;
}

describe("defaultDraft", () => {
  it("starts fixed at the script literal", () => {
    expect(defaultDraft(T)).toEqual({
      mode: "fixed",
      value: "3",
      from: "3",
      to: "3",
      steps: "3",
    });
  });
});

describe("sweepValues", () => {
  it("produces linspace over from/to/steps", () => {
    expect(
      sweepValues({ mode: "sweep", value: "", from: "1", to: "3", steps: "5" }),
    ).toEqual([1, 1.5, 2, 2.5, 3]);
  });

  it("clamps steps to at least one", () => {
    expect(
      sweepValues({ mode: "sweep", value: "", from: "2", to: "4", steps: "0" }),
    ).toEqual([2]);
  });
});

describe("buildRunPlan", () => {
  it("single run with no overrides when everything matches the script", () => {
    const plan = buildRunPlan([T, L], draftsFor(T, L), 4);

    expect(plan.runs).toEqual([{}]);
    expect(plan.count).toBe(1);
    expect(plan.cta).toBe("Start run");
    expect(plan.summary).toBe("Creates 1 run in runs/run-004");
  });

  it("passes only fixed values that differ from the script literal", () => {
    const drafts = draftsFor(T, L);
    drafts.T.value = "1.5"; // changed
    drafts.L.value = "15"; // unchanged

    const plan = buildRunPlan([T, L], drafts, 1);

    expect(plan.runs).toEqual([{ T: 1.5 }]);
  });

  it("expands a single sweep into one run per value", () => {
    const drafts = draftsFor(T, L);
    drafts.T = { mode: "sweep", value: "3", from: "1", to: "3", steps: "3" };

    const plan = buildRunPlan([T, L], drafts, 1);

    expect(plan.runs).toEqual([{ T: 1 }, { T: 2 }, { T: 3 }]);
    expect(plan.count).toBe(3);
    expect(plan.cta).toBe("Start 3 runs");
    expect(plan.summary).toBe(
      "Creates 3 runs — T = 1, 2, 3 · one directory each",
    );
  });

  it("builds the cartesian product with the first variable slowest", () => {
    const drafts = draftsFor(T, L);
    drafts.T = { mode: "sweep", value: "3", from: "1", to: "2", steps: "2" };
    drafts.L = { mode: "sweep", value: "15", from: "10", to: "20", steps: "2" };

    const plan = buildRunPlan([T, L], drafts, 1);

    expect(plan.runs).toEqual([
      { T: 1, L: 10 },
      { T: 1, L: 20 },
      { T: 2, L: 10 },
      { T: 2, L: 20 },
    ]);
    expect(plan.summary).toContain("× more");
  });

  it("combines sweeps with changed fixed overrides", () => {
    const drafts = draftsFor(T, L, thickness);
    drafts.T = { mode: "sweep", value: "3", from: "1", to: "2", steps: "2" };
    drafts.thickness.value = "4";

    const plan = buildRunPlan([T, L, thickness], drafts, 1);

    expect(plan.runs).toEqual([
      { thickness: 4, T: 1 },
      { thickness: 4, T: 2 },
    ]);
  });

  it("ignores non-numeric fixed input", () => {
    const drafts = draftsFor(T);
    drafts.T.value = "hot";

    expect(buildRunPlan([T], drafts, 1).runs).toEqual([{}]);
  });
});

describe("buildCommandPreview", () => {
  it("shows the script and only the passed -var flags", () => {
    const drafts = draftsFor(T, L);
    drafts.T.value = "1.5";

    expect(
      buildCommandPreview("in.melt", [T, L], drafts, {
        enabled: false,
        threads: 4,
      }),
    ).toBe("lmp -in in.melt -var T 1.5");
  });

  it("renders sweep ranges and the KOKKOS suffix", () => {
    const drafts = draftsFor(T);
    drafts.T = { mode: "sweep", value: "3", from: "1", to: "3", steps: "5" };

    expect(
      buildCommandPreview("in.melt", [T], drafts, { enabled: true, threads: 8 }),
    ).toBe("lmp -in in.melt -var T {1 … 3} -sf kk -k on t 8");
  });

  it("falls back to a placeholder when no input script is set", () => {
    expect(
      buildCommandPreview(undefined, [], {}, { enabled: false, threads: 4 }),
    ).toBe("lmp -in (select input script)");
  });
});
