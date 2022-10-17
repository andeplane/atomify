import {Modal, Checkbox, Slider} from 'antd'
import { useStoreState, useStoreActions } from '../hooks';

interface RenderSettingsProps {
  open?: boolean
  onClose: () => void
}

const RenderSettings = ({open, onClose}: RenderSettingsProps) => {
  const ssao = useStoreState(state => state.renderSettings.ssao)
  const setSsao = useStoreActions(actions => actions.renderSettings.setSsao)
  const brightness = useStoreState(state => state.renderSettings.brightness)
  const setBrightness = useStoreActions(actions => actions.renderSettings.setBrightness)

  return (
    <Modal title="Render settings" footer={null} open={open} onCancel={() => onClose()}>
      <p>
        <Checkbox checked={ssao} onChange={(e) => setSsao(e.target.checked)}>
          Enable SSAO
        </Checkbox>
      </p>
      <div>
        Brightness
        <Slider min={0.1} max={2.0} step={0.1} defaultValue={brightness} onChange={(value) => setBrightness(value)} />
      </div>
    </Modal>
  )
}

export default RenderSettings