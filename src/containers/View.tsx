import { useEffect, useState, useRef, useCallback } from "react";
import { Layout, Row, Col, Progress, Modal, Button } from "antd";

import { useStoreState, useStoreActions } from "../hooks";
import { Particles, Bonds, Visualizer, ParticleClickEvent } from "omovi";
import ResponsiveSimulationSummary from "../components/ResponsiveSimulationSummary";
import SimulationSummaryModal from "../components/SimulationSummaryModal";
import SelectedAtomsInfo from "../components/SelectedAtomsInfo";
import ColorLegend from "../components/ColorLegend";
import SimulationSummary from "./SimulationSummary";
import ColorModifierSettings from "../modifiers/ColorModifierSettings";
import { AreaChartOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { track } from "../utils/metrics";
import { useEmbeddedMode } from "../hooks/useEmbeddedMode";
import ColorModifier from "../modifiers/colormodifier";
import * as THREE from "three";
import {
  createBoxGeometry,
  calculateBoxRadius,
  getSimulationBoxBounds,
} from "../utils/boxGeometry";

// Type guard for Visualizer with updateCameraPlanes method
interface VisualizerWithCameraPlanes extends Visualizer {
  updateCameraPlanes: (box: THREE.Box3) => void;
}

function visualizerHasCameraPlanes(
  v: Visualizer,
): v is VisualizerWithCameraPlanes {
  return (
    "updateCameraPlanes" in v &&
    typeof (v as any).updateCameraPlanes === "function"
  );
}

const { Header, Sider } = Layout;

interface ViewProps {
  visible: boolean;
  isEmbeddedMode?: boolean;
}

const AnalyzeButtonContainer = styled.div`
  position: fixed !important;
  bottom: 0;
  right: 0;
  margin-bottom: 20px;
`;

const MobileSummaryButtonContainer = styled.div`
  position: fixed !important;
  bottom: 0;
  right: 0;
  margin-bottom: 20px;
  margin-right: 20px;
`;

const Container = styled.div`
  color: #ffffff;
  height: 100vh;
`;

const VisualizerWrapper = styled.div`
  height: 100vh;
  width: 100%;
  position: relative;
`;

const MOBILE_BREAKPOINT = 900;

const View = ({ visible, isEmbeddedMode = false }: ViewProps) => {
  const [loading, setLoading] = useState(false);
  const [hideNoSimulation, setHideNoSimulation] = useState(false);
  const [showColorSettings, setShowColorSettings] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [showMobileSummaryModal, setShowMobileSummaryModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  // State consistently represents the collapsed state.
  // Initial state is collapsed on mobile, expanded on desktop.
  const [isOverlayCollapsed, setIsOverlayCollapsed] = useState(isMobile);
  const [selectedAtoms, setSelectedAtoms] = useState<Set<number>>(new Set());
  const { embedConfig } = useEmbeddedMode();

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);
  // const simulationBox = useStoreState(state => state.simulation.simulationBox)
  // const simulationOrigo = useStoreState(state => state.simulation.simulationOrigo)
  const cameraPosition = useStoreState(
    (state) => state.simulation.cameraPosition,
  );
  const cameraTarget = useStoreState((state) => state.simulation.cameraTarget);
  const particles = useStoreState((state) => state.render.particles);
  const bonds = useStoreState((state) => state.render.bonds);
  const visualizer = useStoreState((state) => state.render.visualizer);
  const setVisualizer = useStoreActions(
    (actions) => actions.render.setVisualizer,
  );

  const renderSettings = useStoreState((state) => state.settings.render);
  const setRenderSettings = useStoreActions(
    (actions) => actions.settings.setRender,
  );
  const domElement = useRef<HTMLDivElement | null>(null);
  const running = useStoreState((state) => state.simulation.running);
  const simulation = useStoreState((state) => state.simulation.simulation);
  const runTotalTimesteps = useStoreState(
    (state) => state.simulationStatus.runTotalTimesteps,
  );
  const runTimesteps = useStoreState(
    (state) => state.simulationStatus.runTimesteps,
  );
  const timesteps = useStoreState(
    (state) => state.simulationStatus.timesteps,
  );
  const simulationBox = useStoreState((state) => state.simulationStatus.box);
  const simulationOrigo = useStoreState(
    (state) => state.simulationStatus.origo,
  );
  const postTimestepModifiers = useStoreState(
    (state) => state.processing.postTimestepModifiers,
  );
  const computes = useStoreState((state) => state.simulationStatus.computes);
  const fixes = useStoreState((state) => state.simulationStatus.fixes);
  const variables = useStoreState((state) => state.simulationStatus.variables);
  const boxGroupRef = useRef<THREE.Group | null>(null);
  
  // Get color modifier for legend display
  const colorModifier = postTimestepModifiers.find(
    (modifier) => modifier.name === "Colors",
  ) as ColorModifier | undefined;

  // Determine the type of the computeName (compute, fix, or variable)
  const getModifierType = (name: string | undefined): "compute" | "fix" | "variable" | undefined => {
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
      if (event.key === 'Escape' && selectedAtoms.size > 0) {
        handleClearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAtoms, handleClearSelection]);


  const disposeBoxGroup = useCallback(() => {
    if (boxGroupRef.current && visualizer) {
      // Dispose of all cylinders in the group
      boxGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      visualizer.scene.remove(boxGroupRef.current);
      boxGroupRef.current = null;
    }
  }, [visualizer]);

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
              const isDeselecting = newSelection.size === 1 && newSelection.has(particleIndex);
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
        }
      });
      setVisualizer(newVisualizer);
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
      newVisualizer.pointLight.intensity = renderSettings.pointLightIntensity;
      newVisualizer.ambientLight.intensity = renderSettings.ambientLightIntensity;
    }
  }, [domElement, setVisualizer, visualizer, loading, renderSettings]);

  useEffect(() => {
    if (visible && domElement.current) {
      // There is a bug where the height is set to zero when going back to this view
      domElement.current.style.height = "100vh";
    }
    if (visualizer) {
      visualizer.idle = !visible;
    }
  }, [visible, visualizer]);

  // Auto-reset selection when simulation changes
  useEffect(() => {
    handleClearSelection();
  }, [simulation, handleClearSelection]);

  const prevParticlesRef = useRef<Particles>();
  useEffect(() => {
    prevParticlesRef.current = particles;
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

  const prevBondsRef = useRef<Bonds>();
  useEffect(() => {
    prevBondsRef.current = bonds;
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
      visualizer.add(particles);
    }

    if (prevBonds && prevBonds !== bonds) {
      visualizer.remove(prevBonds!);
      prevBonds.dispose();
    }

    if (bonds) {
      visualizer.add(bonds);
    }
  }, [particles, prevParticles, prevBonds, bonds, visualizer]);

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
      
      // Update lighting
      visualizer.pointLight.intensity = renderSettings.pointLightIntensity;
      visualizer.ambientLight.intensity = renderSettings.ambientLightIntensity;

      // Update camera projection mode
      visualizer.setOrthographic(renderSettings.orthographic);
    }
  }, [renderSettings, visualizer]);

  // Apply embed config settings
  useEffect(() => {
    if (visualizer) {
      // Apply camera controls setting
      visualizer.setControlsEnabled(embedConfig.enableCameraControls);
      
      // Apply particle picking setting
      visualizer.setPickingEnabled(embedConfig.enableParticlePicking);
    }
  }, [visualizer, embedConfig.enableCameraControls, embedConfig.enableParticlePicking]);

  // Apply showSimulationBox setting from embed config
  useEffect(() => {
    if (renderSettings.showSimulationBox !== embedConfig.showSimulationBox) {
      setRenderSettings({
        ...renderSettings,
        showSimulationBox: embedConfig.showSimulationBox,
      });
    }
  }, [embedConfig.showSimulationBox, renderSettings, setRenderSettings]);

  // Update camera planes based on simulation box bounds
  useEffect(() => {
    if (!visualizer) {
      return;
    }

    // If simulation box is available, use it to update camera planes
    // This takes precedence over system bounds from particles/bonds
    if (simulationBox && simulationOrigo && visualizerHasCameraPlanes(visualizer)) {
      const boundingBox = getSimulationBoxBounds(simulationBox, simulationOrigo);
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
      const boxGroup = createBoxGeometry(simulationBox, simulationOrigo, radius);
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

  useEffect(() => {
    return () => {
      disposeBoxGroup();
      if (visualizer) {
        visualizer.dispose();
      }
    };
  }, [visualizer, disposeBoxGroup]);

  const title = simulation ? simulation.id : "No simulation";
  const showNoSimulationModal = simulation == null && !hideNoSimulation && !isEmbeddedMode;

  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        className="site-layout-background"
        style={{
          backgroundColor: "rgba(0,0,0,0)",
          position: "fixed",
        }}
      >
        <Col>
          <Row style={{ fontSize: '32px', fontWeight: 600 }}>{title}</Row>
          <Row>
            {running && (
              <Progress
                showInfo={false}
                style={{ marginTop: "-15px" }}
                strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
                size={8}
                percent={Math.round(
                  100 * (runTimesteps / (runTotalTimesteps + 1)),
                )}
              />
            )}
          </Row>
        </Col>
      </Header>
      <div id="canvas-container" style={{ height: "100%", width: "100%" }}>
        <VisualizerWrapper ref={domElement}>
          {showColorSettings && (
            <ColorModifierSettings
              open={true}
              onClose={() => setShowColorSettings(false)}
            />
          )}
          {embedConfig.showSimulationSummary && (
            <ResponsiveSimulationSummary
              isEmbeddedMode={isEmbeddedMode}
              showSimulationSummary={embedConfig.showSimulationSummary}
              isMobile={isMobile}
              isOverlayCollapsed={isOverlayCollapsed}
              showAnalyze={showAnalyze}
              onExpand={() => setIsOverlayCollapsed(false)}
              onCollapse={() => setIsOverlayCollapsed(true)}
              onShowMore={() => setShowAnalyze(true)}
            />
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
        </VisualizerWrapper>
      </div>
      {!isEmbeddedMode && (
        <>
          {!isMobile && (
            <AnalyzeButtonContainer>
              <AreaChartOutlined
                style={{
                  fontSize: "32px",
                  color: "#fff",
                  marginRight: 70,
                  zIndex: 1000,
                }}
                onClick={() => {
                  if (!showAnalyze) {
                    track("SimulationSummary.Open");
                  } else {
                    track("SimulationSummary.Close");
                  }
                  setShowAnalyze(!showAnalyze);
                }}
              />
            </AnalyzeButtonContainer>
          )}
          {isMobile && (
            <MobileSummaryButtonContainer>
              <AreaChartOutlined
                style={{
                  fontSize: "32px",
                  color: "#fff",
                  zIndex: 1000,
                }}
                onClick={() => {
                  track("SimulationSummary.Modal.Open");
                  setShowMobileSummaryModal(true);
                }}
              />
            </MobileSummaryButtonContainer>
          )}
        </>
      )}
      {showAnalyze && !isEmbeddedMode && (
        <Sider
          reverseArrow
          collapsible
          onCollapse={() => setShowAnalyze(false)}
          width={300}
        >
          <Container>
            <SimulationSummary />
          </Container>
        </Sider>
      )}
      {showNoSimulationModal && (
        <Modal
          open
          onCancel={() => setHideNoSimulation(true)}
          footer={[
            <Button onClick={() => setHideNoSimulation(true)}>OK</Button>,
          ]}
          title="No simulation"
        >
          You can create a new simulation or run one of the built-in examples.
        </Modal>
      )}
      {isMobile && (
        <SimulationSummaryModal
          open={showMobileSummaryModal}
          onClose={() => setShowMobileSummaryModal(false)}
        />
      )}
    </Layout>
  );
};

export default View;
