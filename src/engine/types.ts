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
  conservatismFactor: 0.5,
  prestigeThreshold: 0.6,
  contactInfluence: 0.3
}

export interface Community {
  id: number
  x: number
  y: number
  languageId: number
  prestige: number
  population: number
}

export interface Word {
  stringForm: string
  meaning: string
  languageId: number
  borrowedFrom?: number
  creationTick: number
  lastChanged: number
}

export interface Language {
  id: number
  name: string
  phonemeInventory: string[]
  phonemeCount: number
  prestige: number
  familyId: number
  generation: number
  conservatism: number
  parentId?: number
  vocabSize: number
  lexicon: Map<string, Word>
  sampleWord: string
  creationTick: number
  lastEvolved: number
  rules: import('./phonology').PhonologicalRuleSet
}

export interface World {
  w: number
  h: number
  tiles: (number | null)[]
}

export interface SimStateSnapshot {
  tick: number
  world: World
  communities: Community[]
  languages: Map<number, LanguageLike>
  stats: SimulationStats
}

export interface LanguageLike {
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
  creationTick: number
  lastEvolved: number
  speakerCount: number
}

export interface SimulationStats {
  totalCommunities: number
  speakingCommunities: number
  totalLanguages: number
  largestLanguage: number
  languageDistribution: Record<number, number>
  topLanguages: Array<{id: number, name: string, speakers: number}>
  extinctLanguages: number
  newLanguagesThisTick: number
}

export interface SelectedInfo {
  x: number
  y: number
  communityId: number
  languageId: number
}

export interface InspectorData {
  community: Community
  language: LanguageLike & {
    lexiconSample: Array<{meaning: string, word: string, borrowed: boolean}>
    contactLanguages: string[]
    evolutionHistory: string[]
  }
}