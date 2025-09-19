
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
    ctx.clearRect(0,0,canvas.width, canvas.height)

    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Consolas';
      ctx.textBaseline = 'top';
      for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const idx = y*w + x
        const cid = world.tiles[idx]
        if(cid == null){
          // water
          ctx.fillStyle = '#0a1020'
          ctx.fillRect(x*cellW, y*cellH, Math.ceil(cellW)+1, Math.ceil(cellH)+1);
          const text = lang.sampleWord || lang.name;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText(text, x*cellW+2, y*cellH+1);
          this.drawBoundary(x,y,cellW,cellH)
          continue
        }
        const c = communities[cid-1]
        if(!c){ continue }
        const lang = languages.get(c.languageId)!
        ctx.fillStyle = this.colorFor(mode, lang, c.population)
        ctx.fillRect(x*cellW, y*cellH, Math.ceil(cellW)+1, Math.ceil(cellH)+1);
          const text = lang.sampleWord || lang.name;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText(text, x*cellW+2, y*cellH+1);
          this.drawBoundary(x,y,cellW,cellH)
      }
    }
  }

  colorFor(mode: MapMode, lang: LanguageLike, pop: number){
    switch(mode){
      case 'LANGUAGE': {
        let c = this.langColorCache.get(lang.id)
        if(!c){
          const seed = (lang.id * 9301 + 49297) % 233280
          const r = (seed % 255)
          const g = ((seed*3) % 255)
          const b = ((seed*7) % 255)
          c = `rgb(${r},${g},${b})`
          this.langColorCache.set(lang.id, c)
        }
        return c
      }
      case 'PHONEME_COUNT': {
        const [r,g,b] = colorFromPhonemeCount(lang.phonemeCount)
        return `rgb(${r},${g},${b})`
      }
      case 'SPEAKER_COUNT': {
        const t = Math.max(0, Math.min(1, pop/100))
        const v = Math.floor(255 * t)
        return `rgb(${v},${v},${v})`
      }
    }
  }

  hitTest(px: number, py: number): string | null{
    if(!this.lastSnap) return null
    const { world, communities, languages } = this.lastSnap
    const cellW = this.canvas.width / world.w
    const cellH = this.canvas.height / world.h
    const x = Math.floor(px / cellW)
    const y = Math.floor(py / cellH)
    if(x<0||y<0||x>=world.w||y>=world.h) return null
    const idx = y*world.w + x
    const cid = world.tiles[idx]
    if(cid == null) return null
    const c = communities[cid-1]
    const lang = languages.get(c.languageId)!
    return `${lang.name} • phonemes: ${lang.phonemeCount} • prestige: ${lang.prestige.toFixed(2)} • pop: ${c.population}`
  }



  private drawBoundary(x:number,y:number,cw:number,ch:number){
    if(!this.lastSnap) return
    const { world, communities } = this.lastSnap
    const w = world.w, h = world.h
    const idx = y*w + x
    const cid = world.tiles[idx]
    if(cid==null) return
    const base = communities[cid-1]?.languageId
    const ctx = this.ctx

    // right edge
    if(x+1<w){
      const cid2 = world.tiles[y*w + (x+1)]
      const base2 = (cid2==null)? null : communities[cid2-1]?.languageId
      if(base2!==base){
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo((x+1)*cw+0.5, y*ch)
        ctx.lineTo((x+1)*cw+0.5, (y+1)*ch)
        ctx.stroke()
      }
    }
    // bottom edge
    if(y+1<h){
      const cid3 = world.tiles[(y+1)*w + x]
      const base3 = (cid3==null)? null : communities[cid3-1]?.languageId
      if(base3!==base){
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x*cw, (y+1)*ch+0.5)
        ctx.lineTo((x+1)*cw, (y+1)*ch+0.5)
        ctx.stroke()
      }
    }
  }
}