import React from 'react'
import { SimulationStats } from '../engine/types'

export function StatsPanel({ stats, tick }: { stats: SimulationStats, tick: number }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0, color: '#5aa9ff' }}>Simulation Statistics</h3>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 4, fontSize: 14 }}>
          <div style={{ color: '#9aa4af' }}>Tick:</div>
          <div>{tick}</div>
          <div style={{ color: '#9aa4af' }}>Communities:</div>
          <div>{stats.speakingCommunities}/{stats.totalCommunities}</div>
          <div style={{ color: '#9aa4af' }}>Active Languages:</div>
          <div>{stats.totalLanguages}</div>
          <div style={{ color: '#9aa4af' }}>Extinct Languages:</div>
          <div>{stats.extinctLanguages}</div>
          <div style={{ color: '#9aa4af' }}>Largest Language:</div>
          <div>{stats.largestLanguage} speakers</div>
        </div>
      </div>

      {stats.topLanguages.length > 0 && (
        <div>
          <h4 style={{ color: '#e7ecf2', marginBottom: 8 }}>Top Languages</h4>
          <div style={{ fontSize: 12 }}>
            {stats.topLanguages.map((lang, i) => (
              <div key={lang.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 4,
                padding: '4px 8px',
                background: i === 0 ? '#1a2332' : '#11161d',
                borderRadius: 4,
                border: i === 0 ? '1px solid #5aa9ff' : '1px solid #1c2531'
              }}>
                <span style={{ color: '#e7ecf2' }}>
                  {i + 1}. {lang.name}
                </span>
                <span style={{ color: '#9aa4af' }}>
                  {lang.speakers} speakers
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.newLanguagesThisTick > 0 && (
        <div style={{ 
          marginTop: 12, 
          padding: 8, 
          background: '#1a2332', 
          border: '1px solid #5aa9ff', 
          borderRadius: 6 
        }}>
          <div style={{ color: '#5aa9ff', fontSize: 12, fontWeight: 'bold' }}>
            🎉 {stats.newLanguagesThisTick} new language{stats.newLanguagesThisTick > 1 ? 's' : ''} emerged this tick!
          </div>
        </div>
      )}
    </div>
  )
}