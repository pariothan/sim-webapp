// Distinctive features for phonological representation
export const FEATURES = [
  "syllabic", "consonantal", "sonorant", "continuant", "nasal", "lateral",
  "voice", "labial", "coronal", "dorsal", "high", "low", "back", "round",
  "tense", "distributed", "strident", "anterior"
]

// Phoneme inventory with distinctive features
export const PHONEMES: Record<string, number[]> = {
  // Vowels
  "i": [1, -1, 1, 1, -1, -1, 1, -1, -1, 1, 1, -1, -1, -1, 1, -1, -1, -1],
  "e": [1, -1, 1, 1, -1, -1, 1, -1, -1, 1, 0, 0, -1, -1, 1, -1, -1, -1],
  "a": [1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, 1, 0, -1, 1, -1, -1, -1],
  "o": [1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, -1, -1, -1],
  "u": [1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, 1, -1, -1, -1],
  "ə": [1, -1, 1, 1, -1, -1, 1, -1, -1, 1, 0, 0, 0, -1, -1, -1, -1, -1],
  
  // Consonants - Stops
  "p": [-1, 1, -1, -1, -1, -1, -1, 1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 1],
  "b": [-1, 1, -1, -1, -1, -1, 1, 1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 1],
  "t": [-1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 0, 0, 0, 0, 0, 1, 0, 1],
  "d": [-1, 1, -1, -1, -1, -1, 1, -1, 1, -1, 0, 0, 0, 0, 0, 1, 0, 1],
  "k": [-1, 1, -1, -1, -1, -1, -1, -1, -1, 1, 0, 0, 0, 0, 0, 0, 0, -1],
  "g": [-1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 0, 0, 0, 0, 0, 0, 0, -1],
  
  // Fricatives
  "f": [-1, 1, -1, 1, -1, -1, -1, 1, -1, -1, 0, 0, 0, 0, 0, 0, 1, 1],
  "v": [-1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 0, 0, 0, 0, 0, 0, 1, 1],
  "s": [-1, 1, -1, 1, -1, -1, -1, -1, 1, -1, 0, 0, 0, 0, 0, 1, 1, 1],
  "z": [-1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 0, 0, 0, 0, 0, 1, 1, 1],
  "ʃ": [-1, 1, -1, 1, -1, -1, -1, -1, 1, -1, 0, 0, 0, 0, 0, -1, 1, -1],
  "ʒ": [-1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 0, 0, 0, 0, 0, -1, 1, -1],
  "h": [-1, 1, -1, 1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0],
  
  // Nasals
  "m": [-1, 1, 1, -1, 1, -1, 1, 1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 1],
  "n": [-1, 1, 1, -1, 1, -1, 1, -1, 1, -1, 0, 0, 0, 0, 0, 1, 0, 1],
  "ŋ": [-1, 1, 1, -1, 1, -1, 1, -1, -1, 1, 0, 0, 0, 0, 0, 0, 0, -1],
  
  // Liquids
  "l": [-1, 1, 1, 1, -1, 1, 1, -1, 1, -1, 0, 0, 0, 0, 0, 1, 0, 1],
  "r": [-1, 1, 1, 1, -1, -1, 1, -1, 1, -1, 0, 0, 0, 0, 0, 1, 0, 1],
  
  // Glides
  "j": [-1, -1, 1, 1, -1, -1, 1, -1, -1, 1, 1, 0, -1, -1, 0, 0, 0, -1],
  "w": [-1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 0, 1, 1, 0, 0, 0, -1]
}

export const INVENTORY = Object.keys(PHONEMES).sort()

export function featureDistance(a: number[], b: number[]): number {
  let distance = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 0 && b[i] === 0) continue
    if (a[i] === 0 || b[i] === 0) distance += 2
    else if (a[i] !== b[i]) distance += 1
  }
  return distance
}

export function isSyllabic(phoneme: string): boolean {
  const features = PHONEMES[phoneme]
  return features ? features[0] > 0 : false
}

export function isConsonant(phoneme: string): boolean {
  return !isSyllabic(phoneme)
}

