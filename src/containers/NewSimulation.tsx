import {Input, Layout} from 'antd'
import { InboxOutlined } from '@ant-design/icons';
import {useCallback, useEffect, useState} from 'react'
import { useStoreState, useStoreActions } from '../hooks';
import { message, Upload, Modal, Button, Select, Divider } from 'antd';
import type { UploadProps } from 'antd';
import { Simulation, SimulationFile } from '../store/simulation';
const { Option } = Select;

const { Dragger } = Upload;
const {Header} = Layout

interface NewSimulationProps {
  onClose: () => void
}

const NewSimulation = ({onClose}: NewSimulationProps) => {
  const [name, setName] = useState<string>()
  const [files, setFiles] = useState<SimulationFile[]>([])
  const [inputScript, setInputScript] = useState<string>()
  const setNewSimulation = useStoreActions(actions => actions.simulation.newSimulation)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)

  const validSimulation = (name != null && name.length > 0) && inputScript

  const props: UploadProps = {
    name: 'file',
    beforeUpload: () => false,
    multiple: true,
    onDrop: async (e) => {
      const files: SimulationFile[] = []
      const fileList: File[] = []
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i]
        fileList.push(file)
      }
      for (let rawFile of fileList) {
        const file: SimulationFile = {
          fileName: rawFile.name,
          content: await rawFile.text()
        }
        files.push(file)
      }
      setFiles(files)
      message.success(`${files.length} files uploaded successfully.`);
    },
  };
  
  const onOk = useCallback(() => {
    if (!name || !inputScript) {
      return
    }
    const newSimulation: Simulation = {
      files: files,
      id: name,
      inputScript: inputScript,
      start: false
    }
    setNewSimulation(newSimulation)
    setPreferredView('view')
    onClose()
  }, [files, inputScript, name, setNewSimulation, setPreferredView, onClose])
  
  return (
    <Modal open title="Create new simulation" footer={[
      <Button onClick={onOk} disabled={!validSimulation}>OK</Button>
    ]}>
      <p><b>Name</b></p>
      <Input onChange={(e) => setName(e.target.value)} placeholder='Simulation name'></Input>
      <Divider />
      <p><b>Files</b></p>
      <Dragger style={{height: '100%'}} {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">
          Upload files required for your simulation. Note that these files are not stored across Atomify sessions yet.
        </p>
      </Dragger>
      {files.length > 0 && <>
        <Divider />
        <p><b>Select input script</b></p>
        <Select style={{width: '100%'}} onChange={(value) => setInputScript(value)}>
          {files.map(file => (
            <Option value={file.fileName}>{file.fileName}</Option>
          ))}
        </Select>
      </>}
    </Modal>
  )
}
export default NewSimulation