import { Community, Language, LanguageLike, SimConfig, SimStateSnapshot, World, SimulationStats } from './types'
import { generateWorld } from './world'
import { createLanguage, evolveLanguage, borrowWord, splitLanguage } from './language'
import { DEFAULT_CONFIG } from './config'

export interface SimInternal {
  tick: number
  world: World
  communities: Community[]
  languages: Map<number, Language>
  stats: SimulationStats
  extinctLanguages: number
}

export function createSimulation(cfg: SimConfig): SimInternal {
  const world = generateWorld(cfg)
  const sim: SimInternal = {
    tick: 0,
    world,
    communities: [],
    languages: new Map(),
    stats: {
      totalCommunities: 0,
      speakingCommunities: 0,
      totalLanguages: 0,
      largestLanguage: 0,
      languageDistribution: {},
      topLanguages: [],
      extinctLanguages: 0,
      newLanguagesThisTick: 0
    },
    extinctLanguages: 0
  }
  
  seedCommunities(sim)
  updateStats(sim)
  return sim
}

function seedCommunities(sim: SimInternal): void {
  const { world } = sim
  const { w, h, tiles } = world
  let nextCommunityId = 1
  
  // Create communities on land tiles
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] !== null) { // land
      const x = i % w
      const y = Math.floor(i / w)
      
      const community: Community = {
        id: nextCommunityId++,
        x,
        y,
        languageId: -1, // Will be assigned language
        prestige: 0.3 + Math.random() * 0.4,
        population: 10 + Math.floor(Math.random() * 90)
      }
      
      sim.communities.push(community)
      tiles[i] = community.id
    }
  }
  
  // Create initial languages and assign to communities
  const starterWords = DEFAULT_CONFIG.STARTER_WORDS
  const languagesPerStarter = Math.ceil(sim.communities.length / starterWords.length)
  
  let communityIndex = 0
  for (const starterWord of starterWords) {
    if (communityIndex >= sim.communities.length) break
    
    const lang = createLanguage(undefined, sim.tick)
    sim.languages.set(lang.id, lang)
    
    // Assign this language to several communities
    for (let i = 0; i < languagesPerStarter && communityIndex < sim.communities.length; i++) {
      const community = sim.communities[communityIndex]
      community.languageId = lang.id
      community.prestige = lang.prestige
      communityIndex++
    }
  }
  
  // Assign remaining communities to random existing languages
  while (communityIndex < sim.communities.length) {
    const languages = Array.from(sim.languages.keys())
    const randomLangId = languages[Math.floor(Math.random() * languages.length)]
    sim.communities[communityIndex].languageId = randomLangId
    communityIndex++
  }
}

