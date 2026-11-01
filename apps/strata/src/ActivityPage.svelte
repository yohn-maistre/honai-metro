<script lang="ts">
  import { untrack } from 'svelte'
  import {
    Bell,
    CheckCheck,
    MessageCircle,
    MessageSquare,
    BookOpen,
    Users,
    RefreshCw,
    Check,
    LoaderCircle,
  } from '@lucide/svelte'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    request,
    relativeDate,
    type Auth,
    type ActivityInbox,
    type ActivityItem,
  } from './api'
  let {
    auth,
    navigate,
    onError,
    onUnread,
  }: {
    auth: Auth
    navigate: (s: string) => void
    onError: (s: string) => void
    onUnread: (n: number) => void
  } = $props()
  let inbox = $state<ActivityInbox>({ items: [], unread: 0, window: 100 }),
    loading = $state(true),
    busy = $state(false),
    error = $state(''),
    tab = $state('all')
  const display = $derived(
    tab === 'unread' ? inbox.items.filter((i) => !i.read) : inbox.items,
  )
  let generation = 0
  async function load() {
    const mine = ++generation
    if (!auth.actor) {
      loading = false
      return
    }
    loading = true
    error = ''
    try {
      const data = await request<ActivityInbox>('/v1/notifications')
      if (mine !== generation) return
      inbox = data
      onUnread(data.unread)
    } catch (e) {
      if (mine === generation)
        error = e instanceof Error ? e.message : 'Aktivitas belum dapat dimuat.'
    } finally {
      if (mine === generation) loading = false
    }
  }
  $effect(() => {
    const id = auth.actor?.id
    untrack(() => {
      if (id) void load()
      else loading = false
    })
    return () => {
      generation++
    }
  })
  async function mark(ids: string[]) {
    if (busy) return
    busy = true
    try {
      inbox = await request<ActivityInbox>('/v1/notifications/read', { ids })
      onUnread(inbox.unread)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Belum tersimpan.')
      await load()
    } finally {
      busy = false
    }
  }
  async function open(item: ActivityItem) {
    if (!item.read) await mark([item.id])
    navigate(item.href)
  }
</script>

<div class="cx-page-head">
  <h1>Aktivitas</h1>
  <div class="cx-actions">
    <Button
      variant="ghost"
      size="icon"
      aria-label="Muat ulang aktivitas"
      onclick={load}
      disabled={loading}
    >
      <RefreshCw size={17} />
    </Button>{#if inbox.unread}<Button
        variant="ghost"
        size="icon"
        aria-label="Tandai semua dibaca"
        disabled={busy}
        onclick={() =>
          mark(inbox.items.filter((i) => !i.read).map((i) => i.id))}
      >
        <CheckCheck size={19} />
      </Button>{/if}
  </div>
</div>
{#if !auth.actor}<div class="strata-nodata">
    <Bell size={26} />
    <h2>Aktivitasmu di satu tempat</h2>
    <p>Masuk untuk melihat balasan, tinjauan dan keputusan keanggotaan.</p>
    <Button href="/login">Masuk</Button>
  </div>
{:else}
  <Tabs.Root bind:value={tab}>
    <Tabs.List variant="line" class="page-tabs" aria-label="Filter aktivitas">
      <Tabs.Trigger value="all">Semua</Tabs.Trigger><Tabs.Trigger
        value="unread"
      >
        Belum dibaca{#if inbox.unread}<span class="activity-count">
            {inbox.unread}
          </span>{/if}
      </Tabs.Trigger>
    </Tabs.List>
  </Tabs.Root>
  {#if loading}<div class="strata-card strata-inline" role="status">
      <LoaderCircle class="animate-spin" size={18} />Memuat aktivitas…
    </div>{:else if error}<div class="strata-card">
      <p role="alert">{error}</p>
      <Button variant="outline" onclick={load}>Coba lagi</Button>
    </div>{:else if !display.length}<div class="strata-nodata">
      <CheckCheck size={26} />
      <h2>
        {tab === 'unread' ? 'Sudah terbaca semua' : 'Belum ada aktivitas'}
      </h2>
      <p>Balasan dan hal yang perlu ditinjau akan muncul di sini.</p>
    </div>{:else}
    {#each display as item}<Card.Root
        class={'activity-row' + (!item.read ? ' unread' : '')}
      >
        <a
          href={item.href}
          class="activity-link"
          onclick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void open(item)
          }}
        >
          <span class="activity-icon">
            {#if item.kind.startsWith('dm-')}<MessageSquare
                size={20}
              />{:else if item.kind === 'reply'}<MessageCircle
                size={20}
              />{:else if item.kind.startsWith('wiki')}<BookOpen
                size={20}
              />{:else}<Users size={20} />{/if}
          </span>
          <span>
            <strong>{item.detail}</strong>
            <span class="activity-title">{item.title}</span>
            <small>{relativeDate(item.created)}</small>
          </span>
        </a>
        {#if !item.read}<Button
            variant="ghost"
            size="icon"
            aria-label="Tandai dibaca"
            disabled={busy}
            onclick={() => mark([item.id])}
          >
            <Check size={17} />
          </Button>{/if}
      </Card.Root>{/each}
    {#if inbox.items.length === inbox.window}<p class="strata-card cx-hint">
        Menampilkan {inbox.window} aktivitas terbaru yang dapat kamu akses.
      </p>{/if}
  {/if}{/if}
