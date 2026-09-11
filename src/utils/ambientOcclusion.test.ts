import { expect, it, vi } from "vitest";
import type { Visualizer } from "omovi";
import { applyAmbientOcclusion } from "./ambientOcclusion";

it("uses a world-space radius and a denoised default, retaining the faster option", () => {
  const pass = {
    configuration: { screenSpaceRadius: true },
    setQualityMode: vi.fn(),
  };
  const v = {
    renderer: { postProcessingManager: { n8aoPass: pass } },
    forceRender: false,
  } as unknown as Visualizer;
  applyAmbientOcclusion(v, {});
  expect(pass.configuration.screenSpaceRadius).toBe(false);
  expect(pass.setQualityMode).toHaveBeenLastCalledWith("Ultra");
  expect(v.forceRender).toBe(true);
  applyAmbientOcclusion(v, { ssaoQuality: "fast" });
  expect(pass.setQualityMode).toHaveBeenLastCalledWith("Medium");
});
