import { InboxOutlined } from '@ant-design/icons';
import {useCallback, useState} from 'react'
import { useStoreActions } from '../hooks';
import { message, Upload, Modal, Button, Select, Divider, Tooltip, Input, Checkbox } from 'antd';
import type { UploadProps } from 'antd';
import { Simulation, SimulationFile } from '../store/simulation';
import {track} from '../utils/metrics'

const { Option } = Select;

const { Dragger } = Upload;

interface NewSimulationProps {
  onClose: () => void
}

const NewSimulation = ({onClose}: NewSimulationProps) => {
  const [name, setName] = useState<string>()
  const [files, setFiles] = useState<SimulationFile[]>([])
  const [startImmediately, setStartImmediately] = useState(false)
  const [inputScript, setInputScript] = useState<string>()
  const setNewSimulation = useStoreActions(actions => actions.simulation.newSimulation)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)
  
  const validSimulation = (name != null && name.length > 0) && inputScript

  const props: UploadProps = {
    name: 'file',
    beforeUpload: () => false,
    multiple: true,
    onDrop: async (e) => {
      // It's a bit weird. I have to convert to a regular array of File[] to be able to do await file.text()
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
      start: startImmediately
    }
    const fileNames = files.map(file => file.fileName)
    track('Simulation.Create', {fileNames, simulationId: name})
    setNewSimulation(newSimulation)
    if (startImmediately) {
      setPreferredView('view')
    }
    onClose()
  }, [files, inputScript, name, onClose, startImmediately, setPreferredView, setNewSimulation])
  
  return (
    <Modal open title="Create new simulation" footer={[
      <>
        <Checkbox onChange={(e) => setStartImmediately(e.target.checked) }>Start simulation immediately</Checkbox>
        <Button onClick={onClose}>Cancel</Button>
        <Tooltip title="You must specify a simulation name, upload at least one file and select the input script.">
          <Button onClick={onOk} disabled={!validSimulation}>OK</Button>
        </Tooltip>
      </>
    ]} onCancel={onClose}>
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
          Upload the files you need for your simulation. Note that these files are not stored across Atomify sessions yet.
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