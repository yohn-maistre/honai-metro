<script lang="ts">
  import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Newspaper,
    RefreshCw,
  } from '@lucide/svelte'
  import Choice from './Choice.svelte'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { newsDate, type NewsFeed } from './news.svelte'
  import { beginRequest } from './network.svelte'
  let {
    search,
    navigate,
  }: { search: string; navigate: (url: string) => void } = $props()
  let feed = $state<NewsFeed | null>(null),
    pending = $state(true),
    error = $state(''),
    retry = $state(0)
  const params = $derived(new SvelteURLSearchParams(search))
  const desk = $derived(params.get('desk') ?? 'focus'),
    place = $derived(params.get('place') ?? ''),
    page = $derived(Number(params.get('page') ?? 1))
  const desks = [
    { value: 'focus', label: 'Sorotan' },
    { value: 'all', label: 'Terbaru' },
    { value: 'rights', label: 'HAM & konflik' },
    { value: 'land', label: 'Tanah & lingkungan' },
    { value: 'politics', label: 'Politik' },
    { value: 'regional', label: 'Kabar Papua' },
  ]
  function change(key: string, value: string) {
    const q = new SvelteURLSearchParams(search)
    q.set(key, value)
    if (key !== 'page') q.delete('page')
    if (!value) q.delete(key)
    navigate('/news?' + q)
  }
  $effect(() => {
    const query = new SvelteURLSearchParams(search)
    query.set('limit', '12')
    void retry
    const abort = new AbortController(),
      done = beginRequest()
    pending = true
    error = ''
    fetch('/v1/news?' + query, { credentials: 'omit', signal: abort.signal })
      .then(async (r) => {
        if (!r.ok)
          throw Error(
            r.status === 400
              ? 'Filter kabar tidak valid.'
              : 'Kabar belum dapat dimuat.',
          )
        return (await r.json()) as NewsFeed
      })
      .then((data) => {
        if (!abort.signal.aborted) feed = data
      })
      .catch((e) => {
        if (!abort.signal.aborted) error = e.message
      })
      .finally(() => {
        done()
        if (!abort.signal.aborted) pending = false
      })
    return () => abort.abort()
  })
</script>

<section class="news-index">
  <div class="news-index-intro">
    <Newspaper size={20} />
    <div>
      <h1>Kabar Papua</h1>
      <p>West Papua Watch · Liputan, sumber & percakapan</p>
    </div>
    <a
      href="https://westpapua.watch/news/"
      target="_blank"
      rel="noreferrer"
      aria-label="Buka West Papua Watch"
    >
      <ArrowUpRight size={18} />
    </a>
  </div>
  <div class="news-filters">
    <Choice
      aria-label="Pilih liputan"
      compact
      value={desk}
      items={desks}
      onchange={(value) => change('desk', value)}
    />
    <Choice
      aria-label="Pilih tempat"
      compact
      value={place}
      items={[
        { value: '', label: 'Semua tempat' },
        ...(feed?.placeOptions ?? []).map((p) => ({
          value: p.slug,
          label: p.name,
        })),
      ]}
      onchange={(value) => change('place', value)}
    />
  </div>
  {#if pending}<ContentSkeleton rows={3} />{:else if error}<div
      class="search-state"
      role="alert"
    >
      <p>{error}</p>
      <Button variant="outline" onclick={() => retry++}>
        <RefreshCw size={16} />Coba lagi
      </Button>
    </div>{:else if feed}
    <p class="news-range">
      {feed.selection?.total != null
        ? `${feed.selection.total} liputan`
        : 'Liputan tersedia'} · Halaman {page}
    </p>
    <div class="news-list-grid">
      {#each feed.items as item}<a
          class="news-list-card"
          href={'/news/' + item.id}
        >
          {#if item.image}<div class="news-list-photo">
              <img
                src={item.image}
                alt=""
                loading="lazy"
                onerror={(e) =>
                  e.currentTarget.parentElement?.setAttribute('hidden', '')}
              />
              {#if item.imageCredit}<small>{item.imageCredit}</small>{/if}
            </div>{/if}
          <div>
            <span>
              {newsDate(item.publishedAt)}{item.sourceCount
                ? ` · ${item.sourceCount} sumber`
                : ''}
            </span>
            <h2>{item.title}</h2>
            {#if item.summary}<p>{item.summary}</p>{/if}
            <span class="news-read">
              Baca & diskusikan <ArrowRight size={14} />
            </span>
          </div>
        </a>{/each}
    </div>
    {#if !feed.items.length}<div class="search-state">
        Belum ada liputan untuk pilihan ini.
      </div>{/if}
    <nav class="news-pagination" aria-label="Halaman kabar">
      <Button
        variant="ghost"
        disabled={page <= 1}
        onclick={() => change('page', String(page - 1))}
      >
        <ArrowLeft size={16} />Sebelumnya
      </Button>
      <span>{page}</span>
      <Button
        variant="ghost"
        disabled={!feed.pagination?.nextPage}
        onclick={() => change('page', String(feed?.pagination?.nextPage))}
      >
        Berikutnya<ArrowRight size={16} />
      </Button>
    </nav>
  {/if}
</section>
