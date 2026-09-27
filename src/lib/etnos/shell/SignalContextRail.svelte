<script lang="ts">
  import { page } from '$app/state'
  import { profile } from '$lib/app/auth'
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import { onMount } from 'svelte'
  import {
    ArrowUpRight,
    BookOpen,
    Layers3,
    Radar,
    Search,
    Users,
    Workflow,
  } from '@lucide/svelte'

  type Slot = Snippet<[{ class: ClassValue; style?: string }]>

  interface Props {
    suffix?: Slot
    onSearch?: () => void
  }

  let { suffix, onSearch }: Props = $props()

  type Development = {
    id: number
    title?: { en?: string; id?: string }
    source_count?: number
    article_count?: number
  }

  let watchItems = $state<Development[]>([])
  let watchReady = $state(false)

  const path = $derived(page.url.pathname)
  const follows = $derived(profile.current?.user?.follows?.slice(0, 5) ?? [])
  const showUpstream = $derived(path.startsWith('/post/') || path.startsWith('/c/'))

  onMount(async () => {
    try {
      const r = await fetch('/api/etnos/watch/current?limit=3')
      if (!r.ok) return
      const body = await r.json()
      watchItems = Array.isArray(body?.items) ? body.items : []
      watchReady = true
    } catch {
      watchReady = false
    }
  })

  const titleOf = (d: Development) => d.title?.id || d.title?.en || 'Perkembangan'
</script>

