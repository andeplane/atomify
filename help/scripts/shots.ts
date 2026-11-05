/**
 * Helpers for the Help-site screenshot script (screenshots.spec.ts).
 */

import { expect, type Locator, type Page } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "../..");
export const OUT_DIR = resolve(HERE, "../public/screenshots");
const SNIPPETS = resolve(HERE, "../snippets");

/** A file from help/snippets (the same files the tutorials include). */
export const snippet = (name: string): string =>
  readFileSync(resolve(SNIPPETS, name), "utf8");

const MIME: Record<string, string> = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".json": "application/json",
};

/**
 * Serve Monaco (which @monaco-editor/react loads from cdn.jsdelivr.net) from
 * node_modules: works offline and pins the exact installed version.
 */
export async function routeMonaco(page: Page): Promise<void> {
  await page.route("https://cdn.jsdelivr.net/npm/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      /^\/npm\/monaco-editor@[^/]+\//,
      "",
    );
    try {
      const body = await readFile(
        resolve(ROOT, "node_modules/monaco-editor", path),
      );
      await route.fulfill({
        body,
        headers: {
          "content-type": MIME[extname(path)] ?? "application/octet-stream",
          "access-control-allow-origin": "*",
          "cross-origin-resource-policy": "cross-origin",
        },
      });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });
}

/** An IANA zone where the local hour is `hour` now (stable Home greeting). */
export function zoneWhereLocalHourIs(hour: number): string {
  let offset = (hour - new Date().getUTCHours() + 24) % 24;
  if (offset > 12) offset -= 24;
  if (offset === 0) return "Etc/UTC";
  // Etc/GMT zones have inverted signs: Etc/GMT-3 is UTC+3.
  return `Etc/GMT${offset > 0 ? "-" : "+"}${Math.abs(offset)}`;
}

/** Re-encode a PNG as WebP in the browser (smaller files, same pixels). */
async function toWebp(page: Page, png: Buffer): Promise<Buffer> {
  const dataUrl = await page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    const webp = await canvas.convertToBlob({
      type: "image/webp",
      quality: 0.9,
    });
    const bytes = new Uint8Array(await webp.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }, png.toString("base64"));
  return Buffer.from(dataUrl, "base64");
}

type Target = Page | Locator | Locator[];

interface ShotOptions {
  /** Padding around element crops, in CSS pixels. */
  pad?: number;
  /** Clip the crop to at most this height (CSS pixels). */
  maxHeight?: number;
  /** Padding above the top element (defaults to `pad`). */
  padTop?: number;
}

/**
 * Save help/public/screenshots/<name>.webp: the viewport, one element, or
 * the union of several elements' boxes (plus padding).
 */
export async function shot(
  page: Page,
  name: string,
  target: Target = page,
  { pad = 16, maxHeight, padTop = pad }: ShotOptions = {},
): Promise<void> {
  await page.waitForTimeout(300);
  let png: Buffer;
  if (target === page) {
    png = await page.screenshot({ animations: "disabled", caret: "hide" });
  } else {
    const locators = Array.isArray(target) ? target : [target as Locator];
    const boxes = [];
    for (const locator of locators) {
      await expect(locator).toBeVisible();
      const box = await locator.boundingBox();
      if (box) boxes.push(box);
    }
    const viewport = page.viewportSize()!;
    const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
    const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - padTop);
    const right = Math.min(
      viewport.width,
      Math.max(...boxes.map((b) => b.x + b.width)) + pad,
    );
    let bottom = Math.min(
      viewport.height,
      Math.max(...boxes.map((b) => b.y + b.height)) + pad,
    );
    if (maxHeight) bottom = Math.min(bottom, y + maxHeight);
    png = await page.screenshot({
      animations: "disabled",
      caret: "hide",
      clip: { x, y, width: right - x, height: bottom - y },
    });
  }
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, `${name}.webp`), await toWebp(page, png));
  console.log(`  📸 ${name}`);
}

/** Run a dev-server store action/query (same trick as the e2e suite). */
export async function withStore<T>(
  page: Page,
  fn: string,
  arg?: unknown,
): Promise<T> {
  return page.evaluate(
    async ({ fn, arg }) => {
      const path = "/atomify/src/store/index.ts";
      const mod = await import(/* @vite-ignore */ path);
      return new Function("store", "engine", "arg", `return (${fn})`)(
        mod.default,
        mod.engine,
        arg,
      );
    },
    { fn, arg },
  ) as Promise<T>;
}

/** Pause or resume the live simulation. */
export async function setPaused(page: Page, paused: boolean): Promise<void> {
  await withStore(page, "store.getActions().simulation.setPaused(arg)", paused);
}

/** Current step from the viewport overlay ("step 1,234 of 5,000"). */
export async function currentStep(page: Page): Promise<number> {
  const text = (await page.getByTestId("run-viewport").textContent()) ?? "";
  const match = /step ([\d,]+) of/.exec(text);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

export async function waitForStep(
  page: Page,
  step: number,
  timeout = 600_000,
): Promise<void> {
  await expect
    .poll(() => currentStep(page), { timeout, intervals: [500] })
    .toBeGreaterThanOrEqual(step);
}

/**
 * Pause the live run as soon as it reaches `step`. Checks on every store update, so fast runs don't overshoot the way Node-side polling does.
 */
export async function pauseAtStep(
  page: Page,
  step: number,
  timeout = 600_000,
): Promise<void> {
  await page.evaluate(
    async ({ step, timeout }) => {
      const path = "/atomify/src/store/index.ts";
      const { default: store } = await import(/* @vite-ignore */ path);
      const deadline = Date.now() + timeout;
      await new Promise<void>((resolve, reject) => {
        let seen = 0;
        let finished = false;
        const finish = (error?: Error) => {
          finished = true;
          unsubscribe();
          clearInterval(timer);
          if (error) reject(error);
          else resolve();
        };
        const check = () => {
          if (finished) return;
          const now = store.getState().simulationStatus.runTimesteps ?? 0;
          seen = Math.max(seen, now);
          if (now >= step) {
            // Unsubscribe first: pausing dispatches, which calls us again.
            finish();
            store.getActions().simulation.setPaused(true);
          } else if (Date.now() > deadline) {
            finish(new Error(`run never reached step ${step} (max ${seen})`));
          }
        };
        // Check on every store update, so fast runs can't skip past `step`.
        const unsubscribe = store.subscribe(check);
        const timer = setInterval(check, 100);
        check();
      });
    },
    { step, timeout },
  );
}

/** Let the frame and ambient occlusion settle after a pause or change. */
export const settle = (page: Page, ms = 1500) => page.waitForTimeout(ms);

/** Hide notifications (toasts) so they don't cover screenshots. */
export async function hideToasts(page: Page, hide = true): Promise<void> {
  await page.evaluate((hide) => {
    const id = "help-shots-hide-toasts";
    document.getElementById(id)?.remove();
    if (!hide) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = ".ant-notification{display:none!important}";
    document.head.appendChild(style);
  }, hide);
}

/** Put a text file into the open project through the Files tab's uploader. */
export async function upload(
  page: Page,
  name: string,
  content: string,
): Promise<void> {
  await page.getByTestId("tab-files").click();
  await page.getByTestId("upload-input").setInputFiles({
    name,
    mimeType: "text/plain",
    buffer: Buffer.from(content),
  });
  await expect(page.getByTestId(`file-row-${name}`)).toBeVisible();
}

/** Click on the 3D view without selecting anything (gives it key focus). */
export async function focusViewport(page: Page): Promise<void> {
  await page.getByTestId("run-viewport").locator("canvas").first().focus();
}
