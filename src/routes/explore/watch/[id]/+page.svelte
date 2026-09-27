<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import WatchAsk from '$lib/etnos/watch/WatchAsk.svelte'

  type Article = {
    id?: number
    title?: string
    summary?: string
    canonical_url?: string
    published_at?: string
    publisher?: string
    role?: string
    packet_summary?: string
    what_changed?: string
  }
  type Detail = {
    redirect_id?: number
    development?: Record<string, any>
    synthesis?: Record<string, any> | null
    issues?: Array<Record<string, any>>
    places?: Array<Record<string, any>>
    articles?: Article[]
  }

  let loading = $state(true)
  let error = $state('')
  let detail = $state<Detail | null>(null)

  onMount(async () => {
    try {
      const response = await fetch(`/api/etnos/watch/development/${encodeURIComponent(page.params.id)}`)
      if (!response.ok) throw new Error(response.status === 404 ? 'not-found' : 'unavailable')
      const body = await response.json()
      if (body?.redirect_id) {
        location.replace(`/explore/watch/${body.redirect_id}`)
        return
      }
      detail = body
    } catch (e) {
      error = e instanceof Error ? e.message : 'unavailable'
    } finally {
      loading = false
    }
  })

  const d = $derived(detail?.development ?? {})
  const s = $derived(detail?.synthesis ?? {})
  const title = $derived(d.title_id || d.title_en || 'Perkembangan')
  const summary = $derived(d.summary_id || d.summary_en || '')
  const changed = $derived(s.what_changed_id || s.what_changed || '')
  const keyPoints = $derived(Array.isArray(s?.key_points?.id) && s.key_points.id.length ? s.key_points.id : Array.isArray(s?.key_points?.en) ? s.key_points.en : [])
  const articles = $derived(detail?.articles ?? [])
  const sourceCount = $derived(new Set(articles.map((a) => a.publisher).filter(Boolean)).size)
</script>

<svelte:head><title>{title} · Pantauan · ETNOS</title></svelte:head>

{#if loading}
  <div class="detail-state">Memuat perkembangan…</div>
{:else if error || !detail}
  <div class="detail-state"><strong>Perkembangan tidak dapat dimuat.</strong><a href="/explore/watch">← Kembali ke Pantauan</a></div>
{:else}
  <article class="watch-detail">
    <a class="watch-back" href="/explore/watch">← Pantauan</a>
    <header class="detail-head">
      <span class="detail-kicker">Evidence development · {sourceCount} sumber</span>
      <h1>{title}</h1>
      {#if summary}<p>{summary}</p>{/if}
      <div class="detail-tags">
        {#each detail.places ?? [] as place}<span>{place.name}</span>{/each}
        {#each detail.issues ?? [] as issue}<span>{issue.title_id || issue.title_en || issue.slug}</span>{/each}
      </div>
    </header>

    {#if changed || keyPoints.length}
      <section class="synthesis">
        <span class="section-label">Sintesis Watch</span>
        {#if changed}<h2>{changed}</h2>{/if}
        {#if keyPoints.length}
          <ol>
            {#each keyPoints as point, i}<li><span>{String(i + 1).padStart(2, '0')}</span><p>{point}</p></li>{/each}
          </ol>
        {/if}
      </section>
    {/if}

    <WatchAsk pageTitle={title} />

    <section class="reporting">
      <div class="reporting-head"><span class="section-label">Pelaporan sumber</span><strong>{articles.length} laporan</strong></div>
      <div class="report-list">
        {#each articles as article}
          <a class="report-row" href={article.canonical_url} target="_blank" rel="noreferrer">
            <div class="report-source"><strong>{article.publisher || 'Sumber'}</strong><span>{article.role || 'reporting'}</span></div>
            <div class="report-copy"><h3>{article.title}</h3>{#if article.packet_summary || article.summary}<p>{article.packet_summary || article.summary}</p>{/if}</div>
            <div class="report-date">{article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div>
          </a>
        {/each}
      </div>
    </section>
  </article>
{/if}

<style>
  .detail-state { min-height: 50vh; display: flex; flex-direction: column; justify-content: center; gap: 10px; color: var(--etnos-muted); }.detail-state strong{color:var(--etnos-ink)}.detail-state a{color:var(--etnos-ink)}
  .watch-back { display: inline-block; margin-bottom: 14px; color: var(--etnos-muted); font-size: .7rem; text-decoration: none; }
  .detail-head { padding: 6px 0 28px; border-bottom: 1px solid var(--etnos-line-strong); }
  .detail-kicker,.section-label { color: var(--etnos-muted); font-size: .6rem; font-weight: 720; letter-spacing: .15em; text-transform: uppercase; }
  .detail-head h1 { max-width: 850px; margin: 12px 0 0; font-family: 'Instrument Serif',Georgia,serif; font-size: clamp(3.3rem,7.2vw,6.5rem); line-height: .88; letter-spacing: -.045em; font-weight: 400; }
  .detail-head > p { max-width: 760px; margin: 18px 0 0; color: var(--etnos-muted); font-size: 1rem; line-height: 1.62; }
  .detail-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 18px; }.detail-tags span{padding:5px 8px;border:1px solid var(--etnos-line);border-radius:999px;color:var(--etnos-muted);font-size:.62rem}
  .synthesis { padding: 28px 0 10px; }.synthesis h2{max-width:760px;margin:10px 0 20px;font-family:'Instrument Serif',Georgia,serif;font-size:clamp(1.8rem,3.7vw,3rem);line-height:1.04;font-weight:400;letter-spacing:-.025em}.synthesis ol{list-style:none;margin:0;padding:0;border-top:1px solid var(--etnos-line)}.synthesis li{display:grid;grid-template-columns:42px minmax(0,1fr);gap:14px;padding:14px 0;border-bottom:1px solid var(--etnos-line)}.synthesis li>span{color:var(--etnos-muted-2);font-size:.6rem}.synthesis li p{margin:0;max-width:720px;color:var(--etnos-ink-soft);font-size:.84rem;line-height:1.6}
  .reporting { margin-top: 28px; }.reporting-head{display:flex;justify-content:space-between;align-items:end;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--etnos-line-strong)}.reporting-head strong{font-size:.7rem;font-weight:580;color:var(--etnos-muted)}
  .report-row{display:grid;grid-template-columns:150px minmax(0,1fr) 90px;gap:18px;padding:17px 0;border-bottom:1px solid var(--etnos-line);color:var(--etnos-ink);text-decoration:none}.report-row:hover .report-copy h3{text-decoration:underline;text-underline-offset:3px}.report-source{display:flex;flex-direction:column;gap:3px}.report-source strong{font-size:.7rem}.report-source span{color:var(--etnos-muted);font-size:.58rem;text-transform:uppercase;letter-spacing:.08em}.report-copy h3{margin:0;font-size:.93rem;line-height:1.3;font-weight:610}.report-copy p{margin:6px 0 0;color:var(--etnos-muted);font-size:.7rem;line-height:1.48}.report-date{text-align:right;color:var(--etnos-muted);font-size:.6rem}
  @media(max-width:680px){.detail-head h1{font-size:clamp(3rem,15vw,4.6rem)}.report-row{grid-template-columns:1fr}.report-date{text-align:left}.report-source{flex-direction:row;gap:8px;align-items:center}}
</style>
