
import { Community, Language, LanguageLike, SimConfig, SimStateSnapshot, World } from './types'
import { generateWorld } from './world'
import { createLanguage, mutateLanguage, splitLanguage } from './language'

export interface SimInternal{
  tick: number
  world: World
  communities: Community[]
  languages: Map<number, Language>
}

export function createSimulation(cfg: SimConfig): SimInternal{
  const world = generateWorld(cfg)
  const sim: SimInternal = { tick: 0, world, communities: [], languages: new Map() }
  seedCommunities(sim)
  return sim
}

function seedCommunities(sim: SimInternal){
  const { world } = sim
  const { w, h, tiles } = world
  let nextCommunityId = 1
  for(let i=0;i<tiles.length;i++){
    if(tiles[i] !== null){ // land
      const lang = createLanguage()
      sim.languages.set(lang.id, lang)
      const x = i % w, y = Math.floor(i / w)
      const c = {
        id: nextCommunityId++,
        x, y,
        languageId: lang.id,
        prestige: lang.prestige,
        population: 10 + Math.floor(Math.random()*90)
      }
      sim.communities.push(c)
      tiles[i] = c.id
    }
  }
}

function neighbors(x:number, y:number, w:number, h:number){
  return [[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy]) => [x+dx, y+dy] as const)
    .filter(([nx,ny]) => nx>=0 && ny>=0 && nx<w && ny<h)
}

export function step(sim: SimInternal, cfg: SimConfig){
  sim.tick++
  const { world, communities, languages } = sim
  const { w, h, tiles } = world

  // Evolution within languages
  for(const lang of languages.values()){
    if(Math.random() < cfg.pMutate) mutateLanguage(lang)
  }

  // Spread & Borrow across neighboring communities
  for(const c of communities){
    for(const [nx,ny] of neighbors(c.x, c.y, w, h)){
      const idx = ny*w + nx
      const nbrId = tiles[idx]
      if(nbrId == null) continue
      const nbr = communities[(nbrId as number) - 1]; // index by community id
      if(!nbr) continue
      if(Math.random() < cfg.pSpread){
        // adoption if neighbor prestige higher
        const myLang = languages.get(c.languageId)!
        const nbLang = languages.get(nbr.languageId)!
        if(nbLang.prestige > myLang.prestige && Math.random() < 0.4){
          c.languageId = nbLang.id
        }
      }
      if(Math.random() < cfg.pBorrow){
        const myLang = languages.get(c.languageId)!
        const delta = (Math.random()-0.5)*0.4
        myLang.prestige = Math.max(0.05, Math.min(1, myLang.prestige + delta*0.01))
      }
    }
  }

  // Occasional splits
  if(Math.random() < cfg.pSplit){
    // pick a random language and split some of its communities off
    const langs = Array.from(languages.values())
    if(langs.length){
      const base = langs[Math.floor(Math.random()*langs.length)]
      const child = splitLanguage(base)
      languages.set(child.id, child)
      // move some communities of base to child
      for(const c of communities){
        if(c.languageId === base.id && Math.random()<0.02){
          c.languageId = child.id
        }
      }
    }
  }
}

export function snapshot(sim: SimInternal): SimStateSnapshot{
  
const languagesLike: [number, LanguageLike][] = Array.from(sim.languages.values()).map(l => [l.id, {
  id: l.id, name: l.name, phonemeCount: l.phonemeCount, prestige: l.prestige, familyId: l.familyId,
  generation: l.generation, conservatism: l.conservatism, parentId: l.parentId,
  vocabSize: l.vocabSize, phonemeInventory: l.phonemeInventory, sampleWord: l.sampleWord
}])
return {

    tick: sim.tick,
    world: sim.world,
    communities: sim.communities,
    languages: new Map(languagesLike),
  }
}
