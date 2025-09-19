export interface WorldConfig {
  width: number
  height: number
  landProbability: number
  islandBias: number
  smoothingPasses: number
}

export interface Tile {
  isLand: boolean
  communityId: number | null
}

export class World {
  public readonly width: number
  public readonly height: number
  public readonly tiles: Tile[]

  constructor(config: WorldConfig) {
    this.width = config.width
    this.height = config.height
    this.tiles = this.generateTerrain(config)
  }

  private generateTerrain(config: WorldConfig): Tile[] {
    const tiles: Tile[] = new Array(this.width * this.height)
    
    // Initial noise generation with island bias
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x
        const centerX = this.width / 2
        const centerY = this.height / 2
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2)
        const bias = (1 - distance / maxDistance) * config.islandBias
        const probability = config.landProbability + bias
        
        tiles[index] = {
          isLand: Math.random() < probability,
          communityId: null
        }
      }
    }

    // Cellular automata smoothing
    for (let pass = 0; pass < config.smoothingPasses; pass++) {
      const newTiles = [...tiles]
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const index = y * this.width + x
          const landNeighbors = this.countLandNeighbors(tiles, x, y)
          newTiles[index] = {
            ...tiles[index],
            isLand: landNeighbors >= 4
          }
        }
      }
      tiles.splice(0, tiles.length, ...newTiles)
    }

    return tiles
  }

  private countLandNeighbors(tiles: Tile[], x: number, y: number): number {
    let count = 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) {
          count++ // Treat out-of-bounds as land for edge effects
        } else {
          const index = ny * this.width + nx
          if (tiles[index].isLand) count++
        }
      }
    }
    return count
  }

  getTile(x: number, y: number): Tile | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null
    return this.tiles[y * this.width + x]
  }

  getNeighbors(x: number, y: number): Array<{x: number, y: number, tile: Tile}> {
    const neighbors = []
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]
    
    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy
      const tile = this.getTile(nx, ny)
      if (tile) {
        neighbors.push({ x: nx, y: ny, tile })
      }
    }
    
    return neighbors
  }
}