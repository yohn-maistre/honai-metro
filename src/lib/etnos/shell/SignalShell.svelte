<script lang="ts">
  import { page } from '$app/state'
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import {
    Bell,
    BookOpen,
    Bookmark,
    Compass,
    Home,
    Inbox,
    Layers3,
    Menu,
    Plus,
    Radar,
    Search,
    Users,
    Workflow,
  } from '@lucide/svelte'
  import GlobalCommand from './GlobalCommand.svelte'
  import SignalContextRail from './SignalContextRail.svelte'
  import './signal-theme.css'

  type Slot = Snippet<[{ class: ClassValue; style?: string }]>

  interface Props {
    children?: Snippet
    sidebar?: Slot
    main?: Slot
    suffix?: Slot
  }

  let { children, sidebar, main, suffix }: Props = $props()
  let menuOpen = $state(false)
  let commandOpen = $state(false)

  const path = $derived(page.url.pathname)
  const mode = $derived(
    path === '/'
      ? 'home'
      : path.startsWith('/post/')
        ? 'thread'
        : path.startsWith('/explore/watch')
          ? 'watch'
          : path.startsWith('/explore')
            ? 'explore'
            : path.startsWith('/wiki')
              ? 'wiki'
              : path.startsWith('/work')
                ? 'work'
                : 'default',
  )

  const locationLabel = $derived(
    mode === 'home'
      ? 'Beranda'
      : mode === 'thread'
        ? 'Diskusi'
        : mode === 'watch'
          ? 'Pantauan'
          : mode === 'explore'
            ? 'Jelajah'
            : mode === 'wiki'
              ? 'Pengetahuan'
              : mode === 'work'
                ? 'Kerja publik'
                : 'ETNOS',
  )

  function selected(href: string) {
    if (href === '/') return path === '/'
    return path === href || path.startsWith(`${href}/`)
  }

  $effect(() => {
    void path
    menuOpen = false
  })
</script>

{@render children?.()}
<GlobalCommand bind:open={commandOpen} />

