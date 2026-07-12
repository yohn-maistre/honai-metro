/**
 * atlas-id: the whole-Indonesia dot grid, ported from detak-detik's
 * atlas-dots. Province polygons (static/data/idn-prov.geojson, Rupabumi
 * via detak-detik) are rasterized once per grid size; consumers read a
 * Uint8Array of cells (0 = sea, n = province n-1) and dress the dots
 * themselves. Used by the wiki's Wajah locator (Papua emphasized on the
 * national plate) and, next wave, Peta Nusantara in Jelajah.
 *
 * Raster rule (same hard rule as atlas.ts): one coverage pass PER
 * FEATURE reading only alpha. A single indexed-color pass corrupts
 * coastal cells via premultiply blending; never revert.
 */

export const ID_LON0 = 94.5
export const ID_LON1 = 141.5
export const ID_LAT0 = 6.5
export const ID_LAT1 = -11.5

export type ProvInfo = { kode: string; nama: string }
export type IdAtlasGrid = {
  cols: number
  rows: number
  cells: Uint8Array
  provs: ProvInfo[]
}

type GeoFeature = {
  properties: ProvInfo
  geometry: { type: string; coordinates: unknown }
}

const cache = new Map<string, Promise<IdAtlasGrid>>()
let geoCache: Promise<GeoFeature[]> | null = null

function loadGeo(): Promise<GeoFeature[]> {
  if (!geoCache) {
    geoCache = fetch('/data/idn-prov.geojson', {
      signal: AbortSignal.timeout(12000),
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json() as Promise<{ features: GeoFeature[] }>
      })
      .then((gj) => gj.features)
    geoCache.catch(() => {
      geoCache = null // let a later consumer retry
    })
  }
  return geoCache
}

function rasterize(
  features: GeoFeature[],
  cols: number,
  rows: number,
): IdAtlasGrid {
  const off = document.createElement('canvas')
  off.width = cols
  off.height = rows
  const ctx = off.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('ctx')
  const cells = new Uint8Array(cols * rows)
  const coverage = new Uint8Array(cols * rows)
  features.forEach((f, i) => {
    ctx.clearRect(0, 0, cols, rows)
    ctx.fillStyle = '#000'
    const polys = (
      f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.coordinates
    ) as number[][][][]
    ctx.beginPath()
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach((pt, k) => {
          const x = ((pt[0]! - ID_LON0) / (ID_LON1 - ID_LON0)) * cols
          const y = ((ID_LAT0 - pt[1]!) / (ID_LAT0 - ID_LAT1)) * rows
          if (k === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
      }
    }
    ctx.fill('evenodd')
    const px = ctx.getImageData(0, 0, cols, rows).data
    for (let j = 0; j < cells.length; j++) {
      const a = px[j * 4 + 3]!
      if (a > 32 && a > coverage[j]!) {
        coverage[j] = a
        cells[j] = i + 1
      }
    }
  })
  return { cols, rows, cells, provs: features.map((f) => f.properties) }
}

export function loadIdAtlasGrid(cols = 96, rows = 40): Promise<IdAtlasGrid> {
  const key = `${cols}x${rows}`
  let p = cache.get(key)
  if (!p) {
    p = loadGeo().then((features) => rasterize(features, cols, rows))
    p.catch(() => {
      cache.delete(key)
    })
    cache.set(key, p)
  }
  return p
}

/** lon/lat to fractional cell coordinates on the national grid. */
export function idLonLatToCellF(
  lon: number,
  lat: number,
  cols: number,
  rows: number,
): [number, number] {
  return [
    ((lon - ID_LON0) / (ID_LON1 - ID_LON0)) * cols,
    ((ID_LAT0 - lat) / (ID_LAT0 - ID_LAT1)) * rows,
  ]
}
