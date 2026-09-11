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
  // A world-space radius of 10 can cover the whole model in LJ units and
  // amplify sampling lines. Keep the occlusion neighborhood in screen pixels.
  pass.configuration.screenSpaceRadius = true;
  // More hemisphere and denoising samples suppress the visible stippling.
  // The faster mode remains available for phones and larger viewports.
  pass.setQualityMode(settings.ssaoQuality === "fast" ? "Medium" : "Ultra");
  visualizer.forceRender = true;
}
