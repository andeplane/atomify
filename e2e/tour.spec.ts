/**
 * Onboarding tour: replayed from the sidebar, it spotlights the next thing
 * to click and follows the user's real clicks (the dialog step shows as a
 * tour bar; canceling the dialog steps back). Auto-start is disabled under
 * webdriver, so this drives it through "Take the tour".
 */

import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test("the tour guides from an example to the project's input script", async ({
  page,
}) => {
  await gotoApp(page);
  const title = page.locator(".driver-popover-title");

  await page.getByTestId("sidebar-tour").click();
  await expect(title).toHaveText("Welcome to Atomify");
  await page.locator(".driver-popover-next-btn").click();
  // Content loading in above the examples (recent projects, a continue
  // card) shifts the target mid-animation; the popover must follow it.
  await page.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.style.height = "260px";
    document
      .querySelector('[data-testid="home-screen"]')
      ?.firstElementChild?.prepend(spacer);
  });

  await expect(title).toHaveText("Start from an example");
  const useExample = page
    .getByTestId("home-screen")
    .locator('[data-testid^="use-example-"]')
    .first();
  await expect
    .poll(async () => {
      const button = await useExample.boundingBox();
      const popover = await page.locator(".driver-popover").boundingBox();
      if (!button || !popover) {
        return false;
      }
      // The popover sits right next to the button (its arrow touches it).
      const dx = Math.max(
        0,
        button.x - (popover.x + popover.width),
        popover.x - (button.x + button.width),
      );
      const dy = Math.max(
        0,
        button.y - (popover.y + popover.height),
        popover.y - (button.y + button.height),
      );
      return Math.hypot(dx, dy) < 40;
    })
    .toBe(true);
  await useExample.click();
  await expect(page.getByTestId("tour-bar")).toContainText("Name your project");

  // Canceling the dialog goes back to the example step.
  await page.getByRole("dialog").getByLabel("Close").click();
  await expect(title).toHaveText("Start from an example");
  await useExample.click();
  await page.getByTestId("create-project").click();

  await expect(title).toHaveText("Your project's files");
  await expect(page.locator(".driver-active-element")).toHaveAttribute(
    "data-testid",
    /^file-row-.*\.in$/,
  );

  await page.locator(".driver-popover-close-btn").click();
  await expect(page.locator(".driver-popover")).toHaveCount(0);
  await expect(page.getByTestId("tour-bar")).toHaveCount(0);
});
