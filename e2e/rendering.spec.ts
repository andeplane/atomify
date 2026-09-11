import { expect, test, type Page } from "@playwright/test";
import {
  createFastLjProject,
  FAST_LJ_SCRIPT,
  gotoApp,
  waitForEngine,
} from "./helpers";

/** Count visible model pixels in a real WebGL screenshot, not a mocked canvas. */
async function visiblePixels(page: Page): Promise<number> {
  const canvas = page.getByTestId("run-detail").locator("canvas").first();
  const png = await canvas.screenshot();
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const target = document.createElement("canvas");
    target.width = image.width;
    target.height = image.height;
    const context = target.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, target.width, target.height).data;
    let visible = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) > 40) visible++;
    }
    return visible;
  }, png.toString("base64"));
}

test("SSAO can be disabled and re-enabled without losing rendering or camera updates", async ({
  page,
}) => {
  await gotoApp(page);
  await createFastLjProject(
    page,
    "SSAO check",
    "ssao-check",
    "in.melt",
    FAST_LJ_SCRIPT.replace("run 400", "run 100000"),
  );
  await waitForEngine(page);
  await page.getByTestId("editor-back").click();
  await page.getByTestId("run-simulation").click();
  await expect(page.getByTestId("run-detail")).toBeVisible();
  await expect
    .poll(() => visiblePixels(page), { timeout: 60_000 })
    .toBeGreaterThan(1000);
  await page.keyboard.press("Space");

  for (const enabled of [false, true, false]) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByTestId("settings-tab-rendering").click();
    await page.getByTestId("render-ssao").click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("atomify_render_settings")!).ssao,
        ),
      )
      .toBe(enabled);
    await page
      .getByTestId("settings-modal")
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await expect.poll(() => visiblePixels(page)).toBeGreaterThan(1000);

    const canvas = page.getByTestId("run-detail").locator("canvas").first();
    const before = await canvas.screenshot();
    const bounds = (await canvas.boundingBox())!;
    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 90,
      bounds.y + bounds.height / 2 + 30,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect
      .poll(async () => (await canvas.screenshot()).equals(before))
      .toBe(false);
    await expect.poll(() => visiblePixels(page)).toBeGreaterThan(1000);
  }
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});