<div class="context-rail">
  <button class="context-search" type="button" onclick={onSearch}>
    <Search size={15} />
    <span>Cari ETNOS</span>
    <kbd>⌘K</kbd>
  </button>

  {#if showUpstream}
    <div class="context-upstream">
      {@render suffix?.({ class: 'signal-upstream-context' })}
    </div>
  {/if}

  {#if path === '/'}
    <section class="context-section">
      <div class="context-head"><span>Sekarang</span><a href="/explore/watch">Pantauan</a></div>
      {#if watchReady && watchItems.length}
        <div class="context-list">
          {#each watchItems as item}
            <a class="context-item context-story" href={`/explore/watch/${item.id}`}>
              <strong>{titleOf(item)}</strong>
              <small>{item.source_count ?? item.article_count ?? 0} sumber</small>
            </a>
          {/each}
        </div>
      {:else}
        <a class="context-empty" href="/explore/watch">Buka perkembangan dari Watch <ArrowUpRight size={13} /></a>
      {/if}
    </section>

    <section class="context-section">
      <div class="context-head"><span>Mengikuti</span><a href="/explore/communities">Kelola</a></div>
      {#if follows.length}
        <div class="context-list">
          {#each follows as follow}
            <a class="context-item" href={`/c/${encodeURIComponent(follow.community.name)}`}>
              <strong>{follow.community.title || follow.community.name}</strong>
              <small>c/{follow.community.name}</small>
            </a>
          {/each}
        </div>
      {:else}
        <a class="context-empty" href="/explore/communities">Temukan komunitas untuk diikuti <Users size={13} /></a>
      {/if}
    </section>
  {:else if path.startsWith('/explore/watch')}
    <section class="context-section context-callout">
      <div class="context-icon"><Radar size={16} /></div>
      <span class="context-kicker">Mode bukti</span>
      <strong>Pantauan adalah lapisan evidence, bukan feed sosial.</strong>
      <p>Perkembangan diringkas dari sumber Watch; sumber aslinya tetap terlihat di detail.</p>
    </section>
    <section class="context-section">
      <div class="context-head"><span>Terkait</span></div>
      <a class="context-link" href="/explore/pantauan"><Radar size={14} /><span>Peta sinyal</span></a>
      <a class="context-link" href="/wiki"><BookOpen size={14} /><span>Pengetahuan</span></a>
    </section>
  {:else if path.startsWith('/work')}
    <section class="context-section context-callout">
      <div class="context-icon"><Workflow size={16} /></div>
      <span class="context-kicker">PublicWork</span>
      <strong>Kerja manusia dan agen bertemu di artefak publik.</strong>
      <p>Preview ini hanya menampilkan grammar. Eksekusi A2A tetap privat sampai proyeksi publiknya aman.</p>
    </section>
  {:else if path.startsWith('/wiki')}
    <section class="context-section context-callout">
      <div class="context-icon"><BookOpen size={16} /></div>
      <span class="context-kicker">Pengetahuan</span>
      <strong>Artikel harus terhubung kembali ke percakapan dan bukti.</strong>
      <p>Wiki adalah memori publik, bukan jalur sosial kedua.</p>
    </section>
  {:else}
    <section class="context-section">
      <div class="context-head"><span>Jelajah</span></div>
      <a class="context-link" href="/explore/communities"><Users size={14} /><span>Komunitas</span></a>
      <a class="context-link" href="/explore/feeds"><Layers3 size={14} /><span>Feed</span></a>
      <a class="context-link" href="/explore/watch"><Radar size={14} /><span>Pantauan</span></a>
      <a class="context-link" href="/wiki"><BookOpen size={14} /><span>Pengetahuan</span></a>
      <a class="context-link" href="/work"><Workflow size={14} /><span>Kerja publik</span></a>
    </section>
  {/if}

  <footer class="context-footer">
    <span>ETNOS</span>
    <span>federated public square</span>
  </footer>
</div>

<style>
  .context-rail { display: flex; flex-direction: column; gap: 2px; }
  .context-search {
    width: 100%; min-height: 40px; display: grid; grid-template-columns: auto 1fr auto;
    gap: 8px; align-items: center; padding: 8px 10px; border: 1px solid var(--etnos-line);
    border-radius: 10px; background: color-mix(in srgb, var(--etnos-panel) 76%, transparent);
    color: var(--etnos-muted); text-align: left; font-size: .74rem;
  }
  .context-search:hover { border-color: var(--etnos-line-strong); color: var(--etnos-ink); }
  .context-search kbd { font: 600 9px/1 ui-monospace, monospace; border: 1px solid var(--etnos-line); border-radius: 5px; padding: 3px 4px; }
  .context-section { padding: 17px 0; border-bottom: 1px solid var(--etnos-line); }
  .context-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 7px; }
  .context-head > span, .context-kicker { color: var(--etnos-muted-2); font-size: .56rem; font-weight: 720; letter-spacing: .14em; text-transform: uppercase; }
  .context-head a { color: var(--etnos-muted); font-size: .62rem; text-decoration: none; }
  .context-head a:hover { color: var(--etnos-ink); }
  .context-list { display: flex; flex-direction: column; }
  .context-item { display: flex; flex-direction: column; gap: 3px; padding: 8px 7px; border-radius: 9px; color: var(--etnos-ink); text-decoration: none; }
  .context-item:hover { background: color-mix(in srgb, var(--etnos-ink) 5%, transparent); }
  .context-item strong { font-size: .76rem; line-height: 1.28; font-weight: 590; }
  .context-item small { color: var(--etnos-muted-2); font-size: .61rem; }
  .context-story strong { font-family: 'Instrument Serif', Georgia, serif; font-size: .92rem; font-weight: 400; letter-spacing: -.01em; }
  .context-empty { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--etnos-muted); font-size: .7rem; text-decoration: none; padding: 7px; }
  .context-link { display: grid; grid-template-columns: 20px 1fr; gap: 6px; align-items: center; min-height: 35px; padding: 6px 7px; border-radius: 8px; color: var(--etnos-muted); text-decoration: none; font-size: .73rem; }
  .context-link:hover { color: var(--etnos-ink); background: color-mix(in srgb, var(--etnos-ink) 5%, transparent); }
  .context-callout { display: grid; grid-template-columns: 24px 1fr; gap: 5px 8px; }
  .context-icon { grid-row: 1 / span 3; width: 24px; height: 24px; display: grid; place-items: center; border: 1px solid var(--etnos-line); border-radius: 7px; color: var(--etnos-accent); }
  .context-callout strong { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.05rem; line-height: 1.08; font-weight: 400; }
  .context-callout p { margin: 2px 0 0; color: var(--etnos-muted); font-size: .68rem; line-height: 1.48; }
  .context-upstream { padding: 10px 0 4px; border-bottom: 1px solid var(--etnos-line); }
  :global(.signal-upstream-context) { width: 100% !important; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; }
  .context-footer { display: flex; justify-content: space-between; gap: 8px; padding-top: 16px; color: var(--etnos-muted-2); font-size: .56rem; }
</style>
