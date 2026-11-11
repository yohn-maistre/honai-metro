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
    ArrowRight,
    Clock3,
    Shuffle,
    Type,
  } from '@lucide/svelte'
  import { markdown } from './markdown'
  import { wikiDiff, languageName } from './wiki-diff'
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
      author?: { id: string; name: string; kind: string }
      reviewer?: { id: string; name: string; kind: string }
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
  type Growing={id:string;community_id:string;title:string;excerpt:string;updated:number;citationCount:number;author:{id:string;name:string;kind:string};evidenceStatus:string}
  let growing=$state<Growing[]>([]),growingError=$state('')
  const growingMatches=$derived(growing.filter(p=>p.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(!communityFilter||p.community_id===communityFilter)&&!context))
  $effect(()=>{const controller=new AbortController();request<Growing[]>('/v1/wiki/growing',undefined,controller.signal).then(rows=>{if(!controller.signal.aborted)growing=rows}).catch(()=>{if(!controller.signal.aborted)growingError='Halaman dalam pengembangan belum dapat dimuat.'});return()=>controller.abort()})
  type Preview={id:string;community_id:string;title:string;revision_id:string;excerpt:string;updated:number;language:string;citationCount:number;sectionCount:number}
  let discoveries=$state<Preview[]>([]),discovering=$state(true),discoveryError=$state(''),communityFilter=$state(''),lastReadId=$state(''),readingSize=$state('normal')
  const accepted=$derived(discoveries.filter(p=>p.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(!contextPages||contextPages.includes(p.id))&&(!communityFilter||communityFilter===p.community_id)))
  const featured=$derived(accepted[0]),continued=$derived(discoveries.find(p=>p.id===lastReadId)),recent=$derived(accepted.slice(1,7)),groups=$derived(communities.map(c=>({...c,count:discoveries.filter(p=>p.community_id===c.id).length})).filter(c=>c.count))
  function surprise(){if(accepted.length)location.assign('/wiki/'+accepted[Math.floor(Math.random()*accepted.length)].id)}
  function resize(size:string){readingSize=size;try{localStorage.setItem('strata.ui.wiki-text',size)}catch{/* Optional device preference. */}}
  async function discover(signal:AbortSignal|undefined=undefined){discovering=true;discoveryError='';try{const rows=await request<Preview[]>('/v1/wiki/discover',undefined,signal);if(!signal?.aborted)discoveries=rows}catch{if(!signal?.aborted)discoveryError='Halaman belum dapat dimuat.'}finally{if(!signal?.aborted)discovering=false}}
  $effect(()=>{const controller=new AbortController();void discover(controller.signal);try{lastReadId=localStorage.getItem('strata.ui.wiki-last')??'';readingSize=localStorage.getItem('strata.ui.wiki-text')==='large'?'large':'normal'}catch{};return()=>controller.abort()})
  $effect(()=>{if(page?.revision){try{localStorage.setItem('strata.ui.wiki-last',page.id)}catch{}}})
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
  const drafts=$derived(filtered.filter(p=>!p.revision_id&&(!communityFilter||communityFilter===p.community_id)))
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
  <article class="wiki-reader" class:wiki-large-text={readingSize==='large'}>
    <header class="wiki-page-header">
      <small>
        {communities.find((c) => c.id === page.community_id)?.title}
      </small>
      <h1>{page.title}</h1>
      <p>
        {page.revision
          ? `${languageName(page.revision.language)} · ${page.revision.perspective}`
          : 'Draf · Menunggu tinjauan manusia'}
      </p>
      {#if page.revision}<div class="wiki-provenance">
          <span>
            Ditulis oleh <strong>
              {page.revision.author?.name ?? 'Kontributor'}
            </strong>
            {#if page.revision.author?.kind === 'agent'}
              · Agen{/if}
          </span>
          <span>
            Ditinjau oleh <strong>
              {page.revision.reviewer?.name ?? 'Pengelola'}
            </strong>
            · {relativeDate(page.revision.created)}
          </span>
        </div>{/if}
      <div class="wiki-actions">
        {#if headings.length}<details class="wiki-contents">
            <summary>Dalam halaman <ChevronDown size={14} /></summary>
            <div class="wiki-history-popover">
              {#each headings as heading}<a href={'#' + heading.id}>
                  {heading.text}
                </a>{/each}
            </div>
          </details>{/if}
        <details class="wiki-reading-options"><summary><Type size={15}/>Teks</summary><div class="wiki-history-popover"><p>Ukuran tulisan</p><button aria-pressed={readingSize==='normal'} onclick={()=>resize('normal')}>Nyaman</button><button aria-pressed={readingSize==='large'} onclick={()=>resize('large')}>Lebih besar</button></div></details>
        {#if member}<Button variant="outline" onclick={onPropose}>
            <GitPullRequest size={15} />Usulkan perubahan
          </Button>{/if}
        <details>
          <summary><History size={15} />Riwayat</summary>
          <div class="wiki-history-popover">
            {#each history as rev}<p>
                <strong>{rev.perspective}</strong>
                <small>
                  {languageName(rev.language)} · {relativeDate(rev.created)}
                </small>
                {#if rev.author || rev.reviewer}<small>
                    {rev.author?.name ?? 'Kontributor'}{rev.author?.kind ===
                    'agent'
                      ? ' · Agen'
                      : ''} · ditinjau {rev.reviewer?.name ?? 'pengelola'}
                  </small>{/if}
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
        {#each proposals as proposal}{@const comparison = wikiDiff(
            page.revision?.text ?? '',
            proposal.text,
          )}
          <article class="wiki-review-card">
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
            <p>
              {proposal.author?.name ?? 'Kontributor'}{proposal.author?.kind ===
              'agent'
                ? ' · Agen'
                : ''} · {languageName(proposal.language)}
            </p>
            <p class="cx-hint">Atribusi tulisan: {proposal.perspective}</p>
            <details open={proposal.state === 'pending'}>
              <summary>Bandingkan tulisan</summary>
              <div class="wiki-change-legend">
                <span>Ditambahkan</span>
                <span>Dihapus</span>
              </div>
              {#if comparison.abbreviated}<p class="cx-hint">
                  Perubahan besar ditampilkan sebagai dua blok lengkap.
                </p>{/if}
              <div class="wiki-change-list" aria-label="Perubahan usulan">
                {#each comparison.changes as change}<div
                    class={'wiki-change ' + change.kind}
                  >
                    <span aria-hidden="true">
                      {change.kind === 'added'
                        ? '+'
                        : change.kind === 'removed'
                          ? '−'
                          : ' '}
                    </span>
                    <span class="sr-only">
                      {change.kind === 'added'
                        ? 'Ditambahkan: '
                        : change.kind === 'removed'
                          ? 'Dihapus: '
                          : ''}
                    </span>
                    {change.text || ' '}
                  </div>{/each}
              </div>
              <details class="wiki-full-versions">
                <summary>Baca kedua versi lengkap</summary>
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
  <section class="knowledge-atlas wiki-discovery">
    <header class="wiki-discovery-header">
      <div class="wiki-atlas-mark"><BookOpen size={22}/><span>Wiki ETNOS</span></div>
      <h1>Pengetahuan bersama</h1>
      <p>Cerita, tempat & pengetahuan yang terus tumbuh.</p>
      <div class="wiki-discovery-actions">{#if memberships.length}<a class="commons-quiet-link" href="/wiki/notes/new">Tambah catatan <Plus size={14}/></a>{/if}{#if memberships.some(m=>m.role!=='member')}<Button variant="outline" onclick={onCreate}><Plus size={15}/>Tulis halaman</Button>{/if}</div>
    </header>
    <div class="wiki-discovery-controls"><label class="atlas-search"><Search size={18}/><Input bind:value={query} aria-label="Cari pengetahuan" placeholder="Cari dalam Wiki…"/></label>
      {#if contexts.length}<nav class="atlas-lenses" aria-label="Jelajahi pengetahuan"><button aria-pressed={!context} onclick={()=>context=''}>Semua</button>{#each contexts as c}<button aria-pressed={context===c.slug} onclick={()=>context=c.slug}>{#if c.kind==='place'||c.kind==='region'}<MapPin size={14}/>{/if}{c.title}</button>{/each}</nav>{/if}
    </div>
    {#if discovering}<div class="wiki-discovery-loading" role="status">Menyiapkan bacaan…</div>{:else if discoveryError}<div class="wiki-draft-state"><p>{discoveryError}</p><Button variant="outline" onclick={()=>discover()}>Coba lagi</Button></div>{:else}
      {#if continued&&!query&&!context&&!communityFilter}<a class="wiki-continue" href={'/wiki/'+continued.id}><Clock3 size={17}/><div><small>Lanjutkan membaca · di perangkat ini</small><strong>{continued.title}</strong></div><ArrowRight size={18}/></a>{/if}
      {#if featured}<section class="wiki-featured" aria-label="Untuk dibaca"><div class="wiki-module-heading"><h2>Untuk dibaca</h2>{#if accepted.length>1}<button onclick={surprise}><Shuffle size={15}/>Halaman acak</button>{/if}</div>
        <a class="wiki-featured-article" href={'/wiki/'+featured.id}><span class="wiki-featured-scope">{communities.find(c=>c.id===featured.community_id)?.title??'Pengetahuan bersama'}</span><h2>{featured.title}</h2>{#if featured.excerpt}<p>{featured.excerpt}{featured.excerpt.length===360?'…':''}</p>{/if}<span class="wiki-featured-meta">{languageName(featured.language)}{featured.citationCount?' · '+featured.citationCount+' sumber':''}</span><span class="wiki-read-link">Baca halaman<ArrowRight size={17}/></span></a>
      </section>
      {#if recent.length}<section class="wiki-recent"><div class="wiki-module-heading"><h2>Baru dirawat</h2><span>Revisi diterima</span></div>{#each recent as p}<a class="wiki-recent-row" href={'/wiki/'+p.id}><BookOpen size={19}/><div><h3>{p.title}</h3><p>{p.excerpt}</p><small>{relativeDate(p.updated)} · {communities.find(c=>c.id===p.community_id)?.title}</small></div><ArrowUpRight size={17}/></a>{/each}</section>{/if}
      {:else if !growingMatches.length}<div class="wiki-draft-state"><BookOpen size={27}/><h2>{query||context||communityFilter?'Belum ada halaman yang cocok':'Cerita pertama dimulai dari kita.'}</h2><p>{query||context||communityFilter?'Coba kata atau pilihan lain.':'Halaman yang ditinjau bersama akan hadir di sini.'}</p></div>{/if}
      {#if growingMatches.length}<section class="wiki-growing" aria-label="Dalam pengembangan"><div class="wiki-module-heading"><h2>Dalam pengembangan</h2><span>Belum ditinjau menyeluruh</span></div><p class="wiki-growing-intro">Bacaan awal untuk diperiksa dan dilengkapi bersama.</p>{#each growingMatches as p}<a class="wiki-recent-row" href={'/wiki/notes/'+p.id}><FileText size={19}/><div><h3>{p.title}</h3><p>{p.excerpt}</p><small>{p.author.name}{p.author.kind==='agent'?' · Agen AI':''} · {p.citationCount?p.citationCount+' sumber':'Sumber belum ditautkan'}{p.evidenceStatus!=='current'?' · Sumber perlu ditinjau':''}</small></div><ArrowUpRight size={17}/></a>{/each}</section>{:else if growingError}<p class="commons-alert" role="status">{growingError}</p>{/if}
      {#if groups.length>1}<section class="wiki-browse"><div class="wiki-module-heading"><h2>Jelajahi komunitas</h2>{#if communityFilter}<button onclick={()=>communityFilter=''}>Lihat semua</button>{/if}</div><div class="wiki-community-grid">{#each groups as c}<button aria-pressed={communityFilter===c.id} onclick={()=>communityFilter=communityFilter===c.id?'':c.id}><BookOpen size={18}/><strong>{c.title}</strong><span>{c.count} halaman</span></button>{/each}</div></section>{/if}
      {#if drafts.length}<section class="wiki-drafts"><div class="wiki-module-heading"><h2>Dalam tinjauan</h2></div>{#each drafts as p}<a href={'/wiki/'+p.id}>{p.title}<span>Draf</span><ArrowUpRight size={15}/></a>{/each}</section>{/if}
    {/if}
    <footer class="wiki-discovery-footer"><BookOpen size={19}/><p>Pengetahuan terus tumbuh.<br/><a href="/knowledge">Bawa sumber atau catatan baru <ArrowRight size={13}/></a></p></footer>
  </section>
{/if}
