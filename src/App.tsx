import {
  BorderOuterOutlined,
  LineChartOutlined,
  EditOutlined,
  InsertRowAboveOutlined,
  FileOutlined,
  CaretRightOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, Modal, Button, Tooltip, Tabs, Progress, notification } from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import Simulation from './components/Simulation'
import View from './containers/View'
import Analyze from './containers/Analyze'
import Edit from './containers/Edit'
import Examples from './containers/Examples'
import { useStoreActions, useStoreState } from './hooks';

const { Header, Content, Footer, Sider } = Layout;

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
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<string>("examples")
  const wasm = useStoreState(state => state.simulation.wasm)
  const lammps = useStoreState(state => state.simulation.lammps)
  const loading = useStoreState(state => state.simulation.loading)
  const status = useStoreState(state => state.simulation.status)
  const simulation = useStoreState(state => state.simulation.simulation)
  const selectedFile = useStoreState(state => state.simulation.selectedFile)
  const setSelectedFile = useStoreActions(actions => actions.simulation.setSelectedFile)
  const preferredView = useStoreState(state => state.simulation.preferredView)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)
  const run = useStoreActions(actions => actions.simulation.run)

  const items: MenuItem[] = [
    getItem('View', 'view', <BorderOuterOutlined />),
    getItem('Analyze', 'analyze', <LineChartOutlined />),
    getItem('Edit', 'edit', <EditOutlined />, simulation ? simulation.files.map(file => {
      return getItem(file.fileName, 'file'+file.fileName, <FileOutlined />)
    }): [], undefined, selectedFile==null),
    getItem('Examples', 'examples', <InsertRowAboveOutlined />)
  ];
  items.push({type: 'divider'})
  items.push(getItem('Run', 'run', <CaretRightOutlined />, undefined, () => {
    if (lammps?.isRunning()) {
      notification.info({
        message: 'Simulation already running',
        description: "You can't start a new simulation while another one is running.",
      });
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
  }, [preferredView, setPreferredView])
  
  useEffect(() => {
    if (selectedFile) {
      setSelectedMenu('file'+selectedFile.fileName)
    }
  }, [selectedFile])

  const onMenuSelect = useCallback((selected: string) => {
    if (selected === "run") {
      return
    }
    
    setSelectedMenu(selected)
    if (selected.startsWith('file')) {
      // Oh god this is ugly
      const fileName = selected.substring(4)
      const files = simulation?.files
      const selectedFile = files?.filter(file => file.fileName==fileName)[0]

      if (selectedFile) {
        setSelectedFile(selectedFile)
      }
    }

  }, [simulation])
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
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
        <Tabs activeKey={selectedMenu.startsWith("file") ? "editfile" : selectedMenu}  renderTabBar={() => (<></>)}>
          <Tabs.TabPane tab="View" key="view"> 
            <View visible={selectedMenu==='view'} />
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
          {<Modal closable={false} title={status?.title} open={status != null || wasm == null} footer={null}>
            {status?.text}
            <Progress
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
              percent={100 * (status ? status.progress : 0)}
              status="active"
            />
          </Modal>}
            {/* {<Modal closable={false}  title={"Compiling LAMMPS ..."} open={wasm==null} footer={null}>
            {"This may take a few moments."}
          </Modal>} */}
          </>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;