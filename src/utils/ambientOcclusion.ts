import type { Visualizer } from "omovi";
import type { RenderSettings } from "../store/settings";

/** omovi 0.25 does not yet expose N8AO's quality/radius-space controls. */
export function applyAmbientOcclusion(
  visualizer: Visualizer,
  settings: Pick<RenderSettings, "ssaoQuality">,
): void {
  const pass = (
    visualizer.renderer as unknown as {
      postProcessingManager: {
        n8aoPass: {
          configuration: { screenSpaceRadius: boolean };
          setQualityMode: (mode: "Medium" | "Ultra") => void;
        };
      };
    }
  ).postProcessingManager.n8aoPass;
  // Keep the occlusion radius in simulation units (also N8AO's default, set
  // here as a deliberate guard). Occlusion is a property of the geometry:
  // atoms buried in a cluster should stay dark however far the camera is.
  // The previous pixel-radius mode was mis-sized for the 10-unit radius
  // (N8AO wants 16-64 px and a 0.2 falloff there), so the pass degraded to a
  // faint edge detector and the effect looked absent.
  pass.configuration.screenSpaceRadius = false;
  // The grain seen with a large world radius comes from too few samples, so
  // suppress it with more hemisphere and denoising samples instead of a
  // smaller neighborhood. The faster mode remains available for phones and
  // larger viewports.
  pass.setQualityMode(settings.ssaoQuality === "fast" ? "Medium" : "Ultra");
  visualizer.forceRender = true;
}
