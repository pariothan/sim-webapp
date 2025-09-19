import { World, WorldConfig } from './World'
import { Language } from './Language'
import { Community } from './Community'

export interface SimulationConfig {
  world: WorldConfig
  spreadProbability: number
  borrowProbability: number
  evolutionProbability: number
  splitProbability: number
}

export interface SimulationState {
  tick: number
  world: World
  communities: Community[]
  languages: Map<number, Language>
  stats: {
    totalCommunities: number
    communitiesWithLanguage: number
    totalLanguages: number
    extinctLanguages: number
    newLanguagesThisTick: number
    largestLanguage: number
    topLanguages: Array<{id: number, name: string, speakers: number}>
  }
}

export class Simulation {
  private tick: number = 0
  private world: World
  private communities: Community[] = []
  private languages: Map<number, Language> = new Map()
  private extinctLanguages: number = 0
  private newLanguagesThisTick: number = 0

  constructor(private config: SimulationConfig) {
    this.world = new World(config.world)
    this.initializeCommunities()
    this.seedLanguages()
  }

  private initializeCommunities(): void {
    for (let y = 0; y < this.world.height; y++) {
      for (let x = 0; x < this.world.width; x++) {
        const tile = this.world.getTile(x, y)
        if (tile?.isLand) {
          const community = new Community(x, y)
          this.communities.push(community)
          tile.communityId = community.id
        }
      }
    }
  }

  private seedLanguages(): void {
    // Create 2-3 initial languages
    const numLanguages = 2 + Math.floor(Math.random() * 2)
    const landCommunities = this.communities.filter(c => {
      const tile = this.world.getTile(c.x, c.y)
      return tile?.isLand
    })

    for (let i = 0; i < numLanguages && landCommunities.length > 0; i++) {
      const language = new Language(undefined, this.tick)
      this.languages.set(language.id, language)

      // Assign to random community
      const communityIndex = Math.floor(Math.random() * landCommunities.length)
      const community = landCommunities.splice(communityIndex, 1)[0]
      community.setLanguage(language.id)
    }
  }

  step(): void {
    this.tick++
    this.newLanguagesThisTick = 0

    // Evolve languages
    for (const language of this.languages.values()) {
      if (Math.random() < this.config.evolutionProbability) {
        language.evolve(this.tick)
      }
    }

    // Process communities
    const shuffledCommunities = [...this.communities].sort(() => Math.random() - 0.5)
    
    for (const community of shuffledCommunities) {
      this.processCommunity(community)
    }

    // Clean up extinct languages
    this.cleanupExtinctLanguages()
  }

  private processCommunity(community: Community): void {
    if (!community.hasLanguage()) {
      this.tryLanguageAcquisition(community)
      return
    }

    const language = this.languages.get(community.languageId!)
    if (!language) return

    const neighbors = this.getNeighboringCommunities(community)

    // Language spread
    if (Math.random() < this.config.spreadProbability) {
      this.tryLanguageSpread(community, language, neighbors)
    }

    // Word borrowing
    if (Math.random() < this.config.borrowProbability) {
      this.tryWordBorrowing(community, language, neighbors)
    }

    // Language split
    if (Math.random() < this.config.splitProbability) {
      this.tryLanguageSplit(language)
    }
  }

  private tryLanguageAcquisition(community: Community): void {
    const neighbors = this.getNeighboringCommunities(community)
    const languageNeighbors = neighbors.filter(n => n.hasLanguage())
    
    if (languageNeighbors.length === 0) return

    // Choose neighbor with highest prestige
    const bestNeighbor = languageNeighbors.reduce((best, current) => 
      current.prestige > best.prestige ? current : best
    )

    if (Math.random() < bestNeighbor.prestige * 0.1) {
      community.setLanguage(bestNeighbor.languageId!)
    }
  }

