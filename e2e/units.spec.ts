import { expect, test } from "@playwright/test";
import { createBlankProject, gotoApp, waitForEngine } from "./helpers";

for (const [units, time, pressure] of [
  ["real", "fs", "atm"],
  ["metal", "ps", "bar"],
]) {
  test(`real engine chart labels use ${units} units from an included file`, async ({
    page,
  }) => {
    await gotoApp(page);
    await createBlankProject(page, "Chart units", "chart-units");
    await page.getByTestId("upload-input").setInputFiles([
      {
        name: "settings.inc",
        mimeType: "text/plain",
        buffer: Buffer.from(`units ${units}\n`),
      },
      {
        name: "in.units",
        mimeType: "text/plain",
        buffer: Buffer.from(
          "include settings.inc\natom_style atomic\nregion box block 0 4 0 4 0 4\ncreate_box 1 box\ncreate_atoms 1 single 1 1 1\nmass * 1\npair_style zero 1\npair_coeff * *\nrun 0\n",
        ),
      },
    ]);
    await waitForEngine(page);
    await page.getByTestId("run-file-in.units").click();
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const path = "/atomify/src/store/index.ts";
            const s = (await import(path)).default.getState().simulationStatus;
            return {
              units: s.unitStyle,
              x: s.computes.thermo_press?.xLabel,
              y: s.computes.thermo_press?.yLabel,
            };
          }),
        { timeout: 60_000 },
      )
      .toEqual({ units, x: `Time (${time})`, y: `Pressure (${pressure})` });
  });
}
