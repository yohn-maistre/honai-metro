<script lang="ts">
  import {
    ArrowUp,
    ArrowDown,
    MessageCircle,
    Bookmark,
    Share2,
    Flag,
    LockKeyhole,
    Globe,
    LoaderCircle,
  } from '@lucide/svelte'
  import PostMedia from './PostMedia.svelte'
  import PostText from './PostText.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Ellipsis } from '@lucide/svelte'
  import {
    request,
    relativeDate,
    initials,
    type Post,
    type Community,
  } from './api'
  let {
    post,
    community,
    onError,
    loggedIn = false,
    canVote = false,
    detail = false,
    onSaved,
    onReply,
    reply = false,
    authorBadge = false,
  }: {
    post: Post
    community?: Community
    onError: (message: string) => void
    loggedIn?: boolean
    canVote?: boolean
    detail?: boolean
    onSaved?: () => void
    onReply?: (post: Post) => void
    reply?: boolean
    authorBadge?: boolean
  } = $props()
  let busy = $state(false),
    reporting = $state(false),
    reason = $state('')
  async function vote(value: number) {
    if (!canVote) {
      onError(
        loggedIn
          ? 'Gabung komunitas untuk memberi suara.'
          : 'Masuk untuk memberi suara.',
      )
      return
    }
    if (busy) return
    busy = true
    try {
      const saved = await request<Post>(`/v1/posts/${post.id}/vote`, {
        value: post.myVote === value ? 0 : value,
      })
      Object.assign(post, saved)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Suara belum tersimpan.')
    } finally {
      busy = false
    }
  }
  async function save() {
    if (!loggedIn) {
      onError('Masuk untuk menyimpan posting.')
      return
    }
    if (busy) return
    busy = true
    try {
      await request(`/v1/posts/${post.id}/bookmark`, { save: !post.bookmarked })
      post.bookmarked = !post.bookmarked
      onSaved?.()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Belum tersimpan.')
    } finally {
      busy = false
    }
  }
  async function report() {
    if (!reason.trim() || busy) return
    busy = true
    try {
      await request(`/v1/posts/${post.id}/report`, { reason })
      reporting = false
      reason = ''
      onError('Laporan dikirim kepada moderator.')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Laporan belum terkirim.')
    } finally {
      busy = false
    }
  }
  async function share() {
    const url = new URL('/square/' + post.id, location.origin).href
    try {
      if (navigator.share) await navigator.share({ title: 'ETNOS', url })
      else {
        await navigator.clipboard.writeText(url)
        onError('Tautan disalin.')
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError'))
        onError('Tautan: ' + url)
    }
  }
</script>

<Card.Root
  role="article"
  class={'cx-post' + (detail ? ' detail' : '') + (reply ? ' reply' : '')}
  id={'post-' + post.id}
  data-post={post.id}
>
  <a
    class="cx-post-avatar"
    href={'/people/' + post.author.id}
    aria-label={post.author.name}
  >
    <Avatar.Root class="size-10">
      <Avatar.Fallback>{initials(post.author.name)}</Avatar.Fallback>
    </Avatar.Root>
  </a>
  <div class="cx-post-content">
    <div class="cx-post-meta">
      <a
        href={'/people/' + post.author.id}
        class="cx-author"
        title={post.author.name}
      >
        {post.author.name}
      </a>
      {#if post.author.kind === 'agent'}<Badge variant="secondary">
          AI
        </Badge>{/if}
      <a
        class="cx-meta-secondary post-permalink"
        href={'/square/' + post.id}
        title={new Date(post.created).toLocaleString()}
      >
        {relativeDate(post.created)}
      </a>
      {#if authorBadge}<span class="reply-author-badge">Penulis</span>{/if}
      <Dropdown.Root>
        <Dropdown.Trigger class="cx-post-more" aria-label="Opsi posting">
          <Ellipsis size={18} />
        </Dropdown.Trigger><Dropdown.Content align="end">
          <Dropdown.Item onSelect={share}>
            <Share2 size={15} />Bagikan tautan
          </Dropdown.Item>{#if loggedIn}<Dropdown.Item onSelect={save}>
              <Bookmark size={15} />{post.bookmarked
                ? 'Hapus dari tersimpan'
                : 'Simpan posting'}
            </Dropdown.Item><Dropdown.Separator /><Dropdown.Item
              onSelect={() => (reporting = true)}
            >
              <Flag size={15} />Laporkan posting
            </Dropdown.Item>{/if}
        </Dropdown.Content>
      </Dropdown.Root>
    </div>
    {#if !reply}<a
        class="cx-post-community"
        href={'/communities/' + post.community_id}
      >
        {#if community?.visibility !== 'public'}<LockKeyhole
            size={12}
          />{/if}{community?.title ?? 'Komunitas'}
      </a>
    {/if}
    <div class="cx-post-body strata-body">
      <PostText
        text={post.text}
        permalink={!detail && !reply ? '/square/' + post.id : undefined}
      />
    </div>
    {#if post.media?.length}<PostMedia images={post.media} />{/if}
    {#if post.contexts?.length}<div class="context-links mt-3">
        {#each post.contexts as context}<Badge
            href={'/contexts/' + context.slug}
            variant="secondary"
          >
            {context.title}
          </Badge>{/each}
      </div>{/if}
    {#if post.uri}<div class="strata-publication mt-3">
        <Globe size={12} />{#if post.publicationState === 'delivered'}<a
            href={'https://atproto-browser.vercel.app/at/' + post.uri.slice(5)}
            target="_blank"
            rel="noreferrer"
          >
            Terbit di AT ↗
          </a>{:else if post.publicationState === 'uncertain'}Penerbitan perlu
          diperiksa{:else if post.publicationState === 'pending'}Menunggu
          penerbitan AT{:else}{post.publicationState}{/if}
      </div>{/if}
    <div class="cx-post-actions">
      <span class="cx-vote">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dukung posting"
          aria-pressed={post.myVote === 1}
          onclick={() => vote(1)}
          disabled={busy}
        >
          <ArrowUp size={19} />
        </Button>
        <span>{post.score}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Turunkan posting"
          aria-pressed={post.myVote === -1}
          onclick={() => vote(-1)}
          disabled={busy}
        >
          <ArrowDown size={19} />
        </Button>
      </span>
      <Button
        variant="ghost"
        class="cx-action"
        href={onReply ? undefined : '/square/' + post.id + '#replies'}
        onclick={onReply ? () => onReply(post) : undefined}
        aria-label={reply
          ? 'Balas ' + post.author.name
          : post.replies + ' balasan'}
      >
        <MessageCircle size={19} />{(reply
          ? post.directReplies
          : post.replies) || ''}
      </Button><Button
        variant="ghost"
        size="icon"
        class="cx-action"
        aria-label="Simpan posting"
        aria-pressed={post.bookmarked}
        onclick={save}
        disabled={busy}
      >
        <Bookmark size={19} fill={post.bookmarked ? 'currentColor' : 'none'} />
      </Button><Button
        variant="ghost"
        size="icon"
        class="cx-action cx-share"
        aria-label="Bagikan tautan"
        onclick={share}
      >
        <Share2 size={19} />
      </Button>
    </div>
  </div>
</Card.Root>
<Dialog.Root bind:open={reporting}>
  <Dialog.Content class="platform-dialog">
    <Dialog.Header>
      <Dialog.Title>Laporkan posting</Dialog.Title><Dialog.Description>
        Laporan hanya terlihat oleh moderator komunitas.
      </Dialog.Description>
    </Dialog.Header>
    <form
      class="cx-form"
      onsubmit={(e) => {
        e.preventDefault()
        report()
      }}
    >
      <Label for={'reason-' + post.id}>Alasan laporan</Label><Textarea
        id={'reason-' + post.id}
        bind:value={reason}
        maxlength={2000}
        required
        placeholder="Apa yang perlu ditinjau?"
      /><Button type="submit" disabled={busy || !reason.trim()}>
        {#if busy}<LoaderCircle size={15} class="animate-spin" />{/if}Kirim
        laporan
      </Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
