<script lang="ts">
  import { tick } from 'svelte'
  import PostCard from './PostCard.svelte'
  import ThreadBranch from './ThreadBranch.svelte'
  import PostComposer from './PostComposer.svelte'
  import Choice from './Choice.svelte'
  import ThreadWork from './ThreadWork.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { LoaderCircle, ArrowUpLeft } from '@lucide/svelte'
  import { replyTree } from './thread'
  import { request, type Post, type Community, type Actor } from './api'
  let {
    post,
    replies,
    cursor,
    community,
    actor,
    member,
    onError,
    onRefresh,
    onWikiDraft,
  }: {
    post: Post
    replies: Post[]
    cursor: string | null
    community?: Community
    actor: Actor | null
    member: boolean
    onError: (message: string) => void
    onRefresh: () => Promise<void>
    onWikiDraft?: () => void
  } = $props()
  let sort = $state<'old' | 'new' | 'top'>('old'),
    target = $state<Post | null>(null),
    composer = $state<PostComposer | null>(null),
    extra = $state<Post[]>([]),
    next = $state<string | null>(null),
    busy = $state(false)
  $effect(() => {
    extra = []
    next = cursor
    void post.id
  })
  const nodes = $derived(replyTree([...replies, ...extra], post.id, sort))
  async function replyTo(reply: Post) {
    target = reply
    await tick()
    composer?.focus()
  }
  async function more() {
    if (!next || busy) return
    busy = true
    try {
      const page = await request<{ items: Post[]; nextCursor: string | null }>(
        `/v1/posts/${post.id}/replies?cursor=${next}`,
      )
      const known = new Set([...replies, ...extra].map((p) => p.id))
      extra = [...extra, ...page.items.filter((p) => !known.has(p.id))]
      next = page.nextCursor
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Balasan belum dapat dimuat.')
    } finally {
      busy = false
    }
  }
</script>

<div class="conversation-view">
  {#if post.parent_id}<a
      href={'/square/' + post.parent_id}
      class="thread-parent-link"
    >
      <ArrowUpLeft size={16} />Balasan sebelumnya
    </a>{/if}
  <PostCard
    {post}
    {community}
    loggedIn={!!actor}
    canVote={member}
    detail
    onReply={replyTo}
    {onError}
  />
  <div class="thread-reply-dock">
    {#if post.locked}<p class="thread-empty">
        Percakapan dikunci oleh moderator.
      </p>{:else if actor && member && community}{#key post.id}<PostComposer
          bind:this={composer}
          {actor}
          communities={[community]}
          initialCommunity={community.id}
          parentId={target?.id ?? post.id}
          replyingTo={target?.author.name}
          onCancelReply={() => (target = null)}
          compact
          onPosted={async () => {
            target = null
            await onRefresh()
          }}
        />{/key}
    {:else}<Button
        href={actor ? '/communities/' + post.community_id : '/login'}
        variant="ghost"
        class="reply-signin"
      >
        {actor ? 'Gabung komunitas untuk membalas' : 'Masuk untuk membalas'}
      </Button>{/if}
  </div>
  {#if community?.visibility === 'public'}<ThreadWork
      postId={post.id}
      onDraft={onWikiDraft}
    />{/if}
  <section id="replies" aria-label="Balasan" class="thread-discussion">
    <div class="thread-toolbar">
      <h2>
        Balasan <span>
          {post.parent_id ? post.directReplies : post.replies}
        </span>
      </h2>
      <Choice
        aria-label="Urutkan balasan"
        compact
        bind:value={sort}
        items={[
          { value: 'old', label: 'Terlama' },
          { value: 'new', label: 'Terbaru' },
          { value: 'top', label: 'Teratas' },
        ]}
      />
    </div>
    {#each nodes as node (node.post.id)}<ThreadBranch
        {node}
        {community}
        loggedIn={!!actor}
        canVote={member}
        rootAuthor={post.author.id}
        onReply={replyTo}
        {onError}
      />{/each}
    {#if next}<div class="thread-more">
        <Button variant="ghost" disabled={busy} onclick={more}>
          {#if busy}<LoaderCircle size={16} class="animate-spin" />{/if}Muat
          balasan sebelumnya
        </Button>
        <span>Urutan diterapkan pada balasan yang dimuat</span>
      </div>{:else if !replies.length}<p class="thread-empty">
        Mulai percakapan
      </p>{/if}
  </section>
</div>
