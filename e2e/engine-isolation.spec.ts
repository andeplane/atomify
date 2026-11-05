import { test, expect } from "@playwright/test";
import { gotoApp, waitForEngine, waitRunCompleted } from "./helpers";

test("supported browsers isolate a fresh visit and run the engine", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "webkit", "Safari cannot be cross-origin isolated");
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

test("without isolation the serial engine loads and runs", async ({
  browser,
  browserName,
}) => {
  // Blocking service workers keeps the page from being cross-origin
  // isolated, the situation Safari is always in (no COEP credentialless).
  test.skip(browserName === "webkit", "covered by the Safari test below");
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  const engineRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("lammps-atomify"))
      engineRequests.push(request.url());
  });
  await page.goto("http://localhost:5200/atomify/");
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(false);
  await waitForEngine(page);
  await expect(page.getByTestId("engine-error-chip")).toHaveCount(0);
  await page.getByTestId("nav-examples").click();
  await page.getByTestId("library-quick-2D-lj-fluid").click();
  await waitRunCompleted(page);
  expect(
    engineRequests.some((url) => url.includes("lammps-atomify-serial")),
  ).toBe(true);
  await context.close();
});

test("Safari runs simulations on the serial engine", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "webkit", "Safari-specific behavior");
  await gotoApp(page);
  await waitForEngine(page);
  await expect(page.getByTestId("engine-error-chip")).toHaveCount(0);
  await page.getByTestId("nav-examples").click();
  await expect(page.getByTestId("library-example-2D-lj-fluid")).toBeVisible();
  await page.getByTestId("library-quick-2D-lj-fluid").click();
  await waitRunCompleted(page);
});
