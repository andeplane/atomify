import { theme } from "antd";
import type { ThemeConfig } from "antd";
import type { ThemeName } from "./store/settings";
import { shellBase, shellPalettes } from "./shell/tokens";

/**
 * antd bridge for the new shell (ADR-003 §6): antd remains for commodity
 * inner components (Upload dragger, notifications, tooltips) and is themed
 * from the shell design tokens in src/shell/tokens.ts — the same values
 * src/shell/tokens.css exposes as CSS custom properties.
 */
export const shellThemeConfig = (mode: ThemeName): ThemeConfig => {
  const palette = shellPalettes[mode];
  return {
    algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: palette.accent,
      borderRadius: parseInt(shellBase.radius, 10),
      colorBgBase: palette.bg,
      colorBgContainer: palette.surface,
      colorBgElevated: palette.surfaceElevated,
      colorText: palette.text,
      colorTextSecondary: palette.text2,
      colorBorder: palette.borderStrong,
      colorSplit: palette.border,
      fontFamily: shellBase.fontSans,
    },
  };
};
