import { expect, test } from "@playwright/test";
import {
  createBlankProject,
  gotoApp,
  readContentsRecord,
  waitForEngine,
} from "./helpers";

const atomicData = `LAMMPS data file\n\n2 atoms\n1 atom types\n\n0 4 xlo xhi\n0 4 ylo yhi\n0 4 zlo zhi\n\nAtoms # atomic\n\n1 1 1 1 1\n2 1 3 3 3\n`;

const molecularData = `LAMMPS data file\n\n2 atoms\n1 bonds\n1 atom types\n1 bond types\n\n0 4 xlo xhi\n0 4 ylo yhi\n0 4 zlo zhi\n\nAtoms # full\n\n1 1 1 0 1 1 1\n2 1 1 0 2 2 2\n\nBonds\n\n1 1 1 2\n`;
for (const [style, data] of [
  ["atomic", atomicData],
  ["full", molecularData],
]) {
  test(`${style} data opens as an interactive structure with zero integrated steps`, async ({
    page,
  }) => {
    await gotoApp(page);
    await createBlankProject(page, "Data viewer", "data-viewer");
    await page.getByTestId("upload-input").setInputFiles({
      name: "sample.data",
      mimeType: "text/plain",
      buffer: Buffer.from(data),
    });
    await waitForEngine(page);
    await page.getByTestId("view-data-sample.data").click();
    await expect(page.getByRole("textbox", { name: "Atom style" })).toHaveValue(
      style,
    );
    await page.getByRole("combobox", { name: "Units" }).selectOption("lj");
    await page
      .getByTestId("view-data-modal")
      .getByRole("button", { name: "View structure", exact: true })
      .click();
    await expect(page.getByTestId("status-pill-completed").first()).toBeVisible(
      {
        timeout: 60_000,
      },
    );
    const canvas = page.getByTestId("run-detail").locator("canvas").first();
    await expect(canvas).toBeVisible();
    const meta = await readContentsRecord(
      page,
      "data-viewer/runs/run-001/.atomify/run.json",
    );
    expect(meta?.content).toMatchObject({
      viewOnly: true,
      status: "completed",
      stats: { timesteps: 0, numAtoms: 2 },
    });
    const source = await readContentsRecord(page, "data-viewer/sample.data");
    expect(source?.content).toBe(data);
    const before = await canvas.screenshot();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 90,
      box.y + box.height / 2 + 25,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect
      .poll(async () => (await canvas.screenshot()).equals(before))
      .toBe(false);
  });
}
