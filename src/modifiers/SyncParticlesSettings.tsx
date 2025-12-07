import { Modal, Slider, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback } from "react";
import { useStoreActions, useStoreState } from "../hooks";

interface SettingsType {
  key: React.ReactNode;
  name: string;
  value: string | number;
}

const SyncParticlesSettings = ({ onClose }: { onClose: () => void }) => {
  const particleRadius = useStoreState((state) => state.render.particleRadius);
  const setParticleRadius = useStoreActions((actions) => actions.render.setParticleRadius);
  const setParticleStylesUpdated = useStoreActions(
    (actions) => actions.render.setParticleStylesUpdated
  );

  const onParticleRadiusChanged = useCallback(
    (value: number) => {
      setParticleRadius(value);
      setParticleStylesUpdated(true);
    },
    [setParticleStylesUpdated, setParticleRadius]
  );

  const columns: ColumnsType<SettingsType> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      width: "80%",
      render: (value, _record) => (
        <Slider min={0.2} max={2} step={0.02} onChange={onParticleRadiusChanged} value={value} />
      ),
    },
  ];

  return (
    <Modal title="Particle settings" open footer={null} onCancel={onClose}>
      <Table
        size="small"
        showHeader={false}
        columns={columns}
        dataSource={[
          {
            key: "bondradius",
            name: "Particle radius",
            value: particleRadius,
          },
        ]}
        pagination={{ hideOnSinglePage: true }}
      />
    </Modal>
  );
};
export default SyncParticlesSettings;
