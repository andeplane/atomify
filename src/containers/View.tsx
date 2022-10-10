import { useEffect, useState, useRef } from 'react'
import { useStoreState, useStoreActions } from '../hooks';
import {OMOVIVisualizer, Particles, Bonds, Visualizer} from 'omovi'

interface ViewProps {
  visible: boolean
}
const View = ({visible}: ViewProps) => {
  const [loading, setLoading] = useState(false)
  const simulationBox = useStoreState(state => state.simulation.simulationBox)
  const simulationOrigo = useStoreState(state => state.simulation.simulationOrigo)
  const cameraPosition = useStoreState(state => state.simulation.cameraPosition)
  const cameraTarget = useStoreState(state => state.simulation.cameraTarget)
  const particles = useStoreState(state => state.simulation.particles)
  const bonds = useStoreState(state => state.simulation.bonds)
  const particleColors = useStoreState(state => state.simulation.particleColors)
  const [visualizer, setVisualizer] = useState<Visualizer | undefined>(
    undefined
  )
  const domElement = useRef<HTMLDivElement | null>(null)
  
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
    }
  }, [domElement, visualizer, loading, particleColors])

  useEffect(() => {
    if (visible && domElement.current) {
      // There is a bug where the height is set to zero when going back to this view
      domElement.current.style.height = '100vh'
    }
  }, [visible])

  const prevParticlesRef = useRef<Particles>()
  useEffect(() => {
    prevParticlesRef.current = particles
  })
  const prevParticles = prevParticlesRef.current

  const prevColorsRef = useRef<THREE.Color[]>()
  useEffect(() => {
    prevColorsRef.current = particleColors
  })
  const prevColors = prevColorsRef.current

  useEffect(() => {
    if (visualizer) {
      particleColors?.forEach((color, index) => {
        visualizer.setColor(index, color)
      })
    }
  }, [particleColors, visualizer])

  useEffect(() => {
    if (cameraPosition) {
      visualizer.setCameraPosition(cameraPosition)
    }
  }, [cameraPosition, visualizer])

  useEffect(() => {
    if (cameraTarget) {
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
    return () => {
      if (visualizer) {
        visualizer.dispose()
      }
    }
  }, [])

  return (
    <div style={{ height: '100vh', width: '100vh' }}>
      <div style={{ height: '100vh', width: '100vh'  }} ref={domElement} />
    </div>
  )
}
export default View