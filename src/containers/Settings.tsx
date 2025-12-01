import { Modal, Checkbox, Slider, Tabs, Table, Collapse } from "antd";
import { useStoreState, useStoreActions } from "../hooks";
import type { ColumnsType } from "antd/es/table";
import { track } from "../utils/metrics";

interface SettingsProps {
  open?: boolean;
  onClose: () => void;
}

const Settings = ({ open, onClose }: SettingsProps) => {
  const renderSettings = useStoreState((state) => state.settings.render);
  const setRenderSettings = useStoreActions(
    (actions) => actions.settings.setRender,
  );

  interface KeyboardShortcutsDataType {
    key: React.Key;
    name: string;
    keyboardshortcut: string;
  }

  const columns: ColumnsType<KeyboardShortcutsDataType> = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Keyboard shortcut",
      dataIndex: "keyboardshortcut",
    },
  ];
  const data: KeyboardShortcutsDataType[] = [
    {
      key: "camera",
      name: "Copy camera position",
      keyboardshortcut: "c",
    },
    {
      key: "togglepause",
      name: "Toggle pause",
      keyboardshortcut: "space",
    },
    {
      key: "simulationspeed",
      name: "Set simulation speed",
      keyboardshortcut: "1, 2, 3, 4, 5, 6, 7, 8, 9",
    },
    {
      key: "w",
      name: "Move camera forward",
      keyboardshortcut: "w",
    },
    {
      key: "a",
      name: "Move camera left",
      keyboardshortcut: "a",
    },
    {
      key: "s",
      name: "Move camera backward",
      keyboardshortcut: "s",
    },
    {
      key: "d",
      name: "Move camera right",
      keyboardshortcut: "d",
    },
    {
      key: "q",
      name: "Move camera down",
      keyboardshortcut: "q",
    },
    {
      key: "e",
      name: "Move camera up",
      keyboardshortcut: "e",
    },
    {
      key: "up",
      name: "Rotate camera up",
      keyboardshortcut: "↑",
    },
    {
      key: "left",
      name: "Rotate camera left",
      keyboardshortcut: "←",
    },
    {
      key: "down",
      name: "Rotate camera down",
      keyboardshortcut: "↓",
    },
    {
      key: "right",
      name: "Rotate camera right",
      keyboardshortcut: "→",
    },
  ];

  const renderRenderSettings = () => {
    const handleSettingChange = <K extends keyof typeof renderSettings>(
      key: K,
      value: (typeof renderSettings)[K],
      trackName: string
    ) => {
      track(trackName, { value });
      setRenderSettings({ ...renderSettings, [key]: value });
    };

    return (
      <>
        {/* Basic Settings */}
        <Checkbox
          checked={renderSettings.showSimulationBox}
          onChange={(e) =>
            handleSettingChange(
              "showSimulationBox",
              e.target.checked,
              "Settings.Render.ShowSimulationBox"
            )
          }
        >
          Show simulation box
        </Checkbox>

        <Collapse
          defaultActiveKey={["lighting"]}
          items={[
            {
              key: "lighting",
              label: "Lighting",
              children: (
                <>
                  <div style={{ marginBottom: "8px" }}>
                    Ambient Light Intensity:{" "}
                    {renderSettings.ambientLightIntensity.toFixed(2)}
                    <Slider
                      min={0}
                      max={1.0}
                      step={0.01}
                      value={renderSettings.ambientLightIntensity}
                      onChange={(value) =>
                        handleSettingChange(
                          "ambientLightIntensity",
                          value,
                          "Settings.Render.AmbientLightIntensity"
                        )
                      }
                    />
                  </div>
                  <div>
                    Point Light Intensity:{" "}
                    {renderSettings.pointLightIntensity.toFixed(0)}
                    <Slider
                      min={0}
                      max={50}
                      step={1}
                      value={renderSettings.pointLightIntensity}
                      onChange={(value) =>
                        handleSettingChange(
                          "pointLightIntensity",
                          value,
                          "Settings.Render.PointLightIntensity"
                        )
                      }
                    />
                  </div>
                </>
              ),
            },
            {
              key: "ssao",
              label: "Ambient Occlusion (SSAO)",
              children: (
                <>
                  <Checkbox
                    checked={renderSettings.ssao}
                    onChange={(e) =>
                      handleSettingChange(
                        "ssao",
                        e.target.checked,
                        "Settings.Render.SSAO"
                      )
                    }
                  >
                    Enable SSAO
                  </Checkbox>

                  {renderSettings.ssao && (
                    <div style={{ marginTop: "16px" }}>
                      <div style={{ marginBottom: "8px" }}>
                        Radius: {renderSettings.ssaoRadius.toFixed(1)}
                        <Slider
                          min={1}
                          max={30}
                          step={0.5}
                          value={renderSettings.ssaoRadius}
                          onChange={(value) =>
                            handleSettingChange(
                              "ssaoRadius",
                              value,
                              "Settings.Render.SSAORadius"
                            )
                          }
                        />
                      </div>
                      <div>
                        Intensity: {renderSettings.ssaoIntensity.toFixed(1)}
                        <Slider
                          min={0}
                          max={15}
                          step={0.5}
                          value={renderSettings.ssaoIntensity}
                          onChange={(value) =>
                            handleSettingChange(
                              "ssaoIntensity",
                              value,
                              "Settings.Render.SSAOIntensity"
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </>
              ),
            },
          ]}
        />
      </>
    );
  };

  return (
    <Modal
      width={"70%"}
      title="Settings"
      footer={null}
      open={open}
      onCancel={() => onClose()}
    >
      <Tabs
        defaultActiveKey="render"
        items={[
          {
            key: "render",
            label: "Rendering",
            children: renderRenderSettings(),
          },
          {
            key: "keybordshortcuts",
            label: "Keyboard shortcuts",
            children: (
              <Table
                pagination={{ pageSize: 50, hideOnSinglePage: true }}
                columns={columns}
                dataSource={data}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default Settings;
