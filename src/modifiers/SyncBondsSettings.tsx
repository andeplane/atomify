import {Modal, Table, Slider} from 'antd'
import type { ColumnsType } from 'antd/es/table';
import { useStoreState, useStoreActions } from '../hooks';
import {useCallback} from 'react'

interface SettingsType {
  key: React.ReactNode
  name: string
  value: string|number
}

const SyncBondsSettings = ({onClose}:{onClose: () => void}) => {
  const bondRadius = useStoreState(state => state.render.bondRadius)
  const setBondRadius = useStoreActions(actions => actions.render.setBondRadius)
  const bonds = useStoreState(state => state.render.bonds)

  const onBondRadiusChanged = useCallback((value: number) => {
    setBondRadius(value)
    bonds.radii.fill(0.25 * value)
    bonds.markNeedsUpdate()
  }, [setBondRadius, bonds])

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
      render: (value, record) => <Slider min={0.2} max={2} step={0.02} onChange={onBondRadiusChanged} value={value} />
    }
  ];

  return (
    <Modal title="Bonds settings" open footer={null} onCancel={onClose}>
      <Table
        size='small'
        showHeader={false}
        columns={columns}
        dataSource={[
          {
            key: 'bondradius',
            name: 'Bond radius',
            value: bondRadius
          }
        ]}
        pagination={{hideOnSinglePage: true}}
      />
    </Modal>
  )
}
export default SyncBondsSettings