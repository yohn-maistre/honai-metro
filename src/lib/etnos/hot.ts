/**
 * One Hot/Local fetch per page load, shared by every component that
 * wants trending posts (SorotanBoard, PapanSinyal), reuse the system's
 * own primitives instead of hammering the borrowed backend twice.
 */
import { client } from '$lib/api/client.svelte'
import type { PostView } from '$lib/api/types'

let inflight: Promise<PostView[]> | null = null

export function fetchHotPosts(): Promise<PostView[]> {
  // No page_cursor on the first page: '1' is a PieFed convention that
  // Lemmy backends reject as an undecodable cursor (silent empty board).
  inflight ??= client()
    .getPosts({ type_: 'Local', sort: 'Hot', limit: 20 })
    .then((r) => {
      const posts = r.posts.filter(
        (p) => !p.post.deleted && !p.post.removed && !p.post.nsfw,
      )
      if (!posts.length) inflight = null // empty answer: let a later visit retry
      return posts
    })
    .catch(() => {
      inflight = null // let a later page visit retry
      return []
    })
  return inflight
}
