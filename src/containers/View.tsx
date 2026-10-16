import {
  installParticleAttributes,
  syncParticleAttributes,
} from "../rendering/particleAttributes";
import { applyAmbientOcclusion } from "../utils/ambientOcclusion";
import { useEffect, useState, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import { Layout, Row, Col, Progress, Modal, Button } from "antd";

import {
  useEngine,
  useEngineState,
  useStoreState,
  useStoreActions,
} from "../hooks";
import { Particles, Bonds, Visualizer, ParticleClickEvent } from "omovi";
import ResponsiveSimulationSummary from "../components/ResponsiveSimulationSummary";
import SelectedAtomsInfo from "../components/SelectedAtomsInfo";
import ColorLegend from "../components/ColorLegend";
import ColorModifierSettings from "../modifiers/ColorModifierSettings";
import { track } from "../utils/metrics";
import { remapLeftDragToPan } from "../utils/leftDragPan";
import { applyLighting } from "../utils/lighting";
import { useSimulationBoxOverlays } from "./useSimulationBoxOverlays";

const { Header } = Layout;

interface ViewProps {
  visible: boolean;
  /**
   * Pane mode (new shell's run detail): fill the parent container instead of
   * the viewport, hide the legacy header/summary overlays (the run detail has
   * its own status panel), suppress the no-simulation modal, and release the
   * registered visualizer on unmount so a remount can recreate it.
   */
  pane?: boolean;
}

const visualizerWrapperStyle = (pane: boolean): CSSProperties => ({
  height: pane ? "100%" : "100vh",
  width: "100%",
  position: "relative",
});

const MOBILE_BREAKPOINT = 900;
const SIMULATION_SUMMARY_DRAWER_VISIBLE_KEY = "simulationSummaryDrawerVisible";
const PROGRESS_BAR_HEIGHT = 8;

const View = ({ visible, pane = false }: ViewProps) => {
  const [loading, setLoading] = useState(false);
  const [hideNoSimulation, setHideNoSimulation] = useState(false);
  const [showColorSettings, setShowColorSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= MOBILE_BREAKPOINT,
  );
  // State consistently represents the collapsed state.
  // Initial state is collapsed on mobile, expanded on desktop.
  const [isOverlayCollapsed, setIsOverlayCollapsed] = useState(isMobile);
  const [selectedAtoms, setSelectedAtoms] = useState<Set<number>>(new Set());

  // Initialize from localStorage, defaulting to false (show overlay, not expanded)
  const [showAnalyze, setShowAnalyze] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = localStorage.getItem(
        SIMULATION_SUMMARY_DRAWER_VISIBLE_KEY,
      );
      return stored !== null ? stored === "true" : false;
    }
    return false;
  });

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        // Reset collapsed state when switching between mobile/desktop
        setIsOverlayCollapsed(newIsMobile);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Persist drawer visibility to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(
        SIMULATION_SUMMARY_DRAWER_VISIBLE_KEY,
        showAnalyze.toString(),
      );
    }
  }, [showAnalyze]);
  // const simulationBox = useStoreState(state => state.simulation.simulationBox)
  // const simulationOrigo = useStoreState(state => state.simulation.simulationOrigo)
  const cameraPosition = useStoreState(
    (state) => state.simulation.cameraPosition,
  );
  const cameraTarget = useStoreState((state) => state.simulation.cameraTarget);
  // The live render objects are the EngineRegistry's, not store state.
  const engine = useEngine();
  const particles = useEngineState((objects) => objects.particles);
  const bonds = useEngineState((objects) => objects.bonds);
  const visualizer = useEngineState((objects) => objects.visualizer);
  const panMode = useStoreState((state) => state.render.panMode);

  const refreshParticleStyles = useStoreActions(
    (actions) => actions.render.setParticleStylesUpdated,
  );
  const refreshRendering = useStoreActions(
    (actions) => actions.processing.runPostTimestepRendering,
  );
  const styledVisualizer = useRef<Visualizer | null>(null);

  const renderSettings = useStoreState((state) => state.settings.render);
  const domElement = useRef<HTMLDivElement | null>(null);
  const running = useStoreState((state) => state.simulation.running);
  const loadedWorkdir = useStoreState(
    (state) => state.simulation.loadedWorkdir,
  );
  const runTotalTimesteps = useStoreState(
    (state) => state.simulationStatus.runTotalTimesteps,
  );
  const runTimesteps = useStoreState(
    (state) => state.simulationStatus.runTimesteps,
  );
  const timesteps = useStoreState((state) => state.simulationStatus.timesteps);
  const computes = useStoreState((state) => state.simulationStatus.computes);
  const fixes = useStoreState((state) => state.simulationStatus.fixes);
  const variables = useStoreState((state) => state.simulationStatus.variables);

  // Get color modifier for legend display
  const colorModifier = engine.colorModifier;

  // Determine the type of the computeName (compute, fix, or variable)
  const getModifierType = (
    name: string | undefined,
  ): "compute" | "fix" | "variable" | undefined => {
    if (!name) return undefined;
    if (computes[name]) return "compute";
    if (fixes[name]) return "fix";
    if (variables[name]) return "variable";
    return undefined;
  };

  const handleClearSelection = useCallback(() => {
    setSelectedAtoms(new Set());
    if (visualizer) {
      visualizer.clearSelection();
    }
  }, [visualizer]);

  // Add Esc key handler to clear selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedAtoms.size > 0) {
        handleClearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedAtoms, handleClearSelection]);

  // Pan mode (toggled with P): left-drag pans, for trackpads and browsers
  // where right-drag is unavailable. Right-drag keeps panning either way.
  useEffect(() => {
    if (!panMode || !visualizer || !domElement.current) return;
    return remapLeftDragToPan(
      domElement.current,
      visualizer.renderer.getRawRenderer().domElement,
    );
  }, [panMode, visualizer]);

  useEffect(() => {
    if (domElement.current && !loading && !visualizer) {
      setLoading(true);
      const newVisualizer = new Visualizer({
        domElement: domElement.current,
        // onCameraChanged: (position: THREE.Vector3, target: THREE.Vector3) => {console.log(position, target)}
        onParticleClick: (event: ParticleClickEvent) => {
          const { particleIndex, shiftKey } = event;

          setSelectedAtoms((prevSelection) => {
            const newSelection = new Set(prevSelection);

            if (shiftKey) {
              // Shift+click: toggle selection
              if (newSelection.has(particleIndex)) {
                newSelection.delete(particleIndex);
              } else {
                newSelection.add(particleIndex);
              }
            } else {
              // Plain click: if the only selected atom is clicked again, deselect it.
              // Otherwise, select just this one.
              const isDeselecting =
                newSelection.size === 1 && newSelection.has(particleIndex);
              newSelection.clear();
              if (!isDeselecting) {
                newSelection.add(particleIndex);
              }
            }

            // Update visualizer selection
            newVisualizer.clearSelection();
            newSelection.forEach((idx) => {
              newVisualizer.setSelected(idx, true);
            });

            return newSelection;
          });
        },
      });
      installParticleAttributes(newVisualizer);
      engine.setVisualizer(newVisualizer);
      // A new renderer has no colors or radii yet.
      refreshParticleStyles(true);
      setLoading(false);
      newVisualizer.materials.particles.shininess = 50;

      // Initialize post-processing with settings
      newVisualizer.initPostProcessing({
        ssao: {
          enabled: renderSettings.ssao,
          radius: renderSettings.ssaoRadius,
          intensity: renderSettings.ssaoIntensity,
        },
      });

      // Apply lighting settings
      applyAmbientOcclusion(newVisualizer, renderSettings);
      applyLighting(newVisualizer, renderSettings);

      // Check for WebXR support and show VR button if available
      if (navigator.xr) {
        navigator.xr
          .isSessionSupported("immersive-vr")
          .then((supported) => {
            if (supported && domElement.current) {
              const vrButton = newVisualizer.enableXR();
              if (vrButton) domElement.current.appendChild(vrButton);
            }
          })
          .catch((err) => {
            console.warn("Failed to check for WebXR support:", err);
          });
      }
    }
  }, [
    domElement,
    engine,
    refreshParticleStyles,
    visualizer,
    loading,
    renderSettings,
  ]);

  useEffect(() => {
    if (visible && domElement.current) {
      // There is a bug where the height is set to zero when going back to this view
      domElement.current.style.height = pane ? "100%" : "100vh";
    }
    if (visualizer) {
      visualizer.idle = !visible;
    }
  }, [visible, visualizer, pane]);

  // Auto-reset selection when a new run is loaded
  useEffect(() => {
    handleClearSelection();
  }, [loadedWorkdir, handleClearSelection]);

  const prevParticlesRef = useRef<Particles | null>(null);
  useEffect(() => {
    prevParticlesRef.current = particles ?? null;
  });
  const prevParticles = prevParticlesRef.current;

  useEffect(() => {
    if (cameraPosition && visualizer) {
      visualizer.setCameraPosition(cameraPosition);
    }
  }, [cameraPosition, visualizer]);

  useEffect(() => {
    if (cameraTarget && visualizer) {
      visualizer.setCameraTarget(cameraTarget);
    }
  }, [cameraTarget, visualizer]);

  const prevBondsRef = useRef<Bonds | null>(null);
  useEffect(() => {
    prevBondsRef.current = bonds ?? null;
  });
  const prevBonds = prevBondsRef.current;

  useEffect(() => {
    if (!visualizer) {
      return;
    }

    if (prevParticles && prevParticles !== particles) {
      visualizer.remove(prevParticles);
      prevParticles.dispose();
    }

    if (particles) {
      // A completed run can predate this viewport. Bind attributes and restore
      // styles from the cached frame even when no further timestep will arrive.
      syncParticleAttributes(visualizer, particles);
      if (styledVisualizer.current !== visualizer) {
        styledVisualizer.current = visualizer;
        refreshParticleStyles(true);
        refreshRendering();
      }
      visualizer.add(particles);
    }

    if (prevBonds && prevBonds !== bonds) {
      visualizer.remove(prevBonds!);
      prevBonds.dispose();
    }

    if (bonds) {
      visualizer.add(bonds);
    }
  }, [
    particles,
    prevParticles,
    prevBonds,
    bonds,
    visualizer,
    refreshParticleStyles,
    refreshRendering,
  ]);

  // Apply render settings when they change
  useEffect(() => {
    if (visualizer) {
      // Update post-processing settings
      if (visualizer.isPostProcessingEnabled()) {
        visualizer.updatePostProcessingSettings({
          ssao: {
            enabled: renderSettings.ssao,
            radius: renderSettings.ssaoRadius,
            intensity: renderSettings.ssaoIntensity,
          },
        });
      }

      if (visualizer.isPostProcessingEnabled())
        applyAmbientOcclusion(visualizer, renderSettings);

      // Update lighting
      applyLighting(visualizer, renderSettings);

      // Update camera projection mode
      visualizer.setOrthographic(renderSettings.orthographic);
    }
  }, [renderSettings, visualizer]);

  // Apply embed config settings
  useEffect(() => {
    if (visualizer) {
      // Camera controls and particle picking are always on (the embed
      // config that could disable them is gone with embedded mode).
      visualizer.setControlsEnabled(true);
      visualizer.setPickingEnabled(true);
    }
  }, [visualizer]);

  // Camera planes, simulation box and walls (useSimulationBoxOverlays.ts).
  const { disposeBoxGroup, disposeWallGroup } = useSimulationBoxOverlays(
    visualizer,
    renderSettings,
  );

  useEffect(() => {
    return () => {
      disposeBoxGroup();
      disposeWallGroup();
      if (visualizer) {
        visualizer.dispose();
        if (pane) {
          // In the legacy shell View never unmounts, so the registry keeping
          // a reference was harmless. The run-detail pane mounts/unmounts per
          // navigation: release the disposed instance so the next mount's
          // creation effect (guarded by `!visualizer`) builds a fresh one.
          engine.setVisualizer(undefined);
        }
      }
    };
  }, [visualizer, disposeBoxGroup, disposeWallGroup, pane, engine]);

  const title = loadedWorkdir ?? "No simulation";
  const showNoSimulationModal =
    loadedWorkdir == null && !hideNoSimulation && !pane;

  return (
    <Layout style={{ height: pane ? "100%" : "100vh" }}>
      {!pane && (
        <Header
          className="site-layout-background"
          style={{
            backgroundColor: "rgba(0,0,0,0)",
            position: "fixed",
            zIndex: 100,
          }}
        >
          <Col>
            <Row style={{ fontSize: "32px", fontWeight: 600 }}>{title}</Row>
            <Row>
              {running && (
                <Progress
                  showInfo={false}
                  style={{ marginTop: "-15px" }}
                  strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
                  size={["100%", PROGRESS_BAR_HEIGHT]}
                  percent={Math.round(
                    100 * (runTimesteps / (runTotalTimesteps + 1)),
                  )}
                />
              )}
            </Row>
          </Col>
        </Header>
      )}
      <div id="canvas-container" style={{ height: "100%", width: "100%" }}>
        <div ref={domElement} style={visualizerWrapperStyle(pane)}>
          {showColorSettings && (
            <ColorModifierSettings
              open={true}
              onClose={() => setShowColorSettings(false)}
            />
          )}
          {!pane && (
            <ResponsiveSimulationSummary
              isMobile={isMobile}
              isOverlayCollapsed={isOverlayCollapsed}
              showAnalyze={showAnalyze}
              onExpand={() => setIsOverlayCollapsed(false)}
              onCollapse={() => setIsOverlayCollapsed(true)}
              onShowMore={() => {
                track("SimulationSummary.ShowMore");
                // Only allow expanded view on desktop
                if (!isMobile) {
                  setShowAnalyze(true);
                }
              }}
              onShowLess={() => {
                track("SimulationSummary.ShowLess");
                setShowAnalyze(false);
              }}
            />
          )}
          {panMode && (
            <div
              data-testid="pan-mode-indicator"
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                zIndex: 1,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(0, 0, 0, 0.55)",
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: 12,
                pointerEvents: "none",
              }}
            >
              Pan mode · press P to rotate
            </div>
          )}
          <SelectedAtomsInfo
            selectedAtoms={selectedAtoms}
            particles={particles}
            timesteps={timesteps}
            onClearSelection={handleClearSelection}
          />
          {colorModifier?.computeName && (
            <ColorLegend
              computeName={colorModifier.computeName}
              minValue={colorModifier.getEffectiveMinValue()}
              maxValue={colorModifier.getEffectiveMaxValue()}
              type={getModifierType(colorModifier.computeName)}
              colormap={colorModifier.colormap}
              onSettingsClick={() => setShowColorSettings(true)}
            />
          )}
        </div>
      </div>
      {showNoSimulationModal && (
        <Modal
          open
          onCancel={() => setHideNoSimulation(true)}
          footer={[
            <Button key="ok" onClick={() => setHideNoSimulation(true)}>
              OK
            </Button>,
          ]}
          title="No simulation"
        >
          You can create a new simulation or run one of the built-in examples.
        </Modal>
      )}
    </Layout>
  );
};

export default View;
