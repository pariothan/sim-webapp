
import React from 'react'
import { InspectorData } from '../engine/types'

export function Inspector({data, onClose}:{data: InspectorData | null, onClose:()=>void}){
  if(!data) return null
  const L = data.language
  return (
    <div style={{
      position:'absolute', top:16, left:16, right:16, bottom:16,
      background:'#0f151c', border:'1px solid #1c2531', borderRadius:12, padding:16,
      overflow:'auto'
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0}}>{L.name}</h2>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      <section style={{marginTop:12}}>
        <h3>Language Overview</h3>
        <div style={{display:'grid', gridTemplateColumns:'200px 1fr', rowGap:6}}>
          <div>Language ID:</div><div>{L.id}</div>
          <div>Generation:</div><div>{L.generation}</div>
          <div>Prestige:</div><div>{(L.prestige*100).toFixed(1)}%</div>
          <div>Conservatism:</div><div>{(L.conservatism*100).toFixed(1)}%</div>
          <div>Phonemes:</div><div>{L.phonemeCount}</div>
          <div>Vocabulary Size:</div><div>{L.vocabSize}</div>
          <div>Parent Language ID:</div><div>{L.parentId ?? '—'}</div>
        </div>
      </section>
      <section style={{marginTop:16}}>
        <h3>Phonological System</h3>
        <div><strong>Inventory</strong>: {L.phonemeInventory.join(' ')}</div>
        <div style={{marginTop:8}}><strong>Sample Word</strong>: <code>{L.sampleWord}</code></div>
      </section>
    </div>
  )
}
