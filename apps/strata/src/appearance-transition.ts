import { baseRoles } from './appearance-bases.ts'
import { contrast } from './appearance-color.ts'

export const THEME_SHIFT_MS = 30000
const channels = (s: string) =>
  [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
export function mixColor(a: string, b: string, t: number) {
  const end = channels(b)
  return (
    '#' +
    channels(a)
      .map((n, i) =>
        Math.round(n + (end[i] - n) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}
const surfaceKeys = [
  '--page-ground',
  '--reading-surface',
  '--background',
  '--card',
  '--popover',
  '--secondary',
  '--muted',
  '--sidebar',
] as const
/** Intermediate palettes, with contrast guarded rather than fading ink into its ground. */
export function themeFrame(
  base: string,
  fromDark: boolean,
  progress: number,
  accent: string,
) {
  const from = baseRoles(base, fromDark),
    to = baseRoles(base, !fromDark)
  const t = Math.max(0, Math.min(1, progress))
  const roles: Record<string, string> = Object.fromEntries(
    Object.keys(from).map((key) => [
      key,
      mixColor(from[key as keyof typeof from], to[key as keyof typeof to], t),
    ]),
  )
  const anchor = roles['--reading-surface']
  const safeInk =
    contrast('#000000', anchor) >= contrast('#ffffff', anchor)
      ? '#000000'
      : '#ffffff'
  // Narrow surface differences near the polarity change so one ink works everywhere.
  for (const key of surfaceKeys) {
    const original = roles[key]
    for (
      let step = 0;
      contrast(safeInk, roles[key]) < 4.5 && step <= 100;
      step++
    )
      roles[key] = mixColor(original, anchor, step / 100)
  }
  const readable = (candidate: string) =>
    surfaceKeys.every((key) => contrast(candidate, roles[key]) >= 4.5)
  for (const key of ['--foreground', '--muted-foreground'])
    if (!readable(roles[key])) roles[key] = safeInk
  const readableAccent = (seed: string) => {
    let color = seed
    for (let step = 0; !readable(color) && step <= 100; step++)
      color = mixColor(seed, safeInk, step / 100)
    return color
  }
  roles['--brand'] = readableAccent(accent)
  roles['--brand-foreground'] =
    contrast(roles['--brand'], '#ffffff') >
    contrast(roles['--brand'], '#000000')
      ? '#ffffff'
      : '#000000'
  roles['--brand-soft'] = roles['--secondary']
  roles['--destructive'] = readableAccent(
    mixColor(
      fromDark ? '#ff9b9e' : '#b4283e',
      fromDark ? '#b4283e' : '#ff9b9e',
      t,
    ),
  )
  roles['--cx-success'] = readableAccent(
    mixColor(
      fromDark ? '#a3cfb1' : '#336c4d',
      fromDark ? '#336c4d' : '#a3cfb1',
      t,
    ),
  )
  return roles
}
