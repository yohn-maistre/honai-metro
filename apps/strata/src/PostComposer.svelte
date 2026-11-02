<script lang="ts">
  import { onDestroy, untrack } from 'svelte'
  import {
    ImagePlus,
    Globe,
    LockKeyhole,
    X,
    LoaderCircle,
    Link,
    Heading,
    ShieldAlert,
    Vote,
    CalendarDays,
    Code,
    Plus,
  } from '@lucide/svelte'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import Choice from './Choice.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import {
    request,
    ApiError,
    initials,
    type Actor,
    type Community,
    type Post,
    type PostContent,
  } from './api'
  import PostText from './PostText.svelte'
  import { markdown, videoEmbed, directVideo } from './markdown'
  import VideoPreview from './VideoPreview.svelte'
  import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js'
  import { prepareImage, uploadImages, type ImageDraft } from './media'
  let {
    actor,
    communities,
    initialCommunity,
    parentId,
    replyingTo,
    onCancelReply,
    onPosted,
    onStateChange,
    compact = false,
    initialUrl = '',
  }: {
    actor: Actor
    communities: Community[]
    initialCommunity: string
    parentId?: string
    replyingTo?: string
    onCancelReply?: () => void
    onPosted: (post: Post) => void | Promise<void>
    onStateChange?: (state: { dirty: boolean; busy: boolean }) => void
    initialUrl?: string
    compact?: boolean
  } = $props()
  let communityId = $state(untrack(() => initialCommunity)),
    text = $state(''),
    title = $state(''),
    url = $state(untrack(() => initialUrl)),
    warning = $state(''),
    showTitle = $state(false),
    showUrl = $state(false),
    showWarning = $state(false),
    format = $state(false),
    preview = $state(false),
    kind = $state(''),
    pollOptions = $state(['', '']),
    pollDays = $state('3'),
    eventTime = $state(''),
    eventLocation = $state(''),
    pending = $state<{ key: string; payload: Record<string, unknown> } | null>(
      null,
    ),
    images = $state<ImageDraft[]>([]),
    busy = $state(false),
    processing = $state(false),
    error = $state(''),
    altKey = $state(''),
    field = $state<HTMLTextAreaElement | null>(null),
    picker = $state<HTMLInputElement | null>(null)
  const detectedUrl = $derived(
    url.trim() ||
      text.match(/https?:\/\/[^\s<>]+/)?.[0]?.replace(/[.,;!?)]*$/, '') ||
      '',
  )
  const hasContent = $derived(
    !!(text.trim() || title.trim() || url.trim() || images.length || kind),
  )
  $effect(() => {
    onStateChange?.({ dirty: hasContent, busy: busy || processing })
  })
  const destination = $derived(communities.find((c) => c.id === communityId))
  onDestroy(() => images.forEach((image) => URL.revokeObjectURL(image.preview)))
  function remove(key: string) {
    const image = images.find((i) => i.key === key)
    if (image) URL.revokeObjectURL(image.preview)
    images = images.filter((i) => i.key !== key)
  }
  async function add(files: FileList | null) {
    if (!files || processing || busy || pending) return
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
    if (busy || processing || !hasContent || !destination) return
    busy = true
    error = ''
    try {
      const content: PostContent = {
        ...(title.trim() ? { title } : {}),
        ...(detectedUrl ? { url: detectedUrl } : {}),
        ...(warning.trim() ? { warning } : {}),
        ...(format ? { format: 'markdown' } : {}),
      }
      if (kind === 'poll')
        content.poll = {
          options: pollOptions,
          closesAt: Date.now() + Number(pollDays) * 86400000,
        }
      if (kind === 'event') {
        if (!eventTime) throw Error('Pilih waktu acara.')
        content.event = {
          startsAt: new Date(eventTime).getTime(),
          location: eventLocation,
        }
      }
      if (!pending) {
        const mediaIds = await uploadImages(communityId, images)
        pending = {
          key: crypto.randomUUID(),
          payload: {
            communityId,
            text,
            ...(parentId ? { parentId } : {}),
            mediaIds,
            content,
          },
        }
      }
      const post = await request<Post>('/v1/posts', {
        ...pending.payload,
        requestKey: pending.key,
      })
      pending = null
      title = ''
      url = ''
      warning = ''
      kind = ''
      pollOptions = ['', '']
      format = false
      preview = false
      text = ''
      images.forEach((image) => URL.revokeObjectURL(image.preview))
      images = []
      resize()
      await onPosted(post)
    } catch (e) {
      if (e instanceof ApiError && e.status >= 400 && e.status < 500)
        pending = null
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
            <Choice
              aria-label="Komunitas"
              bind:value={communityId}
              disabled={busy || !!pending || images.length > 0}
              items={communities.map((c) => ({
                value: c.id,
                label: c.title + (c.visibility === 'public' ? '' : ' · Privat'),
              }))}
            />
          </span>
        </div>{/if}
      {#if showTitle}<Input
          aria-label="Judul posting"
          placeholder="Judul (opsional)"
          bind:value={title}
          maxlength={180}
          disabled={busy || !!pending}
        />{/if}
      {#if !preview}<Textarea
          bind:ref={field}
          bind:value={text}
          class="composer-text"
          aria-label={compact ? 'Tulis balasan' : 'Posting'}
          placeholder={compact ? 'Tulis balasan…' : 'Apa yang terjadi?'}
          rows={compact ? 1 : 4}
          maxlength={destination?.publication === 'atproto' ? 6000 : 20000}
          disabled={!!pending}
          oninput={resize}
          onkeydown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              void submit()
            }
          }}
        />{:else}<div class="composer-preview post-markdown">
          {#if format}{@html markdown(text)}{:else}<PostText {text} />{/if}
        </div>{/if}
      {#if showUrl}<Input
          aria-label="Tautan posting"
          type="url"
          placeholder="https://…"
          bind:value={url}
          disabled={busy || !!pending}
        />{/if}
      {#if !warning && (videoEmbed(detectedUrl) || directVideo(detectedUrl))}<VideoPreview
          url={detectedUrl}
        />{/if}
      {#if showWarning}<Input
          aria-label="Peringatan konten"
          placeholder="Peringatan konten"
          bind:value={warning}
          maxlength={160}
          disabled={busy || !!pending}
        />{/if}
      {#if kind === 'poll'}<fieldset
          class="composer-extras"
          disabled={busy || !!pending}
        >
          <legend>Jajak pendapat</legend>
          <div class="poll-choice-list">
            {#each pollOptions.keys() as i}<div class="poll-choice-row">
                <span>{i + 1}</span>
                <Input
                  aria-label={'Pilihan ' + (i + 1)}
                  placeholder={'Pilihan ' + (i + 1)}
                  bind:value={pollOptions[i]}
                  maxlength={100}
                  required
                />{#if pollOptions.length > 2}<Button
                    variant="ghost"
                    size="icon"
                    aria-label={'Hapus pilihan ' + (i + 1)}
                    onclick={() =>
                      (pollOptions = pollOptions.filter((_, n) => n !== i))}
                  >
                    <X size={15} />
                  </Button>{/if}
              </div>{/each}
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              disabled={pollOptions.length >= 6}
              onclick={() => (pollOptions = [...pollOptions, ''])}
            >
              Tambah pilihan
            </Button><Choice
              compact
              aria-label="Durasi jajak pendapat"
              bind:value={pollDays}
              items={[
                { value: '1', label: '1 hari' },
                { value: '3', label: '3 hari' },
                { value: '7', label: '7 hari' },
              ]}
            /><Button variant="ghost" size="sm" onclick={() => (kind = '')}>
              Hapus
            </Button>
          </div>
        </fieldset>{/if}
      {#if kind === 'event'}<fieldset
          class="composer-extras"
          disabled={busy || !!pending}
        >
          <legend>Acara</legend>
          <Input
            aria-label="Waktu acara"
            type="datetime-local"
            bind:value={eventTime}
            required
          /><Input
            aria-label="Lokasi acara"
            placeholder="Lokasi (opsional)"
            bind:value={eventLocation}
            maxlength={200}
          /><Button variant="ghost" size="sm" onclick={() => (kind = '')}>
            Hapus acara
          </Button>
        </fieldset>{/if}
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
                disabled={busy || !!pending}
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
            !!pending ||
            processing ||
            images.length >= 4 ||
            destination?.publication !== 'local'}
          onclick={() => picker?.click()}
        >
          {#if processing}<LoaderCircle
              size={20}
              class="animate-spin"
            />{:else}<ImagePlus size={20} />{/if}
        </Button>
        {#if !compact && destination?.publication === 'local'}<Button
            variant="ghost"
            size="icon"
            aria-label="Tambahkan tautan"
            title="Tautan"
            aria-pressed={showUrl}
            disabled={busy || !!pending}
            onclick={() => (showUrl = !showUrl)}
          >
            <Link size={20} />
          </Button>{#if !parentId}<Button
              variant="ghost"
              size="icon"
              aria-label="Tambahkan jajak pendapat"
              title="Jajak pendapat"
              aria-pressed={kind === 'poll'}
              disabled={busy || !!pending}
              onclick={() => (kind = kind === 'poll' ? '' : 'poll')}
            >
              <Vote size={20} />
            </Button>{/if}{/if}
        {#if destination?.publication === 'local'}<Dropdown.Root>
            <Dropdown.Trigger
              class="composer-tool"
              aria-label="Opsi konten"
              disabled={busy || !!pending}
            >
              <Plus size={20} />
            </Dropdown.Trigger><Dropdown.Content>
              <Dropdown.Item onSelect={() => (showTitle = !showTitle)}>
                <Heading size={16} />Judul
              </Dropdown.Item><Dropdown.Item
                onSelect={() => (showUrl = !showUrl)}
              >
                <Link size={16} />Tautan / video
              </Dropdown.Item><Dropdown.Item
                onSelect={() => (showWarning = !showWarning)}
              >
                <ShieldAlert size={16} />Peringatan konten
              </Dropdown.Item>{#if !parentId}<Dropdown.Item
                  onSelect={() => (kind = kind === 'poll' ? '' : 'poll')}
                >
                  <Vote size={16} />Jajak pendapat
                </Dropdown.Item><Dropdown.Item
                  onSelect={() => (kind = kind === 'event' ? '' : 'event')}
                >
                  <CalendarDays size={16} />Acara
                </Dropdown.Item>{/if}<Dropdown.Separator
              /><Dropdown.CheckboxItem
                checked={format}
                onCheckedChange={(v) => (format = v)}
              >
                <Code size={16} />Markdown
              </Dropdown.CheckboxItem>
            </Dropdown.Content>
          </Dropdown.Root>{/if}
        {#if text.trim()}<Button
            variant="ghost"
            size="sm"
            onclick={() => (preview = !preview)}
          >
            {preview ? 'Tulis' : 'Pratinjau'}
          </Button>{/if}
        {#if text.length > 19500}<span class="composer-count">
            {(destination?.publication === 'atproto' ? 6000 : 20000) -
              text.length}
          </span>{/if}
      </div>
    </div>
    {#if compact}<Button
        class="composer-send"
        type="submit"
        size="sm"
        disabled={busy || processing || !hasContent}
      >
        {#if busy}<LoaderCircle
            size={16}
            class="animate-spin"
          />{:else}Balas{/if}
      </Button>{/if}
  </div>
  <div class="composer-footer" class:reply-footer={compact}>
    {#if !compact}<span class="composer-audience">
        {#if destination?.visibility === 'public'}<Globe
            size={13}
          />{destination.publication === 'atproto'
            ? 'Publik · AT'
            : 'Publik'}{:else}<LockKeyhole size={13} />Hanya anggota{/if}
      </span>
      <Button
        type="submit"
        disabled={busy || processing || !hasContent || !destination}
      >
        {#if busy}<LoaderCircle size={16} class="animate-spin" />{/if}Posting
      </Button>{/if}
  </div>
  {#if pending && !busy}<p class="composer-retry-note">
      Pengiriman belum terkonfirmasi. Coba lagi untuk memeriksa posting yang
      sama.
    </p>{/if}
  {#if error}<p class="cx-form-error" role="alert">{error}</p>{/if}
</form>
