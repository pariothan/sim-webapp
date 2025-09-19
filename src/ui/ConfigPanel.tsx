import React from 'react'
import { SimConfig } from '../engine/types'

export function ConfigPanel({ cfg, setCfg }: { cfg: SimConfig, setCfg: (c: SimConfig) => void }) {
  const Row = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="label">
      <div style={{ marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )

  function num<K extends keyof SimConfig>(key: K, min?: number, max?: number, step?: number) {
    return (
      <input
        className="number"
        type="number"
        step={step ?? 0.01}
        value={cfg[key] as number}
        onChange={e => {
          const v = Number(e.target.value)
          setCfg({ ...cfg, [key]: clamp(v, min, max) } as SimConfig)
        }}
      />
    )
  }

  function clamp(v: number, min?: number, max?: number) {
    if (min !== undefined && v < min) v = min
    if (max !== undefined && v > max) v = max
    return v
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>World Configuration</h3>
      <Row label="Grid Width">{num('gridW', 20, 400, 1)}</Row>
      <Row label="Grid Height">{num('gridH', 20, 400, 1)}</Row>
      <Row label="Land Probability">{num('landProb', 0.1, 0.9, 0.01)}</Row>
      <Row label="Island Bias">{num('islandBias', 0, 1, 0.01)}</Row>
      <Row label="Smooth Steps">{num('smoothSteps', 0, 8, 1)}</Row>
      
      <hr style={{ borderColor: '#1c2531', margin: '16px 0' }} />
      <h3 style={{ marginTop: 0 }}>Language Evolution</h3>
      <Row label="P(Spread)">{num('pSpread', 0, 1, 0.01)}</Row>
      <Row label="P(Borrow)">{num('pBorrow', 0, 1, 0.01)}</Row>
      <Row label="P(Mutate)">{num('pMutate', 0, 1, 0.01)}</Row>
      <Row label="P(Split)">{num('pSplit', 0, 1, 0.001)}</Row>
      <Row label="P(Sound Change)">{num('pSoundChange', 0, 1, 0.01)}</Row>
      
      <hr style={{ borderColor: '#1c2531', margin: '16px 0' }} />
      <h3 style={{ marginTop: 0 }}>Advanced Parameters</h3>
      <Row label="Conservatism Factor">{num('conservatismFactor', 0, 1, 0.01)}</Row>
      <Row label="Prestige Threshold">{num('prestigeThreshold', 0, 1, 0.01)}</Row>
      <Row label="Contact Influence">{num('contactInfluence', 0, 1, 0.01)}</Row>
      
      <p style={{ color: '#9aa4af', fontSize: 12, marginTop: 16 }}>
        Changes apply live. Use "Reset" to regenerate with new world parameters.
        Advanced phonological evolution includes sound changes, borrowing patterns, and family tree development.
      </p>
    </div>
  )
}