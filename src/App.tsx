
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Toolbar } from './ui/Toolbar'
import { ConfigPanel } from './ui/ConfigPanel'
import { Renderer } from './vis/Renderer'
import { defaultConfig, MapMode, SimConfig, SimStateSnapshot } from './engine/types'

const workerUrl = new URL('./worker.ts', import.meta.url,).href

export default function App(){
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cfg, setCfg] = useState<SimConfig>({...defaultConfig})
  const [running, setRunning] = useState(true)
  const [mapMode, setMapMode] = useState<MapMode>('LANGUAGE')
  const [tick, setTick] = useState(0)
  const [tooltip, setTooltip] = useState<{x:number,y:number, text:string} | null>(null)
    const [inspector, setInspector] = useState<InspectorData | null>(null)

  const worker = useMemo(()=> new Worker(workerUrl, { type: 'module' }), [])
  const rendererRef = useRef<Renderer | null>(null)

  // Init worker
  useEffect(()=>{
    worker.postMessage({type:'INIT', config: cfg})
    const onMsg = (e: MessageEvent)=>{
      const data = e.data
      if(data.type === 'TICK'){
        const snap: SimStateSnapshot = data.payload
        setTick(snap.tick)
        if(!rendererRef.current && canvasRef.current){
          rendererRef.current = new Renderer(canvasRef.current)
        }
        rendererRef.current?.render(snap, mapMode)
      }
    }
    worker.addEventListener('message', onMsg)
    return ()=> worker.removeEventListener('message', onMsg)
  }, [worker])

  // React to cfg/map changes
  useEffect(()=>{
    worker.postMessage({type:'SET_CONFIG', config: cfg})
  }, [cfg, worker])

  useEffect(()=>{
    // Re-render on map mode change (request a redraw)
    worker.postMessage({type:'REQUEST_FRAME'})
  }, [mapMode, worker])

  // Run/pause
  useEffect(()=>{
    worker.postMessage({type: running ? 'RESUME':'PAUSE'})
  }, [running, worker])

  // Canvas resize
  useEffect(()=>{
    const onResize = ()=>{
      if(!canvasRef.current) return
      const el = canvasRef.current
      const rect = el.getBoundingClientRect()
      el.width = Math.max(100, Math.floor(rect.width))
      el.height = Math.max(100, Math.floor(rect.height))
      worker.postMessage({type:'REQUEST_FRAME'})
    }
    onResize()
    window.addEventListener('resize', onResize)
    return ()=> window.removeEventListener('resize', onResize)
  }, [worker])

  // Hover tooltip
  useEffect(()=>{
    const canvas = canvasRef.current
    if(!canvas) return
    const onMove = (ev: MouseEvent)=>{
      const rect = canvas.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      const hit = rendererRef.current?.hitTest(x, y)
      if(hit){
        setTooltip({x: ev.clientX, y: ev.clientY, text: hit})
      }else{
        setTooltip(null)
      }
    }
    canvas.addEventListener('mousemove', onMove)
    return ()=> canvas.removeEventListener('mousemove', onMove)
  }, [])

  // Click to open inspector
  useEffect(()=>{
    const canvas = canvasRef.current
    if(!canvas) return
    const onClick = (ev: MouseEvent)=>{
      const rect = canvas.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      if(rendererRef.current){
        const snap = (rendererRef.current as any).lastSnap as SimStateSnapshot | null
        if(snap){
          const cellW = canvas.width / snap.world.w
          const cellH = canvas.height / snap.world.h
          const gx = Math.floor(x / cellW)
          const gy = Math.floor(y / cellH)
          worker.postMessage({type:'CLICK_AT', x: gx, y: gy})
        }
      }
    }
    canvas.addEventListener('click', onClick)
    return ()=> canvas.removeEventListener('click', onClick)
  }, [worker])

  return (
    <div className="app">
      <div className="toolbar">
        <Toolbar
          running={running}
          onToggleRun={()=> setRunning(v=>!v)}
          mapMode={mapMode}
          setMapMode={setMapMode}
          onNewWorld={()=> worker.postMessage({type:'NEW_WORLD'})}
          onReset={()=> worker.postMessage({type:'RESET'})}
          tick={tick}
        />
      </div>

      <div className="sidebar">
        <ConfigPanel cfg={cfg} setCfg={setCfg} />
      </div>

      <div className="main">
        <canvas ref={canvasRef} />
        <div className="legend">Tick: {tick} • Mode: {mapMode}</div>
        {tooltip && (
          <div className="tooltip" style={{left: tooltip.x, top: tooltip.y}}>
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  )
}
