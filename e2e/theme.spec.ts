/**
 * Theme toggle: switching to light sets [data-theme=light] on the document
 * root, the token-driven shell background follows, and the choice persists
 * across a reload (localStorage).
 */

import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

// tokens.css: --bg is #0b0d12 (dark) and #f3f5f9 (light).
const DARK_BG = "rgb(11, 13, 18)";
const LIGHT_BG = "rgb(243, 245, 249)";

test("light theme toggles the tokens and persists across reload", async ({
  page,
}) => {
  await test.step("the app starts in the dark theme", async () => {
    await gotoApp(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByTestId("shell-root")).toHaveCSS(
      "background-color",
      DARK_BG,
    );
  });

  await test.step("toggling light updates data-theme and the background", async () => {
    await page.getByTestId("theme-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByTestId("shell-root")).toHaveCSS(
      "background-color",
      LIGHT_BG,
    );
  });

  await test.step("the choice persists across a reload", async () => {
    await page.reload();
    await expect(page.getByTestId("shell-root")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByTestId("shell-root")).toHaveCSS(
      "background-color",
      LIGHT_BG,
    );
  });
});
