import {
  AlignLeftOutlined,
  BorderOuterOutlined,
  BorderOutlined,
  CaretRightOutlined,
  CloudOutlined,
  EditOutlined,
  FileOutlined,
  InsertRowAboveOutlined,
  LineChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PauseOutlined,
  PlaySquareOutlined,
  PlusSquareOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Badge, ConfigProvider, Layout, Menu, theme } from "antd";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useMeasure } from "react-use";
import AutoStartSimulation from "./components/AutoStartSimulation";
import Simulation from "./components/Simulation";
import Main from "./containers/Main";
import NewSimulation from "./containers/NewSimulation";
import Settings from "./containers/Settings";
import ShareSimulation from "./containers/ShareSimulation";
import { useStoreActions, useStoreState } from "./hooks";
import { useEmbeddedMode } from "./hooks/useEmbeddedMode";
import { track } from "./utils/metrics";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const darkThemeConfig = {
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

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  onClick?: () => void,
  disabled?: boolean
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    onClick,
    disabled,
  } as MenuItem;
}

const App: React.FC = () => {
  const [myRef, { width }] = useMeasure<HTMLDivElement>();
  const [collapsed, setCollapsed] = useState(false);
  const [showNewSimulation, setShowNewSimulation] = useState(false);
  const [showShareSimulation, setShowShareSimulation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const running = useStoreState((state) => state.simulation.running);
  const simulation = useStoreState((state) => state.simulation.simulation);
  const selectedFile = useStoreState((state) => state.app.selectedFile);
  const setSelectedFile = useStoreActions((actions) => actions.app.setSelectedFile);
  const setSelectedMenu = useStoreActions((actions) => actions.app.setSelectedMenu);
  const preferredView = useStoreState((state) => state.app.preferredView);
  const setPreferredView = useStoreActions((actions) => actions.app.setPreferredView);
  const paused = useStoreState((state) => state.simulation.paused);
  const setPaused = useStoreActions((actions) => actions.simulation.setPaused);
  const selectedMenu = useStoreState((state) => state.app.selectedMenu);

  const run = useStoreActions((actions) => actions.simulation.run);

  const { isEmbeddedMode } = useEmbeddedMode();

  useEffect(() => {
    if (width < 1000) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [width]);
  const editMenuLabel = "Edit " + (simulation ? simulation?.id : "");
  const runStopButtonTitle = running ? "Stop" : "Run";

  const runStopButton = getItem(
    runStopButtonTitle,
    "run",
    running ? <BorderOutlined /> : <PlaySquareOutlined />,
    undefined,
    () => {
      if (running) {
        // Need to unpause to reach cancel. TODO: improve this state
        setPaused(false);
        window.cancel = true;
      } else {
        run();
        setPreferredView("view");
      }
    },
    simulation == null
  );

  const pauseButtonTitle = paused ? "Continue" : "Pause";
  const pauseButton = getItem(
    pauseButtonTitle,
    "pause",
    paused ? <CaretRightOutlined /> : <PauseOutlined />,
    undefined,
    () => {
      setPaused(!paused);
      setPreferredView(selectedMenu); // This is another hack. Should really rethink menu system.
    },
    running === false
  );

  const newSimulationButton = getItem(
    "New simulation",
    "newsimulation",
    <PlusSquareOutlined />,
    undefined,
    () => {
      setShowNewSimulation(true);
      setPreferredView(selectedMenu); // This is another hack. Should really rethink menu system.
    },
    running
  );

  const shareSimulationButton = getItem(
    <span>
      Share simulation <Badge count="NEW" style={{ backgroundColor: "#52c41a", marginLeft: 8 }} />
    </span>,
    "share",
    <ShareAltOutlined />,
    undefined,
    () => {
      setShowShareSimulation(true);
      setPreferredView(selectedMenu); // This is another hack. Should really rethink menu system.
    },
    simulation == null || running
  );

  const settingsButton = getItem("Settings", "settings", <SettingOutlined />, undefined, () => {
    track("Settings.Open");
    setShowSettings(true);
    setPreferredView(selectedMenu); // This is another hack. Should really rethink menu system.
  });

  const items: MenuItem[] = [
    getItem("View", "view", <AlignLeftOutlined />),
    getItem("Console", "console", <BorderOuterOutlined />),
    getItem("Notebook", "notebook", <LineChartOutlined />),
    getItem(
      editMenuLabel,
      "edit",
      <EditOutlined />,
      simulation
        ? simulation.files.map((file) => {
            return getItem(file.fileName, "file" + file.fileName, <FileOutlined />);
          })
        : [],
      undefined,
      selectedFile == null
    ),
    { type: "divider" },
    newSimulationButton,
    getItem("Examples", "examples", <InsertRowAboveOutlined />),
    shareSimulationButton,
    { type: "divider" },
    runStopButton,
    getItem(
      "Run in cloud",
      "runincloud",
      <CloudOutlined />,
      undefined,
      undefined,
      simulation == null
    ),
    pauseButton,
    { type: "divider" },
    settingsButton,
  ];

  useEffect(() => {
    if (preferredView === "newsimulation") {
      return;
    }

    if (preferredView) {
      setSelectedMenu(preferredView);
      setPreferredView(undefined);
    }
  }, [preferredView, setPreferredView, setSelectedMenu]);

  useEffect(() => {
    if (selectedFile) {
      setSelectedMenu("file" + selectedFile.fileName);
    }
  }, [selectedFile, setSelectedMenu]);

  const onMenuSelect = useCallback(
    (selected: string) => {
      track("MenuClick", {
        selected,
        simulationId: simulation?.id,
        running,
        paused,
      });

      if (
        selected === "run" ||
        selected === "settings" ||
        selected === "newsimulation" ||
        selected === "share"
      ) {
        return;
      }

      setSelectedMenu(selected);
      if (selected.startsWith("file")) {
        // Oh god this is ugly
        const fileName = selected.substring(4);
        const files = simulation?.files;
        const selectedFile = files?.filter((file) => file.fileName === fileName)[0];

        if (selectedFile) {
          setSelectedFile(selectedFile);
        }
      }
    },
    [simulation, setSelectedFile, running, paused, setSelectedMenu]
  );

  return (
    <ConfigProvider theme={darkThemeConfig}>
      <Layout style={{ minHeight: "100vh" }} ref={myRef}>
        {!isEmbeddedMode && (
          <Sider
            width={300}
            collapsible
            collapsedWidth={50}
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            trigger={null}
          >
            <div className="sider-collapse-trigger" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <Menu
              theme="dark"
              selectedKeys={[selectedMenu]}
              defaultOpenKeys={["edit"]}
              defaultSelectedKeys={isEmbeddedMode ? ["view"] : ["examples"]}
              mode="inline"
              items={items}
              onSelect={(info) => onMenuSelect(info.key)}
              style={{ background: "transparent" }}
            />
          </Sider>
        )}
        <Layout className="site-layout">
          <AutoStartSimulation />
          <Simulation />
          <Main isEmbedded={isEmbeddedMode} />
        </Layout>
      </Layout>
      {showNewSimulation && <NewSimulation onClose={() => setShowNewSimulation(false)} />}
      {showShareSimulation && simulation && (
        <ShareSimulation
          visible={showShareSimulation}
          onClose={() => setShowShareSimulation(false)}
          simulation={simulation}
        />
      )}
      {showSettings && <Settings open={showSettings} onClose={() => setShowSettings(false)} />}
    </ConfigProvider>
  );
};

export default App;
