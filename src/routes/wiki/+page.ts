import history from '$lib/etnos/wiki/onthisday.json'
import wordbank from '$lib/etnos/wiki/kata-hari-ini.json'

export const load = () => {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const key = `${mm}-${dd}`

  const historyMap = history as unknown as Record<
    string,
    { title: string; body: string; year?: number | null }
  >

  const todayHistory = historyMap[key] ?? historyMap['default']

  const words = (wordbank as { words: Array<unknown> }).words as Array<{
    word: string
    language: string
    region?: string
    meaning: string
    example?: string | null
  }>

  // Day-of-year, deterministic per calendar day.
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const doy = Math.floor(diff / (1000 * 60 * 60 * 24))
  const todayWord = words[doy % words.length]

  return { todayHistory, todayWord }
}
