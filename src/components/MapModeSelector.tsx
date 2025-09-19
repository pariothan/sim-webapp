import React from 'react'
import { MapMode } from '../renderer/MapRenderer'

interface MapModeSelectorProps {
  mode: MapMode
  onModeChange: (mode: MapMode) => void
}

const modes: { value: MapMode; label: string }[] = [
  { value: 'LANGUAGE', label: 'Language' },
  { value: 'FAMILY_TREE', label: 'Family Tree' },
  { value: 'PHONEME_COUNT', label: 'Phoneme Count' },
  { value: 'SPEAKER_COUNT', label: 'Speaker Count' },
  { value: 'PRESTIGE', label: 'Prestige' },
  { value: 'VOCABULARY_SIZE', label: 'Vocabulary Size' }
]

export function MapModeSelector({ mode, onModeChange }: MapModeSelectorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <label style={{ color: '#9aa4af', fontSize: '14px' }}>
        Map Mode:
      </label>
      <select
        value={mode}
        onChange={(e) => onModeChange(e.target.value as MapMode)}
        style={{
          padding: '6px 12px',
          background: '#0f151c',
          color: '#e7ecf2',
          border: '1px solid #1c2531',
          borderRadius: '8px',
          fontSize: '14px'
        }}
      >
        {modes.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}