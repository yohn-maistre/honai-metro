<script lang="ts">
  import { onMount, onDestroy, untrack, tick } from 'svelte'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import {
    MessageSquare,
    Plus,
    LockKeyhole,
    KeyRound,
    ArrowLeft,
    RefreshCw,
    Send,
    ShieldCheck,
    LoaderCircle,
    Ellipsis,
    UserRoundX,
    Check,
    X,
  } from '@lucide/svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { request, initials, relativeDate, type Auth } from './api'
  import * as crypto from './messaging/crypto'
  import * as vault from './messaging/vault'
  import type { DmThread, DmMessage, DeviceState } from './messaging/types'
  let {
    auth,
    path,
    search,
    navigate,
  }: {
    auth: Auth
    path: string
    search: string
    navigate: (s: string) => void
  } = $props()
  let device = $state<DeviceState | null>(null),
    threads = $state<DmThread[]>([]),
    selected = $state<DmThread | null>(null),
    messages = $state<(vault.LocalMessage & { text: string })[]>([]),
    loading = $state(true),
    busy = $state(false),
    unlocked = $state(false),
    localExists = $state(false),
    error = $state(''),
    passphrase = $state(''),
    confirmation = $state(''),
    consent = $state(false),
    draft = $state(''),
    showNew = $state(false),
    showKeys = $state(false),
    safetyCode = $state(''),
    contactQuery = $state(''),
    contacts = $state<{ id: string; name: string; did: string }[]>([]),
    contactSearched = $state(false),
    pending = $state(false),
    closeKind = $state<'close' | 'block' | null>(null)
  let mountedActor: string | undefined
  let generation = 0
  let scroller = $state<HTMLDivElement>(),
    messageLimit = $state(100)
  const id = $derived(path.split('/')[2]),
    recipient = $derived(new SvelteURLSearchParams(search).get('to')),
    peer = $derived(selected?.participants.find((p) => p.id !== auth.actor?.id))
  async function guarded(fn: () => Promise<void>) {
    if (busy) return
    busy = true
    error = ''
    try {
      await fn()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Pesan belum dapat diproses.'
    } finally {
      busy = false
    }
  }
  async function load() {
    if (!auth.actor) {
      loading = false
      return
    }
    const mine = ++generation,
      selectedId = id
    loading = true
    try {
      const [state, list] = await Promise.all([
        request<DeviceState>('/v1/dm/me'),
        request<DmThread[]>('/v1/dm/threads'),
      ])
      if (mine !== generation) return
      device = state
      threads = list
      localExists = await vault.exists(auth.actor.id)
      const chosen = selectedId
        ? await request<DmThread>('/v1/dm/threads/' + selectedId)
        : null
      if (mine !== generation) return
      selected = chosen
      messages = []
      pending = false
      if (unlocked && selected) await sync()
    } catch (e) {
      if (mine === generation)
        error = e instanceof Error ? e.message : 'Pesan belum dapat dimuat.'
    } finally {
      if (mine === generation) loading = false
    }
  }
  $effect(() => {
    const route = path,
      account = auth.actor?.id
    untrack(() => {
      if (mountedActor !== account) {
        vault.lock()
        mountedActor = account
      }
      if (route && account) void load()
      else loading = false
    })
    return () => {
      generation++
    }
  })
  function locked() {
    unlocked = false
    messages = []
    draft = ''
    passphrase = ''
    confirmation = ''
    pending = false
  }
  onMount(() => {
    window.addEventListener('strata-dm-locked', locked)
    return () => window.removeEventListener('strata-dm-locked', locked)
  })
  onDestroy(() => vault.lock())
  async function setup() {
    await guarded(async () => {
      if (!auth.actor) return
      if (localExists) {
        const v = await vault.unlock(auth.actor.id, passphrase)
        if (device?.device && v.deviceId !== device.device.id) {
          vault.lock()
          throw Error('Kunci perangkat tidak cocok.')
        }
        unlocked = true
        passphrase = ''
        await registerPending()
        await load()
        return
      }
      if (device?.device)
        throw Error(
          'Kunci berada di browser yang digunakan saat menyiapkan pesan. Tidak ada pemulihan atau penggantian kunci otomatis.',
        )
      if (!consent || passphrase !== confirmation)
        throw Error(
          'Konfirmasi frasa sandi dan batas pemulihan terlebih dahulu.',
        )
      const pair = await crypto.signingKeys(),
        deviceId = globalThis.crypto.randomUUID(),
        packages: Record<string, crypto.Package> = {}
      for (let i = 0; i < 8; i++) {
        const p = await crypto.keyPackage(auth.actor.id, deviceId, pair)
        packages[p.id] = p
      }
      const registration = Object.values(packages).map((p) => ({
        id: p.id,
        data: p.data,
      }))
      await vault.create(auth.actor.id, passphrase, {
        actorId: auth.actor.id,
        deviceId,
        pair,
        packages,
        threads: {},
        registration,
      })
      unlocked = true
      passphrase = ''
      confirmation = ''
      await registerPending()
      await load()
    })
  }
  async function registerPending() {
    const v = vault.current()
    if (!v.registration) return
    await request('/v1/dm/device', {
      deviceId: v.deviceId,
      signatureKey: v.pair.publicKey,
      packages: v.registration,
    })
    delete v.registration
    await vault.save()
  }
  async function replenish() {
    await guarded(async () => {
      const v = vault.current(),
        fresh = []
      for (let i = 0; i < 8; i++) {
        const p = await crypto.keyPackage(v.actorId, v.deviceId, v.pair)
        v.packages[p.id] = p
        fresh.push({ id: p.id, data: p.data })
      }
      v.registration = fresh
      await vault.save()
      await registerPending()
      await load()
    })
  }
  async function begin(target: string) {
    await guarded(async () => {
      const v = vault.current(),
        prior = threads.find(
          (t) =>
            t.state !== 'closed' && t.participants.some((p) => p.id === target),
        )
      if (prior) {
        showNew = false
        navigate('/messages/' + prior.id)
        return
      }
      const t = await request<DmThread & { keyPackage: string }>(
          '/v1/dm/requests',
          {
            recipientId: target,
            deviceId: v.deviceId,
            requestKey: globalThis.crypto.randomUUID(),
          },
        ),
        own = await crypto.keyPackage(v.actorId, v.deviceId, v.pair),
        session = await crypto.initiate(t.id, own, t.keyPackage, t.participants)
      v.threads[t.id] = {
        state: session.state,
        pins: t.participants,
        seen: 0,
        texts: {},
        welcome: session.welcome,
      }
      await vault.save()
      await request('/v1/dm/threads/' + t.id + '/start', {
        deviceId: v.deviceId,
        welcome: session.welcome,
      })
      showNew = false
      navigate('/messages/' + t.id)
    })
  }
  async function resume() {
    await guarded(async () => {
      if (!selected) return
      const v = vault.current(),
        local = v.threads[selected.id]
      if (!local?.welcome)
        throw Error(
          'Permintaan ini tidak dapat dilanjutkan dari perangkat ini. Tutup lalu mulai lagi.',
        )
      await request('/v1/dm/threads/' + selected.id + '/start', {
        deviceId: v.deviceId,
        welcome: local.welcome,
      })
      await load()
    })
  }
  async function acceptRequest() {
    await guarded(async () => {
      const t = selected
      if (!t?.welcome) return
      const v = vault.current()
      let local = v.threads[t.id]
      if (!local) {
        const p = v.packages[t.package_id]
        if (!p) throw Error('Kunci undangan tidak ada di perangkat ini.')
        const state = await crypto.accept(t.id, t.welcome, p, t.participants)
        local = v.threads[t.id] = {
          state,
          pins: t.participants,
          seen: 0,
          texts: {},
        }
        delete v.packages[t.package_id]
        await vault.save()
      }
      await request('/v1/dm/threads/' + t.id + '/decide', {
        deviceId: v.deviceId,
        accept: true,
      })
      await load()
    })
  }
  async function sync(t = selected) {
    if (!t || !auth.actor) return
    const v = vault.current(),
      local = v.threads[t.id]
    if (!local) {
      if (t.state === 'active' || t.state === 'closed')
        throw Error('Kunci percakapan tidak ada di perangkat ini.')
      return
    }
    if (
      JSON.stringify(
        local.pins.map((p) => [p.id, p.deviceId, p.signatureKey]),
      ) !==
      JSON.stringify(
        t.participants.map((p) => [p.id, p.deviceId, p.signatureKey]),
      )
    )
      throw Error('Kunci peserta berubah. Percakapan dihentikan.')
    let after = local.seen,
      more = true
    while (more) {
      const page = await request<{ items: DmMessage[]; next: number | null }>(
        '/v1/dm/threads/' + t.id + '/messages?after=' + after,
      )
      for (const envelope of page.items) {
        if (envelope.sender_id === v.actorId) {
          if (!(envelope.client_id in local.texts))
            throw Error('Riwayat pengirim tidak cocok dengan kunci lokal.')
        } else {
          const decoded = await crypto.decrypt(
            local.state,
            local.pins,
            t.id,
            t.participants.find((p) => p.id !== v.actorId)!.id,
            envelope.ciphertext,
          )
          if (vault.current() !== v) throw Error('Kunci pesan telah ditutup.')
          local.state = decoded.state
          local.texts[envelope.client_id] = decoded.text
        }
        local.seen = envelope.version
        ;(local.rows ??= []).push({
          id: envelope.id,
          thread_id: envelope.thread_id,
          sender_id: envelope.sender_id,
          client_id: envelope.client_id,
          version: envelope.version,
          created: envelope.created,
        })
        after = envelope.version
      }
      if (page.items.length) await vault.save()
      more = page.next !== null
    }
    if (vault.current() !== v || selected?.id !== t.id) return
    messages = (local.rows ?? []).map((m) => ({
      ...m,
      text: local.texts[m.client_id] ?? '',
    }))
    pending = !!local.pending
    await request('/v1/dm/threads/' + t.id + '/read', { version: local.seen })
    await tick()
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' })
  }
  async function flush(t = selected) {
    if (!t) return
    const v = vault.current(),
      local = v.threads[t.id]
    if (!local.pending) return
    await request('/v1/dm/threads/' + t.id + '/messages', {
      deviceId: v.deviceId,
      clientId: local.pending.clientId,
      ciphertext: local.pending.ciphertext,
    })
    delete local.pending
    await vault.save()
    await load()
  }
  async function send() {
    await guarded(async () => {
      const t = selected
      if (!t) return
      const v = vault.current(),
        local = v.threads[t.id],
        body = draft
      if (local.pending) {
        await flush(t)
        return
      }
      await sync(t)
      if (selected?.id !== t.id || vault.current() !== v)
        throw Error('Percakapan berubah; pesan belum dikirim.')
      const result = await crypto.encrypt(
          local.state,
          local.pins,
          t.id,
          v.actorId,
          body,
        ),
        clientId = globalThis.crypto.randomUUID()
      if (selected?.id !== t.id || vault.current() !== v)
        throw Error('Percakapan berubah; pesan belum dikirim.')
      local.state = result.state
      local.texts[clientId] = body
      local.pending = { clientId, ciphertext: result.ciphertext, text: body }
      await vault.save()
      pending = true
      draft = ''
      await flush(t)
    })
  }
  async function closeThread() {
    await guarded(async () => {
      if (!selected) return
      await request('/v1/dm/threads/' + selected.id + '/close', {
        block: closeKind === 'block',
      })
      closeKind = null
      await load()
    })
  }
  async function searchContacts() {
    await guarded(async () => {
      contacts = await request(
        '/v1/dm/contacts?q=' + encodeURIComponent(contactQuery),
      )
      contactSearched = true
    })
  }
