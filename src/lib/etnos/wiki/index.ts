// Wiki article registry. Eagerly bundles all *.md in this directory and
// exposes them as a slug → content map for the [category] route, plus
// honest derived metadata (section count, reading time) for the index.

const modules = import.meta.glob('./*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const articles: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, content]) => [
    path.replace('./', '').replace('.md', ''),
    content,
  ]),
)

export const categories = Object.keys(articles).sort()

export interface WikiMeta {
  slug: string
  /** number of `##` sections in the article */
  sections: number
  /** reading time in minutes at ~200 wpm, minimum 1 */
  minutes: number
}

export const meta: Record<string, WikiMeta> = Object.fromEntries(
  categories.map((slug) => {
    const content = articles[slug]!
    const words = content.split(/\s+/).filter(Boolean).length
    return [
      slug,
      {
        slug,
        sections: (content.match(/^##\s/gm) ?? []).length,
        minutes: Math.max(1, Math.round(words / 200)),
      },
    ]
  }),
)
