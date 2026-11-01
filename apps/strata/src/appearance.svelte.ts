/** Presentation only. No identity, membership or institution preferences live here. */
export const palettes = [
  { id: 'abstraksi', name: 'Abstraksi', color: '#b8b2c1' },
  { id: 'aksara', name: 'Aksara', color: '#aa8bd5' },
  { id: 'clay', name: 'Tanah', color: '#b7775c' },
  { id: 'sage', name: 'Daun', color: '#7b9287' },
  { id: 'neutral', name: 'Netral', color: '#8b8b95' },
  { id: 'sky', name: 'Langit', color: '#1680fa' },
  { id: 'sea', name: 'Laut', color: '#6c9bab' },
  { id: 'ochre', name: 'Oker', color: '#bc945e' },
  { id: 'rose', name: 'Ros', color: '#b9848a' },
] as const
export const appearance = $state({
  theme: 'dark' as 'dark' | 'light',
  accent: '#b8b2c1',
  base: 'graphite',
  texture: 'none',
})
import { accentRoles } from './appearance-color'
import { bases, baseRoles } from './appearance-bases'
export function applyAppearance() {
  if (!/^#[0-9a-f]{6}$/i.test(appearance.accent)) appearance.accent = '#b8b2c1'
  const root = document.documentElement,
    dark = appearance.theme === 'dark'
  root.classList.toggle('dark', dark)
  root.dataset.commonsTheme = appearance.theme
  root.style.colorScheme = appearance.theme
  if (!bases.some((b) => b.id === appearance.base)) appearance.base = 'graphite'
  if (!['none', 'grain', 'dither'].includes(appearance.texture))
    appearance.texture = 'none'
  root.dataset.texture = appearance.texture
  root.dataset.base = appearance.base
  for (const [name, value] of Object.entries(baseRoles(appearance.base, dark)))
    root.style.setProperty(name, value)
  const roles = accentRoles(appearance.accent, dark)
  root.style.setProperty('--brand', roles.ink)
  root.style.setProperty('--brand-foreground', roles.foreground)
  root.style.setProperty('--brand-soft', roles.soft)
  try {
    localStorage.setItem('strata.ui.appearance', JSON.stringify(appearance))
  } catch {
    /* Optional presentation storage. */
  }
}
export function restoreAppearance() {
  try {
    const saved = JSON.parse(
      localStorage.getItem('strata.ui.appearance') ?? 'null',
    )
    const theme = saved?.theme ?? localStorage.getItem('strata.ui.theme')
    if (theme === 'light' || theme === 'dark') appearance.theme = theme
    if (/^#[0-9a-f]{6}$/i.test(saved?.accent)) appearance.accent = saved.accent
    if (bases.some((b) => b.id === saved?.base)) appearance.base = saved.base
    if (['none', 'grain', 'dither'].includes(saved?.texture))
      appearance.texture = saved.texture
  } catch {
    /* Optional presentation storage. */
  }
  applyAppearance()
}