<div class="signal-shell-root" data-mode={mode}>
  <aside class="signal-left" aria-label="Navigasi utama">
    <a class="signal-brand" href="/" aria-label="ETNOS Beranda">
      <span class="signal-mark" aria-hidden="true"><i></i><b></b></span>
      <span class="signal-brand-word">etnos.</span>
    </a>

    <nav class="signal-nav signal-nav-primary">
      <a href="/" class:active={selected('/')} title="Beranda"><Home /><strong>Beranda</strong></a>
      <a href="/explore" class:active={selected('/explore')} title="Jelajah"><Compass /><strong>Jelajah</strong></a>
      <a href="/explore/communities" class:active={selected('/explore/communities')} title="Komunitas"><Users /><strong>Komunitas</strong></a>
      <a href="/saved" class:active={selected('/saved')} title="Tersimpan"><Bookmark /><strong>Tersimpan</strong></a>
      <a href="/inbox" class:active={selected('/inbox')} title="Aktivitas"><Inbox /><strong>Aktivitas</strong></a>
    </nav>

    <a class="signal-create" href="/create" title="Buat"><Plus /><strong>Buat</strong></a>

    <div class="signal-rail-section">
      <span class="signal-rail-label">Ruang saya</span>
      <nav class="signal-nav">
        <a href="/explore/feeds" class:active={selected('/explore/feeds')} title="Feed"><Layers3 /><strong>Feed</strong></a>
        <a href="/explore/topics" class:active={selected('/explore/topics')} title="Kategori"><Compass /><strong>Kategori</strong></a>
      </nav>
    </div>

    <div class="signal-rail-section">
      <span class="signal-rail-label">Publik</span>
      <nav class="signal-nav">
        <a href="/explore/watch" class:active={selected('/explore/watch')} title="Pantauan"><Radar /><strong>Pantauan</strong></a>
        <a href="/wiki" class:active={selected('/wiki')} title="Pengetahuan"><BookOpen /><strong>Pengetahuan</strong></a>
        <a href="/work" class:active={selected('/work')} title="Kerja publik"><Workflow /><strong>Kerja publik</strong></a>
      </nav>
    </div>

    <button class="signal-rail-more" type="button" onclick={() => (menuOpen = true)} title="Lainnya">
      <Menu /><strong>Lainnya</strong>
    </button>
  </aside>

  <div class="signal-workspace">
    <header class="signal-topbar">
      <div class="signal-mobile-brand">
        <a href="/">etnos.</a>
      </div>
      <div class="signal-location">
        <span>ETNOS</span>
        <b>/</b>
        <strong>{locationLabel}</strong>
      </div>
      <button class="signal-search" type="button" onclick={() => (commandOpen = true)}>
        <Search size={15} />
        <span>Cari orang, komunitas, diskusi…</span>
        <kbd>⌘K</kbd>
      </button>
      <div class="signal-top-actions">
        <a class="signal-top-create" href="/create"><Plus size={15} /><span>Buat</span></a>
        <a class="signal-top-icon" href="/inbox" aria-label="Aktivitas"><Bell size={17} /></a>
        <button class="signal-top-icon signal-mobile-more" type="button" onclick={() => (menuOpen = true)} aria-label="Lainnya"><Menu size={18} /></button>
      </div>
    </header>

    <div class="signal-content-grid">
      <div class="signal-center">
        {@render main?.({ class: 'signal-main shell-main' })}
      </div>
      <aside class="signal-right" aria-label="Konteks">
        <SignalContextRail {suffix} onSearch={() => (commandOpen = true)} />
      </aside>
    </div>
  </div>

  <nav class="signal-mobile-dock" aria-label="Navigasi utama seluler">
    <a href="/" class:active={selected('/')}><Home /><small>Beranda</small></a>
    <a href="/explore" class:active={selected('/explore')}><Compass /><small>Jelajah</small></a>
    <a href="/create" class="signal-mobile-create" aria-label="Buat"><Plus /></a>
    <a href="/inbox" class:active={selected('/inbox')}><Inbox /><small>Aktivitas</small></a>
    <button type="button" onclick={() => (menuOpen = true)}><Menu /><small>Lainnya</small></button>
  </nav>

  <Sheet.Root bind:open={menuOpen}>
    <Sheet.Content side="right" class="etnos-more-sheet">
      <Sheet.Header class="etnos-more-head">
        <Sheet.Title class="etnos-more-title">etnos.</Sheet.Title>
        <Sheet.Description>Ruang, pengaturan, dan fungsi lain.</Sheet.Description>
      </Sheet.Header>
      <div class="etnos-more-content">
        {@render sidebar?.({ class: 'signal-menu-sidebar' })}
      </div>
    </Sheet.Content>
  </Sheet.Root>
</div>

