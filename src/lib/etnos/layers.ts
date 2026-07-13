/**
 * layers: the live data layers of Peta Kabar, ported from detak-detik's
 * front-page map fetchers and clipped to the Tanah Papua atlas bbox.
 * Return contract, uniform across fetchers:
 *   null  = feed unreachable (no env var, network failure with no cache)
 *   []    = feed answered with zero points in Papua (the honest "nihil")
 *   [...] = live points ("langsung")
 * No fake points, ever: a layer either shows real data or shows nothing,
 * and the chip states carry the difference.
 */
import { env } from '$env/dynamic/public'
import { LAT0, LAT1, LON0, LON1 } from './atlas'

export type LayerId =
  | 'kabar'
  | 'gempa'
  | 'cuaca'
  | 'laut'
  | 'banjir'
  | 'api'
  | 'udara'
export type LayerStatus = 'langsung' | 'nihil' | 'contoh' | 'segera'

export interface GempaPoint {
  mag: number
  lon: number
  lat: number
  wilayah: string
  jam: string
}
export interface CuacaPoint {
  kota: string
  lon: number
  lat: number
  t: number
  langit: string
  /** Local WIT wall-clock "05.38", from the same Open-Meteo request. */
  terbit?: string
  terbenam?: string
}
export interface LautPoint {
  kota: string
  lon: number
  lat: number
  /** Significant wave height in meters. */
  gelombang: number
}
export interface BanjirPoint {
  lon: number
  lat: number
  state: number
  nama: string
}
export interface TitikApiPoint {
  lon: number
  lat: number
  frp: number
}
export interface UdaraPoint {
  lon: number
  lat: number
  aqi: number
  nama: string
}

export interface Anchor {
  kota: string
  wilayah: string
  lnglat: [number, number]
}

/** Six anchor cities of Tanah Papua, west to east. One owner: PetaKabar,
 *  PetaSimpul, and the cuaca fetcher all read the same list. */
export const ANCHORS: Anchor[] = [
  { kota: 'Sorong', wilayah: 'Papua Barat Daya', lnglat: [131.2558, -0.8761] },
  { kota: 'Manokwari', wilayah: 'Papua Barat', lnglat: [134.062, -0.8615] },
  { kota: 'Nabire', wilayah: 'Papua Tengah', lnglat: [135.4833, -3.3667] },
  { kota: 'Wamena', wilayah: 'Papua Pegunungan', lnglat: [138.9489, -4.0892] },
  { kota: 'Jayapura', wilayah: 'Papua', lnglat: [140.7181, -2.5337] },
  { kota: 'Merauke', wilayah: 'Papua Selatan', lnglat: [140.4011, -8.4731] },
]

export function inPapua(lon: number, lat: number): boolean {
  return lon >= LON0 && lon <= LON1 && lat >= LAT1 && lat <= LAT0
}

/* ---- SWR over localStorage, the kabar.ts pattern generalized ---------- */

type CacheShape<T> = { ts: number; data: T }

function readCache<T>(key: string): CacheShape<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as CacheShape<T>
  } catch {
    return null
  }
}

async function swr<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T | null>,
): Promise<T | null> {
  const cached = readCache<T>(key)
  if (cached && Date.now() - cached.ts < ttlMs) return cached.data
  try {
    const fresh = await fetcher()
    if (fresh === null) return cached?.data ?? null
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ ts: Date.now(), data: fresh } satisfies CacheShape<T>),
      )
    } catch {
      /* storage full: serve without caching */
    }
    return fresh
  } catch {
    return cached?.data ?? null
  }
}

/* ---- Gempa: BMKG M5+ nationwide + USGS M2.5+, deduped, clipped -------- */

/** "17:51:09 WIB" -> "19.51 WIT" (Papua wall clock). */
function wibToWit(jam: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(jam)
  if (!m) return jam
  const h = (Number(m[1]) + 2) % 24
  return `${String(h).padStart(2, '0')}.${m[2]} WIT`
}

