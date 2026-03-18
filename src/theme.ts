import { theme } from "antd";

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
