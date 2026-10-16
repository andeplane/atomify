import type { Visualizer } from "omovi";
import type { RenderSettings } from "../store/settings";

/** Viewport illumination must not depend on the simulation's length units. */
export function applyLighting(
  visualizer: Pick<Visualizer, "pointLight" | "ambientLight">,
  settings: Pick<
    RenderSettings,
    "pointLightIntensity" | "ambientLightIntensity"
  >,
): void {
  // The default omovi light cuts off at 200 simulation units and attenuates
  // with distance. That makes otherwise identical systems dark at large
  // scales. Keep its camera-facing position, but use uniform illumination.
  visualizer.pointLight.distance = 0;
  visualizer.pointLight.decay = 0;
  // Retain the existing 0–40 control/storage range with a useful 0–4
  // unattenuated intensity (default 2), rather than saturating the model.
  visualizer.pointLight.intensity = settings.pointLightIntensity / 10;
  visualizer.ambientLight.intensity = settings.ambientLightIntensity;
}