export function fetchGempa(): Promise<GempaPoint[] | null> {
  return swr('etnos.layers.gempa.v1', 120_000, async () => {
    const merged: GempaPoint[] = []
    let answered = false
    try {
      const res = await fetch(
        'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
        { signal: AbortSignal.timeout(6000) },
      )
      const data = (await res.json()) as {
        Infogempa?: {
          gempa?: {
            Coordinates: string
            Magnitude: string
            Wilayah: string
            Jam: string
          }[]
        }
      }
      answered = true
      for (const g of data.Infogempa?.gempa ?? []) {
        const [lat, lon] = g.Coordinates.split(',').map(Number)
        if (Number.isFinite(lon) && Number.isFinite(lat))
          merged.push({
            mag: Number(g.Magnitude),
            lon: lon!,
            lat: lat!,
            wilayah: g.Wilayah,
            jam: wibToWit(g.Jam),
          })
      }
    } catch {
      /* USGS may still fill in */
    }
    try {
      const res = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
        { signal: AbortSignal.timeout(6000) },
      )
      const data = (await res.json()) as {
        features?: {
          properties?: { mag?: number; place?: string; time?: number }
          geometry?: { coordinates?: number[] }
        }[]
      }
      answered = true
      for (const f of data.features ?? []) {
        const c = f.geometry?.coordinates
        if (!c) continue
        const lon = c[0]!
        const lat = c[1]!
        if (
          merged.some(
            (m) => Math.abs(m.lon - lon) < 0.3 && Math.abs(m.lat - lat) < 0.3,
          )
        )
          continue
        const jam = f.properties?.time
          ? new Date(f.properties.time + 9 * 3600_000)
              .toISOString()
              .slice(11, 16)
              .replace(':', '.') + ' WIT'
          : ''
        merged.push({
          mag: Math.round((f.properties?.mag ?? 0) * 10) / 10,
          lon,
          lat,
          wilayah: f.properties?.place ?? 'USGS',
          jam,
        })
      }
    } catch {
      /* BMKG result, if any, stands */
    }
    if (!answered) return null
    return merged
      .filter((g) => inPapua(g.lon, g.lat))
      .sort((a, b) => b.mag - a.mag)
      .slice(0, 30)
  })
}

/* ---- Cuaca: Open-Meteo, one multi-point request over the anchors ------ */

/** WMO weather code to a short Indonesian sky word (detak's sky map). */
export function langit(code: number): string {
  if (code === 0) return 'cerah'
  if (code <= 2) return 'cerah berawan'
  if (code === 3) return 'berawan'
  if (code === 45 || code === 48) return 'berkabut'
  if (code <= 57) return 'gerimis'
  if (code <= 67) return 'hujan'
  if (code <= 77) return 'hujan es'
  if (code <= 82) return 'hujan deras'
  if (code <= 86) return 'hujan es'
  return 'badai petir'
}

/** "2026-07-12T05:38" -> "05.38" (already WIT via timezone param). */
function jamLokal(iso: string | undefined): string | undefined {
  if (!iso || iso.length < 16) return undefined
  return iso.slice(11, 16).replace(':', '.')
}

export function fetchCuaca(): Promise<CuacaPoint[] | null> {
  // v2: sunrise/sunset ride the same request (one owner for the sky), and
  // the timezone is Asia/Jayapura so daily times are true WIT wall clock.
  return swr('etnos.layers.cuaca.v2', 30 * 60_000, async () => {
    const lats = ANCHORS.map((a) => a.lnglat[1]).join(',')
    const lons = ANCHORS.map((a) => a.lnglat[0]).join(',')
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code&daily=sunrise,sunset&forecast_days=1&timezone=Asia%2FJayapura`,
      { signal: AbortSignal.timeout(6000) },
    )
    if (!res.ok) return null
    const d: unknown = await res.json()
    const list = Array.isArray(d) ? d : [d]
    const pts: CuacaPoint[] = []
    list.forEach((entry, i) => {
      const anchor = ANCHORS[i]
      const e = entry as {
        current?: { temperature_2m?: number; weather_code?: number }
        daily?: { sunrise?: string[]; sunset?: string[] }
      }
      const cur = e.current
      if (!anchor || cur?.temperature_2m == null) return
      pts.push({
        kota: anchor.kota,
        lon: anchor.lnglat[0],
        lat: anchor.lnglat[1],
        t: Math.round(cur.temperature_2m),
        langit: langit(cur.weather_code ?? 3),
        terbit: jamLokal(e.daily?.sunrise?.[0]),
        terbenam: jamLokal(e.daily?.sunset?.[0]),
      })
    })
    return pts.length ? pts : null
  })
}

/* ---- Laut: Open-Meteo Marine at nearshore sea points ------------------- */

/** Sea points a short way offshore of the coastal anchors (Wamena is
 *  highland and carries no sea). Coordinates sit in open water so the
 *  marine model answers; a land-locked cell answers null and is dropped. */
export const LAUT_ANCHORS: Anchor[] = [
  { kota: 'Sorong', wilayah: 'Papua Barat Daya', lnglat: [131.1, -0.7] },
  { kota: 'Manokwari', wilayah: 'Papua Barat', lnglat: [134.15, -0.75] },
  { kota: 'Nabire', wilayah: 'Papua Tengah', lnglat: [135.55, -3.2] },
  { kota: 'Jayapura', wilayah: 'Papua', lnglat: [140.75, -2.4] },
  { kota: 'Merauke', wilayah: 'Papua Selatan', lnglat: [140.3, -8.6] },
]

export function fetchLaut(): Promise<LautPoint[] | null> {
  return swr('etnos.layers.laut.v1', 30 * 60_000, async () => {
    const lats = LAUT_ANCHORS.map((a) => a.lnglat[1]).join(',')
    const lons = LAUT_ANCHORS.map((a) => a.lnglat[0]).join(',')
    const res = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&current=wave_height&timezone=Asia%2FJayapura`,
      { signal: AbortSignal.timeout(6000) },
    )
    if (!res.ok) return null
    const d: unknown = await res.json()
    const list = Array.isArray(d) ? d : [d]
    const pts: LautPoint[] = []
    list.forEach((entry, i) => {
      const anchor = LAUT_ANCHORS[i]
      const cur = (entry as { current?: { wave_height?: number | null } })
        .current
      if (!anchor || cur?.wave_height == null) return
      pts.push({
        kota: anchor.kota,
        lon: anchor.lnglat[0],
        lat: anchor.lnglat[1],
        gelombang: Math.round(cur.wave_height * 10) / 10,
      })
    })
    return pts.length ? pts : null
  })
}

