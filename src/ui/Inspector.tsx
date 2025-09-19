import React from 'react'
import { InspectorData } from '../engine/types'

export function Inspector({ data, onClose }: { data: InspectorData | null, onClose: () => void }) {
  if (!data) return null
  
  const { community, language } = data
  
  return (
    <div style={{
      position: 'absolute', top: 16, left: 16, right: 16, bottom: 16,
      background: '#0f151c', border: '1px solid #1c2531', borderRadius: 12, padding: 16,
      overflow: 'auto', maxHeight: 'calc(100vh - 32px)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#e7ecf2' }}>{language.name}</h2>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <section>
          <h3 style={{ color: '#5aa9ff', marginBottom: 8 }}>Community Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 4, fontSize: 14 }}>
            <div style={{ color: '#9aa4af' }}>Location:</div>
            <div>({community.x}, {community.y})</div>
            <div style={{ color: '#9aa4af' }}>Population:</div>
            <div>{community.population}</div>
            <div style={{ color: '#9aa4af' }}>Prestige:</div>
            <div>{(community.prestige * 100).toFixed(1)}%</div>
          </div>
        </section>

        <section>
          <h3 style={{ color: '#5aa9ff', marginBottom: 8 }}>Language Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 4, fontSize: 14 }}>
            <div style={{ color: '#9aa4af' }}>Language ID:</div>
            <div>{language.id}</div>
            <div style={{ color: '#9aa4af' }}>Family ID:</div>
            <div>{language.familyId}</div>
            <div style={{ color: '#9aa4af' }}>Generation:</div>
            <div>{language.generation}</div>
            <div style={{ color: '#9aa4af' }}>Parent ID:</div>
            <div>{language.parentId ?? '—'}</div>
            <div style={{ color: '#9aa4af' }}>Speakers:</div>
            <div>{language.speakerCount}</div>
            <div style={{ color: '#9aa4af' }}>Created:</div>
            <div>Tick {language.creationTick}</div>
            <div style={{ color: '#9aa4af' }}>Last Evolved:</div>
            <div>Tick {language.lastEvolved}</div>
          </div>
        </section>
      </div>

      <section style={{ marginTop: 16 }}>
        <h3 style={{ color: '#5aa9ff', marginBottom: 8 }}>Linguistic Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 4, fontSize: 14 }}>
              <div style={{ color: '#9aa4af' }}>Prestige:</div>
              <div>{(language.prestige * 100).toFixed(1)}%</div>
              <div style={{ color: '#9aa4af' }}>Conservatism:</div>
              <div>{(language.conservatism * 100).toFixed(1)}%</div>
              <div style={{ color: '#9aa4af' }}>Phonemes:</div>
              <div>{language.phonemeCount}</div>
              <div style={{ color: '#9aa4af' }}>Vocabulary:</div>
              <div>{language.vocabSize} words</div>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#e7ecf2' }}>Sample Word:</strong>
              <div style={{ 
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 16,
                color: '#5aa9ff',
                marginTop: 4
              }}>
                {language.sampleWord}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3 style={{ color: '#5aa9ff', marginBottom: 8 }}>Phonological System</h3>
        <div>
          <strong style={{ color: '#e7ecf2' }}>Phoneme Inventory ({language.phonemeCount} phonemes):</strong>
          <div style={{ 
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 14,
            color: '#9aa4af',
            marginTop: 4,
            lineHeight: 1.6,
            wordSpacing: '8px'
          }}>
            {language.phonemeInventory.join(' ')}
          </div>
        </div>
      </section>

      {data.language.lexiconSample && data.language.lexiconSample.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ color: '#5aa9ff', marginBottom: 8 }}>Vocabulary Sample</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {data.language.lexiconSample.slice(0, 12).map((item, i) => (
              <div key={i} style={{ 
                background: '#11161d', 
                padding: 8, 
                borderRadius: 6,
                border: item.borrowed ? '1px solid #5aa9ff' : '1px solid #1c2531'
              }}>
                <div style={{ 
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  color: '#e7ecf2',
                  fontWeight: 'bold'
                }}>
                  {item.word}
                </div>
                <div style={{ color: '#9aa4af', fontSize: 12 }}>
                  '{item.meaning}' {item.borrowed && <span style={{ color: '#5aa9ff' }}>(borrowed)</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.language.contactLanguages && data.language.contactLanguages.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ color: '#5aa9ff', marginBottom: 8 }}>Contact Languages</h3>
          <div style={{ color: '#9aa4af', fontSize: 14 }}>
            {data.language.contactLanguages.join(', ')}
          </div>
        </section>
      )}

      {data.language.evolutionHistory && data.language.evolutionHistory.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ color: '#5aa9ff', marginBottom: 8 }}>Evolution History</h3>
          <div style={{ maxHeight: 120, overflow: 'auto' }}>
            {data.language.evolutionHistory.map((event, i) => (
              <div key={i} style={{ 
                color: '#9aa4af', 
                fontSize: 12, 
                marginBottom: 4,
                paddingLeft: 8,
                borderLeft: '2px solid #1c2531'
              }}>
                {event}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}