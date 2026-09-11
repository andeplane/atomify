import { expect, test } from "@playwright/test";
import { createBlankProject, gotoApp, waitForEngine } from "./helpers";

test("sphere radii are streamed in native units and update during a run", async ({
  page,
}) => {
  await gotoApp(page);
  await createBlankProject(page, "Atom radii", "atom-radii");
  const script =
    "units lj\natom_style sphere 1\nregion box block 0 8 0 8 0 8\ncreate_box 1 box\ncreate_atoms 1 single 2 2 2\ncreate_atoms 1 single 5 5 5\nset atom 1 diameter 1\nset atom 2 diameter 3\npair_style zero 1\npair_coeff * *\ngroup first id 1\nvariable d equal 1+step/1000\nfix grow first adapt 1 atom diameter v_d\nrun 100000\n";
  await page.getByTestId("upload-input").setInputFiles({
    name: "in.radii",
    mimeType: "text/plain",
    buffer: Buffer.from(script),
  });
  await waitForEngine(page);
  await page.getByTestId("run-file-in.radii").click();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const path = "/atomify/src/store/index.ts";
          const s = (await import(path)).default.getState();
          const v = s.render.visualizer;
          if (!v || s.simulationStatus.timesteps < 2) return false;
          const step = s.simulationStatus.timesteps;
          const p = s.render.particles;
          const radii = p.geometry.getAttribute("atomRadius");
          return (
            Math.abs(radii.getX(p.indices.indexOf(1)) - (1 + step / 1000) / 2) <
              0.0001 &&
            Math.abs(radii.getX(p.indices.indexOf(2)) - 1.5) < 0.0001 &&
            !Object.keys(s.simulationStatus.variables).some((name) =>
              name.startsWith("atomify_radius_flag_"),
            )
          );
        }),
      { timeout: 60_000 },
    )
    .toBe(true);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
