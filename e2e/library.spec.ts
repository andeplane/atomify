/**
 * Project library lifecycle: create through the New Project modal, persist
 * across reload (IndexedDB), rename (displayName only — dirName immutable),
 * duplicate, and delete with the confirm summary.
 */

import { test, expect } from "@playwright/test";
import { createBlankProject, gotoApp } from "./helpers";

test("create, persist, rename, duplicate and delete a project", async ({
  page,
}) => {
  const sidebarProjects = page.locator('[data-testid^="sidebar-project-"]');

  await test.step("create a blank project via the modal", async () => {
    await gotoApp(page);
    await createBlankProject(page, "Melt study", "melt-study");
  });

  await test.step("project appears in the sidebar and Files tab", async () => {
    await expect(page.getByTestId("sidebar-project-melt-study")).toBeVisible();
    await expect(page.getByTestId("sidebar-project-melt-study")).toContainText(
      "Melt study",
    );
    await expect(page.getByTestId("files-tab")).toBeVisible();
    // Blank projects start with the notebook template and the runs/ folder.
    await expect(page.getByTestId("file-row-analysis.ipynb")).toBeVisible();
    await expect(page.getByTestId("file-row-runs")).toBeVisible();
  });

  await test.step("project survives a reload (IndexedDB persistence)", async () => {
    await page.reload();
    await expect(page.getByTestId("shell-root")).toBeVisible();
    await expect(page.getByTestId("sidebar-project-melt-study")).toBeVisible();
    // Deep link restored the project workspace too.
    await expect(page.getByTestId("project-title")).toHaveText("Melt study");
  });

  await test.step("rename changes displayName but not the folder", async () => {
    await page.getByTestId("project-menu-toggle").click();
    await page.getByTestId("project-menu-rename").click();
    await page.getByTestId("prompt-input").fill("Melt study v2");
    await page.getByTestId("prompt-confirm").click();
    await expect(page.getByTestId("project-title")).toHaveText("Melt study v2");
    await expect(page.getByTestId("project-dirname")).toHaveText("melt-study/");
    await expect(page.getByTestId("sidebar-project-melt-study")).toContainText(
      "Melt study v2",
    );
  });

  await test.step("duplicate copies the project", async () => {
    await page.getByTestId("project-menu-toggle").click();
    await page.getByTestId("project-menu-duplicate").click();
    await expect(sidebarProjects).toHaveCount(2);
    // The copy becomes the active project.
    await expect(page.getByTestId("project-title")).toHaveText(
      "Melt study v2 (copy)",
    );
    await expect(page.getByTestId("project-dirname")).not.toHaveText(
      "melt-study/",
    );
  });

  await test.step("delete via the confirm modal", async () => {
    await page.getByTestId("project-menu-toggle").click();
    await page.getByTestId("project-menu-delete").click();
    await expect(page.getByTestId("delete-project-modal")).toBeVisible();
    await expect(page.getByTestId("delete-summary")).toContainText(
      "This cannot be undone.",
    );
    await page.getByTestId("delete-project-confirm").click();
    await expect(sidebarProjects).toHaveCount(1);
  });

  await test.step("deletion persists across reload", async () => {
    await page.goto("/atomify/"); // leave the deleted project's deep link
    await expect(page.getByTestId("shell-root")).toBeVisible();
    await expect(page.getByTestId("sidebar-project-melt-study")).toBeVisible();
    await expect(sidebarProjects).toHaveCount(1);
  });
});
