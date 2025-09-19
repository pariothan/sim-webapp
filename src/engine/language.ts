import { Language, Word } from './types'
import { INVENTORY, PHONEMES, isSyllabic, isConsonant, ensureHasVowel, PhonologicalRuleSet } from './phonology'
import { getRandomMeaning, CORE_VOCABULARY } from './vocabulary'

let nextLangId = 1
let nextFamilyId = 1

export function createLanguage(parent?: Language, tick: number = 0): Language {
  const id = nextLangId++
  const familyId = parent ? parent.familyId : nextFamilyId++
  const generation = parent ? parent.generation + 1 : 1
  const name = parent ? evolveName(parent.name) : generateLanguageName(id)
  
  // Inherit and mutate phoneme inventory
  let phonemeInventory: string[]
  if (parent) {
    phonemeInventory = [...parent.phonemeInventory]
    mutatePhonemeInventory(phonemeInventory)
  } else {
    phonemeInventory = generateInitialInventory()
  }
  
  const prestige = clamp(
    (parent ? parent.prestige : Math.random() * 0.6 + 0.3) + (Math.random() - 0.5) * 0.1,
    0.05, 1
  )
  
  const conservatism = clamp(Math.random() * 0.7, 0, 1)
  const vocabSize = parent ? Math.floor(parent.vocabSize * (0.8 + Math.random() * 0.4)) : 100 + Math.floor(Math.random() * 50)
  
  // Create lexicon
  const lexicon = new Map<string, Word>()
  if (parent) {
    // Inherit some vocabulary from parent
    const inheritanceRate = 0.7 + Math.random() * 0.2
    for (const [meaning, word] of parent.lexicon) {
      if (Math.random() < inheritanceRate) {
        const newWord: Word = {
          stringForm: evolveWord(word.stringForm, phonemeInventory),
          meaning: word.meaning,
          languageId: id,
          borrowedFrom: word.borrowedFrom,
          creationTick: tick,
          lastChanged: tick
        }
        lexicon.set(meaning, newWord)
      }
    }
  }
  
  // Fill out vocabulary to target size
  while (lexicon.size < vocabSize && lexicon.size < CORE_VOCABULARY.length) {
    const meaning = getRandomMeaning()
    if (!lexicon.has(meaning)) {
      const wordForm = generateWord(phonemeInventory)
      const word: Word = {
        stringForm: wordForm,
        meaning,
        languageId: id,
        creationTick: tick,
        lastChanged: tick
      }
      lexicon.set(meaning, word)
    } else {
      // Prevent infinite loop if we can't find new meanings
      vocabSize = lexicon.size
      break
    }
  }
  
  const sampleWord = lexicon.size > 0 ? 
    Array.from(lexicon.values())[Math.floor(Math.random() * lexicon.size)].stringForm :
    generateWord(phonemeInventory)
  
  const rules = new PhonologicalRuleSet()
  
  return {
    id,
    name,
    phonemeInventory,
    phonemeCount: phonemeInventory.length,
    prestige,
    familyId,
    generation,
    conservatism,
    parentId: parent?.id,
    vocabSize: lexicon.size,
    lexicon,
    sampleWord,
    creationTick: tick,
    lastEvolved: tick,
    rules
  }
}

