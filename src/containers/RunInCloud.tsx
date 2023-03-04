import { Layout, Checkbox, Select, Input, Form, Button, notification } from 'antd';
import {useState, useCallback} from 'react'
import {track} from '../utils/metrics'
const { Header } = Layout;

const RunInCloud = () => {
    const [api, contextHolder] = notification.useNotification();

    const [wouldUse, setWouldUse] = useState(false)
    const [numCpu, setNumCPU] = useState<string|undefined>("nocpu")
    const [gpuType, setGPUType] = useState<string|undefined>("nogpu")
    const [numGpu, setNumGPU] = useState<string|undefined>()
    const [budget, setBudget] = useState<string|undefined>()
    const [email, setEmail] = useState<string|undefined>()
    const [comments, setComments] = useState<string|undefined>()

    const onSend = useCallback(() => {
        track('RunInCloudSurvey', {wouldUse, numCpu, gpuType, numGpu, budget, email, comments})
        api.open({
            message: 'Thank you',
            description:
              'We appreaciate the feedback. Please reach out on email or GitHub if you have specific needs.'
          });
    }, [api, wouldUse, numCpu, gpuType, numGpu, budget, email, comments])

    return (
    <>
        {contextHolder}
        <Header className="site-layout-background" style={{ fontSize: 25 }}>
            Run in cloud
        </Header>
        <div style={{padding: 10, margin: 10}}>
            Running simulations in the browser is a fantastic way to get started with LAMMPS and can be used to run smaller simulations. However, simulations often require more powerful compute power than what is available in the browser.
            We are considering adding cloud support, so that you can test your simulations in the browser and then run them on high performance computers in the cloud. Before adding this feature, we want to gather more information about the interest.
            <br />
            <br /> 
            We would appreaciate if you could fill in this form. It would be of great help to decide on whether or not this is a good idea, and how to do it right.
            <br /> 
            <br /> 
            <Form
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
                style={{ maxWidth: 600 }}
            >
                <Form.Item name="wouldUse" valuePropName="checked">
                    <Checkbox onChange={(e) => setWouldUse(e.target.checked)}>I would buy this</Checkbox>
                </Form.Item>
                How many CPU cores would you want?
                <Form.Item name="cpu" valuePropName="checked">
                    <Select disabled={!wouldUse} onChange={(value) => {setNumCPU(value)}} defaultValue={"n/a"}>
                        <Select.Option value="n/a">Does not matter</Select.Option>
                        <Select.Option value="4">4 cores</Select.Option>
                        <Select.Option value="16">16 cores</Select.Option>
                        <Select.Option value="64">64 cores</Select.Option>
                        <Select.Option value="176">176 cores</Select.Option>
                    </Select>
                </Form.Item>
                What kind of GPU would you want?
                <Form.Item name="gpu" valuePropName="checked">
                    <Select disabled={!wouldUse} onChange={(value) => {setGPUType(value)}} defaultValue={"n/a"}>
                        <Select.Option value="n/a">Does not matter</Select.Option>
                        <Select.Option value="lowgpu">Low end GPU (NVIDIA K80)</Select.Option>
                        <Select.Option value="mediumgpu">Medium end GPU (NVIDIA P100)</Select.Option>
                        <Select.Option value="highgpu">High end GPU (NVIDIA V100)</Select.Option>
                        <Select.Option value="veryhighgpu">Very high end GPU (NVIDIA A100)</Select.Option>
                    </Select>
                </Form.Item>
                {gpuType !== 'nogpu' && 
                <>
                    How many such GPUs would you want?
                    <Form.Item name="gpu" valuePropName="checked">
                        <Select onChange={(value) => {setNumGPU(value)}} defaultValue={"1gpu"}>
                            <Select.Option value="1">1</Select.Option>
                            <Select.Option value="2">2</Select.Option>
                            <Select.Option value="4">4</Select.Option>
                            <Select.Option value="8">8</Select.Option>
                            <Select.Option value="16">16</Select.Option>
                        </Select>
                    </Form.Item>
                </>
                }
                What would be your yearly budget (in USD)?
                <Form.Item name="gpu" valuePropName="checked">
                    <Input placeholder='$' disabled={!wouldUse} onChange={(e) => setBudget(e.target.value)} />
                </Form.Item>

                Email (if you want updates)
                <Form.Item name="gpu" valuePropName="checked">
                    <Input placeholder='user@domain.com' disabled={!wouldUse} onChange={(e) => setEmail(e.target.value)} />
                </Form.Item>

                Additional comments
                <Form.Item name="gpu" valuePropName="checked">
                    <Input placeholder='This is great!' disabled={!wouldUse} onChange={(e) => setComments(e.target.value)} />
                </Form.Item>
                
                <Form.Item>
                    <Button onClick={() => onSend()}>Send</Button>
                </Form.Item>
            </Form>

        </div>
    </>)
}
export default RunInCloud