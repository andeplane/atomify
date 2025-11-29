import { Modal, Tabs, Progress, Layout } from "antd";
import { useState, useEffect, useMemo } from "react";
import View from "./View";
import Notebook from "./Notebook";
import Edit from "./Edit";
import Console from "./Console";
import Examples from "./Examples";
import RunInCloud from "./RunInCloud";
import LoadingSimulationScreen from "../components/LoadingSimulationScreen";
import ConsoleModal from "../components/ConsoleModal";
import { useStoreState } from "../hooks";
const { Content } = Layout;

const Main = ({ isEmbedded }: { isEmbedded: boolean }) => {
  const wasm = window.wasm; // TODO: This is an ugly hack because wasm object is so big that Redux debugger hangs.
  const [hasStarted, setHasStarted] = useState(false);
  const selectedMenu = useStoreState((state) => state.app.selectedMenu);
  const running = useStoreState((state) => state.simulation.running);
  const status = useStoreState((state) => state.app.status);

  // Track when simulation has started
  useEffect(() => {
    if (running) {
      setHasStarted(true);
    }
  }, [running]);

  // Memoize tabs array to prevent unnecessary re-renders
  const tabs = useMemo(() => {
    const allTabs = [
      {
        key: "view",
        label: "View",
        children:
          isEmbedded && !hasStarted ? (
            <LoadingSimulationScreen status={status} wasmReady={wasm != null} />
          ) : (
            <View
              visible={selectedMenu === "view"}
              isEmbeddedMode={isEmbedded}
            />
          ),
      },
      {
        key: "console",
        label: "Console",
        children: <Console />,
      },
      {
        key: "notebook",
        label: "Notebook",
        children: <Notebook />,
      },
      {
        key: "editfile",
        label: "Edit",
        children: <Edit />,
      },
      {
        key: "examples",
        label: "Examples",
        children: <Examples />,
      },
      {
        key: "runincloud",
        label: "Run in cloud",
        children: <RunInCloud />,
      },
    ];

    // Filter out Examples tab in embedded mode
    return isEmbedded
      ? allTabs.filter((tab) => tab.key !== "examples")
      : allTabs;
  }, [isEmbedded, selectedMenu, hasStarted, status, wasm]);

  return (
    <Content>
      <Tabs
        activeKey={selectedMenu.startsWith("file") ? "editfile" : selectedMenu}
        renderTabBar={() => <></>}
        items={tabs}
      />
      <ConsoleModal />
      {!isEmbedded && (
        <Modal
          closable={false}
          title={status?.title}
          open={status != null || wasm == null}
          footer={null}
        >
          {status?.text}
          <Progress
            strokeColor={{
              from: "#108ee9",
              to: "#87d068",
            }}
            percent={Math.ceil(100 * (status ? status.progress : 0))}
            status="active"
          />
        </Modal>
      )}
    </Content>
  );
};

export default Main;