<style>
  .signal-shell-root {
    --etnos-bg: #080a10;
    --etnos-panel: #0d1119;
    --etnos-panel-2: #111622;
    --etnos-ink: #f4f3fb;
    --etnos-ink-soft: #e8e7f2;
    --etnos-muted: #a7a8b7;
    --etnos-muted-2: #7e8190;
    --etnos-line: rgba(226, 229, 255, .09);
    --etnos-line-strong: rgba(226, 229, 255, .17);
    --etnos-accent: #c4c7ff;
    --etnos-accent-2: #a6d7ff;
    --rail: 224px;
    --context: 316px;
    --center: 780px;
    min-height: 100dvh;
    display: grid;
    grid-template-columns: var(--rail) minmax(0, 1fr);
    background:
      radial-gradient(circle at 58% -16%, rgba(110, 113, 186, .105), transparent 29%),
      var(--etnos-bg);
    color: var(--etnos-ink);
    font-family: 'Instrument Sans Variable', 'Instrument Sans', Inter, system-ui, sans-serif;
  }
  :global(html:not(.dark)) .signal-shell-root {
    --etnos-bg: #f6f4ef;
    --etnos-panel: #fbfaf7;
    --etnos-panel-2: #ece9e2;
    --etnos-ink: #17181d;
    --etnos-ink-soft: #2d2e34;
    --etnos-muted: #70727b;
    --etnos-muted-2: #92949b;
    --etnos-line: rgba(20, 22, 30, .09);
    --etnos-line-strong: rgba(20, 22, 30, .17);
    --etnos-accent: #626aa8;
    --etnos-accent-2: #467ba0;
  }

  .signal-left {
    position: sticky; top: 0; z-index: 70; height: 100dvh; min-width: 0;
    display: flex; flex-direction: column; padding: 18px 15px 16px;
    border-right: 1px solid var(--etnos-line);
    background: color-mix(in srgb, var(--etnos-bg) 91%, transparent);
    backdrop-filter: blur(18px) saturate(118%);
  }
  .signal-brand { display: flex; align-items: center; gap: 10px; height: 42px; padding: 0 8px; color: var(--etnos-ink); text-decoration: none; font-size: 1.2rem; font-weight: 720; letter-spacing: -.055em; }
  .signal-mark { position: relative; width: 22px; height: 24px; flex: 0 0 auto; }
  .signal-mark::before, .signal-mark i, .signal-mark b { content: ''; position: absolute; display: block; border: 1px solid var(--etnos-line-strong); }
  .signal-mark::before { inset: 2px 7px; border-radius: 999px; }
  .signal-mark i { width: 14px; height: 14px; left: 0; top: 5px; border-radius: 50%; }
  .signal-mark b { width: 14px; height: 14px; right: 0; top: 5px; border-radius: 50%; }
  .signal-nav-primary { margin-top: 24px; }
  .signal-nav { display: flex; flex-direction: column; gap: 2px; }
  .signal-nav a, .signal-rail-more, .signal-create {
    min-height: 42px; display: grid; grid-template-columns: 24px minmax(0,1fr); gap: 9px; align-items: center;
    padding: 8px 9px; border: 0; border-radius: 9px; background: transparent; color: var(--etnos-muted);
    text-decoration: none; text-align: left; font-size: .82rem; transition: background .16s ease, color .16s ease, transform .16s ease;
  }
  .signal-nav svg, .signal-rail-more svg, .signal-create svg { width: 17px; height: 17px; stroke-width: 1.75; }
  .signal-nav strong, .signal-rail-more strong, .signal-create strong { font-weight: 550; }
  .signal-nav a:hover, .signal-rail-more:hover { color: var(--etnos-ink); background: color-mix(in srgb, var(--etnos-ink) 5%, transparent); }
  .signal-nav a.active { color: var(--etnos-ink); background: color-mix(in srgb, var(--etnos-accent) 10%, transparent); }
  .signal-nav a.active strong { font-weight: 660; }
  .signal-create { margin: 13px 0 4px; color: #121421; background: #eef0ff; font-weight: 680; }
  .signal-create:hover { transform: translateY(-1px); background: #f5f6ff; }
  .signal-rail-section { margin-top: 15px; padding-top: 14px; border-top: 1px solid var(--etnos-line); }
  .signal-rail-label { display: block; margin: 0 9px 7px; color: var(--etnos-muted-2); font-size: .55rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .signal-rail-more { margin-top: auto; width: 100%; cursor: pointer; }

  .signal-workspace { min-width: 0; }
  .signal-topbar {
    position: sticky; top: 0; z-index: 60; height: 58px; display: grid;
    grid-template-columns: minmax(150px, .55fr) minmax(280px, 620px) minmax(150px, .55fr);
    gap: 18px; align-items: center; padding: 0 28px; border-bottom: 1px solid var(--etnos-line);
    background: color-mix(in srgb, var(--etnos-bg) 84%, transparent); backdrop-filter: blur(20px) saturate(125%);
  }
  .signal-mobile-brand { display: none; }
  .signal-location { display: flex; gap: 7px; align-items: center; min-width: 0; color: var(--etnos-muted-2); font-size: .68rem; }
  .signal-location span { font-weight: 700; letter-spacing: .08em; }
  .signal-location b { font-weight: 400; opacity: .55; }
  .signal-location strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--etnos-ink-soft); font-weight: 580; }
  .signal-search { min-height: 38px; display: grid; grid-template-columns: auto 1fr auto; gap: 9px; align-items: center; padding: 7px 10px; border: 1px solid var(--etnos-line); border-radius: 10px; background: color-mix(in srgb, var(--etnos-panel) 70%, transparent); color: var(--etnos-muted); text-align: left; font-size: .74rem; }
  .signal-search:hover { border-color: var(--etnos-line-strong); color: var(--etnos-ink); }
  .signal-search kbd { font: 600 9px/1 ui-monospace, monospace; border: 1px solid var(--etnos-line); border-radius: 5px; padding: 3px 4px; }
  .signal-top-actions { display: flex; justify-content: end; align-items: center; gap: 6px; }
  .signal-top-create, .signal-top-icon { min-height: 36px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--etnos-line); border-radius: 9px; color: var(--etnos-ink); background: transparent; text-decoration: none; font-size: .72rem; }
  .signal-top-create { padding: 0 11px; }
  .signal-top-icon { width: 36px; padding: 0; }
  .signal-top-create:hover, .signal-top-icon:hover { background: color-mix(in srgb, var(--etnos-ink) 5%, transparent); border-color: var(--etnos-line-strong); }
  .signal-mobile-more { display: none; }

  .signal-content-grid {
    width: min(calc(100% - 56px), calc(var(--center) + var(--context) + 34px));
    margin: 0 auto; display: grid; grid-template-columns: minmax(0, var(--center)) minmax(280px, var(--context));
    gap: 34px; align-items: start;
  }
  .signal-shell-root[data-mode='explore'], .signal-shell-root[data-mode='watch'], .signal-shell-root[data-mode='wiki'], .signal-shell-root[data-mode='work'] { --center: 880px; }
  .signal-shell-root[data-mode='thread'] { --center: 820px; }
  .signal-center { min-width: 0; }
  :global(.signal-main) { width: 100%; min-width: 0; padding: 22px 0 92px; }
  .signal-right { position: sticky; top: 76px; max-height: calc(100dvh - 94px); overflow: auto; scrollbar-width: none; padding: 18px 0 50px; }
  .signal-right::-webkit-scrollbar { display: none; }

  /* Social feed: hierarchy without turning every object into a card. */
  :global(.signal-shell-root[data-mode='home'] .post-container) { border-color: var(--etnos-line) !important; }
  :global(.signal-shell-root[data-mode='home'] .post-container > article) { padding: 22px 2px !important; transition: background .16s ease; }
  :global(.signal-shell-root[data-mode='home'] .post-container > article:hover) { background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--etnos-ink) 2.5%, transparent) 18%, color-mix(in srgb, var(--etnos-ink) 2.5%, transparent) 82%, transparent); }
  :global(.signal-shell-root[data-mode='home'] .post-container h3) { font-family: 'Instrument Sans Variable', sans-serif !important; font-size: clamp(1.15rem, 1.7vw, 1.34rem) !important; line-height: 1.18 !important; letter-spacing: -.032em !important; font-weight: 620 !important; }
  :global(.signal-shell-root[data-mode='home'] .post-container section) { color: var(--etnos-ink-soft); line-height: 1.62; }
  :global(.signal-shell-root[data-mode='home'] .post-container .meta) { color: var(--etnos-muted) !important; }
  :global(.signal-shell-root[data-mode='home'] .post-container img) { border-radius: 15px; }

  /* Thread: the opened object earns more space and editorial hierarchy. */
  :global(.signal-shell-root[data-mode='thread'] .signal-main > article) { gap: 13px !important; padding-top: 12px; }
  :global(.signal-shell-root[data-mode='thread'] .signal-main > article > header h1) { margin: 8px 0 5px; font-family: 'Instrument Serif', Georgia, serif !important; font-size: clamp(2.25rem, 4vw, 3.9rem) !important; line-height: .98 !important; letter-spacing: -.035em !important; font-weight: 400 !important; }
  :global(.signal-shell-root[data-mode='thread'] .signal-main > article > div.text-base) { max-width: 760px; color: var(--etnos-ink-soft) !important; font-size: 1rem !important; line-height: 1.72 !important; }
  :global(.signal-shell-root[data-mode='thread'] #comments) { margin-top: 26px; padding-top: 10px; border-top: 1px solid var(--etnos-line-strong); }

  .signal-mobile-dock { display: none; }
  :global(.etnos-more-sheet) { font-family: 'Instrument Sans Variable', 'Instrument Sans', Inter, system-ui, sans-serif; width: min(420px, 94vw) !important; border-color: var(--etnos-line-strong) !important; background: color-mix(in srgb, var(--etnos-panel) 97%, transparent) !important; color: var(--etnos-ink) !important; }
  :global(.etnos-more-head) { border-bottom: 1px solid var(--etnos-line); padding-bottom: 14px; }
  :global(.etnos-more-title) { font-size: 1.35rem !important; letter-spacing: -.05em; }
  .etnos-more-content { padding: 12px 0 30px; }
  :global(.signal-menu-sidebar) { width: 100% !important; padding: 0 !important; background: transparent !important; }

  @media (max-width: 1220px) {
    .signal-shell-root { --rail: 76px; --context: 286px; --center: 760px; }
    .signal-left { padding-inline: 10px; align-items: stretch; }
    .signal-brand { justify-content: center; padding-inline: 0; }
    .signal-brand-word, .signal-nav strong, .signal-create strong, .signal-rail-label, .signal-rail-more strong { display: none; }
    .signal-nav a, .signal-create, .signal-rail-more { grid-template-columns: 1fr; justify-items: center; padding-inline: 0; }
    .signal-create { width: 44px; justify-self: center; align-self: center; }
    .signal-rail-section { width: 100%; }
    .signal-topbar { grid-template-columns: minmax(110px,.45fr) minmax(260px,560px) minmax(110px,.45fr); padding-inline: 20px; }
    .signal-content-grid { width: min(calc(100% - 40px), calc(var(--center) + var(--context) + 28px)); gap: 28px; }
  }

  @media (max-width: 1040px) {
    .signal-content-grid { width: min(calc(100% - 36px), 880px); display: block; }
    .signal-right { display: none; }
    .signal-shell-root[data-mode='explore'], .signal-shell-root[data-mode='watch'], .signal-shell-root[data-mode='wiki'], .signal-shell-root[data-mode='work'], .signal-shell-root[data-mode='thread'] { --center: 880px; }
  }

  @media (max-width: 760px) {
    .signal-shell-root { display: block; padding-bottom: calc(67px + env(safe-area-inset-bottom)); }
    .signal-left { display: none; }
    .signal-topbar { height: 56px; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; padding: 0 12px; }
    .signal-mobile-brand { display: block; }
    .signal-mobile-brand a { color: var(--etnos-ink); text-decoration: none; font-weight: 720; letter-spacing: -.055em; }
    .signal-location { display: none; }
    .signal-search { justify-self: stretch; grid-template-columns: auto 1fr; }
    .signal-search span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .signal-search kbd { display: none; }
    .signal-top-create { display: none; }
    .signal-mobile-more { display: inline-flex; }
    .signal-content-grid { width: min(calc(100% - 28px), 760px); }
    :global(.signal-main) { padding-top: 14px; padding-bottom: 26px; }
    .signal-mobile-dock { position: fixed; z-index: 80; left: 0; right: 0; bottom: 0; min-height: calc(62px + env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(5,1fr); align-items: start; padding: 7px 9px calc(7px + env(safe-area-inset-bottom)); border-top: 1px solid var(--etnos-line); background: color-mix(in srgb, var(--etnos-bg) 91%, transparent); backdrop-filter: blur(20px) saturate(125%); }
    .signal-mobile-dock a, .signal-mobile-dock button { min-width: 0; min-height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border: 0; background: transparent; color: var(--etnos-muted); text-decoration: none; }
    .signal-mobile-dock svg { width: 19px; height: 19px; stroke-width: 1.8; }
    .signal-mobile-dock small { font-size: .55rem; }
    .signal-mobile-dock .active { color: var(--etnos-ink); }
    .signal-mobile-create { width: 46px; height: 46px; justify-self: center; margin-top: -17px; border-radius: 50% !important; background: #eef0ff !important; color: #121421 !important; border: 4px solid var(--etnos-bg) !important; box-shadow: 0 12px 30px rgba(0,0,0,.28); }
    :global(.signal-shell-root[data-mode='home'] .post-container > article) { padding-block: 18px !important; }
    :global(.signal-shell-root[data-mode='thread'] .signal-main > article > header h1) { font-size: clamp(2.1rem, 10vw, 3rem) !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    .signal-nav a, .signal-create, .signal-search, .signal-top-create, .signal-top-icon { transition: none; }
  }
</style>
