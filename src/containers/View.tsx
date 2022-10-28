import { useEffect, useState, useRef } from 'react'
import {Layout, Row, Col, Progress} from 'antd'

import { useStoreState } from '../hooks';
import {Particles, Bonds, Visualizer} from 'omovi'
import Settings from './Settings'
import SimulationSummaryOverlay from '../components/SimulationSummaryOverlay'
import SimulationSummary from './SimulationSummary'
import {SettingOutlined, AreaChartOutlined} from '@ant-design/icons'
import styled from "styled-components";
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
  padding: 5px;
  color: #ffffff;
  height: 100vh;
`

const View = ({visible}: ViewProps) => {
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAnalyze, setShowAnalyze] = useState(false)
  // const simulationBox = useStoreState(state => state.simulation.simulationBox)
  // const simulationOrigo = useStoreState(state => state.simulation.simulationOrigo)
  const cameraPosition = useStoreState(state => state.simulation.cameraPosition)
  const cameraTarget = useStoreState(state => state.simulation.cameraTarget)
  const particles = useStoreState(state => state.simulation.particles)
  const bonds = useStoreState(state => state.simulation.bonds)
  const particleColors = useStoreState(state => state.simulation.particleColors)
  const [visualizer, setVisualizer] = useState<Visualizer | undefined>(
    undefined
  )
  const renderSettings = useStoreState(state => state.settings.render)
  const domElement = useRef<HTMLDivElement | null>(null)
  const running = useStoreState(state => state.simulation.running)
  const simulation = useStoreState(state => state.simulation.simulation)
  const lastCommand = useStoreState(state => state.simulation.lastCommand)
  const runTotalTimesteps = useStoreState(state => state.simulation.runTotalTimesteps)
  const runTimesteps = useStoreState(state => state.simulation.runTimesteps)
  
  useEffect(() => {
    if (domElement.current && !loading && !visualizer) {
      setLoading(true)
      const newVisualizer = new Visualizer({
        domElement: domElement.current,
        initialColors: particleColors,
        // onCameraChanged: (position: THREE.Vector3, target: THREE.Vector3) => {console.log(position, target)}
      })
      setVisualizer(newVisualizer)
      setLoading(false)
      // @ts-ignore
      window.visualizer = newVisualizer
      document.body.removeChild(newVisualizer.cpuStats.dom)
      document.body.removeChild(newVisualizer.memoryStats.dom)
    }
  }, [domElement, visualizer, loading, particleColors])

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

  const prevColorsRef = useRef<THREE.Color[]>()
  useEffect(() => {
    prevColorsRef.current = particleColors
  })
  // const prevColors = prevColorsRef.current

  useEffect(() => {
    if (visualizer) {
      particleColors?.forEach((color, index) => {
        visualizer.setColor(index, color)
      })
    }
  }, [particleColors, visualizer])

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
      visualizer.pointLight.intensity = 0.5 * renderSettings.brightness
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
    <Layout>
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
        <div style={{ height: '100%', width: '100%'  }} ref={domElement}> 
          <Settings open={showSettings} onClose={() => setShowSettings(false)} />
          {!showAnalyze && <SimulationSummaryOverlay />}
        </div>
      </div>
      {showAnalyze && 
        <Sider width={300}>
          <Container>
            <SimulationSummary />
          </Container>
        </Sider>
      }
      <AnalyzeButtonContainer>
        <AreaChartOutlined style={{ fontSize: '32px', color: '#fff', marginRight: 70}} onClick={() => setShowAnalyze(!showAnalyze)} />
      </AnalyzeButtonContainer>
      <SettingsButtonContainer>
        <SettingOutlined style={{ fontSize: '32px', color: '#fff', marginRight: 20}} onClick={() => setShowSettings(true)} />
      </SettingsButtonContainer>
      </Layout>
  )
}
export default View