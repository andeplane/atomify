/**
 * Variable sweep: sweep T over two values from the New Run modal, watch
 * both runs execute sequentially, verify the runs list shows both rows with
 * their vars under a shared sweep header, and verify the persisted
 * run.json vars straight from IndexedDB.
 */

import { test, expect } from "@playwright/test";
import {
  createFastLjProject,
  gotoApp,
  readContentsRecord,
  RUN_TIMEOUT,
  waitForEngine,
} from "./helpers";

interface RunMetaLike {
  status: string;
  vars?: Record<string, number>;
  sweepId?: string;
}

test("sweep T over two values runs sequentially and records vars", async ({
  page,
}) => {
  await test.step("create a project with a parameterized script", async () => {
    await gotoApp(page);
    await createFastLjProject(page, "Sweep study", "sweep-study");
    await page.getByTestId("editor-back").click();
  });

  await test.step("configure a 2-value sweep of T", async () => {
    await waitForEngine(page); // Start runs is disabled until then
    await page.getByTestId("run-menu-toggle").click();
    await page.getByTestId("run-menu-sweep").click();
    await expect(page.getByTestId("new-run-modal")).toBeVisible();
    // No input script is designated yet, so the chooser comes first.
    await page.getByTestId("script-choice-in.melt").click();
    await expect(page.getByTestId("run-input-script")).toHaveText("in.melt");

    await expect(page.getByTestId("var-row-T")).toBeVisible();
    await page.getByTestId("sweep-toggle-T").click();
    await page.getByTestId("var-from-T").fill("1");
    await page.getByTestId("var-to-T").fill("2");
    await page.getByTestId("var-steps-T").fill("2");
    await expect(page.getByTestId("run-summary")).toContainText(
      "Creates 2 runs",
    );
    await expect(page.getByTestId("run-summary")).toContainText("T = 1, 2");
    await expect(page.getByTestId("start-runs")).toHaveText("Start 2 runs");
  });

  await test.step("both runs execute sequentially to completion", async () => {
    await page.getByTestId("start-runs").click();
    // The store navigates to each run's detail screen as it starts; wait
    // for the second run's detail, then for its completion.
    await expect(page.getByTestId("run-detail")).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page.getByTestId("run-detail").getByText("runs/run-002"),
    ).toBeVisible({ timeout: RUN_TIMEOUT });
    await expect(page.getByTestId("status-pill-completed")).toBeVisible({
      timeout: RUN_TIMEOUT,
    });
  });

  await test.step("the runs list shows both rows under one sweep header", async () => {
    await page.getByTestId("run-detail-back").click();
    await expect(page.getByTestId("runs-tab")).toBeVisible();
    const row1 = page.getByTestId("run-row-run-001");
    const row2 = page.getByTestId("run-row-run-002");
    await expect(row1).toBeVisible();
    await expect(row2).toBeVisible();
    await expect(row1).toContainText("T = 1");
    await expect(row2).toContainText("T = 2");
    const sweepHeaders = page.locator('[data-testid^="sweep-header-"]');
    await expect(sweepHeaders).toHaveCount(1);
    await expect(sweepHeaders.first()).toContainText("Sweep · T = 1 → 2 · 2 runs");
  });

  await test.step("run.json records the vars (read from IndexedDB)", async () => {
    const record1 = await readContentsRecord(
      page,
      "sweep-study/runs/run-001/.atomify/run.json",
    );
    const record2 = await readContentsRecord(
      page,
      "sweep-study/runs/run-002/.atomify/run.json",
    );
    expect(record1).not.toBeNull();
    expect(record2).not.toBeNull();
    const meta1 = record1!.content as RunMetaLike;
    const meta2 = record2!.content as RunMetaLike;
    expect(meta1.status).toBe("completed");
    expect(meta2.status).toBe("completed");
    expect(meta1.vars).toEqual({ T: 1 });
    expect(meta2.vars).toEqual({ T: 2 });
    expect(meta1.sweepId).toBeTruthy();
    expect(meta1.sweepId).toBe(meta2.sweepId);
  });
});
