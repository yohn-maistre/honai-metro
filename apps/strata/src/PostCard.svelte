<script lang="ts">
  import {avatarTone} from './avatar-tone'
  import {autosizeText} from './autosize-text'
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
    GitPullRequest,
  } from '@lucide/svelte'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import OfferingCard from './OfferingCard.svelte'
  import RichPost from './RichPost.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
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
    onKnowledge,
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
    onKnowledge?: () => void
    authorBadge?: boolean
  } = $props()
  let menuOpen = $state(false),
    discardEdit = $state(false),
    extraEdit = $state(false)
  function closeEdit() {
    if (busy) return
    if (editDirty) discardEdit = true
    else editing = false
  }
  function submitEdit(){const form=document.getElementById('edit-form-'+post.id);if(form instanceof HTMLFormElement)form.requestSubmit()}
  let busy = $state(false),
    reporting = $state(false),
    editing = $state(false),
    removing = $state(false),
    editText = $state(''),
    editTitle = $state(''),
    editUrl = $state(''),
    editWarning = $state(''),
    modAction = $state(''),
    modReason = $state(''),
    reason = $state('')
  const editLimit=$derived(community?.publication==='atproto'?6000:20000)
  const editDirty = $derived(
    editText !== post.text ||
      editTitle !== (post.content?.title ?? '') ||
      editUrl !== (post.content?.url ?? '') ||
      editWarning !== (post.content?.warning ?? ''),
  )
  function edit() {
    editText = post.text
    editTitle = post.content?.title ?? ''
    editUrl = post.content?.url ?? ''
    editWarning = post.content?.warning ?? ''
    extraEdit = !!(editTitle || editUrl || editWarning)
    editing = true
  }
  async function mutate(route: string, body: unknown) {
    if (busy) return
    busy = true
    try {
      const saved = await request<Post>(`/v1/posts/${post.id}/${route}`, body)
      if (route === 'moderate') {
        location.reload()
        return
      }
      Object.assign(post, saved)
      editing = false
      removing = false
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Belum tersimpan.')
    } finally {
      busy = false
    }
  }
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
  oncontextmenu={(event) => {
    if (
      event.target instanceof Element &&
      !event.target.closest('input,textarea,a,button') &&
      !window.getSelection()?.toString()
    ) {
      event.preventDefault()
      menuOpen = true
    }
  }}
