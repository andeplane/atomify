/**
 * Editor flows: Monaco autosave with the Saved indicator, persistence
 * across reload, the set-as-input-script chip, and the input-script chooser
 * the Run button opens when two scripts exist and none is designated.
 */

import { test, expect } from "@playwright/test";
import {
  createBlankProject,
  createFile,
  FAST_LJ_SCRIPT,
  gotoApp,
  openInEditor,
  typeInEditor,
  waitForEngine,
} from "./helpers";

test("autosave, persistence across reload, input-script chip", async ({
  page,
}) => {
  await test.step("create a project with a new script file", async () => {
    await gotoApp(page);
    await createBlankProject(page, "Editor study", "editor-study");
    await createFile(page, "in.melt");
  });

  await test.step("type LAMMPS content in Monaco, autosave says Saved", async () => {
    await openInEditor(page, "in.melt");
    await typeInEditor(page, FAST_LJ_SCRIPT);
  });

  await test.step("content persists across a reload", async () => {
    // The deep link (?project=…&file=…) restores the editor directly.
    await page.reload();
    await expect(page.getByTestId("editor-screen")).toBeVisible();
    await expect(page.getByTestId("editor-filename")).toHaveText("in.melt");
    await expect(page.locator(".view-lines").first()).toContainText(
      "lattice fcc 0.8442",
      { timeout: 60_000 },
    );
  });

  await test.step("set as input script from the Files tab", async () => {
    await page.getByTestId("editor-back").click();
    await expect(page.getByTestId("files-tab")).toBeVisible();
    const row = page.getByTestId("file-row-in.melt");
    await expect(row).not.toContainText("Input script");
    await page.getByTestId("set-input-in.melt").click();
    await expect(row).toContainText("Input script");
    // The chip replaces the set-as-input action for that row.
    await expect(page.getByTestId("set-input-in.melt")).toHaveCount(0);
  });
});

test("Run opens the input-script chooser when two scripts exist", async ({
  page,
}) => {
  await test.step("create a project with two scripts and no input script", async () => {
    await gotoApp(page);
    await createBlankProject(page, "Chooser study", "chooser-study");
    await createFile(page, "in.first");
    await createFile(page, "in.second");
    await expect(page.getByTestId("file-row-in.first")).not.toContainText(
      "Input script",
    );
    await expect(page.getByTestId("file-row-in.second")).not.toContainText(
      "Input script",
    );
  });

  await test.step("Run simulation opens the chooser", async () => {
    await waitForEngine(page); // the Run button is disabled until then
    await page.getByTestId("run-simulation").click();
    await expect(page.getByTestId("new-run-modal")).toBeVisible();
    await expect(page.getByTestId("script-choice-in.first")).toBeVisible();
    await expect(page.getByTestId("script-choice-in.second")).toBeVisible();
  });

  await test.step("choosing a script designates it as the input script", async () => {
    await page.getByTestId("script-choice-in.second").click();
    // The modal moves on to the run-parameters view with the chosen script.
    await expect(page.getByTestId("run-input-script")).toHaveText("in.second");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("new-run-modal")).toHaveCount(0);
    await expect(page.getByTestId("file-row-in.second")).toContainText(
      "Input script",
    );
  });

  await test.step("the choice persists across a reload", async () => {
    await page.reload();
    await expect(page.getByTestId("files-tab")).toBeVisible();
    await expect(page.getByTestId("file-row-in.second")).toContainText(
      "Input script",
    );
    await expect(page.getByTestId("file-row-in.first")).not.toContainText(
      "Input script",
    );
  });
});
