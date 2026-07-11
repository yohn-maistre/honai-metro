/**
 * org: helpers for the Level-0 directory. bukaSekarang computes "open
 * right now" from the org's STATED hours in WIT wall-clock time; it is an
 * honest derivation from contoh data, labeled as such where rendered.
 * null jam (e.g. "sesuai musyawarah") renders nothing rather than a guess.
 */
export interface Jam {
  /** ISO weekday range, inclusive: [1,5] = Senin-Jumat */
  hari: [number, number]
  buka: string
  tutup: string
}

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function bukaSekarang(
  jam: Jam | null | undefined,
  now = new Date(),
): boolean | null {
  if (!jam) return null
  // shift to WIT (UTC+9) and read UTC fields off the shifted date
  const wit = new Date(now.getTime() + 9 * 3600_000)
  let day = wit.getUTCDay() // 0 = Minggu
  if (day === 0) day = 7 // ISO: Minggu = 7
  const [from, to] = jam.hari
  if (day < from || day > to) return false
  const minutes = wit.getUTCHours() * 60 + wit.getUTCMinutes()
  return minutes >= toMin(jam.buka) && minutes < toMin(jam.tutup)
}