/* ---- Banjir: PetaBencana community reports, last 12 hours -------------- */

export function fetchBanjir(): Promise<BanjirPoint[] | null> {
  return swr('etnos.layers.banjir.v1', 10 * 60_000, async () => {
    const res = await fetch(
      'https://data.petabencana.id/reports?timeperiod=43200',
      { signal: AbortSignal.timeout(6000) },
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      result?: {
        features?: {
          geometry?: { coordinates?: number[] }
          properties?: Record<string, unknown>
        }[]
      }
    }
    return (data.result?.features ?? [])
      .map((f) => ({
        lon: f.geometry?.coordinates?.[0] ?? NaN,
        lat: f.geometry?.coordinates?.[1] ?? NaN,
        state: Number(f.properties?.state ?? 1),
        nama: String(f.properties?.title ?? 'laporan'),
      }))
      .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
      .filter((p) => inPapua(p.lon, p.lat))
  })
}

/* ---- Worker-proxied feeds: FIRMS fires + WAQI PM2.5 -------------------- */

type GeoFeatureCollection = {
  features?: {
    geometry?: { coordinates?: number[] }
    properties?: Record<string, unknown>
  }[]
}

async function fetchGeo(id: string): Promise<GeoFeatureCollection | null> {
  const base = env.PUBLIC_DETAK_URL as string | undefined
  if (!base) return null
  const res = await fetch(`${base.replace(/\/$/, '')}/geo/${id}`, {
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) return null
  return (await res.json()) as GeoFeatureCollection
}

export function fetchTitikApi(): Promise<TitikApiPoint[] | null> {
  if (!env.PUBLIC_DETAK_URL) return Promise.resolve(null)
  return swr('etnos.layers.api.v1', 5 * 60_000, async () => {
    const data = await fetchGeo('kebakaran')
    if (!data) return null
    return (data.features ?? [])
      .map((f) => ({
        lon: f.geometry?.coordinates?.[0] ?? NaN,
        lat: f.geometry?.coordinates?.[1] ?? NaN,
        frp: Number(f.properties?.frp ?? 10),
      }))
      .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
      .filter((p) => inPapua(p.lon, p.lat))
  })
}

export function fetchUdara(): Promise<UdaraPoint[] | null> {
  if (!env.PUBLIC_DETAK_URL) return Promise.resolve(null)
  return swr('etnos.layers.udara.v1', 10 * 60_000, async () => {
    const data = await fetchGeo('udara')
    if (!data) return null
    return (data.features ?? [])
      .map((f) => ({
        lon: f.geometry?.coordinates?.[0] ?? NaN,
        lat: f.geometry?.coordinates?.[1] ?? NaN,
        aqi: Number(f.properties?.aqi ?? 0),
        nama: String(f.properties?.nama ?? ''),
      }))
      .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
      .filter((p) => inPapua(p.lon, p.lat))
  })
}
