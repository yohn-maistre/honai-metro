<script lang="ts">
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import { RefreshCw, X } from '@lucide/svelte'
  import Choice from './Choice.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import PostCard from './PostCard.svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import {
    request,
    type Auth,
    type Community,
    type Membership,
    type Post,
  } from './api'
  let {
    source,
    choices,
    auth,
    communities,
    memberships,
    enabled,
    onChange,
    onRemove,
    onError,
  }: {
    source: string
    choices: { value: string; label: string }[]
    auth: Auth
    communities: Community[]
    memberships: Membership[]
    enabled: boolean
    onChange: (s: string) => void
    onRemove?: () => void
    onError: (s: string) => void
  } = $props()
  let posts = $state<Post[]>([]),
    pending = $state(false),
    cursor = $state<string | null>(null),
    revision = $state(0),
    error = $state(''),
    generation = 0
  function query(next = '') {
    const q = new SvelteURLSearchParams({ roots: 'true', limit: '20' })
    if (source === 'following') q.set('following', 'true')
    else if (source.startsWith('context:')) q.set('context', source.slice(8))
    else if (source !== 'all') q.set('community', source)
    if (next) q.set('cursor', next)
    return '/v1/feed/page?' + q
  }
  $effect(() => {
    void revision
    const mode = source,
      actor = auth.actor?.id,
      controller = new AbortController(),
      mine = ++generation
    posts = []
    cursor = null
    error = ''
    if (!enabled) return
    pending = true
    request<{ items: Post[]; nextCursor: string | null }>(
      query(),
      undefined,
      controller.signal,
    )
      .then((page) => {
        if (
          !controller.signal.aborted &&
          mine === generation &&
          actor === auth.actor?.id &&
          mode === source
        ) {
          posts = page.items
          cursor = page.nextCursor
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) error = e.message
      })
      .finally(() => {
        if (!controller.signal.aborted) pending = false
      })
    return () => controller.abort()
  })
  async function more() {
    if (!cursor || pending) return
    const mine = generation
    pending = true
    try {
      const page = await request<{ items: Post[]; nextCursor: string | null }>(
        query(cursor),
      )
      if (mine === generation) {
        posts = [
          ...posts,
          ...page.items.filter((p) => !posts.some((old) => old.id === p.id)),
        ]
        cursor = page.nextCursor
      }
    } catch (e) {
      if (mine === generation)
        onError(e instanceof Error ? e.message : 'Belum dapat memuat lajur.')
    } finally {
      if (mine === generation) pending = false
    }
  }
</script>

<section
  class="feed-column"
  aria-label={'Lajur ' + (choices.find((c) => c.value === source)?.label ?? '')}
>
  <header>
    <Choice
      aria-label="Isi lajur"
      compact
      value={source}
      items={choices}
      onchange={onChange}
    /><Button
      size="icon"
      variant="ghost"
      aria-label="Muat ulang lajur"
      disabled={pending}
      onclick={() => revision++}
    >
      <RefreshCw size={16} />
    </Button>{#if onRemove}<Button
        size="icon"
        variant="ghost"
        aria-label="Tutup lajur"
        onclick={onRemove}
      >
        <X size={16} />
      </Button>{/if}
  </header>
  <div class="feed-column-scroll">
    {#if pending && !posts.length}<ContentSkeleton />{:else if error}<div
        class="search-state"
        role="alert"
      >
        <p>{error}</p>
        <Button variant="outline" onclick={() => revision++}>Coba lagi</Button>
      </div>{:else if !posts.length}<div class="search-state">
        <p>
          {source === 'following'
            ? 'Posting orang yang kamu ikuti muncul di sini.'
            : 'Belum ada posting di lajur ini.'}
        </p>
        <a href="/explore">Jelajah komunitas</a>
      </div>{/if}{#each posts as post}<PostCard
        {post}
        community={communities.find((c) => c.id === post.community_id)}
        loggedIn={!!auth.actor}
        canVote={memberships.some((m) => m.community_id === post.community_id)}
        {onError}
      />{/each}{#if cursor}<div class="profile-more">
        <Button variant="outline" disabled={pending} onclick={more}>
          Muat posting lain
        </Button>
      </div>{/if}
  </div>
</section>
