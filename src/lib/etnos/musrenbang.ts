/**
 * musrenbang: the forum side of the usulan flow. When a musrenbang
 * community exists on the instance, its slug goes here and the page
 * lists real posts from it; until then the constant stays null and the
 * page renders the honest empty state. No parallel data path: posts come
 * through the same client the feed uses.
 */
import { client } from '$lib/api/client.svelte'
import type { PostView } from '$lib/api/types'

/** Slug of the community that collects usulan posts (Yose's call). */
export const MUSRENBANG_COMMUNITY: string | null = null

let inflight: Promise<PostView[]> | null = null

export function fetchUsulan(slug: string): Promise<PostView[]> {
  inflight ??= client()
    .getPosts({ community_name: slug, sort: 'New', limit: 10 })
    .then((r) =>
      r.posts.filter((p) => !p.post.deleted && !p.post.removed && !p.post.nsfw),
    )
    .catch(() => {
      inflight = null
      return []
    })
  return inflight
}
