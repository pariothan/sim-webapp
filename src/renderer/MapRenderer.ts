import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Toolbar } from './ui/Toolbar'
import { ConfigPanel } from './ui/ConfigPanel'
import { StatsPanel } from './ui/StatsPanel'
import { Renderer } from './vis/Renderer'
import { defaultConfig, MapMode, SimConfig, SimStateSnapshot, InspectorData, SimulationStats } from './engine/types'
import { Inspector } from './ui/Inspector'

const workerUrl = new URL('./worker.ts', import.meta.url).href

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cfg, setCfg] = useState<SimConfig>({ ...defaultConfig })
  const [running, setRunning] = useState(true)
  const [mapMode, setMapMode] = useState<MapMode>('LANGUAGE')
  const [tick, setTick] = useState(0)
  const [stats, setStats] = useState<SimulationStats>({
    totalCommunities: 0,
    speakingCommunities: 0,
    totalLanguages: 0,
    largestLanguage: 0,
    languageDistribution: {},
    topLanguages: [],
    extinctLanguages: 0,
    newLanguagesThisTick: 0
  })
  const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null)
  const [inspector, setInspector] = useState<InspectorData | null>(null)

  const worker = useMemo(() => new Worker(workerUrl, { type: 'module' }), [])
  const rendererRef = useRef<Renderer | null>(null)

  // Init worker
  useEffect(() => {
    worker.postMessage({ type: 'INIT', config: cfg })
    const onMsg = (e: MessageEvent) => {
      const data = e.data
      console.log('App received message:', data.type)
      if (data.type === 'ERROR') {
        console.error('Worker error:', data.payload)
      } else if (data.type === 'TICK') {
        const snap: SimStateSnapshot = data.payload
        setTick(snap.tick)
        setStats(snap.stats)
        if (!rendererRef.current && canvasRef.current) {
          rendererRef.current = new Renderer(canvasRef.current)
        }
        if (rendererRef.current) {
          rendererRef.current.render(snap, mapMode)
        }
      } else if (data.type === 'INSPECTOR') {
        setInspector(data.payload)
      }
    }
    worker.addEventListener('message', onMsg)
    return () => worker.removeEventListener('message', onMsg)
  }, [worker, mapMode])

  // React to cfg changes
  useEffect(() => {
    worker.postMessage({ type: 'SET_CONFIG', config: cfg })
  }, [cfg, worker])

  // Handle map mode changes by re-rendering
  useEffect(() => {
    if (rendererRef.current && canvasRef.current) {
      worker.postMessage({ type: 'REQUEST_FRAME' })
    }
  }, [mapMode, worker])

  // Run/pause
  useEffect(() => {
    worker.postMessage({ type: running ? 'RESUME' : 'PAUSE' })
  }, [running, worker])

  // Canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
      
      worker.postMessage({ type: 'REQUEST_FRAME' })
    }
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(handleResize, 100)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [worker])

  // Hover tooltip
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onMove = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      const hit = rendererRef.current?.hitTest(x, y)
      if (hit) {
        setTooltip({ x: ev.clientX, y: ev.clientY, text: hit })
      } else {
        setTooltip(null)
      }
    }
    canvas.addEventListener('mousemove', onMove)
    return () => canvas.removeEventListener('mousemove', onMove)
  }, [])

  // Click to open inspector
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      if (rendererRef.current) {
        const snap = (rendererRef.current as any).lastSnap as SimStateSnapshot | null
        if (snap) {
          const cellW = canvas.width / snap.world.w
          const cellH = canvas.height / snap.world.h
          const gx = Math.floor(x / cellW)
          const gy = Math.floor(y / cellH)
          worker.postMessage({ type: 'CLICK_AT', x: gx, y: gy })
        }
      }
    }
    canvas.addEventListener('click', onClick)
    return () => canvas.removeEventListener('click', onClick)
  }, [worker])

  return (
    <div className="app">
      <div className="toolbar">
        <Toolbar
          running={running}
          onToggleRun={() => setRunning(v => !v)}
          mapMode={mapMode}
          setMapMode={setMapMode}
          onNewWorld={() => worker.postMessage({ type: 'NEW_WORLD' })}
          onReset={() => worker.postMessage({ type: 'RESET' })}
          tick={tick}
          stats={stats}
        />
      </div>

      <div className="sidebar">
        <ConfigPanel cfg={cfg} setCfg={setCfg} />
        <StatsPanel stats={stats} tick={tick} />
      </div>

      <div className="main">
        <canvas ref={canvasRef} />
        <div className="legend">
          Tick: {tick} • Mode: {mapMode.replace(/_/g, ' ')} • Languages: {stats.totalLanguages}
        </div>
        {tooltip && (
          <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            {tooltip.text}
          </div>
        )}
        {inspector && (
          <Inspector data={inspector} onClose={() => setInspector(null)} />
        )}
      </div>
    </div>
  )
}