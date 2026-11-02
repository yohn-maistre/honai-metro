import { beginRequest } from './network.svelte'
export type NewsPlace = {
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
}
export type NewsItem = {
  id: string
  title: string
  url: string
  publishedAt: string | null
  sourceCount: number
  summary?: string
  image?: string | null
  imageCredit?: string
  places?: NewsPlace[]
}
export type NewsStory = NewsItem & {
  keyPoints: string[]
  sources: { title: string; url: string; publisher: string; summary: string }[]
}
type Feed = {
  source: { name: string; url: string }
  items: NewsItem[]
  available: boolean
}
export const news = $state<{ feed: Feed | null; pending: boolean }>({
  feed: null,
  pending: true,
})
let inflight: Promise<void> | undefined,
  loadedAt = 0
export function loadNews() {
  if (inflight) return inflight
  if (Date.now() - loadedAt < 300000) return Promise.resolve()
  news.pending = true
  inflight = (async () => {
    const done = beginRequest()
    try {
      const res = await fetch('/v1/news', {
        credentials: 'omit',
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw Error('unavailable')
      const feed = (await res.json()) as Feed
      if (!Array.isArray(feed.items)) throw Error('invalid feed')
      news.feed = feed
      loadedAt = Date.now()
    } catch {
      news.feed = {
        source: {
          name: 'West Papua Watch',
          url: 'https://westpapua.watch/news/',
        },
        items: [],
        available: false,
      }
    } finally {
      news.pending = false
      inflight = undefined
      done()
    }
  })()
  return inflight
}
export function newsDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('id', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Jayapura',
      }).format(Date.parse(value))
    : ''
}
