import {
  BorderOuterOutlined,
  LineChartOutlined,
  EditOutlined,
  InsertRowAboveOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, Modal } from 'antd';
import React, { useState } from 'react';
import Simulation from './components/Simulation'
import View from './containers/View'
import Analyze from './containers/Analyze'
import Edit from './containers/Edit'
import Examples from './containers/Examples'
import { useStoreState } from './hooks';

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

const items: MenuItem[] = [
  getItem('View', 'view', <BorderOuterOutlined />),
  getItem('Analyze', 'analyze', <LineChartOutlined />),
  getItem('Edit', 'edit', <EditOutlined />),
  getItem('Examples', 'examples', <InsertRowAboveOutlined />)
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<string>("view")
  const loading = useStoreState(state => state.simulation.loading)
  const status = useStoreState(state => state.simulation.status)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
        <div className="logo" />
        <Menu theme="dark" defaultSelectedKeys={['view']} mode="inline" items={items} onSelect={(info) => setSelectedMenu(info.key)} />
      </Sider>
      <Layout className="site-layout">
        <Simulation />
        <Header className="site-layout-background" style={{ padding: 0 }} />
        <Content style={{ margin: '0 16px' }}>
          {selectedMenu=="view" && <View />}
          {selectedMenu=="analyze" && <Analyze />}
          {selectedMenu=="edit" && <Edit />}
          {selectedMenu=="examples" && <Examples />}
          {loading && <Modal title={status?.title} open={loading}>
            {status?.text}
          </Modal>}
        </Content>
        <Footer style={{ textAlign: 'center' }}>Atomify ©2022 Created by Henrik Sveinsson, Svenn-Arne Dragly and Anders Hafreager</Footer>
      </Layout>
    </Layout>
  );
};

export default App;