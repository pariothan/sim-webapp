export class Community {
  public readonly id: number
  public readonly x: number
  public readonly y: number
  public languageId: number | null
  public population: number
  public prestige: number

  private static nextId = 1

  constructor(x: number, y: number) {
    this.id = Community.nextId++
    this.x = x
    this.y = y
    this.languageId = null
    this.population = 20 + Math.floor(Math.random() * 80)
    this.prestige = 0.2 + Math.random() * 0.6
  }

  hasLanguage(): boolean {
    return this.languageId !== null
  }

  setLanguage(languageId: number): void {
    this.languageId = languageId
  }

  removeLanguage(): void {
    this.languageId = null
  }
}