import { useEffect, useState, useRef } from 'react'
import {Layout, Row, Col, Progress, Modal, Button} from 'antd'

import { useStoreState, useStoreActions } from '../hooks';
import {Particles, Bonds, Visualizer} from 'omovi'
import Settings from './Settings'
import SimulationSummaryOverlay from '../components/SimulationSummaryOverlay'
import SimulationSummary from './SimulationSummary'
import {SettingOutlined, AreaChartOutlined} from '@ant-design/icons'
import styled from "styled-components";
import {track} from '../utils/metrics'

const { Header, Sider } = Layout;

interface ViewProps {
  visible: boolean
}

const SettingsButtonContainer = styled.div`
  position:fixed !important;
  bottom:0;
  right:0;
  margin-bottom: 20px;
`

const AnalyzeButtonContainer = styled.div`
  position:fixed !important;
  bottom:0;
  right:0;
  margin-bottom: 20px;
`

const Container = styled.div`
  color: #ffffff;
  height: 100vh;
`

const View = ({visible}: ViewProps) => {
  const [loading, setLoading] = useState(false)
  const [hideNoSimulation, setHideNoSimulation] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAnalyze, setShowAnalyze] = useState(window.innerWidth > 900)
  // const simulationBox = useStoreState(state => state.simulation.simulationBox)
  // const simulationOrigo = useStoreState(state => state.simulation.simulationOrigo)
  const cameraPosition = useStoreState(state => state.simulation.cameraPosition)
  const cameraTarget = useStoreState(state => state.simulation.cameraTarget)
  const particles = useStoreState(state => state.render.particles)
  const bonds = useStoreState(state => state.render.bonds)
  const visualizer = useStoreState(state => state.render.visualizer)
  const setVisualizer = useStoreActions(actions => actions.render.setVisualizer)
  
  const renderSettings = useStoreState(state => state.settings.render)
  const domElement = useRef<HTMLDivElement | null>(null)
  const running = useStoreState(state => state.simulation.running)
  const simulation = useStoreState(state => state.simulation.simulation)
  const lastCommand = useStoreState(state => state.simulationStatus.lastCommand)
  const runTotalTimesteps = useStoreState(state => state.simulationStatus.runTotalTimesteps)
  const runTimesteps = useStoreState(state => state.simulationStatus.runTimesteps)
  
  useEffect(() => {
    if (domElement.current && !loading && !visualizer) {
      setLoading(true)
      const newVisualizer = new Visualizer({
        domElement: domElement.current,
        // onCameraChanged: (position: THREE.Vector3, target: THREE.Vector3) => {console.log(position, target)}
      })
      setVisualizer(newVisualizer)
      setLoading(false)
      // @ts-ignore
      window.visualizer = newVisualizer
      document.body.removeChild(newVisualizer.cpuStats.dom)
      document.body.removeChild(newVisualizer.memoryStats.dom)
      newVisualizer.materials.particles.shininess = 50
      newVisualizer.ambientLight.intensity = 0.4
      newVisualizer.pointLight.intensity = 0.6
      newVisualizer.pointLight.decay = 2
    }
  }, [domElement, setVisualizer, visualizer, loading])

  useEffect(() => {
    if (visible && domElement.current) {
      // There is a bug where the height is set to zero when going back to this view
      domElement.current.style.height = '100vh'
    }
    if (visualizer) {
      visualizer.idle = !visible
    }
  }, [visible, visualizer])

  const prevParticlesRef = useRef<Particles>()
  useEffect(() => {
    prevParticlesRef.current = particles
  })
  const prevParticles = prevParticlesRef.current

  useEffect(() => {
    if (cameraPosition && visualizer) {
      visualizer.setCameraPosition(cameraPosition)
    }
  }, [cameraPosition, visualizer])

  useEffect(() => {
    if (cameraTarget && visualizer) {
      visualizer.setCameraTarget(cameraTarget)
    }
  }, [cameraTarget, visualizer])

  const prevBondsRef = useRef<Bonds>()
  useEffect(() => {
    prevBondsRef.current = bonds
  })
  const prevBonds = prevBondsRef.current

  useEffect(() => {
    if (!visualizer) {
      return
    }

    if (prevParticles && prevParticles !== particles) {
      visualizer.remove(prevParticles)
      prevParticles.dispose()
    }

    if (particles) {
      visualizer.add(particles)
    }

    if (prevBonds && prevBonds !== bonds) {
      visualizer.remove(prevBonds!)
      prevBonds.dispose()
    }

    if (bonds) {
      visualizer.add(bonds)
    }
  }, [particles, prevParticles, prevBonds, bonds, visualizer])

  useEffect(() => {
    if (visualizer) {
      visualizer.renderer.renderSsao = renderSettings.ssao
      visualizer.pointLight.intensity = 0.6 * renderSettings.brightness
      visualizer.ambientLight.intensity = 0.4 * renderSettings.brightness
    }
  }, [renderSettings, visualizer])

  useEffect(() => {
    return () => {
      if (visualizer) {
        visualizer.dispose()
      }
    }
  }, [visualizer])
  let title = ''
  if (simulation) {
    title = `${simulation?.inputScript}`
    if (lastCommand) {
      title += `> ${lastCommand}` 
    }
  }
  
  return (
    <Layout style={{height:"100vh"}}>
    <Header className="site-layout-background" style={{ backgroundColor: 'rgba(0,0,0,0)', fontSize: '1.5vw', position: 'fixed' }}>
      <Col>
        <Row>
          {title}
        </Row>
        <Row>
          {running &&   
            <Progress showInfo={false} style={{marginTop: '-25px'}} strokeColor={{'0%': '#108ee9','100%': '#87d068',}} width={30} percent={ Math.round(100 * (runTimesteps / (runTotalTimesteps+1)))} />
          }
        </Row>
      </Col>
    </Header>
      <div id="canvas-container" style={{ height: '100%', width: '100%' }}>
        <div style={{ height: '100vh', width: '100%'  }} ref={domElement}> 
          <Settings open={showSettings} onClose={() => setShowSettings(false)} />
          {!showAnalyze && window.innerWidth>900 && <SimulationSummaryOverlay />}
        </div>
      </div>
      <AnalyzeButtonContainer>
        <AreaChartOutlined style={{ fontSize: '32px', color: '#fff', marginRight: 70, zIndex: 1000}} onClick={() => {
          if (!showAnalyze) {
            track('SimulationSummary.Open')
          } else {
            track('SimulationSummary.Close')
          }
          setShowAnalyze(!showAnalyze)
        }}/>
      </AnalyzeButtonContainer>
      <SettingsButtonContainer>
        <SettingOutlined style={{ fontSize: '32px', color: '#fff', marginRight: 20, zIndex: 1000}} onClick={() => {
          track('Settings.Open')
          setShowSettings(true)
        }}/>
      </SettingsButtonContainer>
      {showAnalyze && 
        <Sider style={{ 
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            right: 0,
          }} reverseArrow collapsible onCollapse={() => setShowAnalyze(false)} width={300}>
          <Container>
            <SimulationSummary />
          </Container>
        </Sider>
      }
      {simulation==null && !hideNoSimulation && <Modal open onCancel={() => setHideNoSimulation(true)} footer={[<Button onClick={() => setHideNoSimulation(true)}>OK</Button>]} title='No simulation'>You can create a new simulation or run one of the built-in examples.</Modal>}
      </Layout>
  )
}
export default View