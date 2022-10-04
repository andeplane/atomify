import {
  BorderOuterOutlined,
  LineChartOutlined,
  EditOutlined,
  InsertRowAboveOutlined,
  FileOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, Modal } from 'antd';
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
): MenuItem {
  return {
    key,    
    icon,
    children,
    label,
  } as MenuItem;
}

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<string>("examples")
  const wasm = useStoreState(state => state.lammps.wasm)
  const loading = useStoreState(state => state.simulation.loading)
  const status = useStoreState(state => state.simulation.status)
  const simulation = useStoreState(state => state.simulation.simulation)
  const selectedFile = useStoreState(state => state.simulation.selectedFile)
  const setSelectedFile = useStoreActions(actions => actions.simulation.setSelectedFile)

  const items: MenuItem[] = [
    getItem('View', 'view', <BorderOuterOutlined />),
    getItem('Analyze', 'analyze', <LineChartOutlined />),
    getItem('Edit', 'edit', <EditOutlined />, simulation ? simulation.files.map(file => getItem(file.fileName, 'file'+file.fileName, <FileOutlined />)): []),
    getItem('Examples', 'examples', <InsertRowAboveOutlined />)
  ];

  useEffect(() => {
    if (selectedFile) {
      setSelectedMenu('file'+selectedFile.fileName)
    }
  }, [selectedFile])

  const onMenuSelect = useCallback((selected: string) => {
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
        <Menu theme="dark" selectedKeys={[selectedMenu]} defaultOpenKeys={['edit']} defaultSelectedKeys={['examples']} mode="inline" items={items} onSelect={(info) => onMenuSelect(info.key)} />
      </Sider>
      <Layout className="site-layout">
        <Simulation />
        <Header className="site-layout-background" style={{ fontSize: 25 }}>
          {selectedMenu=="view" && "View"}
          {selectedMenu=="analyze" && "Analyze"}
          {selectedMenu=="edit" && "Edit"}
          {selectedMenu=="examples" && "Examples"}
          {selectedMenu.startsWith('file') && selectedMenu.substring(4)}
        </Header>
        <Content style={{ margin: '0 16px' }}>
          {selectedMenu=="view" && <View />}
          {selectedMenu=="analyze" && <Analyze />}
          {selectedMenu=="edit" && <Edit />}
          {selectedMenu.startsWith("file") && <Edit />}
          {selectedMenu=="examples" && <Examples />}
          {<Modal closable={false} title={status?.title} open={loading}>
            {status?.text}
          </Modal>}
            {<Modal closable={false}  title={"Compiling LAMMPS ..."} open={wasm==null} footer={null}>
            {"This may take a few moments."}
          </Modal>}
        </Content>
        <Footer style={{ textAlign: 'center' }}>Atomify ©2022 Created by Henrik Sveinsson, Svenn-Arne Dragly and Anders Hafreager</Footer>
      </Layout>
    </Layout>
  );
};

export default App;