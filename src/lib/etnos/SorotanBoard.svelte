<script lang="ts">
  /**
   * Papan Sorotan: the forum's trending posts as a scoreboard — ledger
   * rows in the detak grammar, ranked mono numerals, live from the
   * backend (getPosts Hot/Local). News never appears here; this board
   * is the forum speaking. Renders nothing while empty or on a failed
   * fetch — a labeled hole beats a beautiful fake.
   */
  import type { PostView } from '$lib/api/types'
  import { fetchHotPosts } from '$lib/etnos/hot'
  import { postLink } from '$lib/feature/post/helpers'

  interface Props {
    limit?: number
  }

  let { limit = 8 }: Props = $props()

  let posts = $state<PostView[]>([])

  $effect(() => {
    // shared Hot/Local fetch (hot.ts); board stays absent when the
    // backend is dark
    fetchHotPosts().then((r) => {
      posts = r.slice(0, limit)
    })
  })
</script>

{#if posts.length}
  <section class="flex flex-col gap-2">
    <div class="flex items-end justify-between gap-3 flex-wrap">
      <span class="inkbar"><span class="dot">●</span>Papan Sorotan</span>
      <span class="serial">langsung · dari forum</span>
    </div>
    <div class="ledger">
      {#each posts as p, i (p.post.id)}
        <a href={postLink(p.post)}>
          <span class="flex items-baseline gap-2 min-w-0">
            <span class="serial shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <span class="truncate">
              {p.post.name}
              <span class="text-slate-500 dark:text-zinc-500">
                · {p.community.title}
              </span>
            </span>
          </span>
          <span class="v">▲{p.counts.score} · {p.counts.comments} bls</span>
        </a>
      {/each}
    </div>
  </section>
{/if}
