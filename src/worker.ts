/// <reference lib="webworker" />
import { createSimulation, snapshot, step } from './engine/simulation'
import { SimConfig, defaultConfig, InspectorData } from './engine/types'

let cfg: SimConfig
let sim: any
let running = true

// Initialize immediately
try {
  cfg = { ...defaultConfig }
  sim = createSimulation(cfg)
  console.log('Worker initialized successfully')
} catch (error) {
  console.error('Worker initialization failed:', error)
  postMessage({ type: 'ERROR', payload: error.message })
}

function loop() {
  if (!running || !sim) return
  
  try {
    step(sim, cfg)
    postMessage({ type: 'TICK', payload: snapshot(sim) })
  } catch (error) {
    console.error('Simulation step failed:', error)
    postMessage({ type: 'ERROR', payload: error.message })
    running = false
    return
  }
  
  // Moderate speed for better observation
  setTimeout(() => loop(), 200)
}

addEventListener('message', (e) => {
  try {
    const msg = e.data
    console.log('Worker received message:', msg.type)
    
    switch (msg.type) {
      case 'INIT': {
        cfg = { ...cfg, ...(msg.config || {}) }
        sim = createSimulation(cfg)
        console.log('Simulation created, starting loop')
        loop()
        break
      }
      case 'SET_CONFIG': {
        cfg = { ...cfg, ...(msg.config || {}) }
        break
      }
      case 'RESUME': 
        running = true
        loop()
        break
      case 'PAUSE': 
        running = false
        break
      case 'NEW_WORLD': 
        sim = createSimulation(cfg)
        break
      case 'RESET': 
        sim = createSimulation(cfg)
        break
      case 'REQUEST_FRAME': 
        if (sim) {
          postMessage({ type: 'TICK', payload: snapshot(sim) })
        }
        break
      case 'CLICK_AT': {
        const res = getInspectorData(msg.x, msg.y)
        postMessage({ type: 'INSPECTOR', payload: res })
        break
      }
    }
  } catch (error) {
    console.error('Worker message handling failed:', error)
    postMessage({ type: 'ERROR', payload: error.message })
  }
})

function getInspectorData(px: number, py: number): InspectorData | null {
  const { world, communities, languages } = sim
  const x = Math.floor(px)
  const y = Math.floor(py)
  
  if (x < 0 || y < 0 || x >= world.w || y >= world.h) return null
  
  const idx = y * world.w + x
  const cid = world.tiles[idx]
  if (cid == null) return null
  
  const community = communities.find(c => c.id === cid)
  if (!community) return null
  
  const language = languages.get(community.languageId)
  if (!language) return null
  
  // Get vocabulary sample
  const lexiconSample = Array.from(language.lexicon.entries())
    .slice(0, 20)
    .map(([meaning, word]) => ({
      meaning,
      word: word.stringForm,
      borrowed: !!word.borrowedFrom
    }))
  
  // Get contact languages
  const contactLanguageIds = new Set<number>()
  const neighbors = [
    [community.x + 1, community.y],
    [community.x - 1, community.y],
    [community.x, community.y + 1],
    [community.x, community.y - 1]
  ]
  
  for (const [nx, ny] of neighbors) {
    if (nx >= 0 && ny >= 0 && nx < world.w && ny < world.h) {
      const nidx = ny * world.w + nx
      const ncid = world.tiles[nidx]
      if (ncid) {
        const ncomm = communities.find(c => c.id === ncid)
        if (ncomm && ncomm.languageId !== community.languageId) {
          contactLanguageIds.add(ncomm.languageId)
        }
      }
    }
  }
  
  const contactLanguages = Array.from(contactLanguageIds)
    .map(id => languages.get(id)?.name)
    .filter(name => name) as string[]
  
  // Evolution history (simplified)
  const evolutionHistory = [
    `Created at tick ${language.creationTick}`,
    `Last evolved at tick ${language.lastEvolved}`,
    `Generation ${language.generation} of family ${language.familyId}`,
    language.parentId ? `Descended from language ${language.parentId}` : 'Root language'
  ]
  
  const speakerCount = communities.filter(c => c.languageId === language.id).length
  
  return {
    community,
    language: {
      id: language.id,
      name: language.name,
      phonemeCount: language.phonemeCount,
      prestige: language.prestige,
      familyId: language.familyId,
      generation: language.generation,
      conservatism: language.conservatism,
      parentId: language.parentId,
      vocabSize: language.vocabSize,
      phonemeInventory: language.phonemeInventory,
      sampleWord: language.sampleWord,
      creationTick: language.creationTick,
      lastEvolved: language.lastEvolved,
      speakerCount,
      lexiconSample,
      contactLanguages,
      evolutionHistory
    }
  }
}