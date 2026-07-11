/**
 * Shared helpers for the Atomify shell e2e suite. All selectors are the
 * data-testids the shell components expose (src/shell/*).
 */

import { expect, type Page } from "@playwright/test";

export const APP_URL = "/atomify/";

/** First engine fetch + wasm compile can take a while headless. */
export const ENGINE_TIMEOUT = 120_000;
/** A small LJ run end-to-end, including snapshot + persistence writes. */
export const RUN_TIMEOUT = 180_000;

/**
 * Small, fast LJ melt (~1–3 s once the engine is warm). `variable T` is a
 * plain-number variable, so it shows up as an overridable parameter in the
 * New Run modal (used by the sweep spec).
 */
export const FAST_LJ_SCRIPT = `variable T equal 1.44
units lj
lattice fcc 0.8442
region box block 0 3 0 3 0 3
create_box 1 box
create_atoms 1 box
mass 1 1.0
velocity all create \${T} 87287
pair_style lj/cut 2.5
pair_coeff 1 1 1.0 1.0 2.5
fix 1 all nve
run 400
`;

/** Load the shell and wait for it to mount. */
export async function gotoApp(page: Page): Promise<void> {
  await page.goto(APP_URL);
  await expect(page.getByTestId("shell-root")).toBeVisible();
}

/**
 * Wait until the LAMMPS engine is ready (the sidebar loading chip is only
 * rendered while it isn't). Browsing/editing works before this; running
 * doesn't.
 */
export async function waitForEngine(page: Page): Promise<void> {
  await expect(page.getByTestId("engine-loading-chip")).toHaveCount(0, {
    timeout: ENGINE_TIMEOUT,
  });
}

/** Create a blank project through the New Project modal. */
export async function createBlankProject(
  page: Page,
  name: string,
  dirName: string,
): Promise<void> {
  await page.getByTestId("sidebar-new-project").click();
  await expect(page.getByTestId("new-project-modal")).toBeVisible();
  await page.getByTestId("project-name-input").fill(name);
  // Folder preview updates live from the name.
  await expect(page.getByTestId("new-project-modal")).toContainText(
    `${dirName}/`,
  );
  await page.getByTestId("create-project").click();
  await expect(page.getByTestId("project-title")).toHaveText(name);
  await expect(page.getByTestId("project-dirname")).toHaveText(`${dirName}/`);
}

/** Create an empty file from the Files tab (must be on the Files tab). */
export async function createFile(page: Page, name: string): Promise<void> {
  await page.getByTestId("new-file-button").click();
  await page.getByTestId("prompt-input").fill(name);
  await page.getByTestId("prompt-confirm").click();
  await expect(page.getByTestId(`file-row-${name}`)).toBeVisible();
}

/** Open a file row in the Monaco editor sub-screen and wait for Monaco. */
export async function openInEditor(page: Page, path: string): Promise<void> {
  await page.getByTestId(`file-row-${path}`).click();
  await expect(page.getByTestId("editor-screen")).toBeVisible();
  await expect(page.getByTestId("editor-filename")).toHaveText(path);
  await expect(page.locator(".monaco-editor").first()).toBeVisible({
    timeout: 60_000,
  });
}

/**
 * Type into the open Monaco editor and wait for the debounced autosave
 * (500 ms) to land, i.e. the indicator settles back on "Saved".
 */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  await page.locator(".monaco-editor").first().click();
  await page.keyboard.insertText(text);
  // Past the debounce window the indicator is either "Saving…" (write in
  // flight) or already "Saved"; waiting closes the race with the default
  // "Saved" state shown before any edit.
  await page.waitForTimeout(700);
  await expect(page.getByTestId("editor-save-state")).toContainText("Saved", {
    timeout: 15_000,
  });
}

/**
 * Create a project containing a single fast LJ input script, typed through
 * the real editor. Leaves the page on the editor screen.
 */
export async function createFastLjProject(
  page: Page,
  name: string,
  dirName: string,
  fileName = "in.melt",
  script = FAST_LJ_SCRIPT,
): Promise<void> {
  await createBlankProject(page, name, dirName);
  await createFile(page, fileName);
  await openInEditor(page, fileName);
  await typeInEditor(page, script);
}

/**
 * Wait for the live run to finish successfully: the run-detail screen the
 * store navigated to shows the Completed pill.
 */
export async function waitRunCompleted(page: Page): Promise<void> {
  await expect(page.getByTestId("run-detail")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("status-pill-completed")).toBeVisible({
    timeout: RUN_TIMEOUT,
  });
}

/**
 * Read a raw contents record from the app's IndexedDB ("JupyterLite
 * Storage" database, "files" object store — the same store JupyterLite's
 * contents manager reads). Keys are `<dirName>/<project-relative-path>`.
 * For .json files the stored `content` is the parsed object.
 */
export async function readContentsRecord(
  page: Page,
  key: string,
): Promise<{ content: unknown; format: string | null } | null> {
  return page.evaluate(async (recordKey) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("JupyterLite Storage");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const record = await new Promise<unknown>((resolve, reject) => {
        const get = db
          .transaction("files", "readonly")
          .objectStore("files")
          .get(recordKey);
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => reject(get.error);
      });
      if (!record) {
        return null;
      }
      const { content, format } = record as {
        content: unknown;
        format: string | null;
      };
      return { content, format };
    } finally {
      db.close();
    }
  }, key);
}
