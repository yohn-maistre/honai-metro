/** Optional local presentation assets. No generation or carousel runs for visitors. */
export type WelcomeArtwork = {
  id: string
  src: string
  width: number
  height: number
  location: string
  description: string
  credit: string
}
// Operators may supply their own approved assets/credits, or use [] for no art.
export const siteBranding: { welcomeArtworks: WelcomeArtwork[] } = {
  welcomeArtworks: [{
    id: 'tigi', src: '/branding/tigi-print.webp', width: 840, height: 1260,
    location: 'Danau Tigi · Papua Tengah',
    description: 'Ilustrasi danau dan pegunungan yang terinspirasi lanskap Tigi.',
    credit: 'Ilustrasi ETNOS',
  }, {
    id: 'raja-ampat', src: '/branding/raja-ampat-print.webp', width: 840, height: 1260,
    location: 'Raja Ampat · Papua Barat Daya',
    description: 'Ilustrasi laut dan gugusan pulau yang terinspirasi lanskap Raja Ampat.',
    credit: 'Ilustrasi ETNOS',
  }],
}
let visitArtwork: WelcomeArtwork | null | undefined
export function chooseWelcomeArtwork(): WelcomeArtwork | null {
  if (visitArtwork !== undefined) return visitArtwork
  const artworks = siteBranding.welcomeArtworks
  let last = ''
  try { last = localStorage.getItem('etnos.welcome.artwork') ?? '' } catch { /* Optional storage. */ }
  const previous = artworks.findIndex(a => a.id === last)
  visitArtwork = artworks[(previous + 1) % artworks.length] ?? null
  if (visitArtwork) {
    try { localStorage.setItem('etnos.welcome.artwork', visitArtwork.id) } catch { /* Optional storage. */ }
  }
  return visitArtwork
}
/** Decorative selection only: a community ID is not a geographic or cultural attribution. */
export function communityArtwork(communityId: string): WelcomeArtwork | null {
  let hash = 0
  for (const char of communityId) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0
  const artworks = siteBranding.welcomeArtworks
  return artworks[hash % artworks.length] ?? null
}
