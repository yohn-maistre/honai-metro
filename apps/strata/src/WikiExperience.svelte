<script lang="ts">
  import {
    BookOpen,
    Plus,
    ArrowUpRight,
    GitPullRequest,
    History,
    FileText,
    Search,
    MapPin,
    ChevronDown,
  } from '@lucide/svelte'
  import { markdown } from './markdown'
  import {
    request,
    relativeDate,
    type WikiPage,
    type Proposal,
    type Community,
    type Membership,
    type Auth,
  } from './api'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import WikiPolicy from './WikiPolicy.svelte'
  let {
    page,
    pages,
    proposals,
    history,
    communities,
    memberships,
    auth,
    onCreate,
    onPropose,
    onDecide,
    busy,
  }: {
    page: WikiPage | null
    pages: WikiPage[]
    proposals: Proposal[]
    history: {
      id: string
      created: number
      perspective: string
      language: string
    }[]
    communities: Community[]
    memberships: Membership[]
    auth: Auth
    onCreate: () => void
    onPropose: () => void
    onDecide: (p: Proposal, accept: boolean) => void
    busy: boolean
  } = $props()
  let query = $state(''),
    section = $state('read'),
    context = $state(''),
    contexts = $state<
      { id: string; slug: string; title: string; kind: string }[]
    >([]),
    contextPages = $state<string[] | null>(null)
  const headings = $derived.by(() => {
    if (!page?.revision) return []
    const template = document.createElement('template')
    template.innerHTML = markdown(page.revision.text, [], 'wiki-' + page.id)
    return Array.from(template.content.querySelectorAll('h1,h2,h3,h4')).map(
      (h) => ({ id: h.id, text: h.textContent ?? '' }),
    )
  })
  const member = $derived(
      !!page && memberships.some((m) => m.community_id === page.community_id),
    ),
    steward = $derived(
      !!page &&
        memberships.some(
          (m) => m.community_id === page.community_id && m.role !== 'member',
        ),
    )
  const filtered = $derived(
    pages.filter(
      (p) =>
        p.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
        (!contextPages || contextPages.includes(p.id)),
    ),
  )
  $effect(() => {
    const actor = auth.actor?.id,
      abort = new AbortController()
    request<typeof contexts>('/v1/contexts', undefined, abort.signal)
      .then((rows) => {
        if (!abort.signal.aborted && actor === auth.actor?.id) contexts = rows
      })
      .catch(() => {})
    return () => abort.abort()
  })
  $effect(() => {
    const id = context,
      abort = new AbortController()
    contextPages = null
    if (id)
      request<{ pages: { id: string }[] }>(
        '/v1/contexts/' + id,
        undefined,
        abort.signal,
      )
        .then((result) => {
          if (!abort.signal.aborted)
            contextPages = result.pages.map((p) => p.id)
        })
        .catch(() => {
          if (!abort.signal.aborted) contextPages = []
        })
    return () => abort.abort()
  })
  $effect(() => {
    void page?.id
    section = 'read'
  })
</script>

