import { Modal, Select, Divider, InputNumber, Checkbox, Button, Space } from "antd";
import { useStoreState, useStoreActions } from "../hooks";
import { useCallback, useState } from "react";
import { track } from "../utils/metrics";
import ColorModifier from "./colormodifier";
const { Option, OptGroup } = Select;

const ColorModifierSettings = ({ onClose }: { onClose: () => void }) => {
  const computes = useStoreState((state) => state.simulationStatus.computes);
  const postTimestepModifiers = useStoreState(
    (state) => state.processing.postTimestepModifiers,
  );
  const setParticleStylesUpdated = useStoreActions(
    (actions) => actions.render.setParticleStylesUpdated,
  );
  const colorModifier = postTimestepModifiers.filter(
    (modifier) => modifier.name === "Colors",
  )[0] as ColorModifier;
  const perAtomComputes = Object.values(computes).filter(
    (compute) => compute.isPerAtom,
  );

  const [useCustomRange, setUseCustomRange] = useState(
    colorModifier.customMinValue !== undefined || 
    colorModifier.customMaxValue !== undefined
  );
  const [customMin, setCustomMin] = useState<number | null>(
    colorModifier.customMinValue ?? null
  );
  const [customMax, setCustomMax] = useState<number | null>(
    colorModifier.customMaxValue ?? null
  );

  const onChange = useCallback(
    (value: string) => {
      if (value !== "type") {
        track("Settings.Render.ColorBy", {
          value: "Compute",
          name: "ParticleType",
        });
        colorModifier.computeName = value;
      } else {
        track("Settings.Render.ColorBy", { value: "ParticleType" });
        colorModifier.computeName = undefined;
        setParticleStylesUpdated(true);
      }
    },
    [colorModifier, setParticleStylesUpdated],
  );

  const handleCustomRangeToggle = useCallback(
    (checked: boolean) => {
      setUseCustomRange(checked);
      if (!checked) {
        colorModifier.customMinValue = undefined;
        colorModifier.customMaxValue = undefined;
      } else {
        // Initialize with global values only if they are finite
        const minValue = isFinite(colorModifier.globalMinValue) ? colorModifier.globalMinValue : 0;
        const maxValue = isFinite(colorModifier.globalMaxValue) ? colorModifier.globalMaxValue : 1;
        colorModifier.customMinValue = customMin ?? minValue;
        colorModifier.customMaxValue = customMax ?? maxValue;
        setCustomMin(colorModifier.customMinValue);
        setCustomMax(colorModifier.customMaxValue);
      }
    },
    [colorModifier, customMin, customMax],
  );

  const handleMinChange = useCallback(
    (value: number | null) => {
      setCustomMin(value);
      if (value !== null && useCustomRange) {
        colorModifier.customMinValue = value;
      }
    },
    [colorModifier, useCustomRange],
  );

  const handleMaxChange = useCallback(
    (value: number | null) => {
      setCustomMax(value);
      if (value !== null && useCustomRange) {
        colorModifier.customMaxValue = value;
      }
    },
    [colorModifier, useCustomRange],
  );

  const handleResetRange = useCallback(() => {
    colorModifier.resetMinMax = true;
    setCustomMin(null);
    setCustomMax(null);
    colorModifier.customMinValue = undefined;
    colorModifier.customMaxValue = undefined;
    setUseCustomRange(false);
  }, [colorModifier]);

  const defaultValue = colorModifier.computeName
    ? colorModifier.computeName
    : "type";
  
  const showRangeControls = colorModifier.computeName !== undefined;
  return (
    <Modal
      title="Particle color settings"
      open
      footer={null}
      onCancel={onClose}
      width={480}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Color by:</div>
          <Select
            defaultValue={defaultValue}
            style={{ width: "100%" }}
            onChange={onChange}
          >
            <Option value="type">Particle type</Option>
            <OptGroup label="Computes">
              {perAtomComputes.map((compute) => (
                <Option key={compute.name} value={compute.name}>
                  {compute.name}
                </Option>
              ))}
            </OptGroup>
            <OptGroup label="Fixes"></OptGroup>
          </Select>
        </div>

        {showRangeControls && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Value Range:</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Global: [{isFinite(colorModifier.globalMinValue) ? colorModifier.globalMinValue.toExponential(2) : "N/A"}, {isFinite(colorModifier.globalMaxValue) ? colorModifier.globalMaxValue.toExponential(2) : "N/A"}]
                </div>
              </div>

              <Checkbox
                checked={useCustomRange}
                onChange={(e) => handleCustomRangeToggle(e.target.checked)}
                style={{ marginBottom: 12 }}
                disabled={!isFinite(colorModifier.globalMinValue) || !isFinite(colorModifier.globalMaxValue)}
              >
                Use custom range
              </Checkbox>

              {useCustomRange && (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <div style={{ marginBottom: 4, fontSize: 12 }}>Minimum value:</div>
                    <InputNumber
                      value={customMin}
                      onChange={handleMinChange}
                      style={{ width: "100%" }}
                      step={0.1}
                    />
                  </div>
                  <div>
                    <div style={{ marginBottom: 4, fontSize: 12 }}>Maximum value:</div>
                    <InputNumber
                      value={customMax}
                      onChange={handleMaxChange}
                      style={{ width: "100%" }}
                      step={0.1}
                    />
                  </div>
                </Space>
              )}

              <Button 
                onClick={handleResetRange}
                style={{ marginTop: 12 }}
                size="small"
              >
                Reset global min/max
              </Button>
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
};
export default ColorModifierSettings;
