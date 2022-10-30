import {Modal, Checkbox, Slider, Tabs, Table} from 'antd'
import { useStoreState, useStoreActions } from '../hooks';
import type { ColumnsType } from 'antd/es/table';
import {track} from '../utils/metrics'

interface SettingsProps {
  open?: boolean
  onClose: () => void
}

const Settings = ({open, onClose}: SettingsProps) => {
  const renderSettings = useStoreState(state => state.settings.render)
  const setRenderSettings = useStoreActions(actions => actions.settings.setRender)
  
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
    }
  ];

  const renderRenderSettings = () => (
    <>
      <p>
        <Checkbox checked={renderSettings.ssao} onChange={(e) => {
          track('Settings.Render.SSAO', {value: e.target.checked})
          setRenderSettings({...renderSettings, ssao: e.target.checked})}
        }>
          Enable SSAO
        </Checkbox>
      </p>
      <div>
        Brightness
        <Slider min={0.1} max={2.0} step={0.1} defaultValue={renderSettings.brightness} onChange={(value) => {
          track('Settings.Render.Brightness', {value})
          setRenderSettings({...renderSettings, brightness: value})}
        }/>
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