import { expect, test } from "@playwright/test";
import { createBlankProject, gotoApp, waitForEngine } from "./helpers";

const script = `units lj
atom_style atomic
region box block 0 10 0 10 0 10
create_box 1 box
create_atoms 1 single 1 1 1
mass * 1
pair_style zero 1
pair_coeff * *
velocity all set 1 0 0
fix move all nve
timestep 0.01
dump trace all custom 1 trajectory.dump id x vx
run 10
`;

test("continuation preserves engine state and parent results, and the full sequence can be replayed", async ({
  page,
}) => {
  await gotoApp(page);
  await createBlankProject(page, "Continue test", "continue-test");
  await page
    .getByTestId("upload-input")
    .setInputFiles({
      name: "in.move",
      mimeType: "text/plain",
      buffer: Buffer.from(script),
    });
  await waitForEngine(page);
  await page.getByTestId("run-file-in.move").click();
  await expect(page.getByTestId("continue-run")).toBeVisible({
    timeout: 60_000,
  });
  const original = await page.evaluate(async () => {
    const path = "/atomify/src/store/index.ts";
    const store = (await import(path)).default;
    const output = await store
      .getActions()
      .projects.readFile("runs/run-001/trajectory.dump");
    await store
      .getActions()
      .projects.writeFile({
        path: "in.move",
        content: "invalid working-tree edit\n",
      });
    return output;
  });
  await page.getByTestId("continue-run").click();
  await page.getByLabel("Additional timesteps").fill("20");
  await page
    .getByTestId("continue-run-modal")
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const path = "/atomify/src/store/index.ts";
          const s = (await import(path)).default.getState();
          const meta = s.projects.active?.runs.find(
            (r: { runId: string }) => r.runId === "run-002",
          )?.meta;
          return {
            status: meta?.status,
            step: meta?.stats?.timesteps,
            parent: meta?.continuationOf,
            start: meta?.continuedFromTimestep,
          };
        }),
      { timeout: 60_000 },
    )
    .toEqual({ status: "completed", step: 30, parent: "run-001", start: 10 });
  const after = await page.evaluate(async () => {
    const path = "/atomify/src/store/index.ts";
    const store = (await import(path)).default;
    return {
      x: store.getState().render.particles.positions[0],
      parent: await store
        .getActions()
        .projects.readFile("runs/run-001/trajectory.dump"),
      child: await store
        .getActions()
        .projects.readFile("runs/run-002/trajectory.dump"),
    };
  });
  expect(after.x).toBeCloseTo(1.3, 5);
  expect(after.parent).toBe(original);
  expect(after.child).toContain("ITEM: TIMESTEP\n30\n");
  await page.reload();
  await waitForEngine(page);
  await expect(page.getByTestId("continue-run")).toHaveCount(0);
  await page.getByTestId("replay-continuation").click();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const path = "/atomify/src/store/index.ts";
          const s = (await import(path)).default.getState();
          const meta = s.projects.active?.runs.find(
            (r: { runId: string }) => r.runId === "run-003",
          )?.meta;
          return {
            status: meta?.status,
            step: meta?.stats?.timesteps,
            x: s.render.particles?.positions[0],
          };
        }),
      { timeout: 60_000 },
    )
    .toMatchObject({ status: "completed", step: 30 });
  expect(
    await page.evaluate(async () => {
      const path = "/atomify/src/store/index.ts";
      return (await import(path)).default.getState().render.particles
        .positions[0];
    }),
  ).toBeCloseTo(1.3, 5);
});
