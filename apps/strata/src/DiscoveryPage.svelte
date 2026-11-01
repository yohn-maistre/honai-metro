<script lang="ts">
  import {
    Search,
    ArrowUpRight,
    Users,
    BookOpen,
    MapPin,
    Building2,
    LoaderCircle,
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { request, initials, type Auth } from './api'
  import type { SearchResult } from './search'
  let { auth, navigate }: { auth: Auth; navigate: (href: string) => void } =
    $props()
  let data = $state<SearchResult | null>(null),
    pending = $state(true),
    error = $state(''),
    facet = $state('all')
  const contexts = $derived(
    data?.contexts.filter((c) => facet === 'all' || c.kind === facet) ?? [],
  )
  const kinds: Record<string, string> = {
    region: 'Wilayah',
    place: 'Tempat',
    language: 'Bahasa',
    topic: 'Topik',
  }
  $effect(() => {
    const actor = auth.actor?.id,
      controller = new AbortController()
    pending = true
    request<SearchResult>('/v1/search', undefined, controller.signal)
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

<div class="cx-page-head">
  <h1>Jelajah</h1>
  <Button variant="ghost" href="/groups" aria-label="Organisasi dan kelompok">
    <Building2 size={18} />
  </Button>
</div>
<button
  class="discovery-search discovery-launcher"
  onclick={() => navigate('/find')}
>
  <Search size={18} />
  <span>Orang, tempat, bahasa, percakapan</span>
  <ArrowUpRight size={16} />
</button>
<nav class="discovery-nav" aria-label="Jelajah ETNOS">
  <a href="/communities"><Users size={17} />Komunitas</a>
  <a href="/wiki"><BookOpen size={17} />Wiki</a>
  <a href="/groups"><Building2 size={17} />Kelompok</a>
</nav>
{#if pending}<div class="search-state" role="status">
    <LoaderCircle size={18} class="animate-spin" />Memuat…
  </div>{:else if error}<div class="search-state" role="alert">
    {error}
  </div>{:else if data}
  {#if data.contexts.length}<section class="discovery-section">
      <div class="discovery-section-head">
        <h2>Tempat & bahasa</h2>
        <a href="/contexts">Semua <ArrowUpRight size={14} /></a>
      </div>
      <div class="search-filters" role="group" aria-label="Jenis konteks">
        {#each [['all', 'Semua'], ['region', 'Wilayah'], ['place', 'Tempat'], ['language', 'Bahasa'], ['topic', 'Topik']] as [id, label]}<button
            aria-pressed={facet === id}
            onclick={() => (facet = id)}
          >
            {label}
          </button>{/each}
      </div>
      <div class="discovery-mosaic">
        {#each contexts as context, i}<a
            class="discovery-tile"
            class:wide={i === 0}
            href={'/contexts/' + context.slug}
          >
            <small>{kinds[context.kind]}</small>
            <strong>{context.title}</strong>
            <p>{context.description}</p>
            <ArrowUpRight size={18} />
          </a>{/each}
      </div>
      {#if !contexts.length}<p class="discovery-note">
          Belum ada konteks dalam kategori ini.
        </p>{/if}
    </section>{/if}
  <section class="discovery-section">
    <div class="discovery-section-head">
      <h2>Komunitas</h2>
      <a href="/communities">Semua <ArrowUpRight size={14} /></a>
    </div>
    {#each data.communities as c}<a
        class="discovery-row"
        href={'/communities/' + c.id}
      >
        <span class="cx-avatar sage small">{initials(c.title)}</span>
        <span>
          <strong>{c.title}</strong>
          <small>
            {c.visibility === 'public' ? c.description : 'Khusus anggota'}
          </small>
        </span>
        <ArrowUpRight size={16} />
      </a>{/each}{#if !data.communities.length}<p class="discovery-note">
        Komunitas akan tampil di sini setelah tersedia.
      </p>{/if}
  </section>
  {#if data.people.length}<section class="discovery-section">
      <div class="discovery-section-head">
        <h2>Di percakapan</h2>
        <a href="/find">Cari orang <ArrowUpRight size={14} /></a>
      </div>
      {#each data.people as person}<a
          class="discovery-row"
          href={'/people/' + person.id}
        >
          <span class="cx-avatar sage small">{initials(person.name)}</span>
          <span>
            <strong>{person.name}</strong>
            <small>
              {person.kind === 'agent' ? 'Aksara · AI' : 'Lihat profil'}
            </small>
          </span>
          <ArrowUpRight size={16} />
        </a>{/each}
    </section>{/if}
  {#if data.wiki.length}<section class="discovery-section">
      <div class="discovery-section-head">
        <h2>Wiki bersama</h2>
        <a href="/wiki">Semua <ArrowUpRight size={14} /></a>
      </div>
      {#each data.wiki as page}<a
          class="discovery-row"
          href={'/wiki/' + page.id}
        >
          <BookOpen size={18} />
          <strong>{page.title}</strong>
          <ArrowUpRight size={16} />
        </a>{/each}
    </section>{/if}
  {#if !data.contexts.length}<div class="discovery-note">
      <MapPin size={16} />
      <p>Tempat dan bahasa akan muncul setelah konteks publik ditambahkan.</p>
      {#if auth.steward}<a href="/contexts">
          Tambahkan konteks <ArrowUpRight size={14} />
        </a>{/if}
    </div>{/if}
{/if}
