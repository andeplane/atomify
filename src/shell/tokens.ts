/**
 * Design tokens for the Atomify shell (ADR-003 §6) — the single source of
 * truth for color, radius and font values.
 *
 * - The antd ConfigProvider theme (src/theme.ts) is derived from these.
 * - tokens.css declares the same values as CSS custom properties for the
 *   shell's own CSS and inline styles (`var(--accent)` etc.).
 *   tokens.test.ts fails if the two drift apart.
 *
 * Keys are the camelCase form of the CSS custom property name
 * (`surfaceHover` ↔ `--surface-hover`). A value that has no fitting token
 * gets a new named token here (and in tokens.css) rather than being
 * hard-coded in a component.
 */

import type { ThemeName } from "../store/settings";

export type ShellPalette = {
  bg: string;
  bg2: string;
  surface: string;
  surface2: string;
  surfaceHover: string;
  /** Floating surfaces (popovers, antd elevated components). */
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentLine: string;
  /** Text/icons on solid accent, danger and dark badge fills. */
  onAccent: string;
  /** Hairline divider inside a solid accent button (split buttons). */
  onAccentDivider: string;
  shadow: string;
  /** Modal dialog drop shadow. */
  shadowModal: string;
  /** Backdrop behind modal dialogs. */
  scrim: string;
  /** Toggle switch / range slider knob. */
  knob: string;
  knobShadow: string;
  /** Theme preview swatch outline in Settings (the swatch shows this theme). */
  swatchBorder: string;
  chip: string;
  good: string;
  goodSoft: string;
  bad: string;
  badSoft: string;
  warn: string;
  /** File-type accent for notebooks in the Files tab. */
  notebook: string;
  /**
   * The 3D viewport and the run console stay dark in both themes; content
   * drawn on them uses the `media*` / `console*` tokens below.
   */
  viewport: string;
  /** Soft accent glow behind the "no frame" placeholder. */
  viewportGlow: string;
  consoleBg: string;
  consoleText: string;
  consoleLine: string;
  /** Text tiers on the dark media surfaces (viewport, console, thumbnails). */
  mediaText: string;
  mediaText2: string;
  mediaText3: string;
  mediaText4: string;
  /** Command preview text in the New Run modal (sits on --viewport). */
  mediaTextCode: string;
  /** Progress-bar track on the viewport. */
  mediaTrack: string;
  /** Floating icon buttons on the viewport. */
  mediaControlBg: string;
  mediaControlBorder: string;
  /** Translucent badges over thumbnails/viewport frames. */
  mediaBadge: string;
};

/** Values shared by both themes. Listed once so they cannot drift. */
const shared = {
  onAccent: "#ffffff",
  onAccentDivider: "rgba(255, 255, 255, 0.28)",
  shadowModal: "0 30px 80px rgba(0, 0, 0, 0.4)",
  scrim: "rgba(4, 6, 10, 0.6)",
  knob: "#ffffff",
  knobShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
  notebook: "#e8735a",
  viewportGlow: "rgba(63, 110, 255, 0.1)",
  consoleBg: "#0a0c11",
  consoleText: "rgba(255, 255, 255, 0.82)",
  consoleLine: "rgba(255, 255, 255, 0.06)",
  mediaText: "rgba(255, 255, 255, 0.85)",
  mediaText2: "rgba(255, 255, 255, 0.6)",
  mediaText3: "rgba(255, 255, 255, 0.5)",
  mediaText4: "rgba(255, 255, 255, 0.35)",
  mediaTextCode: "rgba(255, 255, 255, 0.75)",
  mediaTrack: "rgba(255, 255, 255, 0.14)",
  mediaControlBg: "rgba(10, 12, 17, 0.55)",
  mediaControlBorder: "rgba(255, 255, 255, 0.18)",
  mediaBadge: "rgba(8, 10, 14, 0.7)",
} satisfies Partial<ShellPalette>;

export const shellPalettes: Record<ThemeName, ShellPalette> = {
  dark: {
    ...shared,
    bg: "#0b0d12",
    bg2: "#0e1116",
    surface: "#14171e",
    surface2: "#1a1e27",
    surfaceHover: "#20252f",
    surfaceElevated: "#1a1e27",
    border: "rgba(255, 255, 255, 0.07)",
    borderStrong: "rgba(255, 255, 255, 0.13)",
    text: "#eaecef",
    text2: "#9aa1ae",
    text3: "#656c79",
    accent: "#3f6eff",
    accentHover: "#5c86ff",
    accentSoft: "rgba(63, 110, 255, 0.15)",
    accentLine: "rgba(63, 110, 255, 0.35)",
    shadow: "0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.28)",
    swatchBorder: "rgba(255, 255, 255, 0.1)",
    viewport: "#05070b",
    chip: "rgba(255, 255, 255, 0.06)",
    good: "#2fd07a",
    goodSoft: "rgba(47, 208, 122, 0.14)",
    bad: "#e5484d",
    badSoft: "rgba(229, 72, 77, 0.13)",
    warn: "#ffb020",
  },
  light: {
    ...shared,
    bg: "#f3f5f9",
    bg2: "#eaedf3",
    surface: "#ffffff",
    surface2: "#f7f9fc",
    surfaceHover: "#eef1f7",
    surfaceElevated: "#ffffff",
    border: "rgba(17, 20, 28, 0.09)",
    borderStrong: "rgba(17, 20, 28, 0.16)",
    text: "#10131a",
    text2: "#545c6b",
    text3: "#8a92a1",
    accent: "#2e5bff",
    accentHover: "#1e48ea",
    accentSoft: "rgba(46, 91, 255, 0.1)",
    accentLine: "rgba(46, 91, 255, 0.3)",
    shadow:
      "0 1px 2px rgba(16, 20, 30, 0.06), 0 10px 30px rgba(16, 20, 30, 0.1)",
    swatchBorder: "rgba(0, 0, 0, 0.08)",
    viewport: "#0a0c11",
    chip: "rgba(16, 20, 30, 0.05)",
    good: "#17a45c",
    goodSoft: "rgba(23, 164, 92, 0.12)",
    bad: "#d93036",
    badSoft: "rgba(217, 48, 54, 0.1)",
    warn: "#c67c00",
  },
};

/** Theme-independent tokens (declared once on :root in tokens.css). */
export const shellBase = {
  fontSans:
    "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  /** Default control/card radius; also antd's `borderRadius`. */
  radius: "10px",
  radiusPill: "999px",
};

/** camelCase token key → CSS custom property name (`bg2` → `--bg-2`). */
export const cssVarName = (key: string): string =>
  `--${key.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase()}`;
