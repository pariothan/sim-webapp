
// Very lightweight placeholder for feature-based color projection
export function colorFromPhonemeCount(count: number): [number, number, number]{
  // map 0..40 -> 0..1
  const t = Math.max(0, Math.min(1, count/40))
  // simple blue->green gradient
  const r = 0
  const g = Math.floor(255 * t)
  const b = Math.floor(255 * (1 - t))
  return [r,g,b]
}
