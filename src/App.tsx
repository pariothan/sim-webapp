import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapRenderer, MapMode } from './renderer/MapRenderer'
import { ControlPanel } from './components/ControlPanel'
import { MapModeSelector } from './components/MapModeSelector'
import { StatsDisplay } from './components/StatsDisplay'
import { ConfigPanel } from './components/ConfigPanel'
import { Inspector } from './ui/Inspector'

const workerUrl = new URL('./components/SimulationWorker.ts', import.meta.url).href

interface SimulationState {
  tick: number
  world: any
  communities: any[]
  languages: Map<number, any>
  stats: {
    totalCommunities: number
    communitiesWithLanguage: number
    totalLanguages: number
    extinctLanguages: number
    newLanguagesThisTick: number
    largestLanguage: number
    topLanguages: Array<{id: number, name: string, speakers: number}>
  }
}

const defaultConfig = {
  world: {
    width: 30,
    height: 20,
    landProbability: 0.25,
    islandBias: 0.45,
    smoothingPasses: 3
  },
  spreadProbability: 0.22,
  borrowProbability: 0.12,
  evolutionProbability: 0.05,
  splitProbability: 0.01
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<MapRenderer | null>(null)
  const workerRef = useRef<Worker | null>(null)
  
  const [isRunning, setIsRunning] = useState(true)
  const [mapMode, setMapMode] = useState<MapMode>('LANGUAGE')
  const [config, setConfig] = useState(defaultConfig)
  const [state, setState] = useState<SimulationState | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null)
  const [inspector, setInspector] = useState<any>(null)

  // Initialize worker and renderer
  useEffect(() => {
    const worker = new Worker(workerUrl, { type: 'module' })
    workerRef.current = worker

    worker.addEventListener('message', (event) => {
      const { type, payload } = event.data

      switch (type) {
        case 'READY':
          worker.postMessage({ type: 'INIT', payload: config })
          break

        case 'STATE_UPDATE':
          setState(payload)
          if (rendererRef.current) {
            rendererRef.current.render(payload, mapMode)
          }
          break

        case 'ERROR':
          console.error('Simulation error:', payload)
          setIsRunning(false)
          break
      }
    })

    return () => {
      worker.terminate()
    }
  }, [])

  // Initialize renderer when canvas is ready
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new MapRenderer(canvasRef.current)
    }
  }, [])

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return
      
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      
      if (rendererRef.current && state) {
        rendererRef.current.render(state, mapMode)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [state, mapMode])

  // Re-render when map mode changes
  useEffect(() => {
    if (rendererRef.current && state) {
      rendererRef.current.render(state, mapMode)
    }
  }, [mapMode, state])

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !rendererRef.current) return

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      const tooltipText = rendererRef.current!.getTooltip(x, y)
      if (tooltipText) {
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          text: tooltipText
        })
      } else {
        setTooltip(null)
      }
    }

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      const inspectorData = rendererRef.current!.getInspectorData(x, y)
      setInspector(inspectorData)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [])

  const handleToggleRunning = useCallback(() => {
    const newRunning = !isRunning
    setIsRunning(newRunning)
    
    if (workerRef.current) {
      workerRef.current.postMessage({ 
        type: newRunning ? 'START' : 'STOP' 
      })
    }
  }, [isRunning])

  const handleReset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'RESET' })
    }
  }, [])

  const handleNewWorld = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'NEW_WORLD', payload: config })
    }
  }, [config])

  const handleConfigChange = useCallback((newConfig: typeof config) => {
    setConfig(newConfig)
  }, [])

  if (!state) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0b0f14',
        color: '#e7ecf2',
        fontSize: '18px'
      }}>
        Loading simulation...
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      gridTemplateRows: 'auto 1fr',
      gridTemplateAreas: '"controls controls" "sidebar main"',
      gap: '8px',
      height: '100vh',
      padding: '8px',
      background: '#0b0f14',
      color: '#e7ecf2'
    }}>
      {/* Controls */}
      <div style={{ gridArea: 'controls', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <ControlPanel
          isRunning={isRunning}
          onToggleRunning={handleToggleRunning}
          onReset={handleReset}
          onNewWorld={handleNewWorld}
          tick={state.tick}
          stats={state.stats}
        />
        <MapModeSelector mode={mapMode} onModeChange={setMapMode} />
      </div>

      {/* Sidebar */}
      <div style={{
        gridArea: 'sidebar',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'auto'
      }}>
        <StatsDisplay stats={state.stats} tick={state.tick} />
        <ConfigPanel config={config} onConfigChange={handleConfigChange} />
      </div>

      {/* Main canvas area */}
      <div style={{
        gridArea: 'main',
        position: 'relative',
        border: '1px solid #1c2531',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#0e141b'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#e7ecf2'
        }}>
          Tick: {state.tick} • Mode: {mapMode.replace(/_/g, ' ')} • Languages: {state.stats.totalLanguages}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#e7ecf2',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: '300px'
          }}>
            {tooltip.text}
          </div>
        )}

        {/* Inspector */}
        {inspector && (
          <Inspector 
            data={inspector} 
            onClose={() => setInspector(null)} 
          />
        )}
      </div>
    </div>
  )
}