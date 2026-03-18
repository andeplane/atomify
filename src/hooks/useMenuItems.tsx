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
  ShareAltOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import React from "react";
import type { MenuProps } from "antd";
import { Badge } from "antd";
import { useStoreActions, useStoreState } from "./index";
import { track } from "../utils/metrics";
import { setCancel } from "../wasm/wasmInstance";

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

interface UseMenuItemsCallbacks {
  onShowNewSimulation: () => void;
  onShowShareSimulation: () => void;
  onShowSettings: () => void;
}

export function useMenuItems(callbacks: UseMenuItemsCallbacks): MenuItem[] {
  const running = useStoreState((state) => state.simulation.running);
  const simulation = useStoreState((state) => state.simulation.simulation);
  const selectedFile = useStoreState((state) => state.app.selectedFile);
  const paused = useStoreState((state) => state.simulation.paused);
  const selectedMenu = useStoreState((state) => state.app.selectedMenu);
  const setPaused = useStoreActions((actions) => actions.simulation.setPaused);
  const setPreferredView = useStoreActions(
    (actions) => actions.app.setPreferredView,
  );
  const run = useStoreActions((actions) => actions.simulation.run);

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
        setCancel(true);
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
      callbacks.onShowNewSimulation();
      setPreferredView(selectedMenu); // This is another hack. Should really rethink menu system.
    },
    running,
  );

  const shareSimulationButton = getItem(
    <span>
      Share simulation{" "}
      <Badge
        count="NEW"
        style={{ backgroundColor: "#52c41a", marginLeft: 8 }}
      />
    </span>,
    "share",
    <ShareAltOutlined />,
    undefined,
    () => {
      callbacks.onShowShareSimulation();
      setPreferredView(selectedMenu); // This is another hack. Should really rethink menu system.
    },
    simulation == null || running,
  );

  const settingsButton = getItem(
    "Settings",
    "settings",
    <SettingOutlined />,
    undefined,
    () => {
      track("Settings.Open");
      callbacks.onShowSettings();
      setPreferredView(selectedMenu); // This is another hack. Should really rethink menu system.
    },
  );

  return [
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
    shareSimulationButton,
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
    { type: "divider" },
    settingsButton,
  ];
}
