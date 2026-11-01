<script lang="ts">
  import { Search, ArrowUpRight, LoaderCircle } from '@lucide/svelte'
  import { Input } from '$lib/components/ui/input/index.js'
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
    navigate,
  }: { query?: string; navigate: (href: string) => void } = $props()
  let value = $state(''),
    category = $state<SearchCategory>('all'),
    data = $state<SearchResult | null>(null),
    pending = $state(false),
    error = $state('')
  const groups = $derived(resultGroups(data, category))
  $effect(() => {
    value = query
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
<form
  class="discovery-search"
  onsubmit={(e) => {
    e.preventDefault()
    navigate('/find?q=' + encodeURIComponent(value.trim()))
  }}
>
  <Search size={18} /><Input
    bind:value
    aria-label="Kata pencarian"
    placeholder="Orang, topik, komunitas…"
    maxlength={100}
  /><Button type="submit" variant="ghost">Cari</Button>
</form>
<div class="search-filters" role="group" aria-label="Jenis hasil">
  {#each categories as [key, label]}<button
      aria-pressed={category === key}
      onclick={() => (category = key)}
    >
      {label}
    </button>{/each}
</div>
{#if pending}<div class="search-state" role="status">
    <LoaderCircle size={18} class="animate-spin" />Mencari…
  </div>{:else if error}<div class="search-state" role="alert">
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
