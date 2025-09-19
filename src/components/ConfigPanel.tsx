import React from 'react'

interface ConfigPanelProps {
  config: {
    world: {
      width: number
      height: number
      landProbability: number
      islandBias: number
      smoothingPasses: number
    }
    spreadProbability: number
    borrowProbability: number
    evolutionProbability: number
    splitProbability: number
  }
  onConfigChange: (config: any) => void
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  const updateConfig = (path: string[], value: number) => {
    const newConfig = { ...config }
    let current = newConfig
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i] as keyof typeof current] as any
    }
    
    current[path[path.length - 1] as keyof typeof current] = value as any
    onConfigChange(newConfig)
  }

  const NumberInput = ({ 
    label, 
    path, 
    min = 0, 
    max = 1, 
    step = 0.01 
  }: { 
    label: string
    path: string[]
    min?: number
    max?: number
    step?: number
  }) => {
    let value = config
    for (const key of path) {
      value = value[key as keyof typeof value] as any
    }

    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          marginBottom: '4px',
          fontSize: '12px',
          color: '#9aa4af'
        }}>
          {label}
        </label>
        <input
          type="number"
          value={value as number}
          min={min}
          max={max}
          step={step}
          onChange={(e) => updateConfig(path, parseFloat(e.target.value))}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#0f151c',
            color: '#e7ecf2',
            border: '1px solid #1c2531',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>
    )
  }

  return (
    <div style={{
      padding: '16px',
      background: '#11161d',
      border: '1px solid #1c2531',
      borderRadius: '12px',
      color: '#e7ecf2'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#5aa9ff' }}>
        Configuration
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#e7ecf2', fontSize: '14px' }}>
          World Generation
        </h4>
        <NumberInput label="Width" path={['world', 'width']} min={10} max={100} step={1} />
        <NumberInput label="Height" path={['world', 'height']} min={10} max={100} step={1} />
        <NumberInput label="Land Probability" path={['world', 'landProbability']} min={0.1} max={0.8} />
        <NumberInput label="Island Bias" path={['world', 'islandBias']} min={0} max={1} />
        <NumberInput label="Smoothing Passes" path={['world', 'smoothingPasses']} min={0} max={10} step={1} />
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px 0', color: '#e7ecf2', fontSize: '14px' }}>
          Language Evolution
        </h4>
        <NumberInput label="Spread Probability" path={['spreadProbability']} min={0} max={1} />
        <NumberInput label="Borrow Probability" path={['borrowProbability']} min={0} max={1} />
        <NumberInput label="Evolution Probability" path={['evolutionProbability']} min={0} max={1} />
        <NumberInput label="Split Probability" path={['splitProbability']} min={0} max={0.1} step={0.001} />
      </div>

      <p style={{
        fontSize: '11px',
        color: '#9aa4af',
        marginTop: '16px',
        lineHeight: 1.4
      }}>
        Changes require "New World" to take effect. Higher probabilities = more frequent events.
      </p>
    </div>
  )
}