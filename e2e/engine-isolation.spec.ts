import { test, expect } from "@playwright/test";
import { gotoApp, waitForEngine, waitRunCompleted } from "./helpers";

test("static hosting isolates a fresh visit, loads images and runs the engine", async ({
  page,
}) => {
  await gotoApp(page);
  await expect
    .poll(() => page.evaluate(() => window.crossOriginIsolated))
    .toBe(true);
  await waitForEngine(page);
  await page.getByTestId("nav-examples").click();
  const card = page.getByTestId("library-example-2D-lj-fluid");
  await expect(card).toBeVisible();
  // Use a second origin with CORS but no CORP to exercise external thumbnails.
  const img = card.locator("img");
  await img.evaluate((element: HTMLImageElement) => {
    element.src = element.src.replace("localhost", "127.0.0.1");
  });
  await expect
    .poll(() =>
      img.evaluate(
        (element: HTMLImageElement) =>
          element.complete && element.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page.getByTestId("library-quick-2D-lj-fluid").click();
  await waitRunCompleted(page);
  // Simulate a client still controlled by the previous credentialless policy.
  await page.evaluate(async () => {
    navigator.serviceWorker.controller!.postMessage({
      type: "coepCredentialless",
      value: true,
    });
    // Wait until the controller has applied the message before navigating.
    for (let attempt = 0; attempt < 20; attempt++) {
      const response = await fetch(location.href);
      if (
        response.headers.get("Cross-Origin-Embedder-Policy") ===
        "credentialless"
      )
        return;
    }
    throw new Error("Could not seed the old service-worker policy");
  });
  await page.reload();
  await expect(page.getByTestId("shell-root")).toBeVisible();
  await waitForEngine(page);
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
});

test("unavailable isolation shows an error instead of an endless loading chip", async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto("http://localhost:5200/atomify/");
  await expect(page.getByTestId("engine-error-chip")).toContainText(
    "requires cross-origin isolation",
  );
  await expect(page.getByTestId("engine-loading-chip")).toHaveCount(0);
  await context.close();
});
