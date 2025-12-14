import { InboxOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useState } from "react";
import { useStoreActions } from "../hooks";
import {
  message,
  Upload,
  Modal,
  Button,
  Select,
  Divider,
  Tooltip,
  Input,
  Checkbox,
} from "antd";
import type { UploadProps, UploadFile } from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import { Simulation } from "../store/simulation";
import { SimulationFile } from "../store/app";
import { track } from "../utils/metrics";

const { Option } = Select;

const { Dragger } = Upload;

interface NewSimulationProps {
  onClose: () => void;
}

const NewSimulation = ({ onClose }: NewSimulationProps) => {
  const [name, setName] = useState<string>();
  const [files, setFiles] = useState<SimulationFile[]>([]);
  const [startImmediately, setStartImmediately] = useState(false);
  const [inputScript, setInputScript] = useState<string>();
  const setNewSimulation = useStoreActions(
    (actions) => actions.simulation.newSimulation,
  );
  const setPreferredView = useStoreActions(
    (actions) => actions.app.setPreferredView,
  );

  const validSimulation =
    name != null &&
    name.length > 0 &&
    inputScript &&
    files.filter((file) => file.fileName === inputScript).length > 0;

  useEffect(() => {
    window.files = [];
  }, []);

  // Auto-select first .in file if no input script is selected
  useEffect(() => {
    if (!inputScript && files.length > 0) {
      const inFile = files.find((file) => file.fileName.endsWith(".in"));
      if (inFile) {
        setInputScript(inFile.fileName);
      }
    }
  }, [files, inputScript]);

  const onChange = useCallback(
    async (info: UploadChangeParam<UploadFile>) => {
      // Need to use window.files because these async functions can't seem to agree on the state
      if (info.file.status === "removed") {
        const newFiles = files.filter(
          (file) => file.fileName !== info.file.name,
        );
        window.files = newFiles;
        setFiles(newFiles);
        return;
      }

      // Process all files in the list that haven't been processed yet
      for (const uploadFile of info.fileList) {
        // Check current state right before processing to avoid race conditions
        const currentFiles = window.files || [];
        if (currentFiles.some((f) => f.fileName === uploadFile.name)) {
          continue; // Already processed
        }
        
        const originFile = uploadFile.originFileObj;
        if (!originFile) {
          continue; // Not ready yet
        }

        const file: SimulationFile = {
          fileName: uploadFile.name,
          content: await originFile.text(),
        };
        
        // Double-check before adding to prevent race conditions
        const filesBeforeAdd = window.files || [];
        if (!filesBeforeAdd.some((f) => f.fileName === uploadFile.name)) {
          window.files = [...filesBeforeAdd, file];
          message.success(`${file.fileName} uploaded successfully.`);
        }
      }
      
      setFiles(window.files || []);
    },
    [files, setFiles],
  );

  const props: UploadProps = {
    name: "file",
    beforeUpload: () => false,
    multiple: true,
    onChange: onChange,
  };

  const onOk = useCallback(() => {
    if (!name || !inputScript) {
      return;
    }

    const newSimulation: Simulation = {
      files: files,
      id: name,
      inputScript: inputScript,
      start: startImmediately,
    };
    const fileNames = files.map((file) => file.fileName);
    track("Simulation.Create.OK", {
      numFiles: files.length,
      fileNames,
      simulationId: name,
      startImmediately,
    });
    setNewSimulation(newSimulation);
    if (startImmediately) {
      setPreferredView("view");
    }
    onClose();
  }, [
    files,
    inputScript,
    name,
    onClose,
    startImmediately,
    setPreferredView,
    setNewSimulation,
  ]);

  return (
    <Modal
      open
      title="Create new simulation"
      footer={[
        <>
          <Checkbox onChange={(e) => setStartImmediately(e.target.checked)}>
            Start simulation immediately
          </Checkbox>
          <Button
            onClick={() => {
              const fileNames = files.map((file) => file.fileName);
              track("Simulation.Create.Cancel", {
                numFiles: files.length,
                fileNames,
                simulationId: name,
                startImmediately,
              });
              onClose();
            }}
          >
            Cancel
          </Button>
          <Tooltip title="You must specify a simulation name, upload at least one file and select the input script.">
            <Button onClick={onOk} disabled={!validSimulation}>
              OK
            </Button>
          </Tooltip>
        </>,
      ]}
      onCancel={onClose}
    >
      <p>
        <b>Name</b>
      </p>
      <Input
        onChange={(e) => setName(e.target.value)}
        placeholder="Simulation name"
      ></Input>
      <Divider />
      <p>
        <b>Files</b>
      </p>
      <Dragger style={{ height: "100%" }} {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Upload the files you need for your simulation. Note that these files
          are not stored across Atomify sessions yet.
        </p>
      </Dragger>
      {files.length > 0 && (
        <>
          <Divider />
          <p>
            <b>Select input script</b>
          </p>
          <Select
            style={{ width: "100%" }}
            value={inputScript}
            onChange={(value) => setInputScript(value)}
          >
            {files.map((file) => (
              <Option value={file.fileName}>{file.fileName}</Option>
            ))}
          </Select>
        </>
      )}
    </Modal>
  );
};
export default NewSimulation;
