export type MapMode = 'LANGUAGE' | 'PHONEME_COUNT' | 'SPEAKER_COUNT' | 'PRESTIGE' | 'FAMILY_TREE' | 'VOCABULARY_SIZE'

export interface SimConfig {
  gridW: number
  gridH: number
  landProb: number
  islandBias: number
  smoothSteps: number
  pSpread: number
  pBorrow: number
  pMutate: number
  pSplit: number
  pSoundChange: number
  conservatismFactor: number
  prestigeThreshold: number
  contactInfluence: number
}

export const defaultConfig: SimConfig = {
  gridW: 30,
  gridH: 20,
  landProb: 0.25,
  islandBias: 0.45,
  smoothSteps: 3,
  pSpread: 0.22,
  pBorrow: 0.12,
  pMutate: 0.05,
  pSplit: 0.01,
  pSoundChange: 0.08,
  conservatismFactor: 0.3,
  prestigeThreshold: 0.6,
  contactInfluence: 0.4
}

export interface SimStateSnapshot {
  tick: number
  world: {
    w: number
    h: number
    tiles: Array<{ isLand: boolean, communityId: number | null }>
  }
  communities: Array<{
    id: number
    x: number
    y: number
    languageId: number | null
    population: number
    prestige: number
  }>
  languages: Map<number, {
    id: number
    name: string
    phonemeCount: number
    vocabSize: number
    prestige: number
    speakerCount: number
    familyId: number
    generation: number
    parentId: number | null
    creationTick: number
    lastEvolved: number
    sampleWord: string
    phonemeInventory: string[]
    conservatism: number
    lexiconSample?: Array<{ word: string, meaning: string, borrowed: boolean }>
    contactLanguages?: string[]
    evolutionHistory?: string[]
  }>
  stats: SimulationStats
}

export interface SimulationStats {
  totalCommunities: number
  speakingCommunities: number
  totalLanguages: number
  largestLanguage: number
  languageDistribution: Record<number, number>
  topLanguages: Array<{ id: number, name: string, speakers: number }>
  extinctLanguages: number
  newLanguagesThisTick: number
}

export interface InspectorData {
  community: {
    id: number
    x: number
    y: number
    population: number
    prestige: number
  }
  language: {
    id: number
    name: string
    phonemeCount: number
    vocabSize: number
    prestige: number
    speakerCount: number
    familyId: number
    generation: number
    parentId: number | null
    creationTick: number
    lastEvolved: number
    sampleWord: string
    phonemeInventory: string[]
    conservatism: number
    lexiconSample?: Array<{ word: string, meaning: string, borrowed: boolean }>
    contactLanguages?: string[]
    evolutionHistory?: string[]
  }
}