{#if page}
  <article class="wiki-reader">
    <header class="wiki-page-header">
      <small>
        {communities.find((c) => c.id === page.community_id)?.title}
      </small>
      <h1>{page.title}</h1>
      <p>
        {page.revision
          ? `${page.revision.language} · ${page.revision.perspective}`
          : 'Draf · Menunggu tinjauan manusia'}
      </p>
      <div class="wiki-actions">
        {#if headings.length}<details class="wiki-contents">
            <summary>Dalam halaman <ChevronDown size={14} /></summary>
            <div class="wiki-history-popover">
              {#each headings as heading}<a href={'#' + heading.id}>
                  {heading.text}
                </a>{/each}
            </div>
          </details>{/if}
        {#if member}<Button variant="outline" onclick={onPropose}>
            <GitPullRequest size={15} />Usulkan perubahan
          </Button>{/if}
        <details>
          <summary><History size={15} />Riwayat</summary>
          <div class="wiki-history-popover">
            {#each history as rev}<p>
                <strong>{rev.perspective}</strong>
                <small>{rev.language} · {relativeDate(rev.created)}</small>
              </p>{/each}{#if !history.length}<p>
                Belum ada revisi diterima.
              </p>{/if}
          </div>
        </details>
      </div>
    </header>
    {#if member && proposals.length}<nav
        class="wiki-section-tabs"
        aria-label="Tampilan halaman"
      >
        <button
          aria-current={section === 'read' ? 'page' : undefined}
          onclick={() => (section = 'read')}
        >
          Halaman
        </button>
        <button
          aria-current={section === 'review' ? 'page' : undefined}
          onclick={() => (section = 'review')}
        >
          Usulan {proposals.filter((p) => p.state === 'pending').length}
        </button>
      </nav>{/if}
    {#if section === 'read'}
      {#if page.revision}<div class="wiki-body post-markdown">
          {@html markdown(page.revision.text, [], 'wiki-' + page.id)}
        </div>
        <section class="wiki-sources">
          <h2>Sumber & atribusi</h2>
          {#each page.revision.citations as url}<a
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {url}<ArrowUpRight size={13} />
            </a>{/each}{#if !page.revision.citations.length}<p>
              Sumber publik belum ditautkan.
            </p>{/if}
        </section>
      {:else}<div class="wiki-draft-state">
          <FileText size={26} />
          <h2>Tulisan sedang disiapkan</h2>
          <p>Draf dan sumber ditinjau sebelum halaman diterbitkan.</p>
          {#if proposals.length}<Button
              variant="outline"
              onclick={() => (section = 'review')}
            >
              Lihat usulan
            </Button>{/if}
        </div>{/if}
      {#if pages.some((p) => p.id !== page.id && p.community_id === page.community_id)}<section
          class="wiki-related"
        >
          <h2>Jelajahi selanjutnya</h2>
          {#each pages
            .filter((p) => p.id !== page.id && p.community_id === page.community_id && p.revision_id)
            .slice(0, 5) as p}<a href={'/wiki/' + p.id}>
              <BookOpen size={16} />{p.title}<ArrowUpRight size={15} />
            </a>{/each}
        </section>{/if}
    {:else}<section class="wiki-reviews">
        {#each proposals as proposal}<article class="wiki-review-card">
            <div class="wiki-review-heading">
              <strong>
                {proposal.state === 'pending'
                  ? 'Menunggu tinjauan'
                  : proposal.state === 'accepted'
                    ? 'Diterima'
                    : 'Ditolak'}
              </strong>
              <small>{relativeDate(proposal.created)}</small>
            </div>
            <p>{proposal.language} · {proposal.perspective}</p>
            <details open={proposal.state === 'pending'}>
              <summary>Bandingkan tulisan</summary>
              <div class="wiki-compare">
                {#if page.revision}<div>
                    <h3>Revisi saat ini</h3>
                    <div class="post-markdown">
                      {@html markdown(page.revision.text)}
                    </div>
                  </div>{/if}
                <div>
                  <h3>Usulan</h3>
                  <div class="post-markdown">
                    {@html markdown(proposal.text)}
                  </div>
                </div>
              </div>
            </details>
            {#each proposal.citations as url}<a
                class="strata-source"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                {url}
              </a>{/each}
            {#if proposal.state === 'pending' && steward}<div
                class="wiki-review-actions"
              >
                <Button
                  disabled={busy}
                  onclick={() => onDecide(proposal, true)}
                >
                  Terima revisi
                </Button><Button
                  variant="outline"
                  disabled={busy}
                  onclick={() => onDecide(proposal, false)}
                >
                  Tolak
                </Button>
              </div>{/if}
          </article>{/each}
      </section>{/if}
    {#if steward}<WikiPolicy communityId={page.community_id} />{/if}
  </article>
{:else}
  <section class="knowledge-atlas">
    <header>
      <div class="wiki-atlas-mark"><BookOpen size={22} /></div>
      <h1>Pengetahuan bersama</h1>
      <p>Tempat, cerita & pengetahuan yang terus tumbuh.</p>
      {#if memberships.some((m) => m.role !== 'member')}<Button
          variant="outline"
          onclick={onCreate}
        >
          <Plus size={16} />Tulis halaman
        </Button>{/if}
    </header>
    <label class="atlas-search">
      <Search size={18} /><Input
        bind:value={query}
        aria-label="Cari pengetahuan"
        placeholder="Cari halaman…"
      />
    </label>
    {#if contexts.length}<nav
        class="atlas-lenses"
        aria-label="Jelajahi pengetahuan"
      >
        <button aria-pressed={!context} onclick={() => (context = '')}>
          Semua
        </button>
        {#each contexts as c}<button
            aria-pressed={context === c.slug}
            onclick={() => (context = c.slug)}
          >
            {#if c.kind === 'place' || c.kind === 'region'}<MapPin
                size={14}
              />{/if}{c.title}
          </button>{/each}
      </nav>{/if}
    <div class="atlas-page-list">
      {#each filtered as p}<a href={'/wiki/' + p.id}>
          <BookOpen size={20} />
          <div>
            <h2>{p.title}</h2>
            <small>
              {communities.find((c) => c.id === p.community_id)?.title} · {p.revision_id
                ? 'Revisi diterima'
                : 'Draf'}
            </small>
          </div>
          <ArrowUpRight size={17} />
        </a>{/each}{#if !filtered.length}<div class="wiki-draft-state">
          <BookOpen size={27} />
          <h2>
            {query || context
              ? 'Belum ada halaman yang cocok'
              : 'Mulai dari cerita yang kamu kenal'}
          </h2>
          <p>
            Halaman yang diterima menjadi pengetahuan bersama. Draf tetap dalam
            tinjauan.
          </p>
        </div>{/if}
    </div>
  </section>
{/if}
