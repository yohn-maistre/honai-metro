<script lang="ts">
  /**
   * Papan Sorotan: the forum's trending posts, live from the backend
   * (getPosts Hot/Local). News never appears here; this is the forum
   * speaking. Renders nothing while empty or on a failed fetch, since
   * a labeled absence beats a beautiful fake.
   */
  import type { PostView } from '$lib/api/types'
  import { fetchHotPosts } from '$lib/etnos/hot'
  import { postLink } from '$lib/feature/post/helpers'
  import { ChatBubbleLeftRight, Icon } from 'svelte-hero-icons/dist'

  interface Props {
    limit?: number
  }

  let { limit = 8 }: Props = $props()

  let posts = $state<PostView[]>([])

  $effect(() => {
    fetchHotPosts().then((r) => {
      posts = r.slice(0, limit)
    })
  })
</script>

{#if posts.length}
  <section
    class="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden"
  >
    <div
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-zinc-800"
    >
      <h2 class="font-semibold dark:text-white">Sedang ramai</h2>
      <span class="text-xs text-slate-400 dark:text-zinc-500">dari forum</span>
    </div>
    <ol class="flex flex-col">
      {#each posts as p, i (p.post.id)}
        <a
          href={postLink(p.post)}
          class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 transition-colors border-b border-slate-100 dark:border-zinc-800/50 last:border-none"
        >
          <span
            class="w-5 shrink-0 text-sm font-semibold tabular-nums text-slate-400 dark:text-zinc-600 text-center"
          >
            {i + 1}
          </span>
          <span class="flex flex-col gap-0.5 min-w-0 flex-1">
            <span class="text-sm font-medium dark:text-white truncate">
              {p.post.name}
            </span>
            <span class="text-xs text-slate-500 dark:text-zinc-400 truncate">
              {p.community.title}
            </span>
          </span>
          <span
            class="shrink-0 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 tabular-nums"
          >
            <span class="font-medium text-primary-600 dark:text-primary-400">
              ▲{p.counts.score}
            </span>
            <Icon src={ChatBubbleLeftRight} micro size="13" />
            {p.counts.comments}
          </span>
        </a>
      {/each}
    </ol>
  </section>
{/if}
