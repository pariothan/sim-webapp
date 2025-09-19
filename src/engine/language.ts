
import { Language } from './types'

let nextLangId = 1
let nextFamilyId = 1

export function createLanguage(parent?: Language): Language{
  const id = nextLangId++
  const familyId = parent ? parent.familyId : nextFamilyId++
  const generation = parent ? parent.generation + 1 : 1
  const name = parent ? evolveName(parent.name) : makeName(id)
  const baseCount = parent ? parent.phonemeCount : 6 + Math.floor(Math.random()*4)
  const phonemeCount = clamp(baseCount + (Math.random()<0.5?-1:1), 3, 40)
  const prestige = clamp((parent ? parent.prestige : Math.random()*0.6 + 0.3) + (Math.random()-0.5)*0.1, 0.05, 1)
  const conservatism = clamp(Math.random()*0.7, 0, 1)
  const phonemeInventory = makeInventory(phonemeCount)
  const vocabSize = 120 + Math.floor(Math.random()*200)
  const sampleWord = makeWord(phonemeInventory)
  return { id, name, phonemeCount: phonemeInventory.length, prestige, familyId, generation,
           conservatism, parentId: parent?.id, vocabSize, phonemeInventory, sampleWord }
}

export function mutateLanguage(lang: Language){
  if(Math.random()<0.4){
    const change = Math.random()<0.5?-1:1
    lang.phonemeCount = clamp(lang.phonemeCount + change, 3, 40)
    lang.phonemeInventory = mutateInventory(lang.phonemeInventory, lang.phonemeCount)
  }
  lang.prestige = clamp(lang.prestige + (Math.random()-0.5)*0.05, 0.05, 1)
  if(Math.random()<0.08){
    lang.sampleWord = mutateWord(lang.sampleWord, lang.phonemeInventory)
  }
  if(Math.random()<0.05){
    lang.name = evolveName(lang.name)
  }
}

export function splitLanguage(lang: Language): Language{
  return createLanguage(lang)
}

function clamp(v:number, lo:number, hi:number){ return Math.max(lo, Math.min(hi, v)) }

const VOWELS = ['a','e','i','o','u','y','ɑ','ɪ','ʊ','ɛ','ɔ']
const CONS   = ['p','t','k','b','d','g','m','n','ŋ','f','v','s','z','ʃ','ʒ','h','l','r','w','j','t͡s','t͡ʃ']

function makeInventory(target:number): string[]{
  const chosen = new Set<string>()
  // guarantee at least 3 vowels
  shuffle(VOWELS).slice(0, Math.min(3, VOWELS.length)).forEach(v=> chosen.add(v))
  while(chosen.size < target){
    const pool = Math.random()<0.4 ? VOWELS : CONS
    chosen.add(pool[Math.floor(Math.random()*pool.length)])
  }
  return Array.from(chosen)
}

function mutateInventory(inv: string[], targetCount:number): string[]{
  const a = new Set(inv)
  if(a.size < targetCount){
    const pool = Math.random()<0.5 ? VOWELS : CONS
    a.add(pool[Math.floor(Math.random()*pool.length)])
  }else if(a.size > targetCount){
    const arr = Array.from(a)
    a.delete(arr[Math.floor(Math.random()*arr.length)])
  }else if(Math.random()<0.3){
    const arr = Array.from(a)
    a.delete(arr[Math.floor(Math.random()*arr.length)])
    const pool = Math.random()<0.5 ? VOWELS : CONS
    a.add(pool[Math.floor(Math.random()*pool.length)])
  }
  return Array.from(a)
}

function makeWord(inv: string[]): string{
  const vow = inv.filter(p => VOWELS.includes(p))
  const con = inv.filter(p => CONS.includes(p))
  const syl = () => (Math.random()<0.7 ? (con[Math.floor(Math.random()*con.length)]||'') : '') +
                    (vow[Math.floor(Math.random()*vow.length)]||'i') +
                    (Math.random()<0.3 ? (con[Math.floor(Math.random()*con.length)]||'') : '')
  const syllables = 1 + (Math.random()<0.6?0:1)
  let w = ''
  for(let i=0;i<syllables;i++) w += syl()
  return w || 'iin'
}

function mutateWord(w:string, inv:string[]): string{
  if(!w) return makeWord(inv)
  const i = Math.floor(Math.random()*w.length)
  const pool = Math.random()<0.5 ? VOWELS : CONS
  const repl = pool[Math.floor(Math.random()*pool.length)] || 'a'
  return (w.slice(0,i) + repl + w.slice(i+1)).replace(/''+/g, "'")
}

function makeName(seed: number){
  const parts = ['ka','ti','ra','po','mi','su','no','ze','li','va','do','gu','hi','jo','qe','to']
  const n = 2 + (seed % 3)
  let s = ''
  for(let i=0;i<n;i++){
    s += parts[(seed + i*7 + Math.floor(Math.random()*parts.length)) % parts.length]
  }
  return capital(s.replace(/(.{4})/g, "$1'"))
}

function capital(s:string){ return s.charAt(0).toUpperCase() + s.slice(1) }
function evolveName(s: string){ return s.replace(/[aiou]/g, m => ({a:'e', i:'e', o:'u', u:'o'} as any)[m] || m) }

function shuffle<T>(arr:T[]): T[]{
  const a = [...arr]
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]
  }
  return a
}
