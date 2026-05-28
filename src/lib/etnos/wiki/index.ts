// Wiki article registry. Eagerly bundles all *.md in this directory and
// exposes them as a slug → content map for the [category] route.

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
