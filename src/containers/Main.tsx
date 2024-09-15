import { Modal, Tabs, Progress, Button, Layout } from 'antd';
import View from './View'
import Notebook from './Notebook'
import Edit from './Edit'
import Console from './Console'
import Examples from './Examples'
import RunInCloud from './RunInCloud'
import {useStoreActions, useStoreState} from '../hooks'
import Simulations from './Simulations';
const { Content } = Layout;

const Main = () => {
  // @ts-ignore
  const wasm = window.wasm // TODO: This is an ugly hack because wasm object is so big that Redux debugger hangs.
  const showConsole = useStoreState(state => state.simulation.showConsole)
  const setShowConsole = useStoreActions(actions => actions.simulation.setShowConsole)
  const selectedMenu = useStoreState(state => state.app.selectedMenu)
  
  const setPreferredView = useStoreActions(actions => actions.app.setPreferredView)
  const status = useStoreState(state => state.app.status)

  return (
    <Content>
      <Tabs activeKey={selectedMenu.startsWith("file") ? "editfile" : selectedMenu} renderTabBar={() => (<></>)}>
        <Tabs.TabPane tab="View" key="view"> 
          <View visible={selectedMenu==='view'} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Console" key="console"> 
          <Console/>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Notebook" key="notebook">
          <Notebook />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Edit" key="editfile">
          <Edit />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Simulations" key="simulations">
          <Simulations />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Examples" key="examples">
          <Examples />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Run in cloud" key="runincloud">
          <RunInCloud />
        </Tabs.TabPane>
      </Tabs>
        {showConsole && <Modal className='console-modal' bodyStyle={{backgroundColor: '#1E1E1E'}} width={'80%'} footer={[
          <>
          <Button key="analyze" onClick={() => {setShowConsole(false); setPreferredView(undefined); setPreferredView('notebook')}}>
            Analyze in notebook
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
      </Content>
  )
}

export default Main