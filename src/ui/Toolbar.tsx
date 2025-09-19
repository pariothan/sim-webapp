
import React from 'react'
import { MapMode } from '../engine/types'

export function Toolbar(props: {
  running: boolean
  onToggleRun: ()=>void
  mapMode: MapMode
  setMapMode: (m: MapMode)=>void
  onNewWorld: ()=>void
  onReset: ()=>void
  tick: number
}){
  const modes: MapMode[] = ['LANGUAGE','PHONEME_COUNT','SPEAKER_COUNT']
  return (
    <>
      <button className="btn" onClick={props.onToggleRun}>
        {props.running ? 'Pause' : 'Run'}
      </button>
      <button className="btn" onClick={props.onNewWorld}>New World</button>
      <button className="btn" onClick={props.onReset}>Reset</button>
      <div style={{marginLeft:'auto', display:'flex', gap:8, alignItems:'center'}}>
        <span style={{color:'#9aa4af', fontSize:12}}>Map Mode</span>
        <select className="select" value={props.mapMode} onChange={e=> props.setMapMode(e.target.value as MapMode)}>
          {modes.map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
        </select>
        <span style={{opacity:0.7}}>Tick {props.tick}</span>
      </div>
    </>
  )
}
