<script lang="ts">
  import {
    ArrowUpRight,
    Users,
    BookOpen,
    MapPin,
    Building2,
  } from '@lucide/svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import NewsSection from './NewsSection.svelte'
  import { news } from './news.svelte'
  import { request, initials, type Auth } from './api'
  import type { SearchResult } from './search'
  let { auth }: { auth: Auth } = $props()
  let data = $state<SearchResult | null>(null),
    pending = $state(true),
    error = $state(''),
    facet = $state('all')
  const contexts = $derived(
    data?.contexts.filter((c) => facet === 'all' || c.kind === facet) ?? [],
  )
  const featured = $derived(
    data?.posts
      .filter(
        (post) =>
          !post.content?.warning &&
          (post.media?.length || post.content?.event) &&
          data?.communities.some(
            (c) => c.id === post.community_id && c.visibility === 'public',
          ),
      )
      .slice(0, 3) ?? [],
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
        if (!controller.signal.aborted && auth.actor?.id === actor)
          data = result
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

<div class="cx-page-head discovery-heading"><h1>Jelajah</h1></div>
<nav class="discovery-nav" aria-label="Jelajah ETNOS">
  <a href="/communities"><Users size={17} />Komunitas</a>
  <a href="/wiki"><BookOpen size={17} />Wiki</a>
  <a href="/groups"><Building2 size={17} />Kelompok</a>
</nav>
{#if pending}<ContentSkeleton />{:else if error}<div
    class="search-state"
    role="alert"
  >
    {error}
  </div>{:else if data}
  <NewsSection />
  <section class="explore-featured" aria-label="Pilihan jelajah">
    {#if featured.length}{#each featured as post, i}<a
          class="explore-feature-tile"
          class:lead={i === 0}
          class:with-image={!!post.media?.length}
          href={'/square/' + post.id}
        >
          {#if post.media?.[0]}<img
              src={post.media[0].url}
              alt={post.media[0].alt}
              loading="lazy"
            />{/if}
          <div>
            <small>
              {data.communities.find((c) => c.id === post.community_id)?.title}
            </small>
            <strong>{post.content?.title ?? post.text.slice(0, 100)}</strong>
            {#if post.content?.event}<span>
                {post.content.event.location}
              </span>{/if}
          </div>
          <ArrowUpRight size={18} />
        </a>{/each}{:else if !news.pending && !news.feed?.items.length}
      <a
        class="explore-feature-tile lead"
        href={data.communities[0]
          ? '/communities/' + data.communities[0].id
          : '/communities'}
      >
        <Users size={24} />
        <div>
          <small>Ruang percakapan</small>
          <strong>{data.communities[0]?.title ?? 'Temukan komunitasmu'}</strong>
          <span>
            {data.communities[0]?.description ??
              'Percakapan, cerita, dan kabar bersama'}
          </span>
        </div>
        <ArrowUpRight size={18} />
      </a>
    {/if}
    <a
      class="explore-feature-tile knowledge-tile"
      href={data.wiki[0] ? '/wiki/' + data.wiki[0].id : '/wiki'}
    >
      <BookOpen size={24} />
      <div>
        {#if data.wiki[0]}<small>Wiki bersama</small>{/if}
        <strong>
          {data.wiki[0]?.title ?? 'Wiki bersama'}
        </strong>
        <span>Catatan, sumber, dan revisi</span>
      </div>
      <ArrowUpRight size={18} />
    </a>
    <a class="explore-feature-tile places-tile" href="/contexts">
      <MapPin size={24} />
      <div>
        <strong>Tempat & bahasa</strong>
        <span>Wilayah, bahasa, dan topik</span>
      </div>
      <ArrowUpRight size={18} />
    </a>
  </section>
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
