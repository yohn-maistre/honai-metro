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
  }: {
    post: Post
    community?: Community
    onError: (message: string) => void
    loggedIn?: boolean
    canVote?: boolean
    detail?: boolean
    onSaved?: () => void
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
    const url = new URL('/square/' + post.rootId, location.origin).href
    try {
      if (navigator.share) await navigator.share({ title: 'Strata', url })
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

<article class="cx-post" class:detail data-post={post.id}>
  <a
    class="cx-post-avatar"
    href="/people/{post.author.id}"
    aria-label={post.author.name}
  >
    <span class="cx-avatar sage">{initials(post.author.name)}</span>
  </a>
  <div class="cx-post-content">
    <div class="cx-post-meta">
      <a href="/people/{post.author.id}" class="cx-author">
        {post.author.name}
      </a>
      {#if post.author.kind === 'agent'}<span class="strata-pill">AI</span>{/if}
      <span class="cx-meta-secondary">{relativeDate(post.created)}</span>
      {#if loggedIn}<button
          class="cx-icon-button cx-post-more"
          aria-label="Laporkan posting"
          onclick={() => (reporting = !reporting)}
        >
          <Flag size={15} />
        </button>{/if}
    </div>
    <a class="cx-post-community" href="/communities/{post.community_id}">
      {#if community?.visibility !== 'public'}<LockKeyhole
          size={11}
        />{/if}{community?.title ?? 'Komunitas'}
    </a>
    {#if detail}<p class="cx-post-body strata-body">{post.text}</p>{:else}<a
        href="/square/{post.rootId}"
        class="cx-post-body strata-body"
      >
        {post.text}
      </a>{/if}
    {#if post.uri}<div class="strata-publication">
        <Globe size={12} />{#if post.publicationState === 'delivered'}<a
            href={'https://atproto-browser.vercel.app/at/' + post.uri.slice(5)}
            target="_blank"
            rel="noreferrer"
          >
            Terbit di AT ↗
          </a>{:else if post.publicationState === 'uncertain'}Hasil penerbitan
          perlu diperiksa{:else if post.publicationState === 'pending'}Menunggu
          penerbitan AT{:else}{post.publicationState}{/if}
      </div>{/if}
    <div class="cx-post-actions">
      <span class="cx-vote">
        <button
          aria-label="Dukung posting"
          aria-pressed={post.myVote === 1}
          class:active={post.myVote === 1}
          onclick={() => vote(1)}
          disabled={busy}
        >
          <ArrowUp size={16} />
        </button>
        <span>{post.score}</span>
        <button
          aria-label="Turunkan posting"
          aria-pressed={post.myVote === -1}
          class:active={post.myVote === -1}
          onclick={() => vote(-1)}
          disabled={busy}
        >
          <ArrowDown size={16} />
        </button>
      </span>
      <a
        class="cx-action"
        href="/square/{post.rootId}#replies"
        aria-label="{post.replies} balasan"
      >
        <MessageCircle size={17} />
        <span>{post.replies || 'Balas'}</span>
      </a>
      <button
        class="cx-action"
        aria-label="Simpan posting"
        aria-pressed={post.bookmarked}
        class:active={post.bookmarked}
        onclick={save}
        disabled={busy}
      >
        <Bookmark size={17} fill={post.bookmarked ? 'currentColor' : 'none'} />
      </button>
      <button
        class="cx-action cx-share"
        aria-label="Bagikan tautan"
        onclick={share}
      >
        <Share2 size={16} />
      </button>
    </div>
    {#if reporting}<form
        class="cx-inline-form"
        onsubmit={(e) => {
          e.preventDefault()
          report()
        }}
      >
        <label>
          Alasan laporan
          <textarea
            bind:value={reason}
            maxlength="2000"
            required
            placeholder="Apa yang perlu ditinjau?"
          ></textarea>
        </label>
        <div class="cx-actions">
          <button
            class="cx-button primary small"
            disabled={busy || !reason.trim()}
          >
            {#if busy}<LoaderCircle size={14} />{/if}Kirim laporan
          </button>
          <button
            type="button"
            class="cx-button small"
            onclick={() => (reporting = false)}
          >
            Batal
          </button>
        </div>
      </form>{/if}
  </div>
</article>
