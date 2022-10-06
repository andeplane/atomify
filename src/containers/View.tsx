import { useEffect, useState, useRef } from 'react'
import { useStoreState } from '../hooks';
import {OMOVIVisualizer, Particles, Bonds, Visualizer} from 'omovi'

interface ViewProps {
  visible: boolean
}
const View = ({visible}: ViewProps) => {
  const [loading, setLoading] = useState(false)
  const simulationBox = useStoreState(state => state.simulation.simulationBox)
  const simulationOrigo = useStoreState(state => state.simulation.simulationOrigo)
  const particles = useStoreState(state => state.simulation.particles)
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
        initialColors: particleColors
      })
      setVisualizer(newVisualizer)
      setLoading(false)
    }
  }, [domElement, visualizer])

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

  // const prevBondsRef = useRef<Bonds>()
  // useEffect(() => {
  //   prevBondsRef.current = bonds
  // })
  // const prevBonds = prevBondsRef.current
  useEffect(() => {
    if (!visualizer) {
      return
    }

    if (prevParticles && prevParticles !== particles) {
      console.log("Will dispose")
      visualizer.remove(prevParticles)
      prevParticles.dispose()
    }

    if (particles) {
      visualizer.add(particles)
    }

    // if (prevBonds && prevBonds !== bonds) {
    //   visualizer.remove(prevBonds!)
    //   prevBonds.dispose()
    // }
    // if (bonds) {
    //   visualizer.add(bonds!)
    // }
  }, [particles, visualizer])

  useEffect(() => {
    console.log('Will create visualizer')
    return () => {
      if (visualizer) {
        console.log('Will dispose visualizer')
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