import React, {useState, useCallback, useEffect} from 'react'
import { Tabs } from 'antd';
const { TabPane } = Tabs;

type Pane = {
  title: string,
  content: string,
  key: string,
  closable?: boolean
}

const initialPanes: Pane[] = [
  { title: 'Tab 1', content: 'Content of Tab 1', key: '1' },
  { title: 'Tab 2', content: 'Content of Tab 2', key: '2' },
  {
    title: 'Tab 3',
    content: 'Content of Tab 3',
    key: '3',
    closable: false,
  },
];

const Editor = () => {
  const [panes, setPanes] = useState<Pane[]>([])
  const [activeKey, setActiveKey] = useState<string>()
  const onChange = useCallback( (activeKey: string) => {
    setActiveKey(activeKey)
  }, [])

  useEffect(() => {
    setPanes(initialPanes)
  }, [])

  return (
    <Tabs
      type="editable-card"
      onChange={onChange}
      activeKey={activeKey}
    >
      {panes.map(pane => (
        <TabPane tab={pane.title} key={pane.key} closable={pane.closable}>
          Code
        </TabPane>
      ))}
    </Tabs>
  )
}

export default Editor