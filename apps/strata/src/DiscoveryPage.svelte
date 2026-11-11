<script lang="ts">
  import {
    ArrowUpRight,
    Users,
    BookOpen,
    MapPin,
    Building2,
    Hash,
  } from '@lucide/svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import NewsSection from './NewsSection.svelte'
  import EngagementPage from './EngagementPage.svelte'
  import { request, initials, type Auth } from './api'
  import type { SearchResult } from './search'
  let { auth }: { auth: Auth } = $props()
  let data = $state<SearchResult | null>(null),
    pending = $state(true),
    error = $state(''),
    facet = $state('all')
  const contexts = $derived(
    data?.contexts.filter(
      (c) => c.kind !== 'topic' && (facet === 'all' || c.kind === facet),
    ) ?? [],
  )
  const featured = $derived(
    data?.posts
      .filter(
        (post) =>
          !post.content?.warning &&
          !post.parent_id &&
          data?.communities.some(
            (c) => c.id === post.community_id && c.visibility === 'public',
          ),
      )
      .slice(0, 4) ?? [],
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

<nav class="discovery-nav" aria-label="Jelajah ETNOS">
  <a href="/communities"><Users size={17} />Komunitas</a>
  <a href="/topics"><Hash size={17} />Topik</a>
  <a href="/groups"><Building2 size={17} />Organisasi</a>
  <a href="/wiki"><BookOpen size={17}/>Wiki</a>
  <a href="/contexts"><MapPin size={17}/>Tempat & bahasa</a>
</nav>
{#if pending}<ContentSkeleton />{:else if error}<div
    class="search-state"
    role="alert"
  >
    {error}
  </div>{:else if data}
  <NewsSection />
  <EngagementPage {auth} compact />
  {#if featured.length}<section class="discovery-section explore-conversations" aria-label="Percakapan terbaru">
    <div class="discovery-section-head"><h2>Percakapan terbaru</h2><a href="/">Ke beranda <ArrowUpRight size={14}/></a></div>
    <div class="explore-conversation-grid">
      {#each featured as post}<a class="explore-conversation" class:with-image={!!post.media?.length} href={'/square/' + post.id}>
        {#if post.media?.[0]}<img src={post.media[0].url} alt={post.media[0].alt} loading="lazy" decoding="async"/>{/if}
        <div class="explore-conversation-copy">
          <small>{data.communities.find(c => c.id === post.community_id)?.title}</small>
          <strong>{post.content?.title || post.text.slice(0, 280) || (post.content?.event ? 'Acara komunitas' : 'Posting bergambar')}</strong>
          {#if post.content?.event}<span>{post.content.event.location}</span>{/if}
          <footer><span>{post.author.name}</span><ArrowUpRight size={16}/></footer>
        </div>
      </a>{/each}
    </div>
  </section>{/if}
  {#if data.contexts.some((c) => c.kind === 'topic')}<section
      class="discovery-section"
    >
      <div class="discovery-section-head">
        <h2>Topik</h2>
        <a href="/topics">Semua <ArrowUpRight size={14} /></a>
      </div>
      {#each data.contexts.filter((c) => c.kind === 'topic') as topic}<a
          class="discovery-row"
          href={'/contexts/' + topic.slug}
        >
          <Hash size={18} />
          <span>
            <strong>{topic.title}</strong>
            {#if topic.description}<small>{topic.description}</small>{/if}
          </span>
          <ArrowUpRight size={16} />
        </a>{/each}
    </section>{/if}
  {#if data.contexts.some((c) => c.kind !== 'topic')}<section
      class="discovery-section"
    >
      <div class="discovery-section-head">
        <h2>Tempat & bahasa</h2>
        <a href="/contexts">Semua <ArrowUpRight size={14} /></a>
      </div>
      <div class="search-filters" role="group" aria-label="Tempat dan bahasa">
        {#each [['all', 'Semua'], ['region', 'Wilayah'], ['place', 'Tempat'], ['language', 'Bahasa']] as [id, label]}<button
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
          Belum ada tempat atau bahasa dalam pilihan ini.
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
              {person.kind === 'agent' ? 'Agen' : 'Lihat profil'}
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
{/if}
