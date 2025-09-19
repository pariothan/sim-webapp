
export type MapMode = 'LANGUAGE' | 'PHONEME_COUNT' | 'SPEAKER_COUNT'

export interface SimConfig{
  gridW: number
  gridH: number
  landProb: number
  islandBias: number
  smoothSteps: number
  pSpread: number
  pBorrow: number
  pMutate: number
  pSplit: number
  longDistance: number
  prestigeThreshold: number
}

export const defaultConfig: SimConfig = {
  gridW: 120,
  gridH: 80,
  landProb: 0.52,
  islandBias: 0.35,
  smoothSteps: 3,
  pSpread: 0.22,
  pBorrow: 0.12,
  pMutate: 0.05,
  pSplit: 0.01,
  longDistance: 3,
  prestigeThreshold: 0.6,
}

export interface Community{
  id: number
  x: number
  y: number
  languageId: number
  prestige: number
  population: number
}


export interface Language{
  id: number
  name: string
  phonemeCount: number
  prestige: number
  familyId: number
  generation: number
  conservatism: number
  parentId?: number
  vocabSize: number
  phonemeInventory: string[]
  sampleWord: string
}

export interface World{
  w: number
  h: number
  tiles: (number | null)[] // communityId or null (water)
}

export interface SimStateSnapshot{
  tick: number
  world: World
  communities: Community[]
  languages: Map<number, LanguageLike>
}

// Because postMessage can't transfer Map of complex types cleanly,
// we'll define a serializable version:

export interface LanguageLike{
  id: number
  name: string
  phonemeCount: number
  prestige: number
  familyId: number
  generation: number
  conservatism: number
  parentId?: number
  vocabSize: number
  phonemeInventory: string[]
  sampleWord: string
}


export interface SelectedInfo{
  x: number
  y: number
  communityId: number
  languageId: number
}

export interface InspectorData{
  language: LanguageLike & {
    generation: number
    conservatism: number
    parentId?: number
    vocabSize: number
    phonemeInventory: string[]
    sampleWord: string
  }
}