export function syllableCount(word: string[]): number {
  return word.filter(p => isSyllabic(p)).length
}

export function ensureHasVowel(word: string[]): void {
  if (syllableCount(word) === 0) {
    const vowels = INVENTORY.filter(p => isSyllabic(p))
    const insertPos = Math.floor(word.length / 2)
    word.splice(insertPos, 0, vowels[Math.floor(Math.random() * vowels.length)])
  }
}

// Color projection for phoneme count visualization
export function colorFromPhonemeCount(count: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, count / 40))
  const r = Math.floor(255 * (1 - t) * 0.3)
  const g = Math.floor(255 * t * 0.8)
  const b = Math.floor(255 * (1 - t) * 0.9)
  return [r, g, b]
}

// Phonological rule system
export interface PhonologicalRule {
  name: string
  source: string
  target: string
  leftContext: string
  rightContext: string
  probability: number
  strength: number
  startTick: number
}

export class PhonologicalRuleSet {
  rules: PhonologicalRule[] = []
  version = 1

  addRule(rule: PhonologicalRule): void {
    this.rules.push(rule)
    this.version++
  }

  applyRules(word: string[], tick: number): string[] {
    let result = [...word]
    let iterations = 0
    const maxIterations = 10 // Prevent infinite rule application
    
    for (const rule of this.rules) {
      if (tick >= rule.startTick && Math.random() < rule.probability && iterations < maxIterations) {
        result = this.applyRule(result, rule)
        iterations++
      }
    }
    
    return result
  }

  private applyRule(word: string[], rule: PhonologicalRule): string[] {
    const result: string[] = []
    let changes = 0
    const maxChanges = 5 // Prevent excessive changes in one pass
    
    for (let i = 0; i < word.length; i++) {
      if (word[i] === rule.source && changes < maxChanges) {
        // Check context
        const leftOk = !rule.leftContext || 
          (i > 0 && this.matchesContext(word[i-1], rule.leftContext))
        const rightOk = !rule.rightContext || 
          (i < word.length - 1 && this.matchesContext(word[i+1], rule.rightContext))
        
        if (leftOk && rightOk && Math.random() < rule.strength) {
          if (rule.target !== '∅') {
            result.push(rule.target)
            changes++
          }
          // Skip if target is deletion (∅)
        } else {
          result.push(word[i])
        }
      } else {
        result.push(word[i])
      }
    }
    
    return result
  }

  private matchesContext(phoneme: string, context: string): boolean {
    if (context === 'V') return isSyllabic(phoneme)
    if (context === 'C') return isConsonant(phoneme)
    if (context === '#') return false // Word boundary - simplified
    return phoneme === context
  }

  evolve(tick: number, conservatism: number): void {
    // Add new rules occasionally
    if (Math.random() < (1 - conservatism) * 0.01) {
      const newRule = this.generateRandomRule(tick)
      if (newRule) {
        this.addRule(newRule)
      }
    }
    
    // Limit total number of rules to prevent performance issues
    if (this.rules.length > 10) {
      this.rules = this.rules.slice(-8) // Keep only the 8 most recent rules
      this.version++
    }
  }

  private generateRandomRule(tick: number): PhonologicalRule | null {
    const templates = [
      { source: 'p', target: 'f', leftContext: 'V', rightContext: 'V' },
      { source: 't', target: 's', leftContext: 'V', rightContext: 'V' },
      { source: 'k', target: 'x', leftContext: 'V', rightContext: 'V' },
      { source: 'a', target: 'ə', leftContext: 'C', rightContext: 'C' },
      { source: 'o', target: 'ə', leftContext: 'C', rightContext: 'C' }
    ]
    
    const template = templates[Math.floor(Math.random() * templates.length)]
    
    return {
      name: `${template.source}_to_${template.target}_${tick}`,
      source: template.source,
      target: template.target,
      leftContext: template.leftContext,
      rightContext: template.rightContext,
      probability: Math.random() * 0.5 + 0.3,
      strength: Math.random() * 0.5 + 0.5,
      startTick: tick
    }
  }
}