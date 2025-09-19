import React from 'react'
import { MapMode } from '../engine/types'

export function Toolbar(props: {
  running: boolean
  onToggleRun: () => void
  mapMode: MapMode
  setMapMode: (m: MapMode) => void
  onNewWorld: () => void
  onReset: () => void
  tick: number
  stats: {
    totalLanguages: number
    extinctLanguages: number
    newLanguagesThisTick: number
  }
}) {
  const modes: MapMode[] = ['LANGUAGE', 'PHONEME_COUNT', 'SPEAKER_COUNT', 'PRESTIGE', 'FAMILY_TREE', 'VOCABULARY_SIZE']
  
  return (
    <>
      <button className="btn" onClick={props.onToggleRun}>
        {props.running ? 'Pause' : 'Run'}
      </button>
      <button className="btn" onClick={props.onNewWorld}>New World</button>
      <button className="btn" onClick={props.onReset}>Reset</button>
      
      <div style={{ marginLeft: '16px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: '#9aa4af', fontSize: 12 }}>Languages: {props.stats.totalLanguages}</span>
        <span style={{ color: '#9aa4af', fontSize: 12 }}>Extinct: {props.stats.extinctLanguages}</span>
        {props.stats.newLanguagesThisTick > 0 && (
          <span style={{ color: '#5aa9ff', fontSize: 12 }}>+{props.stats.newLanguagesThisTick} new</span>
        )}
      </div>
      
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: '#9aa4af', fontSize: 12 }}>Map Mode</span>
        <select 
          className="select" 
          value={props.mapMode} 
          onChange={e => props.setMapMode(e.target.value as MapMode)}
        >
          {modes.map(m => (
            <option key={m} value={m}>
              {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        <span style={{ opacity: 0.7 }}>Tick {props.tick}</span>
      </div>
    </>
  )
}