export type MapMode = 'LANGUAGE' | 'PHONEME_COUNT' | 'SPEAKER_COUNT' | 'PRESTIGE' | 'FAMILY_TREE' | 'VOCABULARY_SIZE'

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
  stats: {
    totalCommunities: number
    speakingCommunities: number
    totalLanguages: number
    largestLanguage: number
    languageDistribution: Record<number, number>
    topLanguages: Array<{ id: number, name: string, speakers: number }>
    extinctLanguages: number
    newLanguagesThisTick: number
  }
}

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private lastSnap: SimStateSnapshot | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx
  }

  render(snapshot: SimStateSnapshot, mode: MapMode): void {
    this.lastSnap = snapshot
    
    const { width, height } = this.canvas
    if (width === 0 || height === 0) return

    this.ctx.clearRect(0, 0, width, height)

    const cellW = width / snapshot.world.w
    const cellH = height / snapshot.world.h

    // Draw world tiles
    for (let y = 0; y < snapshot.world.h; y++) {
      for (let x = 0; x < snapshot.world.w; x++) {
        const tile = snapshot.world.tiles[y * snapshot.world.w + x]
        const community = snapshot.communities.find(c => c.id === tile.communityId)
        
        const screenX = x * cellW
        const screenY = y * cellH

        if (!tile.isLand) {
          this.ctx.fillStyle = '#1a2332'
          this.ctx.fillRect(screenX, screenY, cellW, cellH)
          continue
        }

        let color = '#2d3748' // Default land color

        if (community && community.languageId) {
          const language = snapshot.languages.get(community.languageId)
          if (language) {
            color = this.getColorForMode(language, community, mode)
          }
        }

        this.ctx.fillStyle = color
        this.ctx.fillRect(screenX, screenY, cellW, cellH)

        // Draw border
        this.ctx.strokeStyle = '#1c2531'
        this.ctx.lineWidth = 0.5
        this.ctx.strokeRect(screenX, screenY, cellW, cellH)
      }
    }
  }

  private getColorForMode(language: any, community: any, mode: MapMode): string {
    switch (mode) {
      case 'LANGUAGE':
        return this.getLanguageColor(language.id)
      case 'PHONEME_COUNT':
        const phonemeRatio = Math.min(language.phonemeCount / 40, 1)
        return this.interpolateColor('#4a5568', '#e53e3e', phonemeRatio)
      case 'SPEAKER_COUNT':
        const speakerRatio = Math.min(language.speakerCount / 20, 1)
        return this.interpolateColor('#4a5568', '#38a169', speakerRatio)
      case 'PRESTIGE':
        return this.interpolateColor('#4a5568', '#3182ce', language.prestige)
      case 'FAMILY_TREE':
        return this.getFamilyColor(language.familyId)
      case 'VOCABULARY_SIZE':
        const vocabRatio = Math.min(language.vocabSize / 200, 1)
        return this.interpolateColor('#4a5568', '#d69e2e', vocabRatio)
      default:
        return '#4a5568'
    }
  }

  private getLanguageColor(languageId: number): string {
    const colors = [
      '#e53e3e', '#3182ce', '#38a169', '#d69e2e', '#9f7aea',
      '#ed8936', '#48bb78', '#4299e1', '#ed64a6', '#38b2ac'
    ]
    return colors[languageId % colors.length]
  }

  private getFamilyColor(familyId: number): string {
    const colors = [
      '#742a2a', '#2a4365', '#22543d', '#744210', '#553c9a',
      '#9c4221', '#276749', '#2b6cb0', '#97266d', '#285e61'
    ]
    return colors[familyId % colors.length]
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    const hex1 = color1.replace('#', '')
    const hex2 = color2.replace('#', '')
    
    const r1 = parseInt(hex1.substr(0, 2), 16)
    const g1 = parseInt(hex1.substr(2, 2), 16)
    const b1 = parseInt(hex1.substr(4, 2), 16)
    
    const r2 = parseInt(hex2.substr(0, 2), 16)
    const g2 = parseInt(hex2.substr(2, 2), 16)
    const b2 = parseInt(hex2.substr(4, 2), 16)
    
    const r = Math.round(r1 + (r2 - r1) * factor)
    const g = Math.round(g1 + (g2 - g1) * factor)
    const b = Math.round(b1 + (b2 - b1) * factor)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  hitTest(x: number, y: number): string | null {
    if (!this.lastSnap) return null

    const cellW = this.canvas.width / this.lastSnap.world.w
    const cellH = this.canvas.height / this.lastSnap.world.h
    
    const gx = Math.floor(x / cellW)
    const gy = Math.floor(y / cellH)
    
    if (gx < 0 || gy < 0 || gx >= this.lastSnap.world.w || gy >= this.lastSnap.world.h) {
      return null
    }

    const tile = this.lastSnap.world.tiles[gy * this.lastSnap.world.w + gx]
    if (!tile.isLand) return 'Ocean'

    const community = this.lastSnap.communities.find(c => c.id === tile.communityId)
    if (!community) return 'Empty land'

    if (!community.languageId) return `Community ${community.id} (no language)`

    const language = this.lastSnap.languages.get(community.languageId)
    if (!language) return `Community ${community.id} (unknown language)`

    return `${language.name} (${language.speakerCount} speakers)`
  }
}