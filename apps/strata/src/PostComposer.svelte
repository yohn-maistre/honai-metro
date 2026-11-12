<script lang="ts">
  import {avatarTone} from './avatar-tone'
  import {firstPostUrl} from './post-links'
  import { onDestroy, untrack } from 'svelte'
  import {
    ShoppingBag,
    ImagePlus,
    Bold,
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
    ArrowUp,
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
  import LinkPreview from './LinkPreview.svelte'
  import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import { prepareImage, uploadImages, type ImageDraft } from './media'
  import type DocumentEditor from './DocumentEditor.svelte'
  let documentEditor = $state<DocumentEditor | null>(null)
  async function insertImage(image: ImageDraft) {
    processing = true
    try {
      await uploadImages(communityId, [image])
      documentEditor?.insertImage(image.uploaded!.url, image.alt)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Gambar belum dapat disisipkan.'
    } finally {
      processing = false
    }
  }
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
    initialKind = '',
  }: {
    actor: Actor
    communities: Community[]
    initialCommunity: string
    parentId?: string
    replyingTo?: string
    onCancelReply?: () => void
    onPosted: (post: Post) => void | Promise<void>
    onStateChange?: (state: {
      dirty: boolean
      busy: boolean
      canSubmit: boolean
    }) => void
    initialUrl?: string
    initialKind?: string
    compact?: boolean
  } = $props()
  let communityId = $state(untrack(() => initialCommunity)),
    text = $state(''),
    title = $state(''),
    url = $state(untrack(() => initialUrl)),
    warning = $state(''),
    showTitle = $state(untrack(()=>initialKind==='offering')),
    showUrl = $state(false),
    showWarning = $state(false),
    format = $state(untrack(()=>communities.find(c=>c.id===initialCommunity)?.publication==='local')),
    showFormatting = $state(true),
    preview = $state(false),
    kind = $state(untrack(() => initialKind)),
    pollOptions = $state(['', '']),
    pollDays = $state('3'),
    offerKind = $state('offer'),offerPrice = $state(''),offerUnit = $state(''),offerDays = $state('30'),
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
    picker = $state<HTMLInputElement | null>(null),
    form = $state<HTMLFormElement | null>(null)
  const detectedUrl = $derived(
    url.trim() ||
      firstPostUrl(text,format),
  )
  const destination = $derived(communities.find((c) => c.id === communityId))
  const textLimit=$derived(destination?.publication==='atproto'?6000:20000)
  const hasContent = $derived(
    !!(text.trim() || title.trim() || url.trim() || images.length || kind),
  )
  $effect(() => {
    onStateChange?.({
      dirty: hasContent,
      busy: busy || processing,
      canSubmit: hasContent && text.length<=textLimit && !!destination && !busy && !processing,
    })
  })
  let lastCommunity = untrack(() => initialCommunity),
    audiencePending = $state('')
  function changeDestination(next: string) {
    const before = communities.find((c) => c.id === lastCommunity),
      after = communities.find((c) => c.id === next)
    if(after?.publication==='atproto'&&format&&text.trim()){error='Tulisan berformat disimpan di komunitas lokal. Pilih komunitas lokal atau mulai tulisan teks baru untuk AT.';return false}
    if (
      hasContent &&
      before &&
      before.visibility !== 'public' &&
      after?.visibility === 'public'
    ) {
      audiencePending = next
      return false
    }
    if(!hasContent)format=after?.publication==='local'
    lastCommunity = next
    return true
  }
  onDestroy(() => images.forEach((image) => URL.revokeObjectURL(image.preview)))
  function remove(key: string) {
    const image = images.find((i) => i.key === key)
    if (image?.uploaded) documentEditor?.removeImage(image.uploaded.url)
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
      field.style.height = field.scrollHeight + 'px'
    }
  }
  export function focus() {
    if(format)documentEditor?.focus();else field?.focus()
  }
  export function send() {
    form?.requestSubmit()
  }
  async function submit() {
    if (busy || processing || !hasContent || !destination || text.length>textLimit) return
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
        const inlineIds = mediaIds.filter((id) =>
          text.includes('/v1/media/' + id),
        )
        if (format && inlineIds.length)
          content.inlineMedia = { version: 1, ids: inlineIds }
        pending = {
          key: crypto.randomUUID(),
          payload: {
            communityId,
            text,
            ...(parentId ? { parentId } : {}),
            mediaIds,
            content,
            ...(kind==='offering'?{kind:offerKind,price:String(offerPrice??'').trim()?Number(offerPrice):null,unit:offerUnit,durationDays:Number(offerDays)}:{}),
          },
        }
      }
      const post = await request<Post>(kind==='offering'?'/v1/offerings':'/v1/posts', {
        ...pending.payload,
        requestKey: pending.key,
      })
      pending = null
      title = ''
      url = ''
      warning = ''
      kind = ''
      offerKind='offer';offerPrice='';offerUnit='';offerDays='30'
      pollOptions = ['', '']
      format = destination?.publication==='local'
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
  bind:this={form}
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
      <Avatar.Fallback class="avatar-tinted" style={avatarTone(actor.id)}>{initials(actor.name)}</Avatar.Fallback>
    </Avatar.Root>
    <div class="composer-content">
      {#if !compact}<div class="composer-identity">
          <strong>{actor.name}</strong>
          <span class="composer-destination">
            <Choice
              aria-label="Komunitas"
              bind:value={communityId}
              onbeforechange={changeDestination}
              disabled={busy || !!pending || images.length > 0}
              items={communities.map((c) => ({
                value: c.id,
                label: c.title + (c.visibility === 'public' ? '' : ' · Privat'),
              }))}
            />
          </span>
        </div>
        <p class="composer-scope">
          {#if destination?.visibility === 'public'}<Globe size={14} />
            <span>
              Publik · semua orang dapat membaca{destination.publication ===
              'atproto'
                ? ' · diterbitkan ke AT'
                : ''}
            </span>{:else}<LockKeyhole size={14} />
            <span>
              Privat · hanya anggota {destination?.title} dapat membaca
            </span>{/if}
        </p>{/if}
      {#if showTitle}<Input
          aria-label="Judul posting"
          placeholder="Judul (opsional)"
          bind:value={title}
          maxlength={180}
          disabled={busy || !!pending}
        />{/if}
      <div class="composer-editor" hidden={preview}>
      {#if format}{#await import('./DocumentEditor.svelte')}<p role="status" class="composer-editor-loading">Menyiapkan editor…</p>{:then module}<module.default bind:this={documentEditor} bind:value={text} label={compact?'Tulis balasan':'Posting'} max={textLimit} disabled={busy||!!pending} toolbar={showFormatting} {compact} autofocus={!compact} placeholder={compact?'Tulis balasan…':kind==='offering'?'Ceritakan yang kamu tawarkan atau butuhkan…':'Apa yang terjadi?'} onSubmit={send}/>{/await}
      {:else}<Textarea bind:ref={field} bind:value={text} class="composer-text" aria-label={compact?'Tulis balasan':'Posting'} placeholder={compact?'Tulis balasan…':'Apa yang terjadi?'} rows={compact?1:4} maxlength={textLimit} disabled={busy||!!pending} oninput={resize} onkeydown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'&&!e.isComposing){e.preventDefault();send()}}}/>{/if}
      </div>
      {#if preview}<div class="composer-preview post-markdown">{#if format}{@html markdown(text)}{:else}<PostText {text}/>{/if}</div>{/if}
      {#if text.length>textLimit}<p role="alert" class="document-editor-error">Tulisan melewati batas {textLimit.toLocaleString('id')} karakter.</p>{/if}
      {#if showUrl}<Input
          aria-label="Tautan posting"
          type="url"
          placeholder="https://…"
          bind:value={url}
          disabled={busy || !!pending}
        />{/if}
      {#if !warning && (videoEmbed(detectedUrl) || directVideo(detectedUrl))}<VideoPreview
          url={detectedUrl}
        />{:else if !warning && detectedUrl && destination?.visibility === 'public'}<div
          class="post-link-card"
        >
          <LinkPreview url={detectedUrl} />
        </div>{/if}
      {#if showWarning}<Input
          aria-label="Peringatan konten"
          placeholder="Peringatan konten"
          bind:value={warning}
          maxlength={160}
          disabled={busy || !!pending}
        />{/if}
      {#if kind === 'offering'}<fieldset class="composer-extras offering-create" disabled={busy||!!pending}><legend>Penawaran atau kebutuhan</legend><Choice aria-label="Menawarkan atau mencari" bind:value={offerKind} items={[{value:'offer',label:'Menawarkan'},{value:'request',label:'Mencari'}]}/><div class="offering-form-pair"><Input aria-label={offerKind==='request'?'Anggaran (Rp)':'Harga (Rp)'} type="number" min="0" step="1" bind:value={offerPrice} placeholder={offerKind==='request'?'Anggaran (opsional)':'Harga (opsional)'}/><Input aria-label="Satuan harga" bind:value={offerUnit} maxlength={60} placeholder="Misalnya per ikat"/></div><Choice aria-label="Masa penawaran" bind:value={offerDays} items={[{value:'7',label:'Berlaku 7 hari'},{value:'30',label:'Berlaku 30 hari'},{value:'90',label:'Berlaku 90 hari'}]}/><p class="cx-hint">Kosongkan harga untuk dibicarakan langsung. Kontak melalui pesan atau diskusi; belum ada pembayaran di ETNOS.</p><Button variant="ghost" size="sm" onclick={()=>kind=''}>Hapus penawaran</Button></fieldset>{/if}
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
              </Button>{#if format}<Button
                  class="draft-insert"
                  variant="secondary"
                  size="sm"
                  disabled={busy || processing || !!pending || !documentEditor}
                  onclick={() => insertImage(image)}
                >
                  Sisipkan
                </Button>{/if}{#if altKey === image.key}<Input
                  aria-label="Teks alternatif gambar"
                  placeholder="Deskripsikan gambar"
                  maxlength={1000}
                  disabled={busy || !!image.uploaded}
                  bind:value={image.alt}
                />{/if}
            </div>{/each}
        </div>{/if}
      <div class="composer-tools">
        {#if !compact && !parentId && destination?.publication === 'local'}<Button variant="ghost" size="icon" aria-label="Tambahkan penawaran" title="Penawaran atau kebutuhan" aria-pressed={kind==='offering'} disabled={busy||!!pending} onclick={()=>{kind=kind==='offering'?'':'offering';if(kind==='offering')showTitle=true}}><ShoppingBag size={20}/><span class="composer-tool-label">Penawaran</span></Button>{/if}
        {#if !compact && destination?.publication === 'local'}<Button
          variant="ghost" size="icon" aria-label="Format tulisan" title="Format tulisan: tebal, miring, daftar dan Markdown"
          aria-pressed={format&&showFormatting} disabled={busy || !!pending} onclick={() => {if(!format)format=true;else showFormatting=!showFormatting}}
        ><Bold size={20}/><span class="composer-tool-label">Format</span></Button>{/if}
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
            />{:else}<ImagePlus size={20} />{/if}<span class="composer-tool-label">Media</span>
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
            <Link size={20} /><span class="composer-tool-label">Tautan</span>
          </Button>{#if !parentId}<Button
              variant="ghost"
              size="icon"
              aria-label="Tambahkan jajak pendapat"
              title="Jajak pendapat"
              aria-pressed={kind === 'poll'}
              disabled={busy || !!pending}
              onclick={() => (kind = kind === 'poll' ? '' : 'poll')}
            >
              <Vote size={20} /><span class="composer-tool-label">Polling</span>
            </Button><Button variant="ghost" size="icon" aria-label="Tambahkan acara" title="Acara" aria-pressed={kind === 'event'} disabled={busy || !!pending} onclick={() => kind = kind === 'event' ? '' : 'event'}><CalendarDays size={20}/><span class="composer-tool-label">Acara</span></Button>{/if}{/if}
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
              /><Dropdown.Item onSelect={()=>documentEditor?.toggleSource()}><Code size={16}/>Sumber Markdown</Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Root>{/if}
        {#if text.trim()}<Button
            variant="ghost"
            size="sm"
            onclick={() => (preview = !preview)}
          >
            {preview ? 'Tulis' : 'Pratinjau'}
          </Button>{/if}
        {#if !format && text.length > textLimit-500}<span class="composer-count">
            {(destination?.publication === 'atproto' ? 6000 : 20000) -
              text.length}
          </span>{/if}
      </div>
    </div>
    {#if compact}<Button
        class="composer-send"
        aria-label="Kirim balasan"
        type="submit"
        size="sm"
        disabled={busy || processing || !hasContent || text.length>textLimit}
      >
        {#if busy}<LoaderCircle size={16} class="animate-spin" />{:else}<ArrowUp
            size={20}
          />{/if}
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
        disabled={busy || processing || !hasContent || !destination || text.length>textLimit}
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
<AlertDialog.Root
  open={!!audiencePending}
  onOpenChange={(open) => {
    if (!open) audiencePending = ''
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Pindahkan tulisan ke ruang publik?</AlertDialog.Title>
      <AlertDialog.Description>
        Semua orang dapat membaca posting di {communities.find(
          (c) => c.id === audiencePending,
        )?.title}. Periksa kembali cerita dan sumber yang boleh dibagikan.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Tetap privat</AlertDialog.Cancel><AlertDialog.Action
        onclick={() => {
          communityId = audiencePending
          lastCommunity = audiencePending
          audiencePending = ''
        }}
      >
        Pindahkan ke publik
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
