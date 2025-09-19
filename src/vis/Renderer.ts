import { LanguageLike, MapMode, SimStateSnapshot } from '../engine/types'
import { colorFromPhonemeCount } from '../engine/phonology'

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private lastSnap: SimStateSnapshot | null = null
  private langColorCache = new Map<number, string>()
  private familyColorCache = new Map<number, string>()

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
  }

  render(snap: SimStateSnapshot, mode: MapMode) {
    this.lastSnap = snap
    const { ctx, canvas } = this
    const { world, communities, languages } = snap
    const w = world.w, h = world.h
    const cellW = canvas.width / w
    const cellH = canvas.height / h
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set up text rendering
    const fontSize = Math.max(8, Math.min(14, Math.floor(Math.min(cellW, cellH) * 0.5)))
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // First pass: draw all tiles
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x
        const cid = world.tiles[idx]
        
        const tileX = x * cellW
        const tileY = y * cellH
        const tileW = Math.ceil(cellW)
        const tileH = Math.ceil(cellH)
        
        if (cid == null) {
          // Water - dark blue/navy
          ctx.fillStyle = '#1a237e'
          ctx.fillRect(tileX, tileY, tileW, tileH)
        } else {
          // Land tile
          const c = communities[cid - 1]
          if (!c) continue
          
          const lang = languages.get(c.languageId)
          if (!lang) {
            // Community without language - use default gray color
            ctx.fillStyle = '#888888'
          } else {
            ctx.fillStyle = this.colorFor(mode, lang, c.population, c.prestige)
          }
          ctx.fillRect(tileX, tileY, tileW, tileH)
          
          // Draw text (sample word or abbreviated name)
          if (lang) {
            const text = this.getDisplayText(lang, cellW, cellH, mode)
            if (text && cellW > 20 && cellH > 15) {
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
    }

    // Second pass: draw boundaries
    this.drawAllBoundaries(world, communities, languages, cellW, cellH, mode)
  }

  private getDisplayText(lang: LanguageLike, cellW: number, cellH: number, mode: MapMode): string {
    // For vocabulary size mode, show vocab count
    if (mode === 'VOCABULARY_SIZE' && cellW > 30) {
      return lang.vocabSize.toString()
    }
    
    // For prestige mode, show prestige percentage
    if (mode === 'PRESTIGE' && cellW > 25) {
      return Math.round(lang.prestige * 100) + '%'
    }
    
    // Use sample word if available and fits, otherwise use abbreviated name
    if (lang.sampleWord && lang.sampleWord.length <= 4 && cellW > 25) {
      return lang.sampleWord
    }
    
    // Create abbreviated name
    const maxChars = Math.floor(cellW / 7) // Rough estimate of character width
    if (maxChars < 2) return ''
    
    if (lang.name.length <= maxChars) {
      return lang.name
    }
    
    return lang.name.substring(0, maxChars - 1) + '.'
  }

  private getTextColor(mode: MapMode, lang: LanguageLike): string {
    switch (mode) {
      case 'LANGUAGE':
      case 'FAMILY_TREE':
        // Use white or black based on background brightness
        const bgColor = mode === 'LANGUAGE' ? 
          (this.langColorCache.get(lang.id) || '#000000') :
          (this.familyColorCache.get(lang.familyId) || '#000000')
        return this.getContrastColor(bgColor)
      case 'PHONEME_COUNT':
        const [r, g, b] = colorFromPhonemeCount(lang.phonemeCount)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness > 128 ? '#000000' : '#ffffff'
      case 'SPEAKER_COUNT':
      case 'VOCABULARY_SIZE':
      case 'PRESTIGE':
        return '#ffffff' // White text on grayscale/colored backgrounds
      default:
        return '#ffffff'
    }
  }

  private getContrastColor(hexColor: string): string {
    // Extract RGB values from hex or hsl string
    let r = 0, g = 0, b = 0
    
    if (hexColor.startsWith('hsl(')) {
      // For HSL colors, use a simple heuristic based on lightness
      const match = hexColor.match(/hsl\(\d+,\s*\d+%,\s*(\d+)%\)/)
      if (match) {
        const lightness = parseInt(match[1])
        return lightness > 50 ? '#000000' : '#ffffff'
      }
    } else if (hexColor.startsWith('rgb(')) {
      const matches = hexColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (matches) {
        r = parseInt(matches[1])
        g = parseInt(matches[2])
        b = parseInt(matches[3])
      }
    } else if (hexColor.startsWith('#')) {
      const hex = hexColor.substring(1)
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
    }
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#000000' : '#ffffff'
  }

  colorFor(mode: MapMode, lang: LanguageLike, pop: number, prestige: number): string {
    switch (mode) {
      case 'LANGUAGE': {
        let c = this.langColorCache.get(lang.id)
        if (!c) {
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
      case 'FAMILY_TREE': {
        let c = this.familyColorCache.get(lang.familyId)
        if (!c) {
          // Generate family colors
          const seed = (lang.familyId * 7919 + 31337) % 233280
          const hue = (seed % 360)
          const saturation = 70 + (seed % 30) // 70-100%
          const lightness = 40 + (lang.generation * 5) % 40  // Vary by generation
          c = `hsl(${hue}, ${saturation}%, ${lightness}%)`
          this.familyColorCache.set(lang.familyId, c)
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
      case 'PRESTIGE': {
        const t = Math.max(0, Math.min(1, prestige))
        const r = Math.floor(255 * (1 - t) * 0.3 + 255 * t * 0.9) // Red to yellow/gold
        const g = Math.floor(255 * t * 0.8)
        const b = Math.floor(255 * (1 - t) * 0.2)
        return `rgb(${r},${g},${b})`
      }
      case 'VOCABULARY_SIZE': {
        const t = Math.max(0, Math.min(1, (lang.vocabSize - 50) / 450)) // 50-500 range
        const r = Math.floor(255 * t * 0.2)
        const g = Math.floor(255 * t * 0.6)
        const b = Math.floor(255 * (0.4 + t * 0.6))
        return `rgb(${r},${g},${b})`
      }
      default:
        return '#666666'
    }
  }

  private drawAllBoundaries(
    world: any, 
    communities: any[], 
    languages: Map<number, LanguageLike>,
    cellW: number, 
    cellH: number,
    mode: MapMode
  ) {
    const { ctx } = this
    const w = world.w, h = world.h
    
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.4
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x
        const cid = world.tiles[idx]
        if (cid == null) continue
        
        const community = communities[cid - 1]
        if (!community) continue
        
        const lang = languages.get(community.languageId)
        if (!lang) continue
        
        const baseId = this.getGroupingId(lang, mode)
        
        const tileX = x * cellW
        const tileY = y * cellH
        const tileW = Math.ceil(cellW)
        const tileH = Math.ceil(cellH)
        
        // Check right neighbor
        if (x + 1 < w) {
          const rightIdx = y * w + (x + 1)
          const rightCid = world.tiles[rightIdx]
          if (rightCid) {
            const rightComm = communities[rightCid - 1]
            const rightLang = rightComm ? languages.get(rightComm.languageId) : null
            const rightId = rightLang ? this.getGroupingId(rightLang, mode) : null
            
            if (rightId !== baseId) {
              ctx.beginPath()
              ctx.moveTo(tileX + tileW, tileY)
              ctx.lineTo(tileX + tileW, tileY + tileH)
              ctx.stroke()
            }
          }
        }
        
        // Check bottom neighbor
        if (y + 1 < h) {
          const bottomIdx = (y + 1) * w + x
          const bottomCid = world.tiles[bottomIdx]
          if (bottomCid) {
            const bottomComm = communities[bottomCid - 1]
            const bottomLang = bottomComm ? languages.get(bottomComm.languageId) : null
            const bottomId = bottomLang ? this.getGroupingId(bottomLang, mode) : null
            
            if (bottomId !== baseId) {
              ctx.beginPath()
              ctx.moveTo(tileX, tileY + tileH)
              ctx.lineTo(tileX + tileW, tileY + tileH)
              ctx.stroke()
            }
          }
        }
      }
    }
    
    ctx.globalAlpha = 1.0
  }

  private getGroupingId(lang: LanguageLike, mode: MapMode): number {
    switch (mode) {
      case 'FAMILY_TREE':
        return lang.familyId
      default:
        return lang.id
    }
  }

  hitTest(px: number, py: number): string | null {
    if (!this.lastSnap) return null
    const { world, communities, languages } = this.lastSnap
    const cellW = this.canvas.width / world.w
    const cellH = this.canvas.height / world.h
    const x = Math.floor(px / cellW)
    const y = Math.floor(py / cellH)
    if (x < 0 || y < 0 || x >= world.w || y >= world.h) return null
    const idx = y * world.w + x
    const cid = world.tiles[idx]
    if (cid == null) return 'Water'
    const c = communities[cid - 1]
    if (!c) return null
    const lang = languages.get(c.languageId)!
    return `${lang.name} • phonemes: ${lang.phonemeCount} • prestige: ${(lang.prestige * 100).toFixed(1)}% • pop: ${c.population} • vocab: ${lang.vocabSize} • gen: ${lang.generation}`
  }
}