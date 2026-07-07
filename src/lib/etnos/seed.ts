/**
 * Seeded randomness, ported from detak-detik's seed.ts: the same seed
 * always draws the same rotation, so every reader sees the same board
 * on the same day, deterministic-for-all-readers is house doctrine.
 * cyrb128 hashes a string seed; splitmix32 is the tiny PRNG over it.
 */
export function cyrb128(str: string): number {
  let h1 = 1779033703
  let h2 = 3144134277
  let h3 = 1013904242
  let h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  return (h1 ^ h2 ^ h3 ^ h4) >>> 0
}

export function splitmix32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x9e3779b9) | 0
    let t = a ^ (a >>> 16)
    t = Math.imul(t, 0x21f0aaad)
    t = t ^ (t >>> 15)
    t = Math.imul(t, 0x735a2d97)
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296
  }
}

export const rngFrom = (seed: string) => splitmix32(cyrb128(seed))

/** The day clock: one seed per calendar day (local), shared site-wide. */
export const daySeed = (salt = 'etnos') => {
  const d = new Date()
  return `${salt}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
