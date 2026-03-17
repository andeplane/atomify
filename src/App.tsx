import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useMeasure } from "react-use";
import React, { useState, useEffect, useCallback } from "react";
import { Layout, Menu, ConfigProvider } from "antd";
import Simulation from "./components/Simulation";
import Main from "./containers/Main";
import { useStoreActions, useStoreState } from "./hooks";
import { track } from "./utils/metrics";
import AutoStartSimulation from "./components/AutoStartSimulation";
import AppModals from "./components/AppModals";
import { useEmbeddedMode } from "./hooks/useEmbeddedMode";
import { useMenuItems } from "./hooks/useMenuItems";
import { darkThemeConfig } from "./theme";
const { Sider } = Layout;

const App: React.FC = () => {
  const [myRef, { width }] = useMeasure<HTMLDivElement>();
  const [collapsed, setCollapsed] = useState(false);
  const [showNewSimulation, setShowNewSimulation] = useState(false);
  const [showShareSimulation, setShowShareSimulation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const running = useStoreState((state) => state.simulation.running);
  const simulation = useStoreState((state) => state.simulation.simulation);
  const setSelectedFile = useStoreActions(
    (actions) => actions.app.setSelectedFile,
  );
  const setSelectedMenu = useStoreActions(
    (actions) => actions.app.setSelectedMenu,
  );
  const preferredView = useStoreState((state) => state.app.preferredView);
  const setPreferredView = useStoreActions(
    (actions) => actions.app.setPreferredView,
  );
  const paused = useStoreState((state) => state.simulation.paused);
  const selectedMenu = useStoreState((state) => state.app.selectedMenu);

  const { isEmbeddedMode } = useEmbeddedMode();

  const items = useMenuItems({
    onShowNewSimulation: () => setShowNewSimulation(true),
    onShowShareSimulation: () => setShowShareSimulation(true),
    onShowSettings: () => setShowSettings(true),
  });

  useEffect(() => {
    if (width < 1000) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [width]);

  useEffect(() => {
    if (preferredView === "newsimulation") {
      return;
    }

    if (preferredView) {
      setSelectedMenu(preferredView);
      setPreferredView(undefined);
    }
  }, [preferredView, setPreferredView, setSelectedMenu]);

  const selectedFile = useStoreState((state) => state.app.selectedFile);

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
        const selectedFile = files?.filter(
          (file) => file.fileName === fileName,
        )[0];

        if (selectedFile) {
          setSelectedFile(selectedFile);
        }
      }
    },
    [simulation, setSelectedFile, running, paused, setSelectedMenu],
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
            <div
              className="sider-collapse-trigger"
              onClick={() => setCollapsed(!collapsed)}
            >
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
      <AppModals
        showNewSimulation={showNewSimulation}
        showShareSimulation={showShareSimulation}
        showSettings={showSettings}
        simulation={simulation}
        onCloseNewSimulation={() => setShowNewSimulation(false)}
        onCloseShareSimulation={() => setShowShareSimulation(false)}
        onCloseSettings={() => setShowSettings(false)}
      />
    </ConfigProvider>
  );
};

export default App;
