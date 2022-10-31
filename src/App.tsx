import {
  BorderOuterOutlined,
  LineChartOutlined,
  EditOutlined,
  InsertRowAboveOutlined,
  FileOutlined,
  PlaySquareOutlined,
  BorderOutlined,
  AlignLeftOutlined
} from '@ant-design/icons';
import { useMeasure } from 'react-use';
import React, { useState, useEffect, useCallback } from 'react';
import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';
import Simulation from './components/Simulation'
import Main from './containers/Main'
import { useStoreActions, useStoreState } from './hooks';
import {track} from './utils/metrics'
const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

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
    disabled
  } as MenuItem;
}

const App: React.FC = () => {
  const [myRef, { width }] = useMeasure<HTMLDivElement>();
  const [collapsed, setCollapsed] = useState(false);
  const running = useStoreState(state => state.simulation.running)
  const simulation = useStoreState(state => state.simulation.simulation)
  const selectedFile = useStoreState(state => state.simulation.selectedFile)
  const setSelectedFile = useStoreActions(actions => actions.simulation.setSelectedFile)
  const setSelectedMenu = useStoreActions(actions => actions.simulation.setSelectedMenu)
  const preferredView = useStoreState(state => state.simulation.preferredView)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)
  const selectedMenu = useStoreState(state => state.simulation.selectedMenu)

  const run = useStoreActions(actions => actions.simulation.run)
  
  useEffect(() => {
    if (width < 1000) {
      setCollapsed(true)
    } else {
      setCollapsed(false)
    }
  }, [width])
  const editMenuLabel = 'Edit '+ (simulation ? simulation?.id : '')
  const runStopButtonTitle = running ? "Stop" : "Run"

  const items: MenuItem[] = [
    getItem('View', 'view', <AlignLeftOutlined />),
    getItem('Console', 'console', <BorderOuterOutlined />),
    getItem('Notebook', 'notebook', <LineChartOutlined />),
    getItem(editMenuLabel, 'edit', <EditOutlined />, simulation ? simulation.files.map(file => {
      return getItem(file.fileName, 'file'+file.fileName, <FileOutlined />)
    }): [], undefined, selectedFile==null),
    getItem('Examples', 'examples', <InsertRowAboveOutlined />),
    {type: 'divider'},
    getItem(runStopButtonTitle, 'run', running ? <BorderOutlined /> : <PlaySquareOutlined />, undefined, () => {
      if (running) {
        // @ts-ignore
        window.cancel = true
      } else {
        run()
        setPreferredView('view')
      }
    }, simulation == null)
  ];

  useEffect(() => {
    if (preferredView) {
      setSelectedMenu(preferredView)
      setPreferredView(undefined)
    }
  }, [preferredView, setPreferredView, setSelectedMenu])
  
  useEffect(() => {
    if (selectedFile) {
      setSelectedMenu('file'+selectedFile.fileName)
    }
  }, [selectedFile, setSelectedMenu])

  const onMenuSelect = useCallback((selected: string) => {
    if (selected === "run") {
      return
    }
    
    setSelectedMenu(selected)
    if (selected.startsWith('file')) {
      // Oh god this is ugly
      const fileName = selected.substring(4)
      const files = simulation?.files
      const selectedFile = files?.filter(file => file.fileName===fileName)[0]

      if (selectedFile) {
        setSelectedFile(selectedFile)
      }
    }
    
    track('MenuClick', {selected, simulationId: simulation?.id, running})
  }, [simulation, setSelectedFile, running, setSelectedMenu])
  
  return (
    <>
    <Layout style={{ minHeight: '100vh' }} ref={myRef}>
      <Sider width={300} collapsible collapsedWidth={50} collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
        <div className="logo" />
        <Menu theme="dark" 
          selectedKeys={[selectedMenu]} 
          defaultOpenKeys={['edit']} 
          defaultSelectedKeys={['examples']} 
          mode="inline" 
          items={items}
          onSelect={(info) => onMenuSelect(info.key)} />
      </Sider>
      <Layout className="site-layout">
        <Simulation />
        <Main />
      </Layout>
    </Layout>
    </>
  );
};

export default App;