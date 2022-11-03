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
    keyboardshortcut: string;
  }

  const columns: ColumnsType<KeyboardShortcutsDataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
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
      keyboardshortcut: 'c'
    },
    {
      key: 'togglepause',
      name: 'Toggle pause',
      keyboardshortcut: 'space'
    },
    {
      key: 'w',
      name: 'Move camera forward',
      keyboardshortcut: 'w'
    },
    {
      key: 'a',
      name: 'Move camera left',
      keyboardshortcut: 'a'
    },
    {
      key: 's',
      name: 'Move camera backward',
      keyboardshortcut: 's'
    },
    {
      key: 'd',
      name: 'Move camera right',
      keyboardshortcut: 'd'
    },
    {
      key: 'q',
      name: 'Move camera down',
      keyboardshortcut: 'q'
    },
    {
      key: 'e',
      name: 'Move camera up',
      keyboardshortcut: 'e'
    },
    {
      key: 'up',
      name: 'Rotate camera up',
      keyboardshortcut: '↑'
    },
    {
      key: 'left',
      name: 'Rotate camera left',
      keyboardshortcut: '←'
    },
    {
      key: 'down',
      name: 'Rotate camera down',
      keyboardshortcut: '↓'
    },
    {
      key: 'right',
      name: 'Rotate camera right',
      keyboardshortcut: '→'
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
        <Table pagination={{pageSize: 50, hideOnSinglePage: true}} columns={columns} dataSource={data} />
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  )
}

export default Settings