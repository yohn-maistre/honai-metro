/**
 * The KILAS wire's rundown, one owner. The contoh set uses real outlets,
 * generic texts, homepage links only (never fake article URLs), detak's
 * edisi-contoh doctrine. Live items are detak-detik's kliping CLUSTERS
 * (owner call 2026-07-12): each entry is a cluster's lead headline, and
 * clicking opens the kliping card on detak-detik itself, so readers get
 * the full multi-outlet coverage and ETNOS never rehosts press. Same
 * /edisi SWR cache as the map's kabar pins: one fact, one owner.
 */
import { klipingUrl, loadKliping } from './kabar'

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

/** Live rundown = detak's published kliping clusters (loadKliping gates
 *  on PUBLIC_DETAK_URL and SWR-caches); null keeps the contoh. */
export async function fetchKilas(): Promise<TickerItem[] | null> {
  const kliping = await loadKliping()
  if (!kliping?.length) return null
  return kliping
    .filter((k) => k.utama?.judul)
    .slice(0, 12)
    .map((k) => ({
      src: k.n_media > 1 ? `${k.utama.media} +${k.n_media - 1}` : k.utama.media,
      teks: k.utama.judul,
      url: klipingUrl(k.id),
    }))
}
