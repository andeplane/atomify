import { useEffect, useState, useRef, useCallback } from "react";
import { Layout, Row, Col, Progress, Modal, Button } from "antd";

import { useStoreState, useStoreActions } from "../hooks";
import { Particles, Bonds, Visualizer, ParticleClickEvent } from "omovi";
import Settings from "./Settings";
import SimulationSummaryOverlay from "../components/SimulationSummaryOverlay";
import SelectedAtomsInfo from "../components/SelectedAtomsInfo";
import SimulationSummary from "./SimulationSummary";
import { SettingOutlined, AreaChartOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { track } from "../utils/metrics";
import * as THREE from "three";
import { createBoxGeometry, calculateBoxRadius } from "../utils/boxGeometry";

const { Header, Sider } = Layout;

interface ViewProps {
  visible: boolean;
  isEmbeddedMode?: boolean;
}

const SettingsButtonContainer = styled.div`
  position: fixed !important;
  bottom: 0;
  right: 0;
  margin-bottom: 20px;
`;

const AnalyzeButtonContainer = styled.div`
  position: fixed !important;
  bottom: 0;
  right: 0;
  margin-bottom: 20px;
`;

const Container = styled.div`
  color: #ffffff;
  height: 100vh;
`;

const View = ({ visible, isEmbeddedMode = false }: ViewProps) => {
  const [loading, setLoading] = useState(false);
  const [hideNoSimulation, setHideNoSimulation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(window.innerWidth > 900);
  const [selectedAtoms, setSelectedAtoms] = useState<Set<number>>(new Set());
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
  const boxGroupRef = useRef<THREE.Group | null>(null);

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
      // Apply initial render settings
      newVisualizer.renderer.renderSsao = renderSettings.ssao;
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

  useEffect(() => {
    if (visualizer) {
      // ts-ignore
      visualizer.renderer.renderSsao = renderSettings.ssao;
      visualizer.pointLight.intensity = renderSettings.pointLightIntensity;
      visualizer.ambientLight.intensity = renderSettings.ambientLightIntensity;
    }
  }, [renderSettings, visualizer]);

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
        <div style={{ height: "100vh", width: "100%" }} ref={domElement}>
          <Settings
            open={showSettings}
            onClose={() => setShowSettings(false)}
          />
          {!showAnalyze && window.innerWidth > 900 && (
            <SimulationSummaryOverlay />
          )}
          <SelectedAtomsInfo
            selectedAtoms={selectedAtoms}
            particles={particles}
            timesteps={timesteps}
            onClearSelection={handleClearSelection}
          />
        </div>
      </div>
      {!isEmbeddedMode && (
        <>
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
          <SettingsButtonContainer>
            <SettingOutlined
              style={{
                fontSize: "32px",
                color: "#fff",
                marginRight: 20,
                zIndex: 1000,
              }}
              onClick={() => {
                track("Settings.Open");
                setShowSettings(true);
              }}
            />
          </SettingsButtonContainer>
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
    </Layout>
  );
};

export default View;
