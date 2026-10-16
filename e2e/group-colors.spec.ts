import { expect, test } from "@playwright/test";
import { createBlankProject, gotoApp, waitForEngine } from "./helpers";

const script = `units lj
atom_style atomic
region box block 0 8 0 8 0 8
create_box 1 box
create_atoms 1 single 2 2 2
create_atoms 1 single 5 5 5
mass * 1
pair_style zero 1
pair_coeff * *
include groups.inc
run 100000
`;

test("runtime groups can color paused atoms and follow dynamic membership", async ({
  page,
}) => {
  await gotoApp(page);
  await createBlankProject(page, "Group colors", "group-colors");
  await page.getByTestId("upload-input").setInputFiles([
    { name: "in.groups", mimeType: "text/plain", buffer: Buffer.from(script) },
    {
      name: "groups.inc",
      mimeType: "text/plain",
      buffer: Buffer.from(
        'variable gname string tracked\nvariable member atom "id == 1 && step < 200"\ngroup ${gname} dynamic all var member every 1\n',
      ),
    },
  ]);
  await waitForEngine(page);
  await page.getByTestId("run-file-in.groups").click();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const path = "/atomify/src/store/index.ts";
          return Object.keys(
            (await import(path)).default.getState().simulationStatus.computes,
          );
        }),
      { timeout: 60_000 },
    )
    .toContain("Group: tracked");
  const pause = async (value: boolean) =>
    page.evaluate(async (value) => {
      const path = "/atomify/src/store/index.ts";
      (await import(path)).default.getActions().simulation.setPaused(value);
    }, value);
  await pause(true);
  await page.getByTestId("color-atoms").click();
  await page.locator(".ant-select-selector").first().click();
  await page.getByText("tracked", { exact: true }).click();
  const colors = () =>
    page.evaluate(async () => {
      const path = "/atomify/src/store/index.ts";
      const s = (await import(path)).default.getState(),
        p = s.render.particles,
        v = s.render.visualizer;
      const attr = p.geometry?.getAttribute("atomColor");
      return [1, 2]
        .map((id) => {
          const i = p.indices.indexOf(id);
          return attr
            ? { r: attr.getX(i), b: attr.getZ(i) }
            : v.colorTexture.getRGBA(id);
        })
        .map((c) => (c.r > c.b ? "member" : "outside"));
    });
  await expect.poll(colors).toEqual(["member", "outside"]);
  await page.getByRole("button", { name: "Close", exact: true }).last().click();
  await pause(false);
  await expect
    .poll(colors, { timeout: 30_000 })
    .toEqual(["outside", "outside"]);
  await pause(true);
  await page.getByTestId("color-atoms").click();
  await page.locator(".ant-select-selector").first().click();
  await page.getByText("all", { exact: true }).click();
  await expect.poll(colors).toEqual(["member", "member"]);
  await page.getByRole("button", { name: "Close", exact: true }).last().click();
  expect(
    await page.evaluate(async () => {
      const path = "/atomify/src/store/index.ts";
      return Object.keys(
        (await import(path)).default.getState().simulationStatus.variables,
      ).filter((name) => name.startsWith("atomify_groups_"));
    }),
  ).toEqual([]);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