</script>

<svelte:document
  onvisibilitychange={() => {
    if (document.visibilityState === 'hidden') vault.lock()
  }}
/>
<div class="cx-page-head">
  <h1>Pesan</h1>
  <div class="cx-actions">
    {#if unlocked}<Button
        variant="ghost"
        size="icon"
        aria-label="Kunci pesan"
        onclick={() => vault.lock()}
      >
        <LockKeyhole size={18} />
      </Button><Button
        variant="ghost"
        size="icon"
        aria-label="Pesan baru"
        onclick={() => {
          showNew = true
          contacts = []
          contactSearched = false
        }}
      >
        <Plus size={19} />
      </Button>{/if}<Button
      variant="ghost"
      size="icon"
      aria-label="Perbarui pesan"
      disabled={busy || loading}
      onclick={() => guarded(load)}
    >
      <RefreshCw size={17} />
    </Button>
  </div>
</div>
{#if !auth.actor}<div class="strata-nodata">
    <MessageSquare size={26} />
    <h2>Pesan antar pengguna</h2>
    <p>Masuk untuk membuka percakapan privat.</p>
    <Button href="/login">Masuk</Button>
  </div>
{:else if loading && !device}<div
    class="strata-card strata-inline"
    role="status"
  >
    <LoaderCircle size={18} class="animate-spin" />Memuat pesan…
  </div>
{:else if !unlocked}
  <div class="strata-narrow">
    <Card.Root>
      <Card.Header>
        <KeyRound size={24} class="text-primary mb-2" /><Card.Title>
          {localExists ? 'Buka kunci pesan' : 'Siapkan pesan'}
        </Card.Title><Card.Description>
          DM terenkripsi · Eksperimental
        </Card.Description>
      </Card.Header><Card.Content>
        {#if device?.device && !localExists}<p class="cx-hint">
            Kunci pesan ada di browser yang digunakan saat aktivasi. Masuk di
            sana untuk membaca pesan. Penggantian perangkat belum tersedia.
          </p>{:else}<form
            class="cx-form"
            onsubmit={(e) => {
              e.preventDefault()
              setup()
            }}
          >
            <Label for="dm-passphrase">Frasa kunci pesan</Label><Input
              id="dm-passphrase"
              type="password"
              bind:value={passphrase}
              minlength={16}
              autocomplete={localExists ? 'current-password' : 'new-password'}
              required
            />{#if !localExists}<Label for="dm-passphrase-confirm">
                Ulangi frasa kunci
              </Label><Input
                id="dm-passphrase-confirm"
                type="password"
                bind:value={confirmation}
                minlength={16}
                autocomplete="new-password"
                required
              />
              <p class="cx-hint">
                Gunakan minimal 16 karakter. Frasa ini hanya membuka kunci di
                browser ini dan tidak dikirim ke server.
              </p>
              <div class="strata-inline items-start">
                <Checkbox id="dm-consent" bind:checked={consent} /><Label
                  for="dm-consent"
                  class="flex-1 text-sm leading-relaxed"
                >
                  Saya paham: kehilangan frasa atau data browser berarti
                  kehilangan akses pesan. Fitur ini belum diaudit; jangan
                  gunakan untuk informasi sensitif.
                </Label>
              </div>{/if}<Button
              type="submit"
              disabled={busy || (!localExists && !consent)}
            >
              {#if busy}<LoaderCircle
                  size={16}
                  class="animate-spin"
                />{/if}{localExists ? 'Buka pesan' : 'Aktifkan pesan'}
            </Button>
          </form>{/if}
      </Card.Content>
    </Card.Root>
  </div>
{:else if selected}
  <div class="dm-thread-head">
    <Button
      href="/messages"
      variant="ghost"
      size="icon"
      aria-label="Kembali ke pesan"
    >
      <ArrowLeft size={18} />
    </Button><Avatar.Root>
      <Avatar.Fallback>{initials(peer?.name ?? '?')}</Avatar.Fallback>
    </Avatar.Root>
    <div class="dm-peer">
      <h2>{peer?.name}</h2>
      <small>DM terenkripsi · eksperimental</small>
    </div>
    <Dropdown.Root>
      <Dropdown.Trigger class="dm-more" aria-label="Opsi percakapan">
        <Ellipsis size={18} />
      </Dropdown.Trigger><Dropdown.Content align="end">
        <Dropdown.Item
          onSelect={() =>
            guarded(async () => {
              safetyCode = await crypto.fingerprint(selected!.participants)
              showKeys = true
            })}
        >
          <ShieldCheck size={16} />Kode keamanan
        </Dropdown.Item><Dropdown.Separator /><Dropdown.Item
          onSelect={() => (closeKind = 'close')}
        >
          Tutup percakapan
        </Dropdown.Item><Dropdown.Item onSelect={() => (closeKind = 'block')}>
          <UserRoundX size={16} />Blokir pengguna
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  </div>
  {#if selected.state === 'preparing'}<div class="strata-card">
      <p>Permintaan belum selesai dikirim.</p>
      {#if !selected.incoming}<Button disabled={busy} onclick={resume}>
          Lanjutkan permintaan
        </Button>{/if}
    </div>
  {:else if selected.state === 'pending'}<div class="strata-card">
      {#if selected.incoming}<h2>Permintaan pesan</h2>
        <p class="cx-hint">
          Terima untuk membuka percakapan dengan {peer?.name}.
        </p>
        <div class="cx-actions">
          <Button disabled={busy} onclick={acceptRequest}>
            <Check size={16} />Terima
          </Button><Button
            variant="outline"
            onclick={() => (closeKind = 'close')}
          >
            <X size={16} />Tolak
          </Button>
        </div>{:else}<p class="cx-hint">
          Menunggu {peer?.name} menerima permintaan.
        </p>{/if}
    </div>
  {:else}
    {#if selected.state === 'closed'}<p class="dm-closed">
        Percakapan ditutup. Pesan baru tidak dapat dikirim.
      </p>{/if}
    <div bind:this={scroller} class="dm-messages" aria-label="Percakapan">
      {#if messages.length > messageLimit}<Button
          variant="ghost"
          onclick={() => (messageLimit += 100)}
        >
          Pesan sebelumnya
        </Button>{/if}{#each messages.slice(-messageLimit) as message}<article
          class:own={message.sender_id === auth.actor.id}
          class="dm-bubble"
        >
          <p>{message.text}</p>
          <small>{relativeDate(message.created)}</small>
        </article>{/each}{#if !messages.length}<div class="strata-nodata">
          <MessageSquare size={24} />
          <h2>Mulai percakapan</h2>
        </div>{/if}
    </div>
    {#if selected.state === 'active'}<form
        class="dm-composer"
        onsubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <Label for="dm-draft" class="sr-only">Tulis pesan</Label><Textarea
          id="dm-draft"
          bind:value={draft}
          placeholder="Tulis pesan…"
          rows={3}
          maxlength={6000}
          disabled={pending}
          required={!pending}
        />
        <div class="cx-between">
          <span class="cx-hint">
            {pending
              ? 'Belum dikonfirmasi server'
              : 'Hanya peserta yang memiliki kunci pesan'}
          </span>
          <Button type="submit" disabled={busy || (!pending && !draft.trim())}>
            {#if busy}<LoaderCircle
                size={16}
                class="animate-spin"
              />{:else}<Send size={16} />{/if}{pending
              ? 'Kirim ulang'
              : 'Kirim'}
          </Button>
        </div>
      </form>{/if}
  {/if}
{:else}
  {#if recipient}<div class="strata-card">
      <p>Mulai percakapan dengan pengguna ini?</p>
      <Button disabled={busy} onclick={() => begin(recipient)}>
        Kirim permintaan pesan
      </Button>
    </div>{/if}
  {#if device && device.availablePackages < 4}<div class="dm-refill">
      <p class="cx-hint">
        Isi ulang kunci agar orang lain dapat memulai percakapan.
      </p>
      <Button variant="outline" disabled={busy} onclick={replenish}>
        Isi ulang kunci
      </Button>
    </div>{/if}
  {#each threads as thread}{@const other = thread.participants.find(
      (p) => p.id !== auth.actor?.id,
    )}<Card.Root class="dm-inbox-row">
      <a href={'/messages/' + thread.id}>
        <Avatar.Root>
          <Avatar.Fallback>{initials(other?.name ?? '?')}</Avatar.Fallback>
        </Avatar.Root>
        <span>
          <strong>{other?.name}</strong>
          <small>
            {thread.state === 'pending'
              ? thread.incoming
                ? 'Permintaan pesan'
                : 'Menunggu diterima'
              : thread.state === 'preparing'
                ? 'Permintaan belum selesai'
                : thread.state === 'closed'
                  ? 'Percakapan ditutup'
                  : 'Pesan terenkripsi'}
          </small>
        </span>
        {#if thread.version > thread.readVersion}<span
            class="unread-dot"
            aria-label="Belum dibaca"
          ></span>{/if}
        <small>{relativeDate(thread.updated)}</small>
      </a>
    </Card.Root>{/each}
  {#if !threads.length && !loading}<div class="strata-nodata">
      <MessageSquare size={26} />
      <h2>Belum ada pesan</h2>
      <p>
        Mulai dari profil pengguna atau cari pengguna yang sudah mengaktifkan
        pesan.
      </p>
      <Button onclick={() => (showNew = true)}>
        <Plus size={16} />Pesan baru
      </Button>
    </div>{/if}
{/if}
{#if error && !showNew}<div class="strata-card">
    <p role="alert" class="cx-form-error">{error}</p>
  </div>{/if}
<Dialog.Root bind:open={showNew}>
  <Dialog.Content class="platform-dialog">
    <Dialog.Header>
      <Dialog.Title>Pesan baru</Dialog.Title><Dialog.Description>
        Cari pengguna yang sudah mengaktifkan pesan.
      </Dialog.Description>
    </Dialog.Header>
    <form
      class="cx-form"
      onsubmit={(e) => {
        e.preventDefault()
        searchContacts()
      }}
    >
      <Label for="dm-contact">Nama pengguna</Label><Input
        id="dm-contact"
        bind:value={contactQuery}
        minlength={2}
        maxlength={100}
        required
      /><Button type="submit" variant="outline" disabled={busy}>Cari</Button>
    </form>
    {#each contacts as contact}<Button
        variant="ghost"
        class="dm-contact"
        aria-label={'Kirim pesan ke ' + contact.name}
        disabled={busy}
        onclick={() => begin(contact.id)}
      >
        <Avatar.Root>
          <Avatar.Fallback>{initials(contact.name)}</Avatar.Fallback>
        </Avatar.Root>
        <span>{contact.name}</span>
      </Button>{/each}{#if contactSearched && !contacts.length}<p
        class="cx-hint"
      >
        Tidak ada pengguna yang tersedia.
      </p>{/if}{#if error}<p role="alert" class="cx-form-error">{error}</p>{/if}
  </Dialog.Content>
</Dialog.Root>
<Dialog.Root bind:open={showKeys}>
  <Dialog.Content class="platform-dialog">
    <Dialog.Header>
      <Dialog.Title>Kode keamanan</Dialog.Title><Dialog.Description>
        Bandingkan kode yang sama dengan {peer?.name} melalui saluran lain.
      </Dialog.Description>
    </Dialog.Header>
    <code class="dm-safety-code">{safetyCode}</code>
    <p class="cx-hint">
      Kode ini mengikat kunci kedua peserta di perangkat ini. Ini tidak
      memverifikasi identitas hukum seseorang.
    </p>
  </Dialog.Content>
</Dialog.Root>
<AlertDialog.Root
  open={closeKind !== null}
  onOpenChange={(v) => {
    if (!v) closeKind = null
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>
        {closeKind === 'block' ? 'Blokir pengguna?' : 'Tutup percakapan?'}
      </AlertDialog.Title><AlertDialog.Description>
        Pesan lama tetap dapat dibaca oleh peserta. {closeKind === 'block'
          ? 'Pengguna ini tidak dapat memulai percakapan baru denganmu.'
          : 'Tidak ada pesan baru yang dapat dikirim di percakapan ini.'}
      </AlertDialog.Description>
    </AlertDialog.Header><AlertDialog.Footer>
      <AlertDialog.Cancel>Batal</AlertDialog.Cancel><Button
        disabled={busy}
        onclick={closeThread}
      >
        {closeKind === 'block' ? 'Blokir' : 'Tutup percakapan'}
      </Button>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
