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
import { Layout, Menu, Modal, Tabs, Progress, Button } from 'antd';
import Simulation from './components/Simulation'
import View from './containers/View'
import Analyze from './containers/Analyze'
import Edit from './containers/Edit'
import Console from './containers/Console'
import Examples from './containers/Examples'
import { useStoreActions, useStoreState } from './hooks';
import mixpanel from 'mixpanel-browser';

const { Content, Sider } = Layout;

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
  const wasm = useStoreState(state => state.simulation.wasm)
  const running = useStoreState(state => state.simulation.running)
  const showConsole = useStoreState(state => state.simulation.showConsole)
  const status = useStoreState(state => state.simulation.status)
  const simulation = useStoreState(state => state.simulation.simulation)
  const selectedFile = useStoreState(state => state.simulation.selectedFile)
  const setSelectedFile = useStoreActions(actions => actions.simulation.setSelectedFile)
  const selectedMenu = useStoreState(state => state.simulation.selectedMenu)
  const setSelectedMenu = useStoreActions(actions => actions.simulation.setSelectedMenu)
  const preferredView = useStoreState(state => state.simulation.preferredView)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)
  const setShowConsole = useStoreActions(actions => actions.simulation.setShowConsole)
  const run = useStoreActions(actions => actions.simulation.run)
  
  useEffect(() => {
    if (width < 1000) {
      setCollapsed(true)
    } else {
      setCollapsed(false)
    }
  }, [width])

  const items: MenuItem[] = [
    getItem('View', 'view', <AlignLeftOutlined />),
    getItem('Console', 'console', <BorderOuterOutlined />),
    getItem('Analyze', 'analyze', <LineChartOutlined />),
    getItem('Edit', 'edit', <EditOutlined />, simulation ? simulation.files.map(file => {
      return getItem(file.fileName, 'file'+file.fileName, <FileOutlined />)
    }): [], undefined, selectedFile==null),
    getItem('Examples', 'examples', <InsertRowAboveOutlined />)
  ];
  const runStopButtonTitle = running ? "Stop" : "Run"

  items.push({type: 'divider'})
  items.push(getItem(runStopButtonTitle, 'run', running ? <BorderOutlined /> : <PlaySquareOutlined />, undefined, () => {
    if (running) {
      // @ts-ignore
      window.cancel = true
    } else {
      run()
      setPreferredView('view')
    }
  }, simulation == null))
  
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
    
    mixpanel.track('MenuClick', {selected, simulationId: simulation?.id, running})
  }, [simulation, setSelectedFile, running, setSelectedMenu])
  
  return (
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
        <Content>
          <>
        <Tabs activeKey={selectedMenu.startsWith("file") ? "editfile" : selectedMenu} renderTabBar={() => (<></>)}>
          <Tabs.TabPane tab="View" key="view"> 
            <View visible={selectedMenu==='view'} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Console" key="console"> 
            <Console/>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Analyze" key="analyze">
            <Analyze />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Edit" key="editfile">
            <Edit />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Examples" key="examples">
            <Examples />
          </Tabs.TabPane>
        </Tabs>
          {showConsole && <Modal className='console-modal' bodyStyle={{backgroundColor: '#1E1E1E'}} width={'80%'} footer={[
            <>
            <Button key="analyze" onClick={() => {setShowConsole(false); setPreferredView('analyze')}}>
              Analyze simulation
            </Button>
            <Button key="close" onClick={() => setShowConsole(false)}>
              Close
            </Button>
          </>
          ]} closable={false} open onCancel={() => setShowConsole(false)}><Console width={'100%'} height={'70vh'}/></Modal>}
          {<Modal closable={false} title={status?.title} open={status != null || wasm == null} footer={null}>
            {status?.text}
            <Progress
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
              percent={Math.ceil(100 * (status ? status.progress : 0))}
              status="active"
            />
          </Modal>}
          </>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;