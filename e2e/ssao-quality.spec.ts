import { expect, test } from "@playwright/test";
import {
  createBlankProject,
  FAST_LJ_SCRIPT,
  gotoApp,
  waitForEngine,
} from "./helpers";

test("SSAO quality is applied to the real pass and survives saved settings", async ({
  page,
}) => {
  await gotoApp(page);
  await createBlankProject(page, "Occlusion quality", "occlusion-quality");
  await page.getByTestId("upload-input").setInputFiles({
    name: "in.ao",
    mimeType: "text/plain",
    buffer: Buffer.from(FAST_LJ_SCRIPT.replace("run 400", "run 100000")),
  });
  await waitForEngine(page);
  await page.getByTestId("run-file-in.ao").click();
  const passConfig = () =>
    page.evaluate(async () => {
      const path = "/atomify/src/store/index.ts";
      const s = (await import(path)).default.getState();
      const c =
        s.render.visualizer?.renderer.postProcessingManager?.n8aoPass
          .configuration;
      return (
        c && {
          samples: c.aoSamples,
          denoise: c.denoiseSamples,
          pixels: c.screenSpaceRadius,
        }
      );
    });
  // Put the pass in the pixel-radius state so each settings change below has
  // to reset it: the world-space value it must restore is also N8AO's default.
  const usePixelRadius = () =>
    page.evaluate(async () => {
      const path = "/atomify/src/store/index.ts";
      const store = (await import(path)).default;
      store.getActions().simulation.setPaused(true);
      const v = store.getState().render.visualizer;
      v.renderer.postProcessingManager.n8aoPass.configuration.screenSpaceRadius = true;
      v.forceRender = true;
    });
  await expect
    .poll(passConfig, { timeout: 60_000 })
    .toEqual({ samples: 64, denoise: 16, pixels: false });
  await usePixelRadius();
  await expect
    .poll(passConfig)
    .toEqual({ samples: 64, denoise: 16, pixels: true });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByTestId("settings-tab-rendering").click();
  await page.getByTestId("render-ssao-quality").selectOption("fast");
  await expect
    .poll(passConfig)
    .toEqual({ samples: 16, denoise: 8, pixels: false });
  await usePixelRadius();
  await page.getByTestId("render-ssao-quality").selectOption("detailed");
  await expect
    .poll(passConfig)
    .toEqual({ samples: 64, denoise: 16, pixels: false });
  await page
    .getByTestId("settings-modal")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByTestId("settings-tab-rendering").click();
  await expect(page.getByTestId("render-ssao-quality")).toHaveValue("detailed");
});
