import {Modal, Select} from 'antd'
import { useStoreState, useStoreActions } from '../hooks';
import {useCallback} from 'react'
import ColorModifier from './colormodifier';
const {Option, OptGroup} = Select

const ColorModifierSettings = ({onClose}:{onClose: () => void}) => {
  const computes = useStoreState(state => state.simulationStatus.computes)
  // const fixes = useStoreState(state => state.simulationStatus.fixes)
  const postTimestepModifiers = useStoreState(state => state.processing.postTimestepModifiers)
  const setParticleStylesUpdated = useStoreActions(actions => actions.render.setParticleStylesUpdated)
  const colorModifier = postTimestepModifiers.filter(modifier => modifier.name==="Colors")[0] as ColorModifier
  const perAtomComputes = Object.values(computes).filter(compute => compute.isPerAtom)
  
  const onChange = useCallback((value: string) => {
    if (value !== "type") {
      colorModifier.computeName = value
    } else {
      colorModifier.computeName = undefined
      setParticleStylesUpdated(true)
    }
  }, [colorModifier, setParticleStylesUpdated])
  const defaultValue = colorModifier.computeName ? colorModifier.computeName : 'type'
  return (
    <Modal title="Particle color settings" open footer={null} onCancel={onClose}>
      <Select defaultValue={defaultValue} style={{ width: 200 }} onChange={onChange}>
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