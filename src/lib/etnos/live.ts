/**
 * ETNOS live tiles: the few numbers the borrowed PieFed backend can
 * actually answer today, fetched client-side with a stale-while-
 * revalidate cache. Honest-label doctrine: only render what a real
 * request returned — getSite exposes ONLY user_count (every other
 * count is -1 in the adapter), listCommunities has no total (we page
 * limit:50, cap 4 pages, saturate to "200+"), and posts-in-24h is
 * client-counted from one New/50 page (saturates to "50+").
 */
import { browser } from '$app/environment'
import { client } from '$lib/api/client.svelte'

export interface LiveStats {
  ts: number
  users: number | null
  communities: number | null
  communitiesSaturated: boolean
  posts24h: number | null
  posts24hSaturated: boolean
}

const CACHE_KEY = 'etnos.live.v1'
const STALE_MS = 10 * 60 * 1000

export function getCached(): LiveStats | null {
  if (!browser) return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as LiveStats) : null
  } catch {
    return null
  }
}

function save(stats: LiveStats) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(stats))
  } catch {
    /* cache is a bonus, never required */
  }
}

/* PieFed timestamps can arrive without a timezone marker; read them as UTC */
function parseUTC(iso: string): number {
  return Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
}

async function fetchUsers(): Promise<number | null> {
  try {
    const site = await client().getSite()
    const n = site.site_view.counts.users
    return typeof n === 'number' && n > 0 ? n : null
  } catch {
    return null
  }
}

async function fetchCommunities(): Promise<{
  count: number | null
  saturated: boolean
}> {
  try {
    let count = 0
    for (let page = 1; page <= 4; page++) {
      const res = await client().listCommunities({
        type_: 'Local',
        limit: 50,
        page,
      })
      count += res.communities.length
      if (res.communities.length < 50) return { count, saturated: false }
    }
    return { count, saturated: true }
  } catch {
    return { count: null, saturated: false }
  }
}

async function fetchPosts24h(): Promise<{
  count: number | null
  saturated: boolean
}> {
  try {
    const res = await client().getPosts({
      type_: 'Local',
      sort: 'New',
      limit: 50,
      page_cursor: '1',
    })
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const recent = res.posts.filter(
      (p) => parseUTC(p.post.published) >= cutoff,
    ).length
    return { count: recent, saturated: recent === res.posts.length && recent >= 50 }
  } catch {
    return { count: null, saturated: false }
  }
}

/** Cached copy immediately if fresh enough; otherwise fetch and re-cache. */
export async function loadLive(): Promise<LiveStats | null> {
  if (!browser) return null
  const cached = getCached()
  if (cached && Date.now() - cached.ts < STALE_MS) return cached

  const [users, communities, posts] = await Promise.all([
    fetchUsers(),
    fetchCommunities(),
    fetchPosts24h(),
  ])
  const stats: LiveStats = {
    ts: Date.now(),
    users,
    communities: communities.count,
    communitiesSaturated: communities.saturated,
    posts24h: posts.count,
    posts24hSaturated: posts.saturated,
  }
  // A fully-failed sweep keeps the last good copy instead of overwriting it
  if (stats.users == null && stats.communities == null && stats.posts24h == null)
    return cached
  save(stats)
  return stats
}