export function evolveLanguage(lang: Language, tick: number, contactLanguages: Language[] = []): void {
  // Prevent excessive evolution calls and infinite recursion
  if (tick - lang.lastEvolved < 5 || tick === lang.lastEvolved) return
  
  lang.lastEvolved = tick
  
  // Phonological evolution
  if (Math.random() < 0.2) {
    mutatePhonemeInventory(lang.phonemeInventory)
    lang.phonemeCount = lang.phonemeInventory.length
  }
  
  // Apply sound changes to vocabulary
  lang.rules.evolve(tick, lang.conservatism)
  
  // Evolve some words
  const wordsToEvolve = Math.min(3, Math.floor(lang.lexicon.size * 0.02)) // Max 3 words, 2% of vocabulary
  const words = Array.from(lang.lexicon.values())
  for (let i = 0; i < wordsToEvolve; i++) {
    const word = words[Math.floor(Math.random() * words.length)]
    if (Math.random() < 0.1) {
      const oldForm = word.stringForm
      word.stringForm = evolveWord(oldForm, lang.phonemeInventory, lang.rules, tick)
      word.lastChanged = tick
    }
  }
  
  // Update sample word occasionally
  if (Math.random() < 0.1) {
    const words = Array.from(lang.lexicon.values())
    if (words.length > 0) {
      lang.sampleWord = words[Math.floor(Math.random() * words.length)].stringForm
    }
  }
  
  // Prestige drift
  lang.prestige = clamp(lang.prestige + (Math.random() - 0.5) * 0.02, 0.05, 1)
  
  // Name evolution
  if (Math.random() < 0.02) {
    lang.name = evolveName(lang.name)
  }
  
  // Add new vocabulary occasionally
  if (Math.random() < 0.05 && lang.lexicon.size < 300) {
    let attempts = 0
    while (attempts < 10) {
      const meaning = getRandomMeaning()
      if (!lang.lexicon.has(meaning)) {
        const word: Word = {
          stringForm: generateWord(lang.phonemeInventory),
          meaning,
          languageId: lang.id,
          creationTick: tick,
          lastChanged: tick
        }
        lang.lexicon.set(meaning, word)
        lang.vocabSize = lang.lexicon.size
        break
      }
      attempts++
    }
  }
}

export function borrowWord(targetLang: Language, sourceLang: Language, meaning: string, tick: number): boolean {
  const sourceWord = sourceLang.lexicon.get(meaning)
  if (!sourceWord) return false
  
  // Adapt word to target language phonology
  const adaptedForm = adaptWordToPhonology(sourceWord.stringForm, targetLang.phonemeInventory)
  
  const borrowedWord: Word = {
    stringForm: adaptedForm,
    meaning,
    languageId: targetLang.id,
    borrowedFrom: sourceLang.id,
    creationTick: tick,
    lastChanged: tick
  }
  
  targetLang.lexicon.set(meaning, borrowedWord)
  targetLang.vocabSize = targetLang.lexicon.size
  return true
}

export function splitLanguage(parent: Language, tick: number): Language {
  return createLanguage(parent, tick)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function generateInitialInventory(): string[] {
  const vowels = INVENTORY.filter(p => isSyllabic(p))
  const consonants = INVENTORY.filter(p => isConsonant(p))
  
  const inventory = new Set<string>()
  
  // Ensure at least 3 vowels
  const selectedVowels = vowels.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3))
  selectedVowels.forEach(v => inventory.add(v))
  
  // Add consonants
  const targetSize = 12 + Math.floor(Math.random() * 20)
  while (inventory.size < targetSize && inventory.size < INVENTORY.length && inventory.size < 40) {
    const pool = Math.random() < 0.3 ? vowels : consonants
    const phoneme = pool[Math.floor(Math.random() * pool.length)]
    inventory.add(phoneme)
  }
  
  return Array.from(inventory)
}

function mutatePhonemeInventory(inventory: string[]): void {
  const vowels = INVENTORY.filter(p => isSyllabic(p))
  const consonants = INVENTORY.filter(p => isConsonant(p))
  
  if (Math.random() < 0.3) {
    // Add phoneme
    const pool = Math.random() < 0.4 ? vowels : consonants
    const candidate = pool[Math.floor(Math.random() * pool.length)]
    if (!inventory.includes(candidate) && inventory.length < 45) {
      inventory.push(candidate)
    }
  }
  
  if (Math.random() < 0.2 && inventory.length > 10) {
    // Remove phoneme
    const index = Math.floor(Math.random() * inventory.length)
    inventory.splice(index, 1)
  }
  
  if (Math.random() < 0.3) {
    // Replace phoneme
    const index = Math.floor(Math.random() * inventory.length)
    const oldPhoneme = inventory[index]
    const pool = isSyllabic(oldPhoneme) ? vowels : consonants
    const newPhoneme = pool[Math.floor(Math.random() * pool.length)]
    inventory[index] = newPhoneme
  }
}

