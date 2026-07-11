/**
 * One Hot/Local fetch per page load, shared by every component that
 * wants trending posts (SorotanBoard, PapanSinyal), reuse the system's
 * own primitives instead of hammering the borrowed backend twice.
 */
import { client } from '$lib/api/client.svelte'
import type { PostView } from '$lib/api/types'

let inflight: Promise<PostView[]> | null = null

export function fetchHotPosts(): Promise<PostView[]> {
  inflight ??= client()
    .getPosts({ type_: 'Local', sort: 'Hot', limit: 20, page_cursor: '1' })
    .then((r) =>
      r.posts.filter((p) => !p.post.deleted && !p.post.removed && !p.post.nsfw),
    )
    .catch(() => {
      inflight = null // let a later page visit retry
      return []
    })
  return inflight
}
