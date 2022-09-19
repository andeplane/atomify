import React, {useState, useCallback, useEffect} from 'react'
import MonacoEditor from 'react-monaco-editor'
import ConsoleTab from '../components/ConsoleTab'
import { LineType } from 'react-terminal-ui';
import {useStoreActions, useStoreState} from 'hooks'
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
  // { title: 'Tab 2', content: 'Content of Tab 2', key: '2' },
  // {
  //   title: 'Tab 3',
  //   content: 'Content of Tab 3',
  //   key: '3',
  //   closable: false,
  // },
];

interface EditorProps {
  lammpsOutput: { type: LineType; value: string;}[]
  onClearConsole: () => void
  particles?: Particles
}

const Editor = ({lammpsOutput, onClearConsole, particles}: EditorProps) => {
  const [panes, setPanes] = useState<Pane[]>([])
  const [activeKey, setActiveKey] = useState<string>()
  const files = useStoreState(state => state.files.files)
  const selectedFile = useStoreState(state => state.files.selectedFile)
  const setSelectedFile = useStoreActions(actions => actions.files.setSelectedFile)

  const onChange = useCallback( (activeKey: string) => {
    setActiveKey(activeKey)
  }, [])

  const onEdit = useCallback( (e: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    console.log("Will close ", e, action)
    const remove = (targetKey: String) => {
      let newActiveKey = activeKey;
      let lastIndex = -1;
      panes.forEach((item, i) => {
        if (item.key === targetKey) {
          lastIndex = i - 1;
        }
      });
      const newPanes = panes.filter(item => item.key !== targetKey);
      if (newPanes.length && newActiveKey === targetKey) {
        if (lastIndex >= 0) {
          newActiveKey = newPanes[lastIndex].key;
        } else {
          newActiveKey = newPanes[0].key;
        }
      }
      console.log("Panes has length ", panes.length, " but newPanes has length ", newPanes.length)
      if (newPanes.length == 0) {
        setSelectedFile(undefined)
        setActiveKey("console")
      } else {
        const paneTitle = newPanes[newPanes.length-1].title
        const file = files[paneTitle]
        setSelectedFile(file)
      }
      setPanes(newPanes)
    };

    if (action === 'add') {
      // add();
    } else {
      if (typeof e === 'string') {
        remove(e);
      }
    }
  }, [panes, activeKey])

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    let hasPaneOpen = false
    panes.forEach(pane => {
      if (pane.title === selectedFile.fileName) {
        hasPaneOpen = true
      }
    })
    
    if (!hasPaneOpen) {
      const newPanes = [
        ...panes,
        {
          title: selectedFile.fileName,
          content: selectedFile.content,
          key: selectedFile.fileName,
          closeable: true
        }
      ]
      
      setPanes(newPanes)
      setActiveKey(selectedFile.fileName)
    }
  }, [panes, selectedFile, files, setSelectedFile])
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
        onEdit={onEdit}
        activeKey={activeKey}
        style={{height: '100%'}}
      >
        <TabPane tab={"Console"} key={"console"} closable={false}>
          <ControlBar onClearConsole={onClearConsole} />
          <ConsoleTab lammpsOutput={lammpsOutput} />
        </TabPane>
        <TabPane tab={"3D"} key={"3d"} closable={false}>
          <ControlBar onClearConsole={onClearConsole} />
          {particles && <OMOVIVisualizer particles={particles}/>}
        </TabPane>
        {panes.map(pane => (
          <TabPane tab={pane.title} key={pane.key} closable={pane.closable}>
            <ControlBar onClearConsole={onClearConsole} />
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