import {Modal, Select} from 'antd'
import { useStoreState } from '../hooks';
import {useCallback} from 'react'
import ColorModifier from './colormodifier';
const {Option, OptGroup} = Select

const ColorModifierSettings = ({onClose}:{onClose: () => void}) => {
  const computes = useStoreState(state => state.simulationStatus.computes)
  // const fixes = useStoreState(state => state.simulationStatus.fixes)
  const postTimestepModifiers = useStoreState(state => state.processing.postTimestepModifiers)
  const colorModifier = postTimestepModifiers.filter(modifier => modifier.name==="Colors")[0] as ColorModifier
  const perAtomComputes = computes.filter(compute => compute.isPerAtom)
  console.log("These are the computes: ", perAtomComputes)
  
  const onChange = useCallback((value: string) => {
    if (value !== "type") {
      colorModifier.computeName = value
    } else {
      colorModifier.computeName = undefined
    }
  }, [colorModifier])
  
  return (
    <Modal title="Particle color settings" open footer={null} onCancel={onClose}>
      <Select defaultValue="type" style={{ width: 200 }} onChange={onChange}>
        <Option value="type">Particle type</Option>
        <OptGroup label="Computes">
          {perAtomComputes.map(compute => (
            <Option value={compute.name}>{compute.name}</Option>
          ))}
        </OptGroup>
        <OptGroup label="Fixes">
          
        </OptGroup>
      </Select>
    </Modal>
  )
}
export default ColorModifierSettings