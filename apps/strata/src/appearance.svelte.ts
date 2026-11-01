/** Presentation only. No identity, membership or institution preferences live here. */
export const palettes = [
  { id: 'abstraksi', name: 'Abstraksi', color: '#c5b0e2' },
  { id: 'aksara', name: 'Aksara', color: '#aa8bd5' },
  { id: 'clay', name: 'Tanah', color: '#b7775c' },
  { id: 'sage', name: 'Daun', color: '#7b9287' },
  { id: 'neutral', name: 'Netral', color: '#8b8b95' },
] as const
export const appearance = $state({
  theme: 'dark' as 'dark' | 'light',
  accent: '#c5b0e2',
})
import { accentRoles } from './appearance-color'
export function applyAppearance() {
  if (!/^#[0-9a-f]{6}$/i.test(appearance.accent)) appearance.accent = '#c5b0e2'
  const root = document.documentElement,
    dark = appearance.theme === 'dark'
  root.classList.toggle('dark', dark)
  root.dataset.commonsTheme = appearance.theme
  root.style.colorScheme = appearance.theme
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
  } catch {
    /* Optional presentation storage. */
  }
  applyAppearance()
}
