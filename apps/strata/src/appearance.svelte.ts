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
  themeMode: 'clock' as ThemeMode,
  accent: '#1680fa',
  base: 'graphite',
  texture: 'grain',
  textureStrength: 'soft',
  fontPair: 'gabarito',
  externalMedia: true,
})
import { accentRoles } from './appearance-color'
import { bases, baseRoles } from './appearance-bases'
import { fontPairs, loadFontPair } from './font-pairs'
import { scheduledTheme, type ThemeMode } from './appearance-schedule'
import { themeFrame, THEME_SHIFT_MS } from './appearance-transition'
let lastAppearance: {
  theme: 'light' | 'dark'
  mode: ThemeMode
  base: string
  accent: string
} | null = null
let stopShift: (() => void) | undefined

export function applyAppearance() {
  if (!/^#[0-9a-f]{6}$/i.test(appearance.accent)) appearance.accent = '#1680fa'
  appearance.theme = scheduledTheme(appearance.themeMode)
  const root = document.documentElement,
    dark = appearance.theme === 'dark'
  const previous = lastAppearance
  const shift =
    previous &&
    previous.theme !== appearance.theme &&
    previous.mode === 'clock' &&
    appearance.themeMode === 'clock' &&
    previous.base === appearance.base &&
    previous.accent === appearance.accent &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches
  lastAppearance = {
    theme: appearance.theme,
    mode: appearance.themeMode,
    base: appearance.base,
    accent: appearance.accent,
  }
  stopShift?.()
  const finishTheme = () => {
    root.classList.toggle('dark', dark)
    root.dataset.commonsTheme = appearance.theme
    root.style.colorScheme = appearance.theme
    delete root.dataset.themeShifting
    for (const name of ['--destructive', '--cx-success'])
      root.style.removeProperty(name)
  }
  if (!shift) finishTheme()
  root.dataset.themeMode = appearance.themeMode
  if (!bases.some((b) => b.id === appearance.base)) appearance.base = 'graphite'
  if (!['none', 'grain', 'dither'].includes(appearance.texture))
    appearance.texture = 'grain'
  root.dataset.texture = appearance.texture
  if (!['soft', 'full'].includes(appearance.textureStrength))
    appearance.textureStrength = 'soft'
  root.dataset.textureStrength = appearance.textureStrength
  const pair =
    fontPairs.find((p) => p.id === appearance.fontPair) ?? fontPairs[0]
  appearance.fontPair = pair.id
  root.dataset.fontPair = pair.id
  root.style.setProperty('--font-sans', `'${pair.sans}', sans-serif`)
  root.style.setProperty('--font-editorial', `'${pair.serif}', Georgia, serif`)
  void loadFontPair(pair.id).catch(() => {
    /* Readable fallback on offline font loads. */
  })
  root.dataset.base = appearance.base
  for (const [name, value] of Object.entries(baseRoles(appearance.base, dark)))
    root.style.setProperty(name, value)
  const roles = accentRoles(appearance.accent, dark)
  root.style.setProperty('--brand', roles.ink)
  root.style.setProperty('--brand-foreground', roles.foreground)
  root.style.setProperty('--brand-soft', roles.soft)
  if (shift) {
    root.dataset.themeShifting = 'true'
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / THEME_SHIFT_MS)
      const eased = progress * progress * (3 - 2 * progress)
      for (const [name, value] of Object.entries(
        themeFrame(
          appearance.base,
          previous.theme === 'dark',
          eased,
          appearance.accent,
        ),
      ))
        root.style.setProperty(name, value)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else {
        finishTheme()
        for (const [name, value] of Object.entries(
          baseRoles(appearance.base, dark),
        ))
          root.style.setProperty(name, value)
        root.style.setProperty('--brand', roles.ink)
        root.style.setProperty('--brand-foreground', roles.foreground)
        root.style.setProperty('--brand-soft', roles.soft)
        media.removeEventListener('change', reduce)
        stopShift = undefined
      }
    }
    tick(start)
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const reduce = () => {
      if (media.matches) {
        stopShift?.()
        finishTheme()
        applyAppearance()
      }
    }
    media.addEventListener('change', reduce, { once: true })
    stopShift = () => {
      cancelAnimationFrame(frame)
      media.removeEventListener('change', reduce)
      delete root.dataset.themeShifting
      stopShift = undefined
    }
  }
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
    if (['clock', 'light', 'dark'].includes(saved?.themeMode))
      appearance.themeMode = saved.themeMode
    else if (theme === 'light' || theme === 'dark') appearance.themeMode = theme
    if (/^#[0-9a-f]{6}$/i.test(saved?.accent)) appearance.accent = saved.accent
    if (bases.some((b) => b.id === saved?.base)) appearance.base = saved.base
    if (typeof saved?.externalMedia === 'boolean')
      appearance.externalMedia = saved.externalMedia
    if (fontPairs.some((p) => p.id === saved?.fontPair))
      appearance.fontPair = saved.fontPair
    if (['soft', 'full'].includes(saved?.textureStrength))
      appearance.textureStrength = saved.textureStrength
    if (['none', 'grain', 'dither'].includes(saved?.texture))
      appearance.texture = saved.texture
  } catch {
    /* Optional presentation storage. */
  }
  applyAppearance()
}
export function startAppearanceClock() {
  const sync = () => {
    if (!document.hidden && appearance.themeMode === 'clock')
      appearance.theme = scheduledTheme('clock')
  }
  const timer = setInterval(sync, 60000)
  document.addEventListener('visibilitychange', sync)
  window.addEventListener('pageshow', sync)
  return () => {
    stopShift?.()
    clearInterval(timer)
    document.removeEventListener('visibilitychange', sync)
    window.removeEventListener('pageshow', sync)
  }
}
