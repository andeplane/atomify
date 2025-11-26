import { Modal, Tabs, Progress, Button, Layout } from "antd";
import { useState, useEffect } from "react";
import View from "./View";
import Notebook from "./Notebook";
import Edit from "./Edit";
import Console from "./Console";
import Examples from "./Examples";
import RunInCloud from "./RunInCloud";
import { useStoreActions, useStoreState } from "../hooks";
import { useEmbeddedMode } from "../hooks/useEmbeddedMode";
const { Content } = Layout;

const Main = ({ isEmbedded }: { isEmbedded: boolean }) => {
  // @ts-ignore
  const wasm = window.wasm; // TODO: This is an ugly hack because wasm object is so big that Redux debugger hangs.
  const showConsole = useStoreState((state) => state.simulation.showConsole);
  const [consoleKey, setConsoleKey] = useState(0);
  const setShowConsole = useStoreActions(
    (actions) => actions.simulation.setShowConsole,
  );
  const selectedMenu = useStoreState((state) => state.app.selectedMenu);

  const setPreferredView = useStoreActions(
    (actions) => actions.app.setPreferredView,
  );
  const status = useStoreState((state) => state.app.status);

  const { isEmbeddedMode } = useEmbeddedMode();
  
  // Update console key when modal opens
  useEffect(() => {
    if (showConsole) {
      setConsoleKey(Date.now());
    }
  }, [showConsole]);

  return (
    <Content>
      <Tabs
        activeKey={selectedMenu.startsWith("file") ? "editfile" : selectedMenu}
        renderTabBar={() => <></>}
        items={[
          {
            key: "view",
            label: "View",
            children: <View visible={selectedMenu === "view"} isEmbeddedMode={isEmbeddedMode} />,
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
        ]}
      />
      {showConsole && (
        <Modal
          className="console-modal"
          bodyStyle={{ backgroundColor: "#1E1E1E" }}
          width={"80%"}
          footer={[
            <>
              <Button
                key="analyze"
                onClick={() => {
                  setShowConsole(false);
                  setPreferredView(undefined);
                  setPreferredView("notebook");
                }}
              >
                Analyze in notebook
              </Button>
              <Button key="close" onClick={() => setShowConsole(false)}>
                Close
              </Button>
            </>,
          ]}
          closable={false}
          open
          onCancel={() => setShowConsole(false)}
        >
          <Console key={consoleKey} width={"100%"} height={"70vh"} />
        </Modal>
      )}
      {
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
      }
    </Content>
  );
};

export default Main;
