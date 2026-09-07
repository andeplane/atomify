import { test, expect } from "@playwright/test";
import { gotoApp, waitForEngine, waitRunCompleted } from "./helpers";

test("supported browsers isolate a fresh visit and run the engine", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "webkit", "Safari is explicitly unsupported");
  await gotoApp(page);
  await expect
    .poll(() => page.evaluate(() => window.crossOriginIsolated))
    .toBe(true);
  await waitForEngine(page);
  await page.getByTestId("nav-examples").click();
  const card = page.getByTestId("library-example-2D-lj-fluid");
  await expect(card).toBeVisible();
  await page.getByTestId("library-quick-2D-lj-fluid").click();
  await waitRunCompleted(page);
  await page.reload();
  await expect(page.getByTestId("shell-root")).toBeVisible();
  await waitForEngine(page);
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
});

test("unavailable isolation shows an error instead of an endless loading chip", async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Safari has a dedicated unsupported message",
  );
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto("http://localhost:5200/atomify/");
  await expect(page.getByTestId("engine-error-chip")).toContainText(
    "requires cross-origin isolation",
  );
  await expect(page.getByTestId("engine-loading-chip")).toHaveCount(0);
  await context.close();
});

test("Safari shows an unsupported message without downloading the engine", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "webkit", "Safari-specific behavior");
  const engineRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("lammps-atomify"))
      engineRequests.push(request.url());
  });
  await gotoApp(page);
  await expect(page.getByTestId("engine-error-chip")).toContainText(
    "Safari is not supported",
  );
  await expect(page.getByTestId("engine-error-chip")).toContainText(
    "Chrome or Firefox on a desktop computer",
  );
  await expect(page.getByTestId("engine-loading-chip")).toHaveCount(0);
  await page.getByTestId("nav-examples").click();
  await expect(page.getByTestId("library-example-2D-lj-fluid")).toBeVisible();
  await expect(page.getByTestId("library-quick-2D-lj-fluid")).toBeDisabled();
  expect(engineRequests).toEqual([]);
});
