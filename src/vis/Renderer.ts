import { LanguageLike, MapMode, SimStateSnapshot } from '../engine/types'
import { colorFromPhonemeCount } from '../engine/phonology'

export class Renderer{
  private ctx: CanvasRenderingContext2D
  private lastSnap: SimStateSnapshot | null = null
  private langColorCache = new Map<number, string>()

  constructor(private canvas: HTMLCanvasElement){
    const ctx = canvas.getContext('2d')
    if(!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
  }

  render(snap: SimStateSnapshot, mode: MapMode){
    this.lastSnap = snap
    const { ctx, canvas } = this
    const { world, communities, languages } = snap
    const w = world.w, h = world.h
    const cellW = canvas.width / w
    const cellH = canvas.height / h
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set up text rendering
    const fontSize = Math.max(8, Math.min(12, Math.floor(Math.min(cellW, cellH) * 0.4)))
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // First pass: draw all tiles
    for(let y = 0; y < h; y++){
      for(let x = 0; x < w; x++){
        const idx = y * w + x
        const cid = world.tiles[idx]
        
        const tileX = x * cellW
        const tileY = y * cellH
        const tileW = Math.ceil(cellW)
        const tileH = Math.ceil(cellH)
        
        if(cid == null){
          // Water - dark blue/navy
          ctx.fillStyle = '#1a237e'
          ctx.fillRect(tileX, tileY, tileW, tileH)
        } else {
          // Land tile
          const c = communities[cid - 1]
          if(!c) continue
          
          const lang = languages.get(c.languageId)!
          ctx.fillStyle = this.colorFor(mode, lang, c.population)
          ctx.fillRect(tileX, tileY, tileW, tileH)
          
          // Draw text (sample word or abbreviated name)
          const text = this.getDisplayText(lang, cellW, cellH)
          if(text && cellW > 20 && cellH > 15) {
            ctx.fillStyle = this.getTextColor(mode, lang)
            ctx.fillText(
              text, 
              tileX + tileW / 2, 
              tileY + tileH / 2
            )
          }
        }
      }
    }

    // Second pass: draw boundaries
    this.drawAllBoundaries(world, communities, cellW, cellH)
  }

  private getDisplayText(lang: LanguageLike, cellW: number, cellH: number): string {
    // Use sample word if available and fits, otherwise use abbreviated name
    if(lang.sampleWord && lang.sampleWord.length <= 4) {
      return lang.sampleWord
    }
    
    // Create abbreviated name
    const maxChars = Math.floor(cellW / 6) // Rough estimate of character width
    if(maxChars < 2) return ''
    
    if(lang.name.length <= maxChars) {
      return lang.name
    }
    
    return lang.name.substring(0, maxChars - 1) + '.'
  }

  private getTextColor(mode: MapMode, lang: LanguageLike): string {
    switch(mode) {
      case 'LANGUAGE':
        // Use white or black based on background brightness
        const bgColor = this.langColorCache.get(lang.id) || '#000000'
        return this.getContrastColor(bgColor)
      case 'PHONEME_COUNT':
        const [r, g, b] = colorFromPhonemeCount(lang.phonemeCount)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness > 128 ? '#000000' : '#ffffff'
      case 'SPEAKER_COUNT':
        return '#ffffff' // White text on grayscale background
      default:
        return '#ffffff'
    }
  }

  private getContrastColor(hexColor: string): string {
    // Extract RGB values from hex or rgb string
    let r = 0, g = 0, b = 0
    
    if(hexColor.startsWith('rgb(')) {
      const matches = hexColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if(matches) {
        r = parseInt(matches[1])
        g = parseInt(matches[2])
        b = parseInt(matches[3])
      }
    } else if(hexColor.startsWith('#')) {
      const hex = hexColor.substring(1)
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
    }
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#000000' : '#ffffff'
  }

  colorFor(mode: MapMode, lang: LanguageLike, pop: number): string {
    switch(mode){
      case 'LANGUAGE': {
        let c = this.langColorCache.get(lang.id)
        if(!c){
          // Generate more vibrant, distinct colors
          const seed = (lang.id * 9301 + 49297) % 233280
          const hue = (seed % 360)
          const saturation = 65 + (seed % 35) // 65-100%
          const lightness = 45 + (seed % 25)  // 45-70%
          c = `hsl(${hue}, ${saturation}%, ${lightness}%)`
          this.langColorCache.set(lang.id, c)
        }
        return c
      }
      case 'PHONEME_COUNT': {
        const [r, g, b] = colorFromPhonemeCount(lang.phonemeCount)
        return `rgb(${r},${g},${b})`
      }
      case 'SPEAKER_COUNT': {
        const t = Math.max(0, Math.min(1, pop / 100))
        const v = Math.floor(50 + 205 * t) // Range from 50 to 255 for better visibility
        return `rgb(${v},${v},${v})`
      }
    }
  }

  private drawAllBoundaries(world: any, communities: any[], cellW: number, cellH: number) {
    const { ctx } = this
    const w = world.w, h = world.h
    
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.3
    
    for(let y = 0; y < h; y++) {
      for(let x = 0; x < w; x++) {
        const idx = y * w + x
        const cid = world.tiles[idx]
        if(cid == null) continue
        
        const baseLangId = communities[cid - 1]?.languageId
        if(!baseLangId) continue
        
        const tileX = x * cellW
        const tileY = y * cellH
        const tileW = Math.ceil(cellW)
        const tileH = Math.ceil(cellH)
        
        // Check right neighbor
        if(x + 1 < w) {
          const rightIdx = y * w + (x + 1)
          const rightCid = world.tiles[rightIdx]
          const rightLangId = rightCid ? communities[rightCid - 1]?.languageId : null
          
          if(rightLangId !== baseLangId) {
            ctx.beginPath()
            ctx.moveTo(tileX + tileW, tileY)
            ctx.lineTo(tileX + tileW, tileY + tileH)
            ctx.stroke()
          }
        }
        
        // Check bottom neighbor
        if(y + 1 < h) {
          const bottomIdx = (y + 1) * w + x
          const bottomCid = world.tiles[bottomIdx]
          const bottomLangId = bottomCid ? communities[bottomCid - 1]?.languageId : null
          
          if(bottomLangId !== baseLangId) {
            ctx.beginPath()
            ctx.moveTo(tileX, tileY + tileH)
            ctx.lineTo(tileX + tileW, tileY + tileH)
            ctx.stroke()
          }
        }
      }
    }
    
    ctx.globalAlpha = 1.0
  }

  hitTest(px: number, py: number): string | null{
    if(!this.lastSnap) return null
    const { world, communities, languages } = this.lastSnap
    const cellW = this.canvas.width / world.w
    const cellH = this.canvas.height / world.h
    const x = Math.floor(px / cellW)
    const y = Math.floor(py / cellH)
    if(x < 0 || y < 0 || x >= world.w || y >= world.h) return null
    const idx = y * world.w + x
    const cid = world.tiles[idx]
    if(cid == null) return 'Water'
    const c = communities[cid - 1]
    if(!c) return null
    const lang = languages.get(c.languageId)!
    return `${lang.name} • phonemes: ${lang.phonemeCount} • prestige: ${(lang.prestige * 100).toFixed(1)}% • pop: ${c.population}`
  }
}