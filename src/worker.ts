
/// <reference lib="webworker" />
import { createSimulation, snapshot, step } from './engine/simulation'
import { SimConfig, defaultConfig } from './engine/types'

let cfg: SimConfig = { ...defaultConfig }
let sim = createSimulation(cfg)
let running = true
let rafId: number | null = null

function loop(){
  if(!running) return
  step(sim, cfg)
  postMessage({type:'TICK', payload: snapshot(sim)})
  // aim modest speed
  setTimeout(()=> loop(), 50)
}

addEventListener('message', (e)=>{
  const msg = e.data
  switch(msg.type){
    case 'INIT': {
      cfg = { ...cfg, ...(msg.config||{}) }
      sim = createSimulation(cfg)
      if(!rafId){ loop() }
      break
    }
    case 'SET_CONFIG': {
      cfg = { ...cfg, ...(msg.config||{}) }
      break
    }
    case 'RESUME': running = true; loop(); break
    case 'PAUSE': running = false; break
    case 'NEW_WORLD': sim = createSimulation(cfg); break
    case 'RESET': sim = createSimulation(cfg); break
    case 'REQUEST_FRAME': postMessage({type:'TICK', payload: snapshot(sim)}); break
  }
})


function getInspectorData(px:number, py:number){
  const { world, communities, languages } = sim
  const x = Math.floor(px), y = Math.floor(py)
  if(x<0||y<0||x>=world.w||y>=world.h) return null
  const idx = y*world.w + x
  const cid = world.tiles[idx]
  if(cid==null) return null
  const c = communities[cid-1]
  const lang = languages.get(c.languageId)!
  return {
    language: {
      id: lang.id, name: lang.name, phonemeCount: lang.phonemeCount, prestige: lang.prestige, familyId: lang.familyId,
      generation: lang.generation, conservatism: lang.conservatism, parentId: lang.parentId,
      vocabSize: lang.vocabSize, phonemeInventory: lang.phonemeInventory, sampleWord: lang.sampleWord
    }
  }
}

addEventListener('message', (e)=>{
  const msg = e.data
  if(msg.type === 'CLICK_AT'){
    const res = getInspectorData(msg.x, msg.y)
    postMessage({type:'INSPECTOR', payload: res})
  }
})
