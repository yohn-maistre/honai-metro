<script lang="ts">
  import { onMount } from 'svelte'
  import WatchAsk from '$lib/etnos/watch/WatchAsk.svelte'

  type Development = {
    id: number
    title?: { en?: string; id?: string }
    summary?: { en?: string; id?: string }
    title_en?: string
    title_id?: string
    summary_en?: string
    summary_id?: string
    source_count?: number
    article_count?: number
    updated_at?: string
    latest_report_at?: string
    place?: string | null
  }

  let loading = $state(true)
  let error = $state('')
  let items = $state<Development[]>([])

  onMount(async () => {
    try {
      const response = await fetch('/api/etnos/watch/current?limit=14')
      if (!response.ok) throw new Error(response.status === 503 ? 'not-configured' : 'unavailable')
      const body = await response.json()
      items = Array.isArray(body?.items) ? body.items : []
    } catch (e) {
      error = e instanceof Error ? e.message : 'unavailable'
    } finally {
      loading = false
    }
  })

  const titleOf = (item: Development) => item.title?.id || item.title_id || item.title?.en || item.title_en || 'Perkembangan'
  const summaryOf = (item: Development) => item.summary?.id || item.summary_id || item.summary?.en || item.summary_en || ''
  const dateOf = (item: Development) => item.latest_report_at || item.updated_at
  const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''
</script>

<svelte:head><title>Pantauan · ETNOS</title></svelte:head>

<section class="watch-index">
  <header class="watch-head">
    <span class="watch-kicker">West Papua Watch · evidence monitor</span>
    <h1>Pantauan<span>.</span></h1>
    <p>Perkembangan publik yang disusun Watch dari peliputan dan sumber berbeda. Buka satu perkembangan untuk melihat sintesis, tempat, isu, dan laporan sumbernya.</p>
  </header>

  <WatchAsk pageTitle="Pantauan" />

  {#if loading}
    <div class="watch-state">Memuat perkembangan…</div>
  {:else if error}
    <div class="watch-state">
      <strong>Watch belum tersambung di deployment ini.</strong>
      <p>Hubungkan service binding <code>WATCH_ENGINE</code>. ETNOS sengaja tidak mengarang berita contoh.</p>
      <a href="https://westpapua.watch" rel="noreferrer">Buka West Papua Watch ↗</a>
    </div>
  {:else if items.length === 0}
    <div class="watch-state">Belum ada perkembangan yang dipublikasikan.</div>
  {:else}
    <div class="watch-list">
      {#each items as item, index}
        <a class="watch-row" href={`/explore/watch/${item.id}`}>
          <span class="watch-num">{String(index + 1).padStart(2, '0')}</span>
          <div class="watch-copy">
            <h2>{titleOf(item)}</h2>
            {#if summaryOf(item)}<p>{summaryOf(item)}</p>{/if}
          </div>
          <div class="watch-meta">
            <strong>{item.source_count ?? item.article_count ?? 0}</strong>
            <span>sumber</span>
            {#if dateOf(item)}<time datetime={dateOf(item)}>{formatDate(dateOf(item))}</time>{/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .watch-index { width: 100%; }
  .watch-head { padding: 18px 0 24px; border-bottom: 1px solid var(--etnos-line-strong); }
  .watch-kicker { color: var(--etnos-muted); font-size: .6rem; font-weight: 720; letter-spacing: .15em; text-transform: uppercase; }
  .watch-head h1 { margin: 8px 0 0; font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(4.2rem, 9vw, 7.6rem); line-height: .82; font-weight: 400; letter-spacing: -.055em; }
  .watch-head h1 span { color: var(--etnos-accent); }
  .watch-head p { max-width: 700px; margin: 16px 0 0; color: var(--etnos-muted); font-size: .95rem; line-height: 1.58; }
  .watch-state { margin-top: 20px; padding: 22px 0; border-top: 1px solid var(--etnos-line); color: var(--etnos-muted); }
  .watch-state strong { color: var(--etnos-ink); }.watch-state p{max-width:620px}.watch-state a{color:var(--etnos-ink)}
  .watch-list { margin-top: 18px; border-top: 1px solid var(--etnos-line-strong); }
  .watch-row { display: grid; grid-template-columns: 42px minmax(0,1fr) 86px; gap: 16px; padding: 21px 0; border-bottom: 1px solid var(--etnos-line); color: var(--etnos-ink); text-decoration: none; transition: padding .18s ease, background .18s ease; }
  .watch-row:hover { padding-left: 8px; padding-right: 8px; background: color-mix(in srgb,var(--etnos-ink) 2.5%,transparent); }
  .watch-num { color: var(--etnos-muted-2); font-size: .62rem; font-variant-numeric: tabular-nums; }
  .watch-copy h2 { margin: 0; font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(1.65rem,3vw,2.45rem); line-height: .98; font-weight: 400; letter-spacing: -.025em; }
  .watch-copy p { max-width: 680px; margin: 8px 0 0; color: var(--etnos-muted); font-size: .78rem; line-height: 1.5; }
  .watch-meta { display: flex; flex-direction: column; align-items: flex-end; color: var(--etnos-muted); font-size: .6rem; }
  .watch-meta strong { color: var(--etnos-ink); font-size: 1.15rem; line-height: 1; }.watch-meta time{margin-top:auto}
  @media(max-width:620px){.watch-head h1{font-size:clamp(4rem,20vw,6rem)}.watch-row{grid-template-columns:28px minmax(0,1fr)}.watch-meta{grid-column:2;flex-direction:row;align-items:center;gap:5px}.watch-meta time{margin-left:auto}.watch-copy h2{font-size:1.75rem}}
</style>