>
  <a
    class="cx-post-avatar"
    href={'/people/' + post.author.id}
    aria-label={post.author.name}
  >
    <Avatar.Root class="size-10">
      <Avatar.Fallback class="avatar-tinted" style={avatarTone(post.author.id)}>{initials(post.author.name)}</Avatar.Fallback>
    </Avatar.Root>
  </a>
  <div class="cx-post-content">
    <div class="cx-post-meta" class:agent-meta={post.author.kind==='agent'}>
      <a
        href={'/people/' + post.author.id}
        class="cx-author"
        title={post.author.name}
      >
        {post.author.name}
      </a>
      {#if post.author.kind === 'agent'}<Badge variant="secondary" class="post-agent-badge">
          {post.author.agent?.role === 'steward'
            ? 'Agen · pendamping'
            : post.author.agent?.role === 'worker'
              ? 'Agen · pekerja'
              : 'Agen tamu'}
        </Badge>{/if}
      <a
        class="cx-meta-secondary post-permalink"
        href={'/square/' + post.id}
        title={new Date(post.created).toLocaleString()}
      >
        {relativeDate(post.created)}{#if post.updated}
          · diedit{/if}
      </a>
      {#if post.pinned}<span class="post-state">Disematkan</span>{/if}
      {#if authorBadge}<span class="reply-author-badge">Penulis</span>{/if}
      <Dropdown.Root bind:open={menuOpen}>
        <Dropdown.Trigger class="cx-post-more" aria-label="Opsi posting">
          <Ellipsis size={18} />
        </Dropdown.Trigger><Dropdown.Content align="end">
          {#if post.permissions?.edit}<Dropdown.Item onSelect={edit}>
              Edit posting
            </Dropdown.Item><Dropdown.Item onSelect={() => (removing = true)}>
              Hapus posting
            </Dropdown.Item><Dropdown.Separator />{/if}
          {#if post.permissions?.moderate && !post.deleted}<Dropdown.Item
              onSelect={() => (modAction = 'hide')}
            >
              Sembunyikan posting
            </Dropdown.Item>{#if !post.parent_id}<Dropdown.Item
                onSelect={() => (modAction = post.locked ? 'unlock' : 'lock')}
              >
                {post.locked ? 'Buka percakapan' : 'Kunci percakapan'}
              </Dropdown.Item><Dropdown.Item
                onSelect={() => (modAction = post.pinned ? 'unpin' : 'pin')}
              >
                {post.pinned ? 'Lepas sematan' : 'Sematkan'}
              </Dropdown.Item>{/if}<Dropdown.Separator />{/if}
          {#if loggedIn && !post.deleted && community?.visibility === 'public' && (onKnowledge || post.permissions?.moderate)}
            {#if onKnowledge}<Dropdown.Item onSelect={onKnowledge}>
                <GitPullRequest size={15} />Tinjau sebagai bahan wiki
              </Dropdown.Item>
            {:else}<Dropdown.Item>
                {#snippet child({ props })}<a
                    {...props}
                    href={'/square/' + post.id + '?review=wiki'}
                  >
                    <GitPullRequest size={15} />Tinjau sebagai bahan wiki
                  </a>{/snippet}
              </Dropdown.Item>{/if}
            <Dropdown.Separator />
          {/if}
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
    <RichPost
      {post}
      {detail}
      {canVote}
      {onError}
      externalPreview={community?.visibility === 'public'}
    />
    {#if post.offering}<OfferingCard {post} {community} {loggedIn} onUpdated={value=>post=value} {onError}/>{/if}
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

<Dialog.Root
  open={editing}
  onOpenChange={(v) => {
    if (!v) closeEdit()
  }}
>
  <Dialog.Content
    class="platform-dialog edit-dialog"
    showCloseButton={false}
    onEscapeKeydown={(event) => {
      event.preventDefault()
      closeEdit()
    }}
    onInteractOutside={(event) => {
      event.preventDefault()
      if (!discardEdit) closeEdit()
    }}
  >
    <Dialog.Header class="edit-dialog-header">
      <Button variant="ghost" onclick={closeEdit} disabled={busy}>Batal</Button>
      <Dialog.Title>Edit posting</Dialog.Title>
      <Button
        type="submit"
        form={'edit-form-' + post.id}
        disabled={busy || !editDirty || editText.length>editLimit}
      >
        {#if busy}<LoaderCircle size={15} class="animate-spin" />{/if}Simpan
      </Button>
      <Dialog.Description class="sr-only">
        Perbarui tulisan dan rincian posting.
      </Dialog.Description>
    </Dialog.Header>
    <form
      id={'edit-form-' + post.id}
      class="edit-form"
      onsubmit={(event) => {
        event.preventDefault()
        if(editText.length>editLimit)return
        void mutate('edit', {
          revision: post.revision,
          text: editText,
          content: {
            title: editTitle,
            url: editUrl,
            warning: editWarning,
            format: post.content?.format ?? 'plain',
            ...(post.content?.inlineMedia
              ? { inlineMedia: post.content.inlineMedia }
              : {}),
          },
        })
      }}
    >
      <div class="edit-author">
        <Avatar.Root>
          <Avatar.Fallback class="avatar-tinted" style={avatarTone(post.author.id)}>{initials(post.author.name)}</Avatar.Fallback>
        </Avatar.Root>
        <span>
          <strong>{post.author.name}</strong>
          <small>{community?.title ?? 'Percakapan'}</small>
        </span>
      </div>
      {#if post.content?.format==='markdown'}{#await import('./DocumentEditor.svelte') then module}<module.default bind:value={editText} label="Posting" max={editLimit} disabled={busy} placeholder="Apa yang terjadi?" onSubmit={submitEdit}/>{/await}
      {:else}<Label class="sr-only" for={'edit-text-' + post.id}>
        Posting
      </Label><textarea data-slot="textarea"
        id={'edit-text-' + post.id}
        bind:value={editText}
        maxlength={editLimit}
        class="edit-writing"
        placeholder="Apa yang terjadi?"
        use:autosizeText={editText}
      ></textarea>{/if}
      <div class="edit-tools">
        <Button
          variant="ghost"
          type="button"
          aria-expanded={extraEdit}
          onclick={() => (extraEdit = !extraEdit)}
        >
          Rincian posting
        </Button>
        <small>{editText.length.toLocaleString('id')} / {editLimit.toLocaleString('id')}</small>
      </div>
      {#if extraEdit}<div class="edit-details">
          <Label for={'edit-title-' + post.id}>Judul (opsional)</Label><Input
            id={'edit-title-' + post.id}
            bind:value={editTitle}
            maxlength={180}
          />
          <Label for={'edit-link-' + post.id}>Tautan</Label><Input
            id={'edit-link-' + post.id}
            bind:value={editUrl}
            type="url"
            maxlength={2048}
            placeholder="https://"
          />
          <Label for={'edit-cw-' + post.id}>Peringatan konten</Label><Input
            id={'edit-cw-' + post.id}
            bind:value={editWarning}
            maxlength={160}
          />
        </div>{/if}
    </form>
  </Dialog.Content>
</Dialog.Root>
<AlertDialog.Root bind:open={discardEdit}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>
        Buang perubahan?
      </AlertDialog.Title><AlertDialog.Description>
        Perubahan ini belum disimpan.
      </AlertDialog.Description>
    </AlertDialog.Header><AlertDialog.Footer>
      <AlertDialog.Cancel>
        Lanjut mengedit
      </AlertDialog.Cancel><AlertDialog.Action
        onclick={() => {
          editing = false
          discardEdit = false
        }}
      >
        Buang perubahan
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
<Dialog.Root bind:open={removing}>
  <Dialog.Content class="platform-dialog">
    <Dialog.Header>
      <Dialog.Title>Hapus posting?</Dialog.Title><Dialog.Description>
        Teks dan media akan dihapus. Balasan tetap ada.
      </Dialog.Description>
    </Dialog.Header><Button
      variant="destructive"
      disabled={busy}
      onclick={() => mutate('delete', { revision: post.revision })}
    >
      Hapus posting
    </Button>
  </Dialog.Content>
</Dialog.Root>
<Dialog.Root
  open={!!modAction}
  onOpenChange={(open) => {
    if (!open) {
      modAction = ''
      modReason = ''
    }
  }}
>
  <Dialog.Content class="platform-dialog">
    <Dialog.Header>
      <Dialog.Title>Moderasi posting</Dialog.Title><Dialog.Description>
        {(
          {
            hide: 'Sembunyikan posting',
            lock: 'Kunci percakapan',
            unlock: 'Buka percakapan',
            pin: 'Sematkan',
            unpin: 'Lepas sematan',
          } as Record<string, string>
        )[modAction]}
      </Dialog.Description>
    </Dialog.Header>
    <form
      class="cx-form"
      onsubmit={(e) => {
        e.preventDefault()
        void mutate('moderate', { action: modAction, reason: modReason })
      }}
    >
      <Label for={'mod-reason-' + post.id}>
        Alasan untuk catatan moderator
      </Label><Textarea
        id={'mod-reason-' + post.id}
        bind:value={modReason}
        maxlength={500}
        required
      /><Button type="submit" disabled={busy || !modReason.trim()}>
        Terapkan
      </Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
