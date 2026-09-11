import { expect, it } from "vitest";
import { AmbientLight, PointLight } from "three";
import { applyLighting } from "./lighting";

it("removes distance falloff and finite range while preserving adjustable lighting", () => {
  const visualizer = {
    pointLight: new PointLight(0xffffff, 20, 200, 0.8),
    ambientLight: new AmbientLight(),
  };
  applyLighting(visualizer, {
    pointLightIntensity: 20,
    ambientLightIntensity: 0.05,
  });
  expect(visualizer.pointLight.distance).toBe(0);
  expect(visualizer.pointLight.decay).toBe(0);
  expect(visualizer.pointLight.intensity).toBe(2);
  expect(visualizer.ambientLight.intensity).toBe(0.05);
  applyLighting(visualizer, {
    pointLightIntensity: 0,
    ambientLightIntensity: 0.4,
  });
  expect(visualizer.pointLight.intensity).toBe(0);
  expect(visualizer.ambientLight.intensity).toBe(0.4);
});
