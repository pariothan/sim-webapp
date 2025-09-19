import { SimulationState } from '../core/Simulation'
import { Language } from '../core/Language'

export type MapMode = 'LANGUAGE' | 'PHONEME_COUNT' | 'SPEAKER_COUNT' | 'PRESTIGE' | 'FAMILY_TREE' | 'VOCABULARY_SIZE'

export class MapRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private lastState: SimulationState | null = null
  private languageColors = new Map<number, string>()
  private familyColors = new Map<number, string>()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx
  }

  render(state: SimulationState, mode: MapMode): void {
    this.lastState = state
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const cellWidth = this.canvas.width / state.world.width
    const cellHeight = this.canvas.height / state.world.height

    // Render tiles
    for (let y = 0; y < state.world.height; y++) {
      for (let x = 0; x < state.world.width; x++) {
        this.renderTile(x, y, cellWidth, cellHeight, state, mode)
      }
    }

    // Render borders
    this.renderBorders(state, mode, cellWidth, cellHeight)
  }

  private renderTile(
    x: number, 
    y: number, 
    cellWidth: number, 
    cellHeight: number, 
    state: SimulationState, 
    mode: MapMode
  ): void {
    const tile = state.world.getTile(x, y)
    if (!tile) return

    const pixelX = x * cellWidth
    const pixelY = y * cellHeight

    if (!tile.isLand) {
      // Water
      this.ctx.fillStyle = '#1a237e'
      this.ctx.fillRect(pixelX, pixelY, cellWidth, cellHeight)
      return
    }

    // Land
    const community = state.communities.find(c => c.id === tile.communityId)
    if (!community || !community.hasLanguage()) {
      this.ctx.fillStyle = '#8d6e63'
      this.ctx.fillRect(pixelX, pixelY, cellWidth, cellHeight)
      return
    }

    const language = state.languages.get(community.languageId!)
    if (!language) {
      this.ctx.fillStyle = '#8d6e63'
      this.ctx.fillRect(pixelX, pixelY, cellWidth, cellHeight)
      return
    }

    // Colored tile based on mode
    this.ctx.fillStyle = this.getColor(language, community, mode, state)
    this.ctx.fillRect(pixelX, pixelY, cellWidth, cellHeight)

    // Text overlay
    if (cellWidth > 20 && cellHeight > 15) {
      const text = this.getText(language, mode)
      if (text) {
        this.ctx.fillStyle = this.getTextColor(mode)
        this.ctx.font = `${Math.min(12, cellHeight * 0.6)}px monospace`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(text, pixelX + cellWidth / 2, pixelY + cellHeight / 2)
      }
    }
  }

  private getColor(language: Language, community: any, mode: MapMode, state: SimulationState): string {
    switch (mode) {
      case 'LANGUAGE':
        return this.getLanguageColor(language.id)
      
      case 'FAMILY_TREE':
        return this.getFamilyColor(language.familyId)
      
      case 'PHONEME_COUNT':
        const t = Math.min(1, language.phonemes.length / 30)
        return `hsl(${240 - t * 120}, 70%, ${30 + t * 40}%)`
      
      case 'SPEAKER_COUNT':
        const speakers = state.communities.filter(c => c.languageId === language.id).length
        const intensity = Math.min(1, speakers / 10)
        const gray = Math.floor(50 + intensity * 150)
        return `rgb(${gray}, ${gray}, ${gray})`
      
      case 'PRESTIGE':
        const prestige = language.prestige
        return `hsl(${prestige * 60}, 80%, ${30 + prestige * 40}%)`
      
      case 'VOCABULARY_SIZE':
        const vocabSize = language.vocabulary.size
        const vocabT = Math.min(1, vocabSize / 100)
        return `hsl(${120 + vocabT * 120}, 60%, ${30 + vocabT * 30}%)`
      
      default:
        return '#666666'
    }
  }

  private getLanguageColor(languageId: number): string {
    if (!this.languageColors.has(languageId)) {
      const hue = (languageId * 137.5) % 360
      const saturation = 60 + (languageId % 40)
      const lightness = 40 + (languageId % 30)
      this.languageColors.set(languageId, `hsl(${hue}, ${saturation}%, ${lightness}%)`)
    }
    return this.languageColors.get(languageId)!
  }

  private getFamilyColor(familyId: number): string {
    if (!this.familyColors.has(familyId)) {
      const hue = (familyId * 97.3) % 360
      const saturation = 70 + (familyId % 30)
      const lightness = 45 + (familyId % 25)
      this.familyColors.set(familyId, `hsl(${hue}, ${saturation}%, ${lightness}%)`)
    }
    return this.familyColors.get(familyId)!
  }

  private getText(language: Language, mode: MapMode): string {
    switch (mode) {
      case 'PHONEME_COUNT':
        return language.phonemes.length.toString()
      case 'VOCABULARY_SIZE':
        return language.vocabulary.size.toString()
      case 'PRESTIGE':
        return Math.round(language.prestige * 100) + '%'
      default:
        return language.getSampleWord().substring(0, 4)
    }
  }

  private getTextColor(mode: MapMode): string {
    return mode === 'SPEAKER_COUNT' ? '#000000' : '#ffffff'
  }

  private renderBorders(state: SimulationState, mode: MapMode, cellWidth: number, cellHeight: number): void {
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
    this.ctx.lineWidth = 1

    for (let y = 0; y < state.world.height; y++) {
      for (let x = 0; x < state.world.width; x++) {
        const tile = state.world.getTile(x, y)
        if (!tile?.isLand) continue

        const community = state.communities.find(c => c.id === tile.communityId)
        if (!community?.hasLanguage()) continue

        const groupId = this.getGroupId(community.languageId!, mode, state)
        
        // Check right neighbor
        const rightTile = state.world.getTile(x + 1, y)
        if (rightTile?.isLand) {
          const rightCommunity = state.communities.find(c => c.id === rightTile.communityId)
          const rightGroupId = rightCommunity?.hasLanguage() ? 
            this.getGroupId(rightCommunity.languageId!, mode, state) : null
          
          if (rightGroupId !== groupId) {
            this.ctx.beginPath()
            this.ctx.moveTo((x + 1) * cellWidth, y * cellHeight)
            this.ctx.lineTo((x + 1) * cellWidth, (y + 1) * cellHeight)
            this.ctx.stroke()
          }
        }

        // Check bottom neighbor
        const bottomTile = state.world.getTile(x, y + 1)
        if (bottomTile?.isLand) {
          const bottomCommunity = state.communities.find(c => c.id === bottomTile.communityId)
          const bottomGroupId = bottomCommunity?.hasLanguage() ? 
            this.getGroupId(bottomCommunity.languageId!, mode, state) : null
          
          if (bottomGroupId !== groupId) {
            this.ctx.beginPath()
            this.ctx.moveTo(x * cellWidth, (y + 1) * cellHeight)
            this.ctx.lineTo((x + 1) * cellWidth, (y + 1) * cellHeight)
            this.ctx.stroke()
          }
        }
      }
    }
  }

  private getGroupId(languageId: number, mode: MapMode, state: SimulationState): number {
    if (mode === 'FAMILY_TREE') {
      const language = state.languages.get(languageId)
      return language?.familyId || languageId
    }
    return languageId
  }

  getTooltip(x: number, y: number): string | null {
    if (!this.lastState) return null

    const cellWidth = this.canvas.width / this.lastState.world.width
    const cellHeight = this.canvas.height / this.lastState.world.height
    
    const tileX = Math.floor(x / cellWidth)
    const tileY = Math.floor(y / cellHeight)
    
    const tile = this.lastState.world.getTile(tileX, tileY)
    if (!tile) return null
    
    if (!tile.isLand) return 'Water'
    
    const community = this.lastState.communities.find(c => c.id === tile.communityId)
    if (!community) return 'Empty land'
    
    if (!community.hasLanguage()) {
      return `No language • Population: ${community.population} • Prestige: ${Math.round(community.prestige * 100)}%`
    }
    
    const language = this.lastState.languages.get(community.languageId!)
    if (!language) return 'Unknown language'
    
    const speakers = this.lastState.communities.filter(c => c.languageId === language.id).length
    
    return `${language.name} • Phonemes: ${language.phonemes.length} • Speakers: ${speakers} • Vocab: ${language.vocabulary.size} • Gen: ${language.generation}`
  }

  getInspectorData(x: number, y: number): any {
    if (!this.lastState) return null

    const cellWidth = this.canvas.width / this.lastState.world.width
    const cellHeight = this.canvas.height / this.lastState.world.height
    
    const tileX = Math.floor(x / cellWidth)
    const tileY = Math.floor(y / cellHeight)
    
    const tile = this.lastState.world.getTile(tileX, tileY)
    if (!tile?.isLand) return null
    
    const community = this.lastState.communities.find(c => c.id === tile.communityId)
    if (!community?.hasLanguage()) return null
    
    const language = this.lastState.languages.get(community.languageId!)
    if (!language) return null

    const speakers = this.lastState.communities.filter(c => c.languageId === language.id).length
    const neighbors = this.lastState.world.getNeighbors(community.x, community.y)
    const contactLanguages = neighbors
      .map(n => this.lastState!.communities.find(c => c.id === n.tile.communityId))
      .filter(c => c?.hasLanguage() && c.languageId !== language.id)
      .map(c => this.lastState!.languages.get(c!.languageId!))
      .filter(l => l)
      .map(l => l!.name)

    const lexiconSample = Array.from(language.vocabulary.entries())
      .slice(0, 20)
      .map(([meaning, word]) => ({
        meaning,
        word: word.form,
        borrowed: word.borrowed
      }))

    return {
      community: {
        id: community.id,
        x: community.x,
        y: community.y,
        languageId: community.languageId,
        population: community.population,
        prestige: community.prestige
      },
      language: {
        id: language.id,
        name: language.name,
        phonemeCount: language.phonemes.length,
        phonemeInventory: language.phonemes,
        prestige: language.prestige,
        familyId: language.familyId,
        generation: language.generation,
        conservatism: language.conservatism,
        parentId: language.parentId,
        vocabSize: language.vocabulary.size,
        sampleWord: language.getSampleWord(),
        creationTick: language.createdAt,
        lastEvolved: language.lastChanged,
        speakerCount: speakers,
        lexiconSample,
        contactLanguages,
        evolutionHistory: [
          `Created at tick ${language.createdAt}`,
          `Last changed at tick ${language.lastChanged}`,
          `Generation ${language.generation} of family ${language.familyId}`,
          language.parentId ? `Descended from language ${language.parentId}` : 'Root language'
        ]
      }
    }
  }
}