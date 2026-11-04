<script lang="ts">
  import { Search, ArrowUpRight } from '@lucide/svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { request } from './api'
  import {
    categories,
    resultGroups,
    type SearchResult,
    type SearchCategory,
  } from './search'
  let {
    query = '',
    onSearch,
  }: { query?: string; onSearch: (query: string) => void } = $props()
  let category = $state<SearchCategory>('all'),
    data = $state<SearchResult | null>(null),
    pending = $state(false),
    error = $state('')
  const groups = $derived(resultGroups(data, category))
  $effect(() => {
    const controller = new AbortController()
    pending = true
    error = ''
    data = null
    request<SearchResult>(
      '/v1/search?q=' + encodeURIComponent(query),
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) data = result
      })
      .catch((e) => {
        if (!controller.signal.aborted) error = e.message
      })
      .finally(() => {
        if (!controller.signal.aborted) pending = false
      })
    return () => controller.abort()
  })
</script>

<div class="cx-page-head"><h1>Cari</h1></div>
<div class="search-query-summary">
  <span>{query ? `Hasil untuk “${query}”` : 'Di ETNOS'}</span>
  <Button variant="ghost" onclick={() => onSearch(query)}>
    <Search size={16} />Ubah pencarian
  </Button>
</div>
<div class="search-filters" role="group" aria-label="Jenis hasil">
  {#each categories as [key, label]}<button
      aria-pressed={category === key}
      onclick={() => (category = key)}
    >
      {label}
    </button>{/each}
</div>
{#if pending}<ContentSkeleton />{:else if error}<div
    class="search-state"
    role="alert"
  >
    {error}
  </div>{:else}
  {#each groups as group}<section class="search-page-group">
      <h2>{group.label}</h2>
      {#each group.items as item}<a class="search-page-result" href={item.href}>
          <span>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </span>
          <ArrowUpRight size={16} />
        </a>{/each}
    </section>{/each}
  {#if !groups.length}<div class="search-state">
      <strong>Belum ada hasil</strong>
      <p>Coba nama, topik, atau kata lain.</p>
      <Button href="/explore" variant="outline">Jelajah</Button>
    </div>{/if}
{/if}
