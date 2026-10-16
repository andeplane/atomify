/**
 * The 3D view's scene overlays derived from the simulation status: the
 * camera clipping planes, the simulation box and the walls, rebuilt when
 * the box, walls or their render settings change.
 */

import { useCallback, useEffect, useRef } from "react";
import type { Visualizer } from "omovi";
import * as THREE from "three";
import { useStoreState } from "../hooks";
import type { RenderSettings } from "../store/settings";
import {
  createBoxGeometry,
  calculateBoxRadius,
  getSimulationBoxBounds,
} from "../utils/boxGeometry";
import { createWallGroup } from "../utils/wallGeometry";

// Type guard for Visualizer with updateCameraPlanes method
interface VisualizerWithCameraPlanes extends Visualizer {
  updateCameraPlanes: (box: THREE.Box3) => void;
}

function visualizerHasCameraPlanes(
  v: Visualizer,
): v is VisualizerWithCameraPlanes {
  return (
    "updateCameraPlanes" in v && typeof v.updateCameraPlanes === "function"
  );
}

export function useSimulationBoxOverlays(
  visualizer: Visualizer | undefined,
  renderSettings: Pick<RenderSettings, "showSimulationBox" | "showWalls">,
) {
  const simulationBox = useStoreState((state) => state.simulationStatus.box);
  const simulationOrigo = useStoreState(
    (state) => state.simulationStatus.origo,
  );
  const dimension = useStoreState((state) => state.simulationStatus.dimension);
  const walls = useStoreState((state) => state.simulationStatus.walls);
  const boxGroupRef = useRef<THREE.Group | null>(null);
  const wallGroupRef = useRef<THREE.Group | null>(null);

  const disposeBoxGroup = useCallback(() => {
    if (boxGroupRef.current) {
      // Dispose of all cylinders in the group
      boxGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });

      if (
        visualizer &&
        visualizer.scene &&
        boxGroupRef.current.parent === visualizer.scene
      ) {
        visualizer.scene.remove(boxGroupRef.current);
      }
      boxGroupRef.current = null;
    }
  }, [visualizer]);

  const disposeWallGroup = useCallback(() => {
    if (wallGroupRef.current) {
      // Dispose of all meshes in the group
      wallGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });

      if (
        visualizer &&
        visualizer.scene &&
        wallGroupRef.current.parent === visualizer.scene
      ) {
        visualizer.scene.remove(wallGroupRef.current);
      }
      wallGroupRef.current = null;
    }
  }, [visualizer]);

  // Update camera planes based on simulation box bounds
  useEffect(() => {
    if (!visualizer) {
      return;
    }

    // If simulation box is available, use it to update camera planes
    // This takes precedence over system bounds from particles/bonds
    if (
      simulationBox &&
      simulationOrigo &&
      visualizerHasCameraPlanes(visualizer)
    ) {
      const boundingBox = getSimulationBoxBounds(
        simulationBox,
        simulationOrigo,
      );
      visualizer.updateCameraPlanes(boundingBox);
    }
    // Note: Camera planes are also updated automatically when particles/bonds are added
    // (as a fallback if simulation box is not available)
  }, [visualizer, simulationBox, simulationOrigo]);

  // Handle simulation box visualization
  useEffect(() => {
    if (!visualizer) {
      return;
    }

    const shouldShowBox =
      renderSettings.showSimulationBox &&
      simulationBox !== undefined &&
      simulationOrigo !== undefined;

    // Remove existing box if it exists
    disposeBoxGroup();

    // Create and add box if enabled and data is available
    if (shouldShowBox && simulationBox && simulationOrigo) {
      const radius = calculateBoxRadius(simulationBox);
      const boxGroup = createBoxGeometry(
        simulationBox,
        simulationOrigo,
        radius,
      );
      boxGroupRef.current = boxGroup;
      visualizer.scene.add(boxGroup);
    }
  }, [
    visualizer,
    simulationBox,
    simulationOrigo,
    renderSettings.showSimulationBox,
    disposeBoxGroup,
  ]);

  // Handle wall visualization
  useEffect(() => {
    if (!visualizer) {
      return;
    }

    const shouldShowWalls =
      renderSettings.showWalls &&
      walls.length > 0 &&
      simulationBox !== undefined &&
      simulationOrigo !== undefined;

    // Remove existing walls if they exist
    disposeWallGroup();

    // Create and add walls if data is available
    if (shouldShowWalls && simulationBox && simulationOrigo) {
      const wallGroup = createWallGroup(
        walls,
        simulationBox,
        simulationOrigo,
        dimension,
      );
      wallGroupRef.current = wallGroup;
      visualizer.scene.add(wallGroup);
    }
  }, [
    visualizer,
    walls,
    simulationBox,
    simulationOrigo,
    dimension,
    renderSettings.showWalls,
    disposeWallGroup,
  ]);

  return { disposeBoxGroup, disposeWallGroup };
}
