/**
 * The KILAS sample rundown, one owner for the contoh headlines, shared
 * by the ticker and the Papan Kilas board. Real outlets, generic texts,
 * homepage links only (never fake article URLs), detak's edisi-contoh
 * doctrine. Replaced live when PUBLIC_DETAK_URL's /ticker responds.
 */
export interface TickerItem {
  src: string
  teks: string
  url?: string
}

export const KILAS_CONTOH: TickerItem[] = [
  { src: 'JUBI', teks: 'Liputan layanan kesehatan kampung di pegunungan tengah', url: 'https://jubi.id' },
  { src: 'BMKG', teks: 'Prakiraan cuaca Tanah Papua: hujan sore di pesisir utara', url: 'https://www.bmkg.go.id' },
  { src: 'SUARA PAPUA', teks: 'Warga soroti akses pendidikan di kabupaten pemekaran', url: 'https://suarapapua.com' },
  { src: 'GFW', teks: 'Peringatan deforestasi terdeteksi di koridor selatan', url: 'https://www.globalforestwatch.org' },
  { src: 'ANTARA', teks: 'Pembangunan infrastruktur distrik dilaporkan berlanjut', url: 'https://papua.antaranews.com' },
  { src: 'BPS', teks: 'Rilis data sosial-ekonomi provinsi terbaru', url: 'https://papua.bps.go.id' },
]

/** Fetch the live rundown from the detak worker; null keeps the contoh. */
export async function fetchKilas(
  detakUrl: string | undefined,
): Promise<TickerItem[] | null> {
  if (!detakUrl) return null
  try {
    const res = await fetch(`${detakUrl.replace(/\/$/, '')}/ticker`, {
      signal: AbortSignal.timeout(6000),
    })
    if (res.status !== 200) return null
    const d: unknown = await res.json()
    const arr = Array.isArray(d) ? d : (d as { items?: unknown[] }).items
    if (!Array.isArray(arr) || !arr.length) return null
    const parsed = arr
      .map((x) => x as Record<string, unknown>)
      .filter((x) => typeof x.teks === 'string')
      .map((x) => ({
        src: String(x.src ?? ''),
        teks: String(x.teks),
        url: typeof x.url === 'string' ? x.url : undefined,
      }))
    return parsed.length ? parsed : null
  } catch {
    return null
  }
}