function neighbors(x: number, y: number, w: number, h: number): [number, number][] {
  return [
    [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
  ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < w && ny < h)
}

export function step(sim: SimInternal, cfg: SimConfig): void {
  sim.tick++
  sim.stats.newLanguagesThisTick = 0
  
  const { world, communities, languages } = sim
  const { w, h, tiles } = world
  
  // Shuffle communities for random processing order
  const shuffledCommunities = [...communities].sort(() => Math.random() - 0.5)
  
  // Language internal evolution
  for (const lang of languages.values()) {
    if (Math.random() < cfg.pMutate) {
      const contactLanguages = getContactLanguages(lang.id, sim)
      evolveLanguage(lang, sim.tick, contactLanguages)
    }
  }
  
  // Process each community
  for (const community of shuffledCommunities) {
    if (community.languageId < 0) continue
    
    const language = languages.get(community.languageId)
    if (!language) continue
    
    // Get neighboring communities
    const neighborCommunities = neighbors(community.x, community.y, w, h)
      .map(([nx, ny]) => {
        const idx = ny * w + nx
        const nbrId = tiles[idx]
        return nbrId ? communities.find(c => c.id === nbrId) : null
      })
      .filter(c => c !== null) as Community[]
    
    // Language spread
    if (Math.random() < cfg.pSpread) {
      attemptLanguageSpread(community, language, neighborCommunities, sim)
    }
    
    // Word borrowing
    if (Math.random() < cfg.pBorrow) {
      attemptWordBorrowing(community, language, neighborCommunities, languages, sim.tick)
    }
    
    // Language splitting
    if (Math.random() < cfg.pSplit) {
      attemptLanguageSplit(community, language, sim)
    }
  }
  
  // Clean up extinct languages
  cleanupExtinctLanguages(sim)
  
  // Update statistics
  updateStats(sim)
}

function attemptLanguageSpread(
  community: Community,
  language: Language,
  neighbors: Community[],
  sim: SimInternal
): void {
  if (neighbors.length === 0) return
  
  const spreadStrength = language.prestige * community.prestige
  
  for (const neighbor of neighbors) {
    if (neighbor.languageId === community.languageId) continue
    
    const spreadProb = Math.min(0.3, spreadStrength * 0.1)
    if (Math.random() < spreadProb) {
      const oldLangId = neighbor.languageId
      neighbor.languageId = community.languageId
      neighbor.prestige = (neighbor.prestige + community.prestige) / 2
      
      // Check if old language became extinct
      if (oldLangId >= 0) {
        const remainingSpeakers = sim.communities.filter(c => c.languageId === oldLangId)
        if (remainingSpeakers.length === 0) {
          sim.languages.delete(oldLangId)
          sim.extinctLanguages++
        }
      }
      
      return // Only spread to one neighbor per step
    }
  }
}

function attemptWordBorrowing(
  community: Community,
  language: Language,
  neighbors: Community[],
  languages: Map<number, Language>,
  tick: number
): void {
  const sourceNeighbors = neighbors.filter(n => 
    n.languageId !== community.languageId && n.languageId >= 0
  )
  
  if (sourceNeighbors.length === 0) return
  
  // Choose source based on prestige
  const sourceComm = sourceNeighbors.reduce((best, current) => 
    current.prestige > best.prestige ? current : best
  )
  
  const sourceLanguage = languages.get(sourceComm.languageId)
  if (!sourceLanguage) return
  
  // Borrow a random word
  const sourceMeanings = Array.from(sourceLanguage.lexicon.keys())
  if (sourceMeanings.length > 0) {
    const meaning = sourceMeanings[Math.floor(Math.random() * sourceMeanings.length)]
    if (Math.random() < sourceComm.prestige * 0.5) {
      borrowWord(language, sourceLanguage, meaning, tick)
    }
  }
}

function attemptLanguageSplit(
  community: Community,
  language: Language,
  sim: SimInternal
): void {
  // Only split if language has enough speakers
  const speakers = sim.communities.filter(c => c.languageId === language.id)
  if (speakers.length < 8) return
  
  // Create daughter language
  const daughter = splitLanguage(language, sim.tick)
  sim.languages.set(daughter.id, daughter)
  sim.stats.newLanguagesThisTick++
  
  // Assign some speakers to daughter language
  const splitSize = Math.min(2, Math.floor(speakers.length / 3))
  const communitiesToSplit = speakers
    .sort(() => Math.random() - 0.5)
    .slice(0, splitSize)
  
  for (const comm of communitiesToSplit) {
    comm.languageId = daughter.id
  }
}

function getContactLanguages(languageId: number, sim: SimInternal): Language[] {
  const speakingCommunities = sim.communities.filter(c => c.languageId === languageId)
  const contactLangIds = new Set<number>()
  
  // Find neighboring languages
  for (const community of speakingCommunities) {
    const neighborCoords = neighbors(community.x, community.y, sim.world.w, sim.world.h)
    for (const [nx, ny] of neighborCoords) {
      const idx = ny * sim.world.w + nx
      const nbrId = sim.world.tiles[idx]
      if (nbrId) {
        const neighbor = sim.communities.find(c => c.id === nbrId)
        if (neighbor && neighbor.languageId !== languageId && neighbor.languageId >= 0) {
          contactLangIds.add(neighbor.languageId)
        }
      }
    }
  }
  
  // Get Language objects for contact languages
  const contactLanguages: Language[] = []
  for (const langId of contactLangIds) {
    const lang = sim.languages.get(langId)
    if (lang) {
      contactLanguages.push(lang)
    }
  }
  
  // Sort by prestige (most influential first)
  contactLanguages.sort((a, b) => b.prestige - a.prestige)
  
  return contactLanguages.slice(0, 5) // Limit to top 5 contact languages
}

function cleanupExtinctLanguages(sim: SimInternal): void {
  const activeLangIds = new Set(sim.communities.map(c => c.languageId).filter(id => id >= 0))
  
  for (const langId of sim.languages.keys()) {
    if (!activeLangIds.has(langId)) {
      sim.languages.delete(langId)
      sim.extinctLanguages++
    }
  }
}

function updateStats(sim: SimInternal): void {
  const langCounts: Record<number, number> = {}
  let speakingCommunities = 0
  
  for (const community of sim.communities) {
    if (community.languageId >= 0) {
      speakingCommunities++
      langCounts[community.languageId] = (langCounts[community.languageId] || 0) + 1
    }
  }
  
  const topLanguages = Object.entries(langCounts)
    .map(([langId, count]) => {
      const lang = sim.languages.get(parseInt(langId))
      return {
        id: parseInt(langId),
        name: lang?.name || `Lang${langId}`,
        speakers: count
      }
    })
    .sort((a, b) => b.speakers - a.speakers)
    .slice(0, 5)
  
  sim.stats = {
    totalCommunities: sim.communities.length,
    speakingCommunities,
    totalLanguages: sim.languages.size,
    largestLanguage: Math.max(...Object.values(langCounts), 0),
    languageDistribution: langCounts,
    topLanguages,
    extinctLanguages: sim.extinctLanguages,
    newLanguagesThisTick: sim.stats.newLanguagesThisTick
  }
}

export function snapshot(sim: SimInternal): SimStateSnapshot {
  const languagesLike: [number, LanguageLike][] = Array.from(sim.languages.values()).map(l => {
    const speakerCount = sim.communities.filter(c => c.languageId === l.id).length
    return [l.id, {
      id: l.id,
      name: l.name,
      phonemeCount: l.phonemeCount,
      prestige: l.prestige,
      familyId: l.familyId,
      generation: l.generation,
      conservatism: l.conservatism,
      parentId: l.parentId,
      vocabSize: l.vocabSize,
      phonemeInventory: l.phonemeInventory,
      sampleWord: l.sampleWord,
      creationTick: l.creationTick,
      lastEvolved: l.lastEvolved,
      speakerCount
    }]
  })
  
  return {
    tick: sim.tick,
    world: sim.world,
    communities: sim.communities,
    languages: new Map(languagesLike),
    stats: sim.stats
  }
}