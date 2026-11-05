import { expect, test, type Page } from "@playwright/test";
import { createBlankProject, gotoApp, waitForEngine } from "./helpers";

// Tilted (triclinic) fcc crystal with two types so image colors are checked.
const script = `units lj
lattice fcc 0.8442
region box prism 0 4 0 4 0 4 2 0 0
create_box 2 box
create_atoms 1 box
set type 1 type/fraction 2 0.3 1234
mass * 1.0
velocity all create 0.05 87287
pair_style lj/cut 2.5
pair_coeff * * 1.0 1.0 2.5
fix 1 all nve
run 1000000
`;

const rendered = (page: Page) =>
  page.evaluate(async () => {
    const path = "/atomify/src/store/index.ts";
    const { default: store, engine } = await import(path);
    const s = store.getState();
    const p = engine.particles;
    const color = p?.geometry?.getAttribute("atomColor");
    const n = s.simulationStatus.numAtoms;
    // The status box arrives with the first synced frame.
    if (!color || !s.simulationStatus.box)
      return { count: 0, numAtoms: n, timesteps: 0 };
    let imagesMatch = true;
    for (let i = n; i < p.count; i++) {
      const j = i % n;
      imagesMatch &&=
        p.indices[i] === p.indices[j] && color.getZ(i) === color.getZ(j);
    }
    // THREE stores the cell column-major: b = (e[1], e[4], e[7]).
    const e = s.simulationStatus.box.elements;
    const shiftB = [0, 1, 2].map(
      (d) => p.positions[6 * n + d] - p.positions[d] - e[1 + 3 * d],
    );
    return {
      count: p.count,
      numAtoms: n,
      timesteps: s.simulationStatus.timesteps,
      imagesMatch,
      shiftBError: Math.max(...shiftB.map(Math.abs)),
    };
  });

test("periodic images replicate a triclinic crystal along the box vectors", async ({
  page,
}) => {
  await gotoApp(page);
  await createBlankProject(page, "Periodic images", "periodic-images");
  await page.getByTestId("upload-input").setInputFiles({
    name: "in.crystal",
    mimeType: "text/plain",
    buffer: Buffer.from(script),
  });
  await waitForEngine(page);
  await page.getByTestId("run-file-in.crystal").click();
  await expect
    .poll(async () => (await rendered(page)).timesteps, { timeout: 120_000 })
    .toBeGreaterThan(10);
  const { numAtoms } = await rendered(page);
  expect((await rendered(page)).count).toBe(numAtoms);

  await page.getByTestId("periodic-images").click();
  await page.getByLabel("Images along x").fill("2");
  await page.getByLabel("Images along y").fill("2");
  await expect
    .poll(async () => (await rendered(page)).count, { timeout: 30_000 })
    .toBe(4 * numAtoms);
  const replicated = await rendered(page);
  expect(replicated.imagesMatch).toBe(true);
  expect(replicated.shiftBError).toBeLessThan(1e-3);

  // Images follow the running simulation, and 1×1×1 restores the original.
  await expect
    .poll(async () => (await rendered(page)).timesteps, { timeout: 30_000 })
    .toBeGreaterThan(replicated.timesteps);
  await page.getByLabel("Images along x").fill("1");
  await page.getByLabel("Images along y").fill("1");
  await expect
    .poll(async () => (await rendered(page)).count, { timeout: 30_000 })
    .toBe(numAtoms);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
