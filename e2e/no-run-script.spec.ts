/**
 * A script that defines analysis computes but never issues run/minimize
 * (the library's "fly around the structure" examples) must still complete
 * as a zero-step structure view. LAMMPS never initializes such computes, and
 * invoking e.g. `compute rdf` in the final snapshot throws "Trying to build
 * an occasional neighbor list before initialization is complete" — that must
 * be absorbed, not reported as a failed run.
 */

import { test, expect } from "@playwright/test";
import {
  createFastLjProject,
  gotoApp,
  readContentsRecord,
  waitForEngine,
  waitRunCompleted,
} from "./helpers";

const NO_RUN_RDF_SCRIPT = `units lj
lattice fcc 0.8442
region box block 0 3 0 3 0 3
create_box 1 box
create_atoms 1 box
mass 1 1.0
pair_style lj/cut 2.5
pair_coeff 1 1 1.0 1.0 2.5
compute rdf all rdf 50
fix 1 all nve
print "structure only"
`;

test("a script with computes but no run completes as a structure view", async ({
  page,
}) => {
  await gotoApp(page);
  await createFastLjProject(
    page,
    "No run",
    "no-run",
    "in.structure",
    NO_RUN_RDF_SCRIPT,
  );
  await waitForEngine(page);
  await page.getByTestId("editor-save-and-run").click();
  await waitRunCompleted(page);
  await expect(page.getByTestId("status-pill-failed")).toHaveCount(0);
  // The final snapshot still captured the initialized structure.
  await expect(page.getByTestId("run-frame")).toBeVisible();
  const meta = await readContentsRecord(
    page,
    "no-run/runs/run-001/.atomify/run.json",
  );
  expect(meta?.content).toMatchObject({
    status: "completed",
    stats: { timesteps: 0, numAtoms: 108 },
  });
});
