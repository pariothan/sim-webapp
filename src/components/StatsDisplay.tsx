import React from 'react'

interface StatsDisplayProps {
  stats: {
    totalCommunities: number
    communitiesWithLanguage: number
    totalLanguages: number
    extinctLanguages: number
    newLanguagesThisTick: number
    largestLanguage: number
    topLanguages: Array<{id: number, name: string, speakers: number}>
  }
  tick: number
}

export function StatsDisplay({ stats, tick }: StatsDisplayProps) {
  return (
    <div style={{
      padding: '16px',
      background: '#11161d',
      border: '1px solid #1c2531',
      borderRadius: '12px',
      color: '#e7ecf2'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#5aa9ff' }}>
        Statistics
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: '8px 16px',
        fontSize: '14px',
        marginBottom: '16px'
      }}>
        <span style={{ color: '#9aa4af' }}>Tick:</span>
        <span>{tick}</span>

        <span style={{ color: '#9aa4af' }}>Communities:</span>
        <span>{stats.communitiesWithLanguage}/{stats.totalCommunities}</span>

        <span style={{ color: '#9aa4af' }}>Languages:</span>
        <span>{stats.totalLanguages}</span>

        <span style={{ color: '#9aa4af' }}>Extinct:</span>
        <span>{stats.extinctLanguages}</span>

        <span style={{ color: '#9aa4af' }}>Largest:</span>
        <span>{stats.largestLanguage} speakers</span>
      </div>

      {stats.topLanguages.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#e7ecf2', fontSize: '16px' }}>
            Top Languages
          </h4>
          <div style={{ fontSize: '12px' }}>
            {stats.topLanguages.map((lang, index) => (
              <div
                key={lang.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  marginBottom: '4px',
                  background: index === 0 ? '#1a2332' : '#0e141b',
                  border: index === 0 ? '1px solid #5aa9ff' : '1px solid #1c2531',
                  borderRadius: '4px'
                }}
              >
                <span>{index + 1}. {lang.name}</span>
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
          marginTop: '16px',
          padding: '8px',
          background: '#1a2332',
          border: '1px solid #5aa9ff',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#5aa9ff',
          fontWeight: 'bold'
        }}>
          🎉 {stats.newLanguagesThisTick} new language{stats.newLanguagesThisTick > 1 ? 's' : ''} emerged!
        </div>
      )}
    </div>
  )
}