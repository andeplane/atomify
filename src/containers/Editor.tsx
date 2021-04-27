import React, {useState, useCallback, useEffect} from 'react'
import MonacoEditor from 'react-monaco-editor'
import ConsoleTab from '../components/ConsoleTab'
import { LineType } from 'react-terminal-ui';
import {OMOVIVisualizer, Particles} from 'omovi'
import ControlBar from 'components/ControlBar'
import { Tabs } from 'antd';
const { TabPane } = Tabs;

type Pane = {
  title: string,
  content: string,
  key: string,
  closable?: boolean
}

const initialPanes: Pane[] = [
  { title: 'Tab 2', content: 'Content of Tab 2', key: '2' },
  {
    title: 'Tab 3',
    content: 'Content of Tab 3',
    key: '3',
    closable: false,
  },
];

interface EditorProps {
  lammpsOutput: { type: LineType; value: string;}[]
  particles?: Particles
}

const Editor = ({lammpsOutput, particles}: EditorProps) => {
  const [panes, setPanes] = useState<Pane[]>([])
  const [activeKey, setActiveKey] = useState<string>()
  const onChange = useCallback( (activeKey: string) => {
    setActiveKey(activeKey)
  }, [])

  useEffect(() => {
    setPanes(initialPanes)
  }, [])

  const editorDidMount = useCallback( (editor: any, monaco: any) => {
    console.log('editorDidMount', editor);
    editor.focus();
  }, [])

  const onEditorChange = useCallback( (newValue: string, e: any) => {
    console.log('onChange', newValue, e);
  }, [])

  const options = {
    selectOnLineNumbers: true
  };

  return (
      <Tabs
        type="editable-card"
        onChange={onChange}
        activeKey={activeKey}
        style={{height: '100%'}}
      >
        <TabPane tab={"Console"} key={"console"} closable={false}>
          <ControlBar />
          <ConsoleTab lammpsOutput={lammpsOutput} />
        </TabPane>
        <TabPane tab={"3D"} key={"3d"} closable={false}>
          <ControlBar />
          {particles && <OMOVIVisualizer particles={particles}/>}
        </TabPane>
        {panes.map(pane => (
          <TabPane tab={pane.title} key={pane.key} closable={pane.closable}>
            <ControlBar />
            <MonacoEditor
              height="500px"
              language="javascript"
              theme="vs-dark"
              value={pane.content}
              options={options}
              onChange={onEditorChange}
              editorDidMount={editorDidMount}
            />
          </TabPane>
        ))}
      </Tabs>
  )
}

export default Editor