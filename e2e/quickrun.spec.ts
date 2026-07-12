/**
 * Quick run from the example library: scratch project with the temporary
 * banner and no Notebook tab, then Save as project materializes it into the
 * library (banner gone, Notebook tab present, sidebar entry).
 */

import { test, expect } from "@playwright/test";
import { gotoApp, RUN_TIMEOUT, waitForEngine } from "./helpers";

// Small 2D binary LJ gas — the lightest auto-startable example.
const EXAMPLE_ID = "2D-lj-fluid";
const EXAMPLE_TITLE = "2D Lennard Jones fluid";

test("quick run an example, then save it as a project", async ({ page }) => {
  await test.step("quick run from the example library", async () => {
    await gotoApp(page);
    await page.getByTestId("nav-examples").click();
    await expect(page.getByTestId("examples-screen")).toBeVisible();
    await expect(
      page.getByTestId(`library-example-${EXAMPLE_ID}`),
    ).toBeVisible({ timeout: 30_000 });
    await waitForEngine(page); // Quick run is disabled until the engine is up
    await page.getByTestId(`library-quick-${EXAMPLE_ID}`).click();
  });

  await test.step("banner visible, Notebook tab hidden", async () => {
    await expect(page.getByTestId("quick-run-banner")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("quick-run-banner")).toContainText(
      "files are temporary",
    );
    await expect(page.getByTestId("tab-files")).toBeVisible();
    await expect(page.getByTestId("tab-runs")).toBeVisible();
    await expect(page.getByTestId("tab-notebook")).toHaveCount(0);
    await expect(page.getByTestId("project-title")).toContainText(
      `Quick run — ${EXAMPLE_TITLE}`,
    );
  });

  await test.step("wait for the auto-started run to finish", async () => {
    // The quick run auto-starts and navigates to its live run detail; wait
    // until the run is no longer live so saving is deterministic.
    await expect(page.getByTestId("run-detail")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("stop-run")).toHaveCount(0, {
      timeout: RUN_TIMEOUT,
    });
  });

  await test.step("save as project materializes it into the library", async () => {
    await page.getByTestId("save-as-project").click();
    await expect(page.getByTestId("quick-run-banner")).toHaveCount(0, {
      timeout: 60_000,
    });
    await expect(page.getByTestId("project-title")).toHaveText(EXAMPLE_TITLE);
    await expect(page.getByTestId("tab-notebook")).toBeVisible();
    const sidebarProjects = page.locator('[data-testid^="sidebar-project-"]');
    await expect(sidebarProjects).toHaveCount(1);
    await expect(sidebarProjects.first()).toContainText(EXAMPLE_TITLE);
  });
});
