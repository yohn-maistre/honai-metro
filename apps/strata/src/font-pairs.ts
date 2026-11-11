/** Self-hosted, presentation-only choices. Optional faces load when selected. */
export const fontPairs = [
  {
    id: 'geist',
    name: 'Geist + Geist Serif',
    sans: 'Geist Variable',
    serif: 'Geist Serif',
    note: 'Rapi dan tenang, dengan kontras serif yang tegas.',
  },
  {
    id: 'gabarito',
    name: 'Gabarito + Geist Serif',
    sans: 'Gabarito Variable',
    serif: 'Geist Serif',
    note: 'Akrab, dengan suara editorial yang hangat.',
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans + Geist Serif',
    sans: 'Plus Jakarta Sans Variable',
    serif: 'Geist Serif',
    note: 'Terbuka dan bersahabat, dengan serif untuk membaca.',
  },
  {
    id: 'instrument',
    name: 'Instrument Sans + Instrument Serif',
    sans: 'Instrument Sans Variable',
    serif: 'Instrument Serif',
    note: 'Ringan dan luwes untuk percakapan sehari-hari.',
  },
  {
    id: 'newsreader',
    name: 'Geist + Newsreader',
    sans: 'Geist Variable',
    serif: 'Newsreader Variable',
    note: 'Untuk membaca berita dan tulisan panjang.',
  },
  {
    id: 'source',
    name: 'Source Sans 3 + Source Serif 4',
    sans: 'Source Sans 3 Variable',
    serif: 'Source Serif 4 Variable',
    note: 'Jelas dan nyaman untuk pengetahuan bersama.',
  },
] as const
export function loadFontPair(id: string) {
  if (id === 'gabarito')
    return import('@fontsource-variable/gabarito')
  if (id === 'jakarta')
    return import('@fontsource-variable/plus-jakarta-sans')
  if (id === 'geist')
    return Promise.all([
      import('@fontsource-variable/geist'),
      import('./styles/geist-serif.css'),
    ])
  if (id === 'instrument')
    return Promise.all([
      import('@fontsource-variable/instrument-sans'),
      import('@fontsource/instrument-serif/latin-400.css'),
      import('@fontsource/instrument-serif/latin-400-italic.css'),
    ])
  if (id === 'newsreader')
    return Promise.all([
      import('@fontsource-variable/geist'),
      import('@fontsource-variable/newsreader'),
    ])
  if (id === 'source')
    return Promise.all([
      import('@fontsource-variable/source-sans-3'),
      import('@fontsource-variable/source-serif-4'),
    ])
  return Promise.resolve()
}
