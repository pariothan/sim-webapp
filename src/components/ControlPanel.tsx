import React from 'react'

interface ControlPanelProps {
  isRunning: boolean
  onToggleRunning: () => void
  onReset: () => void
  onNewWorld: () => void
  tick: number
  stats: {
    totalLanguages: number
    extinctLanguages: number
    newLanguagesThisTick: number
  }
}

export function ControlPanel({
  isRunning,
  onToggleRunning,
  onReset,
  onNewWorld,
  tick,
  stats
}: ControlPanelProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      padding: '12px',
      background: '#11161d',
      border: '1px solid #1c2531',
      borderRadius: '12px'
    }}>
      <button
        onClick={onToggleRunning}
        style={{
          padding: '8px 16px',
          background: isRunning ? '#d32f2f' : '#2e7d32',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {isRunning ? 'Pause' : 'Run'}
      </button>

      <button
        onClick={onReset}
        style={{
          padding: '8px 16px',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Reset
      </button>

      <button
        onClick={onNewWorld}
        style={{
          padding: '8px 16px',
          background: '#7b1fa2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        New World
      </button>

      <div style={{
        display: 'flex',
        gap: '16px',
        marginLeft: '24px',
        fontSize: '14px',
        color: '#9aa4af'
      }}>
        <span>Tick: {tick}</span>
        <span>Languages: {stats.totalLanguages}</span>
        <span>Extinct: {stats.extinctLanguages}</span>
        {stats.newLanguagesThisTick > 0 && (
          <span style={{ color: '#5aa9ff' }}>
            +{stats.newLanguagesThisTick} new
          </span>
        )}
      </div>
    </div>
  )
}