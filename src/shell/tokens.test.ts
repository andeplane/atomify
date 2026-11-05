/**
 * tokens.ts owns the shell's design-token values; tokens.css mirrors them as
 * CSS custom properties (ADR-003 §6). These tests keep the two — and the
 * antd theme derived from tokens.ts — in lockstep.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cssVarName, shellBase, shellPalettes } from "./tokens";
import { shellThemeConfig } from "../theme";

// Read from disk: vitest stubs CSS imports (even `?raw`) to empty strings.
const css = readFileSync(resolve(__dirname, "tokens.css"), "utf8");

/** Custom properties declared in the first rule whose selector is `selector`. */
const declaredVars = (selector: string): Record<string, string> => {
  const start = css.indexOf(`${selector} {`);
  expect(start, `rule ${selector} not found in tokens.css`).toBeGreaterThan(-1);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[match[1]] = normalize(match[2]);
  }
  return vars;
};

// Formatting differences (whitespace, quote style, hex case) are not drift.
const normalize = (value: string) =>
  value.replace(/\s+/g, "").replace(/'/g, '"').toLowerCase();

const expectedVars = (tokens: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [
      cssVarName(key),
      normalize(value),
    ]),
  );

describe("shell design tokens", () => {
  it("maps camelCase keys to the CSS custom property names", () => {
    expect(cssVarName("bg2")).toBe("--bg-2");
    expect(cssVarName("surfaceHover")).toBe("--surface-hover");
    expect(cssVarName("mediaText2")).toBe("--media-text-2");
  });

  it("declares the dark palette (the default) on :root / [data-theme=dark]", () => {
    expect(declaredVars(':root,\n[data-theme="dark"]')).toEqual(
      expectedVars(shellPalettes.dark),
    );
  });

  it("declares the light palette on [data-theme=light]", () => {
    expect(declaredVars('[data-theme="light"]')).toEqual(
      expectedVars(shellPalettes.light),
    );
  });

  it("declares the theme-independent tokens once on :root", () => {
    expect(declaredVars(":root")).toEqual(expectedVars(shellBase));
  });

  it("themes antd from the same values", () => {
    for (const mode of ["dark", "light"] as const) {
      const token = shellThemeConfig(mode).token!;
      const palette = shellPalettes[mode];
      expect(token.colorPrimary).toBe(palette.accent);
      expect(token.colorBgBase).toBe(palette.bg);
      expect(token.colorBgContainer).toBe(palette.surface);
      expect(token.colorBgElevated).toBe(palette.surfaceElevated);
      expect(token.colorText).toBe(palette.text);
      expect(token.colorTextSecondary).toBe(palette.text2);
      expect(token.colorBorder).toBe(palette.borderStrong);
      expect(token.colorSplit).toBe(palette.border);
      expect(`${token.borderRadius}px`).toBe(shellBase.radius);
      expect(token.fontFamily).toBe(shellBase.fontSans);
    }
  });
});
