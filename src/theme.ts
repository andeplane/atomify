import { theme } from "antd";
import type { ThemeConfig } from "antd";
import type { ThemeName } from "./store/settings";

/**
 * antd bridge for the new shell (ADR-003 §6): antd remains for commodity
 * inner components (Upload dragger, notifications, tooltips) and is themed
 * from the same values as the CSS custom-property tokens in
 * src/shell/tokens.css. Keep the two in sync when changing tokens.
 */
export const shellThemeConfig = (mode: ThemeName): ThemeConfig =>
  mode === "dark"
    ? {
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#3F6EFF",
          borderRadius: 10,
          colorBgBase: "#0B0D12",
          colorBgContainer: "#14171E",
          colorBgElevated: "#1A1E27",
          colorText: "#EAECEF",
          colorTextSecondary: "#9AA1AE",
          colorBorder: "rgba(255,255,255,0.13)",
          colorSplit: "rgba(255,255,255,0.07)",
          fontFamily:
            "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      }
    : {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#2E5BFF",
          borderRadius: 10,
          colorBgBase: "#F3F5F9",
          colorBgContainer: "#FFFFFF",
          colorBgElevated: "#FFFFFF",
          colorText: "#10131A",
          colorTextSecondary: "#545C6B",
          colorBorder: "rgba(17,20,28,0.16)",
          colorSplit: "rgba(17,20,28,0.09)",
          fontFamily:
            "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      };

/** Legacy config for the embedded-mode shell (unchanged). */
export const darkThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 8,
    colorBgBase: "#29282d",
    colorBgContainer: "#2a292f",
    fontSizeHeading1: 48,
    fontSizeHeading2: 36,
  },
  components: {
    Menu: {
      colorBgContainer: "transparent",
      itemBorderRadius: 8,
      itemMarginInline: 8,
      itemActiveBorderWidth: 0,
      itemSelectedBorderWidth: 0,
      subMenuItemBorderRadius: 8,
    },
    Layout: {
      siderBg: "transparent",
      triggerBg: "#1f1f1f",
    },
    Select: {
      selectorBg: "#2a292f",
      optionSelectedBg: "#2a2a2a",
      colorText: "#ffffff",
      colorTextPlaceholder: "#888",
      colorBorder: "#3a3a3a",
    },
  },
};
