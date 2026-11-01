<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import {
    ImagePlus,
    Globe,
    LockKeyhole,
    X,
    LoaderCircle,
    ChevronDown,
  } from '@lucide/svelte'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as NativeSelect from '$lib/components/ui/native-select/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import {
    request,
    initials,
    type Actor,
    type Community,
    type Post,
  } from './api'
  import { prepareImage, uploadImages, type ImageDraft } from './media'
  let {
    actor,
    communities,
    initialCommunity,
    parentId,
    replyingTo,
    onCancelReply,
    onPosted,
    compact = false,
  }: {
    actor: Actor
    communities: Community[]
    initialCommunity: string
    parentId?: string
    replyingTo?: string
    onCancelReply?: () => void
    onPosted: (post: Post) => void | Promise<void>
    compact?: boolean
  } = $props()
  let communityId = $state(untrack(() => initialCommunity)),
    text = $state(''),
    images = $state<ImageDraft[]>([]),
    busy = $state(false),
    processing = $state(false),
    error = $state(''),
    altKey = $state(''),
    field = $state<HTMLTextAreaElement | null>(null),
    picker = $state<HTMLInputElement | null>(null)
  const destination = $derived(communities.find((c) => c.id === communityId))
  onDestroy(() => images.forEach((image) => URL.revokeObjectURL(image.preview)))
  function remove(key: string) {
    const image = images.find((i) => i.key === key)
    if (image) URL.revokeObjectURL(image.preview)
    images = images.filter((i) => i.key !== key)
  }
  async function add(files: FileList | null) {
    if (!files || processing || busy) return
    processing = true
    error = ''
    try {
      if (images.length + files.length > 4)
        throw Error('Maksimal 4 gambar per posting.')
      for (const file of Array.from(files))
        images = [...images, await prepareImage(file)]
    } catch (e) {
      error = e instanceof Error ? e.message : 'Gambar belum dapat ditambahkan.'
    } finally {
      processing = false
      if (picker) picker.value = ''
    }
  }
  function resize() {
    if (field) {
      field.style.height = 'auto'
      field.style.height = Math.min(field.scrollHeight, 300) + 'px'
    }
  }
  export function focus() {
    field?.focus()
  }
  async function submit() {
    if (busy || processing || !text.trim() || !destination) return
    busy = true
    error = ''
    try {
      const mediaIds = await uploadImages(communityId, images)
      const post = await request<Post>('/v1/posts', {
        communityId,
        text,
        ...(parentId ? { parentId } : {}),
        mediaIds,
      })
      text = ''
      images.forEach((image) => URL.revokeObjectURL(image.preview))
      images = []
      resize()
      await onPosted(post)
    } catch (e) {
      error =
        e instanceof Error
          ? e.message
          : 'Belum terkirim. Periksa percakapan sebelum mencoba lagi.'
    } finally {
      busy = false
    }
  }
</script>

<form
  class="post-composer"
  class:compact
  onsubmit={(e) => {
    e.preventDefault()
    void submit()
  }}
>
  {#if replyingTo}<div class="reply-target">
      <span>Membalas {replyingTo}</span>
      {#if onCancelReply}<Button
          variant="ghost"
          size="icon"
          aria-label="Batal membalas"
          onclick={onCancelReply}
        >
          <X size={16} />
        </Button>{/if}
    </div>{/if}
  <div class="composer-writing">
    <Avatar.Root class="composer-avatar">
      <Avatar.Fallback>{initials(actor.name)}</Avatar.Fallback>
    </Avatar.Root>
    <div class="composer-content">
      {#if !compact}<div class="composer-identity">
          <strong>{actor.name}</strong>
          <span class="composer-destination">
            <ChevronDown size={12} /><NativeSelect.Root
              aria-label="Komunitas"
              bind:value={communityId}
              disabled={busy || images.length > 0}
            >
              {#each communities as community}<option value={community.id}>
                  {community.title}{community.visibility === 'public'
                    ? ''
                    : ' · Privat'}
                </option>{/each}
            </NativeSelect.Root>
          </span>
        </div>{/if}
      <Textarea
        bind:ref={field}
        bind:value={text}
        class="composer-text"
        aria-label={compact ? 'Tulis balasan' : 'Posting'}
        placeholder={compact ? 'Tulis balasan…' : 'Apa yang terjadi?'}
        rows={compact ? 1 : 4}
        maxlength={6000}
        required
        oninput={resize}
        onkeydown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            void submit()
          }
        }}
      />
      {#if images.length}<div class="composer-images">
          {#each images as image (image.key)}<div class="composer-image-draft">
              <img
                src={image.preview}
                alt={image.alt || 'Pratinjau gambar'}
                width={image.width}
                height={image.height}
              />
              <Button
                class="draft-remove"
                variant="secondary"
                size="icon"
                aria-label="Hapus gambar"
                disabled={busy}
                onclick={() => remove(image.key)}
              >
                <X size={16} />
              </Button><Button
                class="draft-alt"
                variant="secondary"
                disabled={busy || !!image.uploaded}
                onclick={() => (altKey = altKey === image.key ? '' : image.key)}
              >
                ALT{image.alt ? ' ✓' : ''}
              </Button>{#if altKey === image.key}<Input
                  aria-label="Teks alternatif gambar"
                  placeholder="Deskripsikan gambar"
                  maxlength={1000}
                  disabled={busy || !!image.uploaded}
                  bind:value={image.alt}
                />{/if}
            </div>{/each}
        </div>{/if}
    </div>
    {#if compact}<Button
        class="composer-send"
        type="submit"
        size="sm"
        disabled={busy || processing || !text.trim()}
      >
        {#if busy}<LoaderCircle
            size={16}
            class="animate-spin"
          />{:else}Balas{/if}
      </Button>{/if}
  </div>
  <div class="composer-footer" class:reply-footer={compact}>
    <div class="composer-tools">
      <input
        bind:this={picker}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        class="sr-only"
        tabindex="-1"
        aria-label="Pilih gambar"
        onchange={(e) => void add(e.currentTarget.files)}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Tambahkan gambar"
        disabled={busy ||
          processing ||
          images.length >= 4 ||
          destination?.publication !== 'local'}
        onclick={() => picker?.click()}
      >
        {#if processing}<LoaderCircle
            size={20}
            class="animate-spin"
          />{:else}<ImagePlus size={20} />{/if}
      </Button>{#if text.length > 5500}<span class="composer-count">
          {6000 - text.length}
        </span>{/if}
    </div>
    {#if !compact}<span class="composer-audience">
        {#if destination?.visibility === 'public'}<Globe
            size={13}
          />{destination.publication === 'atproto'
            ? 'Publik · AT'
            : 'Publik'}{:else}<LockKeyhole size={13} />Hanya anggota{/if}
      </span>
      <Button
        type="submit"
        disabled={busy || processing || !text.trim() || !destination}
      >
        {#if busy}<LoaderCircle size={16} class="animate-spin" />{/if}Posting
      </Button>{/if}
  </div>
  {#if error}<p class="cx-form-error" role="alert">{error}</p>{/if}
</form>
