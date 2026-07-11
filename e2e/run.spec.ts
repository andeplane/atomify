/**
 * The core run flow with the real wasm engine: run a small LJ melt, watch
 * the live run detail, verify the Completed pill, the runs/run-001 history
 * row, output files (log.lammps), the read-only snapshot banner, and that
 * the run detail is never blank after a reload (frame or placeholder plus
 * the persisted console).
 */

import { test, expect } from "@playwright/test";
import {
  createFastLjProject,
  gotoApp,
  RUN_TIMEOUT,
  waitForEngine,
  waitRunCompleted,
} from "./helpers";

test("run a simulation end-to-end and inspect the recorded run", async ({
  page,
}) => {
  await test.step("create a project with a fast LJ script", async () => {
    await gotoApp(page);
    await createFastLjProject(page, "LJ melt", "lj-melt");
  });

  await test.step("run the simulation and watch live progress", async () => {
    await waitForEngine(page);
    await page.getByTestId("editor-save-and-run").click();
    // The store navigates to the live run detail screen.
    await expect(page.getByTestId("run-detail")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("status-pill-running")).toBeVisible({
      timeout: 60_000,
    });
    // Live console follows the engine output.
    await expect(page.getByTestId("run-console")).toContainText("LAMMPS", {
      timeout: 60_000,
    });
  });

  await test.step("the run completes", async () => {
    await waitRunCompleted(page);
  });

  await test.step("runs/run-001 is listed in the Runs tab", async () => {
    await page.getByTestId("run-detail-back").click();
    await expect(page.getByTestId("runs-tab")).toBeVisible();
    const row = page.getByTestId("run-row-run-001");
    await expect(row).toBeVisible();
    await expect(row).toContainText("in.melt");
    await expect(row).toContainText("runs/run-001");
  });

  await test.step("output files include log.lammps", async () => {
    await page.getByTestId("run-row-run-001").click();
    await expect(page.getByTestId("run-detail")).toBeVisible();
    await expect(page.getByTestId("status-pill-completed")).toBeVisible();
    await expect(page.getByTestId("run-output-log.lammps")).toBeVisible({
      timeout: 30_000,
    });
  });

  await test.step("the log opens as a read-only snapshot", async () => {
    await page.getByTestId("run-output-log.lammps").click();
    await expect(page.getByTestId("editor-screen")).toBeVisible();
    await expect(page.getByTestId("editor-filename")).toHaveText(
      "runs/run-001/log.lammps",
    );
    await expect(page.getByTestId("editor-snapshot-banner")).toContainText(
      "Read-only — snapshot of run #001",
    );
    // Read-only files have no autosave indicator and no Save & run.
    await expect(page.getByTestId("editor-save-state")).toHaveCount(0);
  });

  await test.step("run detail after reload is never blank", async () => {
    // Navigate back to the run detail so the ?run= deep link is in the URL.
    await page.getByTestId("editor-back").click();
    await page.getByTestId("tab-runs").click();
    await page.getByTestId("run-row-run-001").click();
    await expect(page.getByTestId("run-detail")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("run-detail")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("status-pill-completed")).toBeVisible();
    // Either the captured frame.png or the designed placeholder — never a
    // silent black canvas.
    await expect(
      page.getByTestId("run-frame").or(page.getByTestId("run-placeholder")),
    ).toBeVisible({ timeout: 30_000 });
    // The persisted console is shown for finished runs.
    await expect(page.getByTestId("run-console")).toContainText(
      /Loop time|Total wall time/,
      { timeout: RUN_TIMEOUT },
    );
    await expect(page.getByTestId("run-console")).not.toContainText(
      "no log recorded",
    );
  });
});
