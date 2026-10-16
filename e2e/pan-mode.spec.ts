import { expect, test, type Page } from "@playwright/test";
import {
  createBlankProject,
  FAST_LJ_SCRIPT,
  gotoApp,
  waitForEngine,
} from "./helpers";

/** omovi keeps the camera target fixed while rotating and moves it to pan. */
async function cameraTarget(page: Page): Promise<number[]> {
  return page.evaluate(async () => {
    const path = "/atomify/src/store/index.ts";
    const v = (await import(path)).engine.visualizer;
    const t = v.getCameraTarget();
    return [t.x, t.y, t.z];
  });
}

async function leftDrag(page: Page) {
  const canvas = page.getByTestId("run-detail").locator("canvas").first();
  const bounds = (await canvas.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 120, y + 40, { steps: 8 });
  await page.mouse.up();
}

test("P switches left-drag between rotate and pan", async ({ page }) => {
  await gotoApp(page);
  await createBlankProject(page, "Pan mode", "pan-mode");
  await page.getByTestId("upload-input").setInputFiles({
    name: "in.melt",
    mimeType: "text/plain",
    buffer: Buffer.from(FAST_LJ_SCRIPT.replace("run 400", "run 1000000")),
  });
  await waitForEngine(page);
  await page.getByTestId("run-file-in.melt").click();
  await expect(page.getByTestId("run-detail")).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const path = "/atomify/src/store/index.ts";
          return (await import(path)).default.getState().simulationStatus
            .timesteps;
        }),
      { timeout: 60_000 },
    )
    .toBeGreaterThan(1);
  await page.keyboard.press("Space");

  // Default: left-drag rotates around a fixed target.
  const initial = await cameraTarget(page);
  await leftDrag(page);
  await page.waitForTimeout(500);
  expect(await cameraTarget(page)).toEqual(initial);
  await expect(page.getByTestId("pan-mode-indicator")).toHaveCount(0);

  // Pan mode: left-drag moves the target.
  await page.keyboard.press("p");
  await expect(page.getByTestId("pan-mode-indicator")).toBeVisible();

  // Shift+click still selects atoms in pan mode.
  const canvas = page.getByTestId("run-detail").locator("canvas").first();
  const bounds = (await canvas.boundingBox())!;
  const selected = page.getByText(/Selected Atoms \(\d+\)/);
  for (const [dx, dy] of [
    [0, 0],
    [12, 8],
    [-10, 5],
    [20, -15],
    [5, 25],
  ]) {
    await page.keyboard.down("Shift");
    await page.mouse.click(
      bounds.x + bounds.width / 2 + dx,
      bounds.y + bounds.height / 2 + dy,
    );
    await page.keyboard.up("Shift");
    if (await selected.isVisible()) break;
  }
  await expect(selected).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(selected).toHaveCount(0);

  await leftDrag(page);
  await expect.poll(() => cameraTarget(page)).not.toEqual(initial);

  // Back to rotate.
  await page.keyboard.press("p");
  await expect(page.getByTestId("pan-mode-indicator")).toHaveCount(0);
  await page.waitForTimeout(500);
  const panned = await cameraTarget(page);
  await leftDrag(page);
  await page.waitForTimeout(500);
  expect(await cameraTarget(page)).toEqual(panned);

  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
