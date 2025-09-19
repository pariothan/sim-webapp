export interface LanguageConfig {
  minPhonemes: number
  maxPhonemes: number
  initialVocabSize: number
  maxVocabSize: number
}

export interface Word {
  form: string
  meaning: string
  borrowed: boolean
  createdAt: number
}

export class Language {
  public readonly id: number
  public name: string
  public phonemes: string[]
  public vocabulary: Map<string, Word>
  public prestige: number
  public conservatism: number
  public familyId: number
  public generation: number
  public parentId: number | null
  public createdAt: number
  public lastChanged: number

  private static nextId = 1
  private static nextFamilyId = 1

  constructor(parent?: Language, tick: number = 0) {
    this.id = Language.nextId++
    this.familyId = parent ? parent.familyId : Language.nextFamilyId++
    this.generation = parent ? parent.generation + 1 : 0
    this.parentId = parent?.id || null
    this.createdAt = tick
    this.lastChanged = tick

    this.name = this.generateName()
    this.phonemes = this.generatePhonemes(parent)
    this.vocabulary = new Map()
    this.prestige = 0.3 + Math.random() * 0.4
    this.conservatism = Math.random() * 0.8

    this.initializeVocabulary(parent, tick)
  }

  private generateName(): string {
    const syllables = ['ka', 'ti', 'ra', 'po', 'mi', 'su', 'no', 'ze', 'li', 'va']
    const length = 2 + Math.floor(Math.random() * 2)
    let name = ''
    for (let i = 0; i < length; i++) {
      name += syllables[Math.floor(Math.random() * syllables.length)]
    }
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  private generatePhonemes(parent?: Language): string[] {
    const allPhonemes = [
      'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'h',
      'm', 'n', 'ŋ', 'l', 'r', 'j', 'w',
      'i', 'e', 'a', 'o', 'u', 'ə'
    ]

    if (parent) {
      // Inherit with some mutations
      const inherited = [...parent.phonemes]
      
      // Small chance to add/remove phonemes
      if (Math.random() < 0.3 && inherited.length < 30) {
        const available = allPhonemes.filter(p => !inherited.includes(p))
        if (available.length > 0) {
          inherited.push(available[Math.floor(Math.random() * available.length)])
        }
      }
      
      if (Math.random() < 0.2 && inherited.length > 8) {
        inherited.splice(Math.floor(Math.random() * inherited.length), 1)
      }
      
      return inherited
    } else {
      // Generate initial inventory
      const vowels = ['i', 'e', 'a', 'o', 'u']
      const consonants = allPhonemes.filter(p => !vowels.includes(p))
      
      const inventory = [...vowels] // Always include all basic vowels
      const numConsonants = 8 + Math.floor(Math.random() * 12)
      
      for (let i = 0; i < numConsonants; i++) {
        const consonant = consonants[Math.floor(Math.random() * consonants.length)]
        if (!inventory.includes(consonant)) {
          inventory.push(consonant)
        }
      }
      
      return inventory
    }
  }

  private initializeVocabulary(parent?: Language, tick: number = 0): void {
    const meanings = [
      'water', 'fire', 'earth', 'air', 'sun', 'moon', 'star', 'tree', 'stone', 'river',
      'mountain', 'sea', 'sky', 'cloud', 'rain', 'wind', 'snow', 'ice', 'sand', 'grass',
      'flower', 'leaf', 'root', 'seed', 'fruit', 'wood', 'bone', 'blood', 'skin', 'hair',
      'eye', 'ear', 'nose', 'mouth', 'hand', 'foot', 'head', 'heart', 'tooth', 'tongue',
      'man', 'woman', 'child', 'mother', 'father', 'brother', 'sister', 'friend', 'enemy',
      'house', 'village', 'path', 'door', 'window', 'roof', 'wall', 'floor', 'bed', 'table',
      'food', 'meat', 'fish', 'bread', 'milk', 'honey', 'salt', 'spice', 'drink', 'wine',
      'knife', 'spear', 'bow', 'arrow', 'shield', 'sword', 'tool', 'rope', 'cloth', 'pot',
      'one', 'two', 'three', 'four', 'five', 'many', 'few', 'all', 'some', 'none',
      'big', 'small', 'long', 'short', 'high', 'low', 'wide', 'narrow', 'thick', 'thin',
      'hot', 'cold', 'warm', 'cool', 'wet', 'dry', 'hard', 'soft', 'smooth', 'rough',
      'light', 'dark', 'bright', 'dim', 'red', 'blue', 'green', 'yellow', 'black', 'white',
      'good', 'bad', 'new', 'old', 'young', 'strong', 'weak', 'fast', 'slow', 'loud', 'quiet',
      'go', 'come', 'walk', 'run', 'jump', 'climb', 'fall', 'fly', 'swim', 'crawl',
      'eat', 'drink', 'sleep', 'wake', 'see', 'hear', 'smell', 'taste', 'touch', 'feel',
      'think', 'know', 'learn', 'teach', 'speak', 'listen', 'sing', 'dance', 'play', 'work',
      'make', 'break', 'build', 'destroy', 'give', 'take', 'buy', 'sell', 'trade', 'steal',
      'love', 'hate', 'like', 'fear', 'hope', 'dream', 'laugh', 'cry', 'smile', 'frown',
      'live', 'die', 'born', 'grow', 'change', 'move', 'stop', 'start', 'end', 'begin'
    ]

    if (parent) {
      // Inherit vocabulary with sound changes
      for (const [meaning, word] of parent.vocabulary) {
        if (Math.random() < 0.8) { // 80% inheritance rate
          this.vocabulary.set(meaning, {
            form: this.evolveWord(word.form),
            meaning,
            borrowed: word.borrowed,
            createdAt: tick
          })
        }
      }
    }

    // Fill vocabulary to target size
    const targetSize = 50 + Math.floor(Math.random() * 50)
    const availableMeanings = meanings.filter(m => !this.vocabulary.has(m))
    
    while (this.vocabulary.size < targetSize && availableMeanings.length > 0) {
      const meaning = availableMeanings.splice(Math.floor(Math.random() * availableMeanings.length), 1)[0]
      this.vocabulary.set(meaning, {
        form: this.generateWord(),
        meaning,
        borrowed: false,
        createdAt: tick
      })
    }
  }

  private generateWord(): string {
    const vowels = this.phonemes.filter(p => 'ieoauə'.includes(p))
    const consonants = this.phonemes.filter(p => !'ieoauə'.includes(p))
    
    if (vowels.length === 0) vowels.push('a')
    if (consonants.length === 0) consonants.push('t')

    const syllables = 1 + Math.floor(Math.random() * 2)
    let word = ''

    for (let i = 0; i < syllables; i++) {
      // Optional onset
      if (Math.random() < 0.8) {
        word += consonants[Math.floor(Math.random() * consonants.length)]
      }
      
      // Nucleus (required)
      word += vowels[Math.floor(Math.random() * vowels.length)]
      
      // Optional coda
      if (Math.random() < 0.3) {
        word += consonants[Math.floor(Math.random() * consonants.length)]
      }
    }

    return word || 'a'
  }

  private evolveWord(word: string): string {
    let result = word
    
    // Simple sound changes
    if (Math.random() < 0.3) {
      const changes = [
        ['p', 'f'], ['t', 's'], ['k', 'x'],
        ['a', 'ə'], ['o', 'u'], ['i', 'e']
      ]
      
      const change = changes[Math.floor(Math.random() * changes.length)]
      result = result.replace(new RegExp(change[0], 'g'), change[1])
    }
    
    return result || word
  }

  evolve(tick: number): void {
    if (tick - this.lastChanged < 5) return
    
    this.lastChanged = tick
    
    // Evolve some words
    const wordsToEvolve = Math.min(3, Math.floor(this.vocabulary.size * 0.05))
    const words = Array.from(this.vocabulary.entries())
    
    for (let i = 0; i < wordsToEvolve; i++) {
      const [meaning, word] = words[Math.floor(Math.random() * words.length)]
      if (Math.random() < 0.2) {
        this.vocabulary.set(meaning, {
          ...word,
          form: this.evolveWord(word.form)
        })
      }
    }
    
    // Prestige drift
    this.prestige = Math.max(0.1, Math.min(0.9, this.prestige + (Math.random() - 0.5) * 0.05))
  }

  borrowWord(sourceLanguage: Language, meaning: string, tick: number): boolean {
    const sourceWord = sourceLanguage.vocabulary.get(meaning)
    if (!sourceWord) return false

    this.vocabulary.set(meaning, {
      form: this.adaptWord(sourceWord.form),
      meaning,
      borrowed: true,
      createdAt: tick
    })

    return true
  }

  private adaptWord(foreignWord: string): string {
    // Simple phonological adaptation
    let adapted = foreignWord
    
    for (const char of foreignWord) {
      if (!this.phonemes.includes(char)) {
        // Replace with similar phoneme
        const vowels = this.phonemes.filter(p => 'ieoauə'.includes(p))
        const consonants = this.phonemes.filter(p => !'ieoauə'.includes(p))
        
        if ('ieoauə'.includes(char)) {
          adapted = adapted.replace(char, vowels[Math.floor(Math.random() * vowels.length)])
        } else {
          adapted = adapted.replace(char, consonants[Math.floor(Math.random() * consonants.length)])
        }
      }
    }
    
    return adapted || foreignWord
  }

  getSampleWord(): string {
    const words = Array.from(this.vocabulary.values())
    return words.length > 0 ? words[Math.floor(Math.random() * words.length)].form : 'word'
  }
}