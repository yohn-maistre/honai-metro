<script lang="ts">
  import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    RefreshCw,
  } from '@lucide/svelte'
  import Choice from './Choice.svelte'
  import { tabScroll } from './tab-scroll'
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
    retry = $state(0),
    failedPhotos = $state<string[]>([])
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

<section class="news-index" aria-busy={pending}>
  <header class="news-desk-heading">
    <h1>Kabar Papua</h1>
    <a href="https://westpapua.watch/news/" target="_blank" rel="noreferrer">
      West Papua Watch <ArrowUpRight size={14} />
    </a>
  </header>
  <nav
    class="news-desk-tabs section-tab-scroll"
    use:tabScroll
    aria-label="Topik kabar"
  >
    {#each desks as category}<button
        aria-current={desk === category.value ? 'page' : undefined}
        onclick={() => change('desk', category.value)}
      >
        {category.label}
      </button>{/each}
  </nav>
  <div class="news-desk-tools">
    <span class="news-desk-count" aria-live="polite">
      {pending
        ? 'Memuat liputan…'
        : feed?.selection?.total != null
          ? `${feed.selection.total.toLocaleString('id-ID')} liputan`
          : 'Liputan terkini'}
    </span>
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
  {#if error}<div class="search-state" role="alert">
      <p>{error}</p>
      <Button variant="outline" onclick={() => retry++}>
        <RefreshCw size={16} />Coba lagi
      </Button>
    </div>
  {:else if pending}<ContentSkeleton rows={3} />
  {:else if feed}
    <div class="news-desk-stories">
      {#each feed.items as item, i}{@const photo =
          !!item.image && !failedPhotos.includes(item.id)}
        <a
          class="news-desk-story"
          class:news-desk-lead={i === 0 && page === 1}
          class:has-photo={photo}
          href={'/news/' + item.id}
        >
          {#if photo}<div class="news-desk-photo">
              <img
                src={item.image}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                onerror={() => {
                  failedPhotos = [...failedPhotos, item.id]
                }}
              />
              {#if item.imageCredit && i === 0 && page === 1}<small>
                  {item.imageCredit}
                </small>{/if}
            </div>{/if}
          <div class="news-desk-copy">
            <span class="news-desk-meta">
              {newsDate(item.publishedAt)}{item.sourceCount
                ? ` · ${item.sourceCount} sumber`
                : ''}
            </span>
            <h2>{item.title}</h2>
            {#if item.summary && i === 0 && page === 1}<p>
                {item.summary}
              </p>{/if}
            {#if photo && item.imageCredit && (i !== 0 || page !== 1)}<small
                class="news-desk-credit"
              >
                {item.imageCredit}
              </small>{/if}
          </div>
          <ArrowUpRight class="news-desk-open" size={16} />
        </a>{/each}
    </div>
    {#if !feed.items.length}<div class="search-state">
        Belum ada liputan untuk pilihan ini.{#if place}<Button
            variant="ghost"
            onclick={() => change('place', '')}
          >
            Semua tempat
          </Button>{/if}
      </div>{/if}
    <nav class="news-pagination" aria-label="Halaman kabar">
      <Button
        variant="ghost"
        disabled={page <= 1}
        onclick={() => change('page', String(page - 1))}
      >
        <ArrowLeft size={16} />Sebelumnya
      </Button>
      <span>Halaman {page}</span>
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
