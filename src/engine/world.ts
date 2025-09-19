
import { SimConfig, World } from './types'

function rand(){ return Math.random() }

export function generateWorld(cfg: SimConfig): World{
  const w = cfg.gridW, h = cfg.gridH
  // Start with random noise with island bias (higher land prob near center)
  const tiles: (number|null)[] = new Array(w*h).fill(null)
  const centerX = (w-1)/2, centerY = (h-1)/2
  const maxDist = Math.hypot(centerX, centerY)

  let landMask = new Array(w*h).fill(0)
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const idx = y*w+x
      const dist = Math.hypot(x-centerX, y-centerY) / maxDist
      const bias = (1 - dist) * cfg.islandBias
      const p = cfg.landProb + bias
      landMask[idx] = rand() < p ? 1 : 0
    }
  }

  // Smooth with cellular automata rules
  const nbrs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]
  for(let s=0;s<cfg.smoothSteps;s++){
    const next = new Array(w*h).fill(0)
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const idx = y*w + x
        let count = 0
        for(const [dx,dy] of nbrs){
          const nx = x+dx, ny = y+dy
          if(nx<0||ny<0||nx>=w||ny>=h) continue
          if(landMask[ny*w+nx]) count++
        }
        next[idx] = (landMask[idx] && count>=3) || (!landMask[idx] && count>=5) ? 1 : 0
      }
    }
    landMask = next
  }

  // Assign community ids to land tiles (contiguous ids later filled by simulation seeding)
  for(let i=0;i<w*h;i++){
    if(landMask[i]) tiles[i] = -1 // placeholder: land exists but no community yet
  }
  return { w, h, tiles }
}
