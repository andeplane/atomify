/**
 * Captures every screenshot used by the Help site into
 * help/public/screenshots/*.webp. See playwright.config.ts for how to run.
 *
 * One serial walk through the app, in the order a new user would meet
 * things, so later shots can reuse earlier state (projects, runs). The
 * scripts it types are the ones the tutorials include (help/snippets), so
 * the pictures match the text.
 *
 * Set SHOTS=name1,name2 to only save those shots (the walk still runs).
 */

import { test, expect, type Page } from "@playwright/test";
import { gotoApp, waitForEngine } from "../../e2e/helpers";
import {
  focusViewport,
  hideToasts,
  routeMonaco,
  setPaused,
  settle,
  shot as saveShot,
  snippet,
  upload,
  pauseAtStep,
  withStore,
  zoneWhereLocalHourIs,
} from "./shots";

const ONLY = process.env.SHOTS?.split(",").map((s) => s.trim());
const shot: typeof saveShot = async (page, name, ...rest) => {
  if (ONLY && !ONLY.includes(name)) return;
  await saveShot(page, name, ...rest);
};

const TOUR_SEEN_KEY = "atomify.tour.seen.v1";
const LONG = 900_000;

test.use({ timezoneId: zoneWhereLocalHourIs(10) });

async function newPage(
  browser: import("@playwright/test").Browser,
  options: import("@playwright/test").BrowserContextOptions = {},
): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    serviceWorkers: "block",
    timezoneId: zoneWhereLocalHourIs(10),
    permissions: ["clipboard-read", "clipboard-write"],
    ...options,
  });
  await context.addInitScript((key) => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // ignore
    }
  }, TOUR_SEEN_KEY);
  const page = await context.newPage();
  await routeMonaco(page);
  return page;
}

async function waitCompleted(page: Page, timeout = LONG): Promise<void> {
  await expect(page.getByTestId("status-pill-completed").first()).toBeVisible({
    timeout,
  });
}

