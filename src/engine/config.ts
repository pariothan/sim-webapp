export interface Config {
  // World generation
  GRID_WIDTH: number
  GRID_HEIGHT: number
  LAND_PROBABILITY: number
  ISLAND_BIAS: number
  SMOOTH_STEPS: number
  
  // Simulation parameters
  P_SPREAD: number
  P_BORROW: number
  P_MUTATE: number
  P_LANGUAGE_SPLIT: number
  P_SOUND_CHANGE: number
  
  // Language parameters
  MIN_PHONEMES: number
  MAX_PHONEMES: number
  INITIAL_VOCAB_SIZE: number
  MAX_VOCAB_SIZE: number
  
  // Evolution parameters
  CONSERVATISM_FACTOR: number
  PRESTIGE_THRESHOLD: number
  CONTACT_INFLUENCE: number
  
  // Display
  PRINT_STATS: boolean
  STATS_INTERVAL: number
  LEADERBOARD_TOPK: number
  
  // Starter languages
  STARTER_WORDS: string[]
}

export const DEFAULT_CONFIG: Config = {
  // World generation
  GRID_WIDTH: 30,
  GRID_HEIGHT: 20,
  LAND_PROBABILITY: 0.12,
  ISLAND_BIAS: 0.55,
  SMOOTH_STEPS: 3,
  
  // Simulation parameters
  P_SPREAD: 0.22,
  P_BORROW: 0.12,
  P_MUTATE: 0.05,
  P_LANGUAGE_SPLIT: 0.01,
  P_SOUND_CHANGE: 0.08,
  
  // Language parameters
  MIN_PHONEMES: 12,
  MAX_PHONEMES: 45,
  INITIAL_VOCAB_SIZE: 100,
  MAX_VOCAB_SIZE: 500,
  
  // Evolution parameters
  CONSERVATISM_FACTOR: 0.5,
  PRESTIGE_THRESHOLD: 0.6,
  CONTACT_INFLUENCE: 0.3,
  
  // Display
  PRINT_STATS: true,
  STATS_INTERVAL: 50,
  LEADERBOARD_TOPK: 5,
  
  // Starter languages
  STARTER_WORDS: ['kala', 'tano', 'miru', 'sola', 'veda']
}