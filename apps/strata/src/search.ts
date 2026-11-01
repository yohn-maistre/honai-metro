import type { Actor, Community, Post } from './api'
export type SearchResult = {
  query: string
  people: Actor[]
  posts: Post[]
  communities: Pick<Community, 'id' | 'title' | 'description' | 'visibility'>[]
  contexts: {
    id: string
    slug: string
    title: string
    kind: string
    description: string
  }[]
  groups: { id: string; title: string; kind: string; description: string }[]
  wiki: { id: string; title: string; community_id: string }[]
}
export const categories = [
  ['all', 'Semua'],
  ['people', 'Orang'],
  ['posts', 'Posting'],
  ['communities', 'Komunitas'],
  ['contexts', 'Konteks'],
  ['groups', 'Kelompok'],
  ['wiki', 'Wiki'],
] as const
export type SearchCategory = (typeof categories)[number][0]
export function resultGroups(
  data: SearchResult | null,
  category: SearchCategory,
) {
  if (!data) return []
  const compact = (value: string) => value.replace(/\s+/g, ' ').slice(0, 140)
  return categories
    .filter(
      ([key]) => key !== 'all' && (category === 'all' || key === category),
    )
    .map(([key, label]) => ({
      key,
      label,
      items:
        key === 'people'
          ? data.people.map((a) => ({
              id: a.id,
              title: a.name,
              detail: a.kind === 'agent' ? 'Aksara · AI' : 'Profil',
              href: '/people/' + a.id,
            }))
          : key === 'posts'
            ? data.posts.map((p) => ({
                id: p.id,
                title: p.content?.warning
                  ? 'Peringatan: ' + p.content.warning
                  : p.content?.title || compact(p.text) || 'Posting bergambar',
                detail: p.author.name,
                href: '/square/' + p.id,
              }))
            : key === 'communities'
              ? data.communities.map((c) => ({
                  id: c.id,
                  title: c.title,
                  detail:
                    c.visibility === 'public'
                      ? compact(c.description)
                      : 'Khusus anggota',
                  href: '/communities/' + c.id,
                }))
              : key === 'contexts'
                ? data.contexts.map((c) => ({
                    id: c.id,
                    title: c.title,
                    detail: compact(c.description),
                    href: '/contexts/' + c.slug,
                  }))
                : key === 'groups'
                  ? data.groups.map((g) => ({
                      id: g.id,
                      title: g.title,
                      detail: compact(g.description),
                      href: '/groups/' + g.id,
                    }))
                  : data.wiki.map((w) => ({
                      id: w.id,
                      title: w.title,
                      detail: 'Wiki bersama',
                      href: '/wiki/' + w.id,
                    })),
    }))
    .filter((group) => group.items.length)
}
