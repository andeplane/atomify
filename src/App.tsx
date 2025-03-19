import {
  BorderOuterOutlined,
  LineChartOutlined,
  EditOutlined,
  InsertRowAboveOutlined,
  FileOutlined,
  PlaySquareOutlined,
  BorderOutlined,
  AlignLeftOutlined,
  PlusSquareOutlined,
  CaretRightOutlined,
  CloudOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { useMeasure } from "react-use";
import React, { useState, useEffect, useCallback } from "react";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";
import Simulation from "./components/Simulation";
import Main from "./containers/Main";
import { useStoreActions, useStoreState } from "./hooks";
import { track } from "./utils/metrics";
import NewSimulation from "./containers/NewSimulation";
import AutoStartSimulation from "./components/AutoStartSimulation";
const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  onClick?: () => void,
  disabled?: boolean,
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
  const running = useStoreState((state) => state.simulation.running);
  const simulation = useStoreState((state) => state.simulation.simulation);
  const selectedFile = useStoreState((state) => state.app.selectedFile);
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
  const setPaused = useStoreActions((actions) => actions.simulation.setPaused);
  const selectedMenu = useStoreState((state) => state.app.selectedMenu);

  const run = useStoreActions((actions) => actions.simulation.run);

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
        // @ts-ignore
        window.cancel = true;
      } else {
        run();
        setPreferredView("view");
      }
    },
    simulation == null,
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
    running === false,
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
    running,
  );

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
            return getItem(
              file.fileName,
              "file" + file.fileName,
              <FileOutlined />,
            );
          })
        : [],
      undefined,
      selectedFile == null,
    ),
    { type: "divider" },
    newSimulationButton,
    getItem("Examples", "examples", <InsertRowAboveOutlined />),
    { type: "divider" },
    runStopButton,
    getItem(
      "Run in cloud",
      "runincloud",
      <CloudOutlined />,
      undefined,
      undefined,
      simulation == null,
    ),
    pauseButton,
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

      if (selected === "run") {
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
    <>
      <Layout style={{ minHeight: "100vh" }} ref={myRef}>
        <Sider
          width={300}
          collapsible
          collapsedWidth={50}
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <div className="logo" />
          <Menu
            theme="dark"
            selectedKeys={[selectedMenu]}
            defaultOpenKeys={["edit"]}
            defaultSelectedKeys={["examples"]}
            mode="inline"
            items={items}
            onSelect={(info) => onMenuSelect(info.key)}
          />
        </Sider>
        <Layout className="site-layout">
          <AutoStartSimulation />
          <Simulation />
          <Main />
        </Layout>
      </Layout>
      {showNewSimulation && (
        <NewSimulation onClose={() => setShowNewSimulation(false)} />
      )}
    </>
  );
};

export default App;
