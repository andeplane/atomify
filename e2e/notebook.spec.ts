/**
 * Notebook tab: the JupyterLite iframe targets the project's analysis
 * notebook. Only the iframe target is asserted — booting JupyterLite is out
 * of scope, and the site only exists in dev when public/jupyter has been
 * built (it's gitignored), so the test skips itself when it's absent.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { createBlankProject, gotoApp } from "./helpers";

const JUPYTER_BUILT = existsSync(
  join(__dirname, "..", "public", "jupyter", "lab", "index.html"),
);

test("notebook iframe targets the project's analysis notebook", async ({
  page,
}) => {
  test.skip(
    !JUPYTER_BUILT,
    "public/jupyter is not built — run `make jupyterlite` first",
  );

  await test.step("create a project and open the Notebook tab", async () => {
    await gotoApp(page);
    await createBlankProject(page, "Notebook study", "notebook-study");
    await page.getByTestId("tab-notebook").click();
    await expect(page.getByTestId("notebook-tab")).toBeVisible();
  });

  await test.step("the iframe src points at the project notebook", async () => {
    const iframe = page.getByTestId("notebook-iframe");
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute(
      "src",
      /jupyter\/lab\/index\.html\?path=notebook-study%2Fanalysis\.ipynb$/,
    );
  });
});
