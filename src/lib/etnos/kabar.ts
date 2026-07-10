/**
 * kabar: the news layer for Peta Kabar. Fetches detak-detik's published
 * edition (worker GET /edisi, CORS-open, refreshed twice daily), then
 * gazetteer-matches cluster headlines against kabupaten names from the same
 * GeoJSON that draws the map, so a place can only be pinned where a dot can
 * be drawn. Clusters carry no geo field upstream; the match is honest
 * best-effort over verbatim headline text. Deep links use detak-detik's
 * existing #/kliping/{id} hash route.
 */
import { env } from '$env/dynamic/public'
import type { KabInfo } from './atlas'

export interface KlipingItem {
  judul: string
  url: string
  media: string
}

export interface Kliping {
  id: string
  utama: KlipingItem
  liputan: KlipingItem[]
  n_media: number
  n_grup: number
  skor: number
  meja: string
  sari?: string | null
  resmi?: boolean
}

export interface KabarPin {
  kliping: Kliping
  kab: KabInfo
}

export const DETAK_SITE = 'https://detak-detik.pages.dev'
export const klipingUrl = (id: string) => `${DETAK_SITE}/#/kliping/${id}`

/* Common headline spellings that differ from the kabupaten's official name.
   Keys are lowercase needles; values must match GeoJSON `nama` exactly. */
const ALIAS: Record<string, string> = {
  wamena: 'Jayawijaya',
  timika: 'Mimika',
  sentani: 'Jayapura',
  serui: 'Kepulauan Yapen',
  yapen: 'Kepulauan Yapen',
  agats: 'Asmat',
  oksibil: 'Pegunungan Bintang',
  'tanah merah': 'Boven Digoel',
  biak: 'Biak Numfor',
  fakfak: 'Fak Fak',
  bintuni: 'Teluk Bintuni',
  wondama: 'Teluk Wondama',
  wasior: 'Teluk Wondama',
  kaimana: 'Kaimana',
  enarotali: 'Paniai',
}

/* Names too generic to match bare in Indonesian headlines. */
const AMBIGUOUS = new Set(['puncak'])

const CACHE_KEY = 'etnos.kabar.v1'
const STALE_MS = 10 * 60 * 1000

type CacheShape = { ts: number; kliping: Kliping[] }

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CacheShape
  } catch {
    return null
  }
}

/** Live clusters from the detak worker, SWR-cached. null = not available
 *  (no env, endpoint empty, or network failure with no cache). */
export async function loadKliping(): Promise<Kliping[] | null> {
  const base = env.PUBLIC_DETAK_URL as string | undefined
  if (!base) return null

  const cached = readCache()
  if (cached && Date.now() - cached.ts < STALE_MS) return cached.kliping

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/edisi`, {
      signal: AbortSignal.timeout(12000),
    })
    if (res.status === 204 || !res.ok) return cached?.kliping ?? null
    const edisi = (await res.json()) as { kliping?: Kliping[] }
    const kliping = edisi.kliping ?? []
    if (!kliping.length) return cached?.kliping ?? null
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), kliping } satisfies CacheShape),
      )
    } catch {
      /* storage full: serve without caching */
    }
    return kliping
  } catch {
    return cached?.kliping ?? null
  }
}

/** Match clusters to kabupaten by scanning headline text for place names.
 *  One pin per cluster (first match wins); a kabupaten can hold several. */
export function matchPins(kliping: Kliping[], kabs: KabInfo[]): KabarPin[] {
  const needles: [string, KabInfo][] = []
  for (const kab of kabs) {
    const name = kab.nama.toLowerCase()
    if (!AMBIGUOUS.has(name)) needles.push([name, kab])
  }
  for (const [alias, nama] of Object.entries(ALIAS)) {
    const kab = kabs.find((k) => k.nama === nama)
    if (kab) needles.push([alias, kab])
  }
  // Longest needles first so 'puncak jaya' wins before 'jaya...' fragments.
  needles.sort((a, b) => b[0].length - a[0].length)

  const pins: KabarPin[] = []
  for (const k of kliping) {
    const text = [k.utama?.judul, ...(k.liputan ?? []).map((l) => l.judul)]
      .filter(Boolean)
      .join(' • ')
      .toLowerCase()
    for (const [needle, kab] of needles) {
      // Word-ish boundary: avoid matching inside longer words.
      const i = text.indexOf(needle)
      if (i === -1) continue
      const before = i === 0 ? ' ' : text[i - 1]!
      const after =
        i + needle.length >= text.length ? ' ' : text[i + needle.length]!
      if (/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) continue
      pins.push({ kliping: k, kab })
      break
    }
  }
  return pins
}