function generateWord(inventory: string[]): string {
  const vowels = inventory.filter(p => isSyllabic(p))
  const consonants = inventory.filter(p => isConsonant(p))
  
  if (vowels.length === 0) vowels.push('a')
  if (consonants.length === 0) consonants.push('t')
  
  const syllables = 1 + (Math.random() < 0.6 ? 0 : 1) + (Math.random() < 0.2 ? 1 : 0)
  let word = ''
  
  for (let i = 0; i < syllables; i++) {
    // Onset (optional)
    if (Math.random() < 0.8) {
      word += consonants[Math.floor(Math.random() * consonants.length)]
    }
    
    // Nucleus (required)
    word += vowels[Math.floor(Math.random() * vowels.length)]
    
    // Coda (optional)
    if (Math.random() < 0.3) {
      word += consonants[Math.floor(Math.random() * consonants.length)]
    }
  }
  
  return word || 'a'
}

function evolveWord(word: string, inventory: string[], rules?: PhonologicalRuleSet, tick?: number): string {
  let phonemes = word.split('')
  
  // Prevent infinite evolution
  if (phonemes.length === 0) return 'a'
  
  // Apply phonological rules if available
  if (rules && tick !== undefined) {
    phonemes = rules.applyRules(phonemes, tick)
    // Ensure we still have phonemes after rule application
    if (phonemes.length === 0) phonemes = ['a']
  }
  
  // Random mutations
  if (Math.random() < 0.3) {
    const index = Math.floor(Math.random() * phonemes.length)
    const oldPhoneme = phonemes[index]
    
    if (isSyllabic(oldPhoneme)) {
      const vowels = inventory.filter(p => isSyllabic(p))
      if (vowels.length > 0) {
        phonemes[index] = vowels[Math.floor(Math.random() * vowels.length)]
      }
    } else {
      const consonants = inventory.filter(p => isConsonant(p))
      if (consonants.length > 0) {
        phonemes[index] = consonants[Math.floor(Math.random() * consonants.length)]
      }
    }
  }
  
  ensureHasVowel(phonemes)
  return phonemes.join('')
}

function adaptWordToPhonology(word: string, targetInventory: string[]): string {
  const phonemes = word.split('')
  const vowels = targetInventory.filter(p => isSyllabic(p))
  const consonants = targetInventory.filter(p => isConsonant(p))
  
  if (vowels.length === 0) vowels.push('a')
  if (consonants.length === 0) consonants.push('t')
  
  const adapted = phonemes.map(phoneme => {
    if (!targetInventory.includes(phoneme)) {
      // Replace with similar phoneme
      if (isSyllabic(phoneme)) {
        return vowels[Math.floor(Math.random() * vowels.length)]
      } else {
        return consonants[Math.floor(Math.random() * consonants.length)]
      }
    }
    return phoneme
  })
  
  ensureHasVowel(adapted)
  return adapted.join('')
}

function generateLanguageName(seed: number): string {
  const parts = ['ka', 'ti', 'ra', 'po', 'mi', 'su', 'no', 'ze', 'li', 'va', 'do', 'gu', 'hi', 'jo', 'qe', 'to']
  const numParts = 2 + (seed % 3)
  let name = ''
  
  for (let i = 0; i < numParts; i++) {
    const partIndex = (seed + i * 7 + Math.floor(Math.random() * parts.length)) % parts.length
    name += parts[partIndex]
  }
  
  return capitalize(name)
}

function evolveName(name: string): string {
  return name.replace(/[aiou]/g, match => {
    const changes: Record<string, string> = { a: 'e', i: 'e', o: 'u', u: 'o' }
    return changes[match] || match
  })
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}