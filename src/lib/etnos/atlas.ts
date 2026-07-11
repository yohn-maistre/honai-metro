/**
 * atlas: the accurate dot-grid of Tanah Papua, ported from detak-detik's
 * atlas-dots. Kabupaten polygons (static/data/papua-kab.geojson) are
 * rasterized ONCE per grid size to an offscreen canvas with the feature
 * index encoded in the red channel; consumers read a Uint8Array of cells
 * (0 = sea, n = kabupaten n-1) and draw dots however they want. No tiles,
 * no network beyond one 52 KB GeoJSON, no MapLibre.
 */

export const LON0 = 129.0
export const LON1 = 141.3
export const LAT0 = 1.3
export const LAT1 = -9.4

export type KabInfo = { nama: string; prov: string; cen: [number, number] }
export type AtlasGrid = {
  cols: number
  rows: number
  cells: Uint8Array
  kabs: KabInfo[]
}

type GeoFeature = {
  properties: KabInfo
  geometry: { type: string; coordinates: unknown }
}

const cache = new Map<string, Promise<AtlasGrid>>()
let geoCache: Promise<GeoFeature[]> | null = null

export function loadGeo(): Promise<GeoFeature[]> {
  if (!geoCache) {
    geoCache = fetch('/data/papua-kab.geojson', {
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
): AtlasGrid {
  const off = document.createElement('canvas')
  off.width = cols
  off.height = rows
  const ctx = off.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('ctx')
  features.forEach((f, i) => {
    ctx.fillStyle = `rgb(${i + 1},0,0)`
    const polys = (
      f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.coordinates
    ) as number[][][][]
    ctx.beginPath()
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach((pt, k) => {
          const x = ((pt[0]! - LON0) / (LON1 - LON0)) * cols
          const y = ((LAT0 - pt[1]!) / (LAT0 - LAT1)) * rows
          if (k === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
      }
    }
    ctx.fill('evenodd')
  })
  const px = ctx.getImageData(0, 0, cols, rows).data
  const cells = new Uint8Array(cols * rows)
  for (let i = 0; i < cells.length; i++)
    cells[i] = px[i * 4 + 3]! > 0 ? px[i * 4]! : 0
  return { cols, rows, cells, kabs: features.map((f) => f.properties) }
}

export function loadAtlasGrid(cols = 120, rows = 104): Promise<AtlasGrid> {
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

export type BoundaryPaths = { paths: Path2D[]; kabs: KabInfo[] }

const boundaryCache = new Map<string, Promise<BoundaryPaths>>()

/** One Path2D per kabupaten in grid-cell coordinates (same transform as
 *  the raster), for stroking the cadastral lines over the dot fill.
 *  Consumers scale the context to the plate, then stroke. */
export function loadBoundaryPaths(
  cols = 120,
  rows = 104,
): Promise<BoundaryPaths> {
  const key = `${cols}x${rows}`
  let p = boundaryCache.get(key)
  if (!p) {
    p = loadGeo().then((features) => ({
      kabs: features.map((f) => f.properties),
      paths: features.map((f) => {
        const path = new Path2D()
        const polys = (
          f.geometry.type === 'Polygon'
            ? [f.geometry.coordinates]
            : f.geometry.coordinates
        ) as number[][][][]
        for (const poly of polys) {
          for (const ring of poly) {
            ring.forEach((pt, k) => {
              const x = ((pt[0]! - LON0) / (LON1 - LON0)) * cols
              const y = ((LAT0 - pt[1]!) / (LAT0 - LAT1)) * rows
              if (k === 0) path.moveTo(x, y)
              else path.lineTo(x, y)
            })
            path.closePath()
          }
        }
        return path
      }),
    }))
    p.catch(() => {
      boundaryCache.delete(key)
    })
    boundaryCache.set(key, p)
  }
  return p
}

/** lon/lat to fractional cell coordinates on a grid. */
export function lonLatToCellF(
  lon: number,
  lat: number,
  cols: number,
  rows: number,
): [number, number] {
  return [
    ((lon - LON0) / (LON1 - LON0)) * cols,
    ((LAT0 - lat) / (LAT0 - LAT1)) * rows,
  ]
}