  private tryLanguageSpread(community: Community, language: Language, neighbors: Community[]): void {
    const targets = neighbors.filter(n => n.languageId !== community.languageId)
    if (targets.length === 0) return

    const spreadStrength = language.prestige * community.prestige
    
    for (const target of targets) {
      if (Math.random() < spreadStrength * 0.05) {
        const oldLanguageId = target.languageId
        target.setLanguage(language.id)
        
        // Check if old language became extinct
        if (oldLanguageId !== null) {
          const remainingSpeakers = this.communities.filter(c => c.languageId === oldLanguageId)
          if (remainingSpeakers.length === 0) {
            this.languages.delete(oldLanguageId)
            this.extinctLanguages++
          }
        }
        break // Only spread to one neighbor per step
      }
    }
  }

  private tryWordBorrowing(community: Community, language: Language, neighbors: Community[]): void {
    const sourceNeighbors = neighbors.filter(n => 
      n.hasLanguage() && n.languageId !== community.languageId
    )
    
    if (sourceNeighbors.length === 0) return

    // Choose source based on prestige
    const source = sourceNeighbors.reduce((best, current) => 
      current.prestige > best.prestige ? current : best
    )

    const sourceLanguage = this.languages.get(source.languageId!)
    if (!sourceLanguage) return

    // Borrow random word
    const meanings = Array.from(sourceLanguage.vocabulary.keys())
    if (meanings.length > 0) {
      const meaning = meanings[Math.floor(Math.random() * meanings.length)]
      if (Math.random() < source.prestige * 0.3) {
        language.borrowWord(sourceLanguage, meaning, this.tick)
      }
    }
  }

  private tryLanguageSplit(language: Language): void {
    const speakers = this.communities.filter(c => c.languageId === language.id)
    if (speakers.length < 6) return

    // Create daughter language
    const daughter = new Language(language, this.tick)
    this.languages.set(daughter.id, daughter)
    this.newLanguagesThisTick++

    // Assign some speakers to daughter
    const splitSize = Math.min(3, Math.floor(speakers.length / 2))
    const toSplit = speakers.slice(0, splitSize)
    
    for (const community of toSplit) {
      community.setLanguage(daughter.id)
    }
  }

  private getNeighboringCommunities(community: Community): Community[] {
    const neighbors = this.world.getNeighbors(community.x, community.y)
    return neighbors
      .map(n => this.communities.find(c => c.id === n.tile.communityId))
      .filter(c => c !== undefined) as Community[]
  }

  private cleanupExtinctLanguages(): void {
    const activeLangIds = new Set(
      this.communities
        .filter(c => c.hasLanguage())
        .map(c => c.languageId!)
    )

    for (const langId of this.languages.keys()) {
      if (!activeLangIds.has(langId)) {
        this.languages.delete(langId)
        this.extinctLanguages++
      }
    }
  }

  getState(): SimulationState {
    const languageCounts: Record<number, number> = {}
    let communitiesWithLanguage = 0

    for (const community of this.communities) {
      if (community.hasLanguage()) {
        communitiesWithLanguage++
        const langId = community.languageId!
        languageCounts[langId] = (languageCounts[langId] || 0) + 1
      }
    }

    const topLanguages = Object.entries(languageCounts)
      .map(([langId, count]) => {
        const lang = this.languages.get(parseInt(langId))
        return {
          id: parseInt(langId),
          name: lang?.name || `Language ${langId}`,
          speakers: count
        }
      })
      .sort((a, b) => b.speakers - a.speakers)
      .slice(0, 5)

    return {
      tick: this.tick,
      world: this.world,
      communities: this.communities,
      languages: this.languages,
      stats: {
        totalCommunities: this.communities.length,
        communitiesWithLanguage,
        totalLanguages: this.languages.size,
        extinctLanguages: this.extinctLanguages,
        newLanguagesThisTick: this.newLanguagesThisTick,
        largestLanguage: Math.max(...Object.values(languageCounts), 0),
        topLanguages
      }
    }
  }

  reset(): void {
    this.tick = 0
    this.communities = []
    this.languages.clear()
    this.extinctLanguages = 0
    this.newLanguagesThisTick = 0
    
    this.world = new World(this.config.world)
    this.initializeCommunities()
    this.seedLanguages()
  }
}