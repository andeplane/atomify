import {Modal, Checkbox, Slider, Tabs, Table} from 'antd'
import { useStoreState, useStoreActions } from '../hooks';
import type { ColumnsType } from 'antd/es/table';

interface SettingsProps {
  open?: boolean
  onClose: () => void
}

const Settings = ({open, onClose}: SettingsProps) => {
  const ssao = useStoreState(state => state.renderSettings.ssao)
  const setSsao = useStoreActions(actions => actions.renderSettings.setSsao)
  const brightness = useStoreState(state => state.renderSettings.brightness)
  const setBrightness = useStoreActions(actions => actions.renderSettings.setBrightness)

  interface KeyboardShortcutsDataType {
    key: React.Key;
    name: string;
    description: string;
    keyboardshortcut: string;
  }

  const columns: ColumnsType<KeyboardShortcutsDataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
    {
      title: 'Keyboard shortcut',
      dataIndex: 'keyboardshortcut',
    },
  ];
  const data: KeyboardShortcutsDataType[] = [
    {
      key: 'camera',
      name: 'Copy camera position',
      description: 'Copies current camera position and target to clipboard',
      keyboardshortcut: 'c'
    },
    {
      key: 'simulationstep',
      name: 'Step simulation',
      description: 'Run one single timestep (only works after simulation is finished)',
      keyboardshortcut: 'space'
    },
    {
      key: 'simulationspeed',
      name: 'Set simulation speed',
      description: 'Set simulation speed (speeds 1, 2, 4, 6, 10, 20, 50, 100, 200)',
      keyboardshortcut: '1, 2, 3, 4, 5, 6, 7, 8, 9'
    }
  ];

  const renderRenderSettings = () => (
    <>
      <p>
        <Checkbox checked={ssao} onChange={(e) => setSsao(e.target.checked)}>
          Enable SSAO
        </Checkbox>
      </p>
      <div>
        Brightness
        <Slider min={0.1} max={2.0} step={0.1} defaultValue={brightness} onChange={(value) => setBrightness(value)} />
      </div>
    </>
  )

  return (
    <Modal width={"70%"} title="Settings" footer={null} open={open} onCancel={() => onClose()}>
      <Tabs defaultActiveKey="render">
        <Tabs.TabPane tab="Rendering" key="render">
          {renderRenderSettings()}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Keybord shortcuts" key="keybordshortcuts">
        <Table columns={columns} dataSource={data} />
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  )
}

export default Settings