import {Modal, Table, Slider} from 'antd'
import type { ColumnsType } from 'antd/es/table';
import { useStoreState, useStoreActions } from '../hooks';
import {useCallback} from 'react'

interface SettingsType {
  key: React.ReactNode
  name: string
  value: string|number
}

const SyncParticlesSettings = ({onClose}:{onClose: () => void}) => {
  const particleRadius = useStoreState(state => state.render.particleRadius)
  const setParticleRadius = useStoreActions(actions => actions.render.setParticleRadius)
  const particles = useStoreState(state => state.render.particles)

  const onParticleRadiusChanged = useCallback((value: number) => {
    const oldValue = particleRadius
    const factor = value / oldValue
    for (let i = 0; i < particles.count; i++) {
      particles.radii[i] *= factor
    }
    setParticleRadius(value)
    particles.markNeedsUpdate()
  }, [particleRadius, setParticleRadius, particles])

  const columns: ColumnsType<SettingsType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: '80%',
      render: (value, record) => <Slider min={0.2} max={2} step={0.02} onChange={onParticleRadiusChanged} value={value} />
    }
  ];

  return (
    <Modal title="Particle settings" open footer={null} onCancel={onClose}>
      <Table
        size='small'
        showHeader={false}
        columns={columns}
        dataSource={[
          {
            key: 'bondradius',
            name: 'Particle radius',
            value: particleRadius
          }
        ]}
        pagination={{hideOnSinglePage: true}}
      />
    </Modal>
  )
}
export default SyncParticlesSettings