test("capture Help screenshots", async ({ browser }) => {
  test.setTimeout(3 * 3_600_000);

  // ---------------------------------------------------------------- phase 0
  await test.step("engine loading chip", async () => {
    const page = await newPage(browser);
    // Hold the engine module back so the loading chip stays up.
    await page.route(/lammps-atomify\.js/, async (route) => {
      await new Promise((r) => setTimeout(r, 20_000));
      await route.continue().catch(() => {});
    });
    await gotoApp(page);
    const chip = page.getByTestId("engine-loading-chip");
    await expect(chip).toBeVisible();
    await page.waitForTimeout(1500);
    await shot(
      page,
      "engine-loading",
      [
        chip,
        page.getByTestId("sidebar-help"),
        page.getByTestId("sidebar-settings"),
      ],
      { pad: 10, padTop: 2 },
    );
    await page.context().close();
  });

  await test.step("unsupported browser (Safari)", async () => {
    const page = await newPage(browser, {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    });
    await gotoApp(page);
    const chip = page.getByTestId("engine-error-chip");
    await expect(chip).toBeVisible({ timeout: 60_000 });
    await shot(
      page,
      "safari-unsupported",
      [chip, page.getByTestId("sidebar-settings")],
      { pad: 10, padTop: 2 },
    );
    await page.context().close();
  });

  await test.step("home for a new user", async () => {
    const page = await newPage(browser);
    await gotoApp(page);
    await waitForEngine(page);
    await expect(page.getByTestId("welcome-card")).toBeVisible();
    await page.waitForTimeout(1500); // example thumbnails
    await shot(page, "home-welcome");
    await page.context().close();
  });

  // ---------------------------------------------------------------- phase 1
  const page = await newPage(browser);
  page.on("pageerror", (error) => console.log("pageerror:", error.message));

  await test.step("example library", async () => {
    await page.goto("/atomify/?screen=examples");
    await expect(page.getByTestId("examples-screen")).toBeVisible();
    await page.waitForFunction(() =>
      Array.from(document.images).every((img) => img.complete),
    );
    await page.waitForTimeout(1000);
    await shot(page, "example-library");
    await waitForEngine(page);
  });

  await test.step("quick run of the 2D LJ fluid", async () => {
    await hideToasts(page);
    // The example's 1,000 steps finish in a few seconds headless, too fast
    // to catch mid-run; give the quick run more steps.
    await page.route(/2D-lj-fluid\.in$/, async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/^run 1000$/m, "run 20000");
      await route.fulfill({ response, body });
    });
    await page.getByTestId("library-quick-2D-lj-fluid").click();
    await expect(page.getByTestId("run-detail")).toBeVisible();
    await expect(page.getByTestId("run-side-panel")).toContainText("Dynamics", {
      timeout: LONG,
    });
    await pauseAtStep(page, 300);
    await settle(page);
    await shot(page, "quick-run-live");

    await page.getByTestId("run-console-toggle").click();
    await page.waitForTimeout(800);
    await shot(page, "run-console", page.getByTestId("run-console"), {
      pad: 0,
    });
    await page.getByTestId("run-console-toggle").click();

    await page.getByTestId("analysis-entry-thermo_temp").click();
    const figure = page.getByTestId("analysis-figure");
    await expect(figure).toBeVisible();
    await page.waitForTimeout(2000);
    await shot(page, "analysis-figure-temp", figure, { pad: 0 });
    await page.keyboard.press("Escape");
    await expect(figure).toBeHidden();

    await setPaused(page, false);
    await waitCompleted(page);
    await settle(page);
    await shot(page, "quick-run-completed");
  });

  await test.step("save as project, then new project dialog", async () => {
    await page.getByTestId("save-as-project").click();
    await expect(page.getByTestId("project-title")).toHaveText(
      "2D Lennard Jones fluid",
      { timeout: 60_000 },
    );

    await page.getByTestId("sidebar-new-project").click();
    const modal = page.getByTestId("new-project-modal");
    await expect(modal).toBeVisible();
    await page.getByTestId("project-name-input").fill("LJ melt");
    await page.locator('[data-testid^="color-"]').first().click();
    await page.waitForTimeout(400);
    await shot(page, "new-project-blank", modal, { pad: 0 });

    await page.getByTestId("source-example").click();
    await page.getByTestId("np-example-search").fill("diffusion");
    await page.waitForTimeout(1000);
    await shot(page, "new-project-example", modal, { pad: 0 });

    await page.getByTestId("source-blank").click();
    await page.getByTestId("create-project").click();
    await expect(page.getByTestId("project-title")).toHaveText("LJ melt");
  });

  await test.step("first run of in.melt", async () => {
    const melt = snippet("in.melt").replace(
      "#/atom 1 0.6 #3F6EFF",
      "#/camera position 21.6 17.1 26.9\n#/camera target 4.9 4.9 4.9\n#/atom 1 0.6 #3F6EFF",
    );
    await upload(page, "in.melt", melt);
    await page.getByTestId("run-simulation").click();
    await expect(page.getByTestId("run-detail")).toBeVisible();
    await waitCompleted(page);
    await settle(page);
    await shot(page, "run-detail-completed");

    await page.getByTestId("continue-run").click();
    const modal = page.getByTestId("continue-run-modal");
    await expect(modal).toBeVisible();
    await shot(page, "continue-modal", modal, { pad: 0 });
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  await test.step("files tab", async () => {
    await upload(page, "data.lmp", snippet("two-atoms.data"));
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await shot(page, "files-tab");

    await page.getByTestId("file-row-in.melt").hover();
    await page.getByTestId("file-menu-in.melt").click();
    const popover = page.getByTestId("file-menu-popover-in.melt");
    await expect(popover).toBeVisible();
    await shot(page, "file-row-menu", [
      page.getByTestId("file-row-in.melt"),
      popover,
    ]);
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 895);

    await page.getByTestId("new-file-button").click();
    await page.getByTestId("prompt-input").fill("in.equilibrate");
    const prompt = page.getByTestId("prompt-modal");
    await shot(page, "new-file-prompt", prompt, { pad: 0 });
    await page.keyboard.press("Escape");
    await expect(prompt).toBeHidden();
  });

  await test.step("editor", async () => {
    await page.getByTestId("edit-file-in.melt").click();
    await expect(page.getByTestId("editor-screen")).toBeVisible();
    await expect(page.locator(".monaco-editor .view-lines")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("editor-save-state")).toContainText("Saved");
    await page.waitForTimeout(1000);
    await shot(page, "editor");

    await withStore(
      page,
      `store.getActions().projects.setScreen({ name: "project", dirName: "lj-melt", tab: "files", filePath: "runs/run-001/in.melt" })`,
    );
    await expect(page.getByTestId("editor-snapshot-banner")).toBeVisible();
    await expect(page.locator(".monaco-editor .view-lines")).toBeVisible();
    await page.waitForTimeout(1000);
    await shot(page, "editor-snapshot", page.getByTestId("editor-screen"), {
      pad: 0,
      maxHeight: 330,
    });
    await page.getByTestId("editor-back").click();
  });

  await test.step("run menu, script chooser and project menu", async () => {
    await upload(page, "in.sweep", snippet("in.sweep"));
    await page.getByTestId("run-menu-toggle").click();
    const menu = page.getByTestId("run-menu");
    await expect(menu).toBeVisible();
    await shot(page, "run-menu", [
      page.getByTestId("run-simulation"),
      page.getByTestId("run-menu-toggle"),
      menu,
    ]);
    await page.getByTestId("run-menu-choose-input").click();
    const chooser = page.getByRole("dialog");
    await expect(chooser).toBeVisible();
    await expect(chooser).toContainText("in.sweep");
    await shot(page, "script-chooser", chooser.first(), { pad: 0 });
    await page.keyboard.press("Escape");
    await expect(chooser).toBeHidden();

    await page.getByTestId("project-menu-toggle").click();
    const projectMenu = page.getByTestId("project-menu");
    await expect(projectMenu).toBeVisible();
    await shot(page, "project-menu", [
      page.getByTestId("project-menu-toggle"),
      projectMenu,
    ]);
    await page.getByTestId("project-menu-delete").click();
    const del = page.getByTestId("delete-project-modal");
    await expect(del).toBeVisible();
    await page.waitForTimeout(800);
    await shot(page, "delete-project-modal", del, { pad: 0 });
    await page.keyboard.press("Escape");
    await expect(del).toBeHidden();
  });

  await test.step("sweep", async () => {
    await page.getByTestId("tab-files").click();
    await page.getByTestId("file-row-in.sweep").hover();
    await page.getByTestId("set-input-in.sweep").click();
    await page.getByTestId("run-menu-toggle").click();
    await page.getByTestId("run-menu-sweep").click();
    const modal = page.getByTestId("new-run-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("var-row-T")).toBeVisible();
    await page.waitForTimeout(500);
    await shot(page, "new-run-modal", modal, { pad: 0 });

    await page.getByTestId("sweep-toggle-T").click();
    await page.getByTestId("var-from-T").fill("1");
    await page.getByTestId("var-to-T").fill("2");
    await page.getByTestId("var-steps-T").fill("3");
    await expect(page.getByTestId("run-summary")).toContainText("3 runs");
    await page.waitForTimeout(400);
    await shot(page, "new-run-sweep", modal, { pad: 0 });

    await page.getByTestId("start-runs").click();
    await expect(page.getByTestId("run-detail")).toBeVisible();
    // Faster sweep runs; the setting carries over to the next runs.
    await page.getByTestId("speed-slider").fill("10");
    await page.getByTestId("run-detail-back").click();
    const runs = page.getByTestId("runs-tab");
    await expect(runs).toBeVisible();
    await expect(page.getByTestId("run-progress-bar").first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('[data-testid^="queued-run-"]')).toHaveCount(2);
    await page.waitForTimeout(1500);
    await shot(page, "runs-tab-sweep-live");

    // When run #002 finishes, Atomify opens run #003 and a toast reports
    // #002 (it's not the run on screen).
    await hideToasts(page, false);
    const toast = page
      .locator(".ant-notification-notice")
      .filter({ hasText: "Run #002" });
    await expect(toast).toBeVisible({ timeout: LONG });
    try {
      // Hovering pauses the toast's auto-close timer. (A synthetic event:
      // the next run's screen can briefly sit on top.)
      await toast.dispatchEvent("mouseover");
      // Wait for the slide-in to finish.
      await expect
        .poll(
          async () => {
            const box = await toast.boundingBox();
            return !!box && box.x > 0 && box.x + box.width <= 1440;
          },
          { timeout: 5000 },
        )
        .toBe(true);
      await page.waitForTimeout(500);
      await shot(page, "run-finished-toast", toast, { pad: 8 });
    } catch (error) {
      console.log("  ⚠️  toast shot failed:", (error as Error).message);
    }
    await hideToasts(page);

    // The store opens each sweep run as it starts; wait for the last one.
    await expect(
      page.getByTestId("run-detail").getByText("runs/run-004"),
    ).toBeVisible({ timeout: LONG });
    await waitCompleted(page);
    await page.getByTestId("run-detail-back").click();
    await expect(runs).toBeVisible();
    await page.waitForTimeout(1000);
    await shot(page, "runs-tab");
  });

  // ---------------------------------------------------------------- phase 2
  await test.step("Nanoball: live visualization", async () => {
    await page.getByTestId("sidebar-new-project").click();
    await page.getByTestId("project-name-input").fill("Nanoball");
    await page.locator('[data-testid^="color-"]').nth(4).click();
    await page.getByTestId("create-project").click();
    await expect(page.getByTestId("project-title")).toHaveText("Nanoball");
    await upload(page, "in.ball", snippet("in.ball"));
    await page.getByTestId("run-simulation").click();
    await expect(page.getByTestId("run-detail")).toBeVisible();
    await page.getByTestId("speed-slider").fill("10");
    await pauseAtStep(page, 3000);
    await settle(page, 2500);
    await shot(page, "run-detail-live");
    await shot(page, "side-panel-live", page.getByTestId("run-side-panel"), {
      pad: 0,
    });
    const analysis = page.getByTestId("run-analysis-section");
    await analysis.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await shot(page, "analysis-panel", analysis, { pad: 8 });
  });

  await test.step("select atoms", async () => {
    const canvas = page.getByTestId("run-viewport").locator("canvas").first();
    const box = (await canvas.boundingBox())!;
    const selected = (n: number) =>
      page.getByText(new RegExp(`Selected Atoms \\(${n}\\)`));
    const scan = async (n: number, shift: boolean) => {
      for (let i = 0; i < 81; i++) {
        const x = box.x + box.width * (0.35 + 0.3 * ((i % 9) / 8));
        const y = box.y + box.height * (0.35 + 0.3 * (Math.floor(i / 9) / 8));
        // mouse.click has no modifiers option; hold Shift on the keyboard.
        if (shift) await page.keyboard.down("Shift");
        await page.mouse.click(x, y);
        if (shift) await page.keyboard.up("Shift");
        await page.waitForTimeout(150);
        if (await selected(n).isVisible()) return true;
      }
      return false;
    };
    if ((await scan(1, false)) && (await scan(2, true))) {
      await page.waitForTimeout(800);
      await shot(page, "selection", page.getByTestId("run-viewport"), {
        pad: 0,
      });
    } else {
      console.log("  ⚠️  could not select two atoms; skipping selection shot");
    }
    await focusViewport(page);
    await page.keyboard.press("Escape");
  });

  await test.step("color atoms", async () => {
    await page.getByTestId("color-atoms").click();
    const settings = page.getByRole("dialog", {
      name: "Particle color settings",
    });
    await expect(settings).toBeVisible();
    await settings.locator(".ant-select").first().click();
    await page
      .locator(".ant-select-dropdown:visible")
      .getByText("ball", { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Close", exact: true })
      .last()
      .click();
    await settle(page, 2500);
    await shot(page, "color-by-group", page.getByTestId("run-viewport"), {
      pad: 0,
    });

    await page.getByTestId("color-atoms").click();
    await expect(settings).toBeVisible();
    await settings.locator(".ant-select").first().click();
    await page
      .locator(".ant-select-dropdown:visible")
      .getByText("ke", { exact: true })
      .click();
    await settings.locator(".ant-select").nth(1).click();
    await page
      .locator(".ant-select-dropdown:visible")
      .getByText("Viridis", { exact: true })
      .click();
    await settings.getByText("Use custom range").click();
    const numbers = settings.getByRole("spinbutton");
    await numbers.nth(0).fill("0");
    await numbers.nth(0).press("Tab");
    await numbers.nth(1).fill("3");
    await numbers.nth(1).press("Tab");
    await page.waitForTimeout(800);
    await shot(page, "color-settings", settings, { pad: 0 });
    await page
      .getByRole("button", { name: "Close", exact: true })
      .last()
      .click();
    await settle(page, 2500);
    await shot(page, "colored-by-ke", page.getByTestId("run-viewport"), {
      pad: 0,
    });

    // Back to type colors for the next shots.
    await page.getByTestId("color-atoms").click();
    await settings.locator(".ant-select").first().click();
    await page
      .locator(".ant-select-dropdown:visible")
      .getByText("Particle type", { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Close", exact: true })
      .last()
      .click();
  });

  await test.step("slice and periodic images", async () => {
    await page.getByTestId("slice-atoms").click();
    await page.getByTestId("slice-toggle").click();
    await page.getByTestId("slice-axis-z").click();
    await settle(page, 2500);
    await shot(
      page,
      "slice",
      [page.getByTestId("run-viewport"), page.getByTestId("slice-popover")],
      { pad: 0 },
    );
    await page.getByTestId("slice-toggle").click();
    await page.keyboard.press("Escape");
    await page.getByTestId("slice-atoms").click({ trial: true });

    await page.getByTestId("periodic-images").click();
    for (const axis of ["x", "y", "z"]) {
      await page.getByLabel(`Images along ${axis}`).fill("2");
      await page.getByLabel(`Images along ${axis}`).press("Tab");
    }
    await settle(page, 3000);
    await shot(
      page,
      "periodic-images",
      [
        page.getByTestId("run-viewport"),
        page.getByTestId("periodic-images-menu"),
      ],
      { pad: 0 },
    );
    for (const axis of ["x", "y", "z"]) {
      await page.getByLabel(`Images along ${axis}`).fill("1");
      await page.getByLabel(`Images along ${axis}`).press("Tab");
    }
    await page.keyboard.press("Escape");
    await page.mouse.click(720, 20);
    await settle(page);
  });

  await test.step("pan mode", async () => {
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.keyboard.press("p");
    await expect(page.getByTestId("pan-mode-indicator")).toBeVisible();
    await shot(page, "pan-mode", page.getByTestId("run-viewport"), { pad: 0 });
    await page.keyboard.press("p");
  });

  await test.step("rendering settings", async () => {
    await page.getByTestId("sidebar-settings").click();
    await page.getByTestId("settings-tab-rendering").click();
    await page.getByTestId("render-orthographic").click();
    await page.getByTestId("render-showScaleBar").click();
    const dialog = page.getByTestId("settings-modal");
    await page.waitForTimeout(500);
    await shot(page, "settings-rendering", dialog, { pad: 0 });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await settle(page, 2500);
    await shot(page, "ortho-scale-bar", page.getByTestId("run-viewport"), {
      pad: 0,
    });
    await page.getByTestId("sidebar-settings").click();
    await page.getByTestId("settings-tab-rendering").click();
    await page.getByTestId("render-orthographic").click();
    await page.getByTestId("render-showScaleBar").click();
    await page.keyboard.press("Escape");
  });

  await test.step("full screen, then stop", async () => {
    await page.getByTestId("viewport-fullscreen").click();
    await settle(page, 2500);
    await shot(page, "fullscreen");
    await page.getByTestId("viewport-fullscreen").click();
    await expect(page.getByTestId("viewport-stop")).toBeHidden();
    await page.waitForTimeout(800);
    await setPaused(page, false);
    await page.getByTestId("stop-run").click();
    await expect(
      page.locator('[data-testid^="status-pill-"]').first(),
    ).not.toHaveAttribute("data-testid", "status-pill-running", {
      timeout: 300_000,
    });
  });

  // ---------------------------------------------------------------- phase 3
  await test.step("failed run", async () => {
    await page.getByTestId("sidebar-project-lj-melt").click();
    await upload(page, "in.broken", snippet("in.broken"));
    await page.getByTestId("file-row-in.broken").hover();
    await page.getByTestId("run-file-in.broken").click();
    await expect(page.getByTestId("status-pill-failed")).toBeVisible({
      timeout: 120_000,
    });
    await page.getByTestId("run-console-toggle").click();
    await page.waitForTimeout(1000);
    await shot(page, "run-failed");
    await page.getByTestId("run-console-toggle").click();
  });

  await test.step("view a data file", async () => {
    await page.getByTestId("run-detail-back").click();
    const zeolite = await import("node:fs").then((fs) =>
      fs.readFileSync(
        new URL(
          "../../public/examples/silica/zeolite_zsm5/zeolite_zsm5.data",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await upload(page, "zeolite.data", zeolite);
    await page.getByTestId("file-row-zeolite.data").hover();
    await page.getByTestId("view-data-zeolite.data").click();
    const modal = page.getByTestId("view-data-modal");
    await expect(modal).toBeVisible();
    await page.getByRole("combobox", { name: "Units" }).selectOption("metal");
    await page.waitForTimeout(400);
    await shot(page, "view-data-modal", modal, { pad: 0 });
    await modal
      .getByRole("button", { name: "View structure", exact: true })
      .click();
    await waitCompleted(page, 600_000);
    await settle(page, 2500);
    await shot(page, "view-data-structure");
  });

  await test.step("notebook", async () => {
    await page.getByTestId("run-detail-back").click();
    await page.getByTestId("tab-notebook").click();
    const frame = page.frameLocator('[data-testid="notebook-iframe"]');
    try {
      await expect(frame.locator(".jp-Notebook").first()).toBeVisible({
        timeout: 240_000,
      });
      // Wait for the kernel to be idle, then run all cells.
      await page.waitForTimeout(8000);
      await frame.locator(".jp-Notebook").first().click();
      await page.keyboard.press("Escape");
      await frame.getByText("Run", { exact: true }).first().click();
      await frame.getByText("Run All Cells", { exact: true }).first().click();
      await page.waitForTimeout(90_000);
      await shot(page, "notebook");
    } catch (error) {
      console.log("  ⚠️  notebook shot failed:", (error as Error).message);
    }
  });

  await test.step("settings, about, home, theme, sidebar", async () => {
    await page.getByTestId("sidebar-settings").click();
    const dialog = page.getByTestId("settings-modal");
    await page.getByTestId("settings-tab-general").click();
    await page.waitForTimeout(400);
    await shot(page, "settings-general", dialog, { pad: 0 });
    await page.getByTestId("settings-tab-storage").click();
    await expect(page.getByTestId("storage-used")).not.toHaveText("…");
    await page.waitForTimeout(1500);
    await shot(page, "settings-storage", dialog, { pad: 0 });
    await page.keyboard.press("Escape");

    await page.getByTestId("sidebar-about").click();
    const about = page.getByTestId("about-modal");
    await page.waitForTimeout(400);
    await shot(page, "about", about, { pad: 0 });
    await page.keyboard.press("Escape");

    await page.getByTestId("nav-home").click();
    await expect(page.getByTestId("continue-card")).toBeVisible();
    await page.waitForTimeout(2000);
    await shot(page, "home-returning");
    await shot(page, "sidebar", page.getByTestId("sidebar"), { pad: 0 });

    await page.getByTestId("theme-light").click();
    await page.waitForTimeout(1500);
    await shot(page, "home-light");
    await page.getByTestId("theme-dark").click();

    await page.getByTestId("sidebar-collapse").click();
    await page.waitForTimeout(800);
    await shot(page, "sidebar-collapsed", page.getByTestId("sidebar"), {
      pad: 0,
    });
    await page.getByTestId("sidebar-collapse").click();
  });
});
