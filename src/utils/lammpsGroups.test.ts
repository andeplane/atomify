import { expect, it } from "vitest";
import {
  GROUP_READY,
  parseLammpsGroups,
  prepareGroupInspection,
} from "./lammpsGroups";

it("reads static and dynamic names from the runtime registry", () => {
  expect(
    parseLammpsGroups(
      "Group information:\nGroup[ 0]:     all              (static)\nGroup[ 2]:     water-mobile     (dynamic)\n",
    ),
  ).toEqual(["all", "water-mobile"]);
});
it("instruments direct, continued, and conditional runs without touching comments or data", () => {
  const source =
    '# run 10\nvariable text string "run 20"\nrun &\n 100\nif "1" then "run 20"\nminimize 1e-4 1e-6 100 1000\n';
  const instrumented = prepareGroupInspection(source);
  expect(instrumented.split(GROUP_READY)).toHaveLength(4);
  expect(instrumented).toContain('# run 10\nvariable text string "run 20"\n');
  expect(instrumented).toContain("run &\n 100");
  expect(prepareGroupInspection("Atoms # atomic\n1 1 2 3 4\n")).toBe(
    "Atoms # atomic\n1 1 2 3 4\n",
  );
});
