<script lang="ts">
  import {
    MessageCircle,
    ArrowUpRight,
    ArrowRight,
    ClipboardList,
    Plus,
    RefreshCw,
  } from '@lucide/svelte'
  import { request, type Post, type Auth } from './api'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import { Button } from '$lib/components/ui/button/index.js'
  import ContentSkeleton from './ContentSkeleton.svelte'
  let {
    auth,
    compact = false,
    onAsk,
    communityId = '',
  }: {
    auth: Auth
    compact?: boolean
    onAsk?: () => void
    communityId?: string
  } = $props()
  type Work = {
    id: string
    title: string
    state: string
    origin_post_id: string | null
    sponsor: { title: string }
    result: { id: string; text: string } | null
  }
  let questions = $state<Post[]>([]),
    works = $state<Work[]>([]),
    pending = $state(true),
    error = $state(''),
    cursor = $state<string | null>(null),
    mode = $state('open'),
    revision = $state(0),
    moreBusy = $state(false)
  const displayed = $derived(
    questions
      .filter((p) => (mode === 'closed' ? p.poll?.closed : !p.poll?.closed))
      .slice(0, compact ? 3 : questions.length),
  )
  const reports = $derived(works.filter((w) => w.result && w.origin_post_id))
  function query() {
    const q = new SvelteURLSearchParams({
      roots: 'true',
      polls: 'true',
      limit: '20',
    })
    if (communityId) q.set('community', communityId)
    return q
  }
  $effect(() => {
    const actor = auth.actor?.id,
      q = query(),
      abort = new AbortController()
    void revision
    pending = true
    error = ''
    questions = []
    works = []
    Promise.all([
      request<{ items: Post[]; nextCursor: string | null }>(
        '/v1/feed/page?' + q,
        undefined,
        abort.signal,
      ),
      request<Work[]>('/v1/work', undefined, abort.signal),
    ])
      .then(([feed, work]) => {
        if (!abort.signal.aborted && actor === auth.actor?.id) {
          questions = feed.items
          cursor = feed.nextCursor
          works = work
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted) error = e.message
      })
      .finally(() => {
        if (!abort.signal.aborted) pending = false
      })
    return () => abort.abort()
  })
  async function more() {
    if (!cursor || moreBusy) return
    moreBusy = true
    try {
      const q = query()
      q.set('cursor', cursor)
      const feed = await request<{ items: Post[]; nextCursor: string | null }>(
        '/v1/feed/page?' + q,
      )
      questions = [
        ...questions,
        ...feed.items.filter((p) => !questions.some((old) => old.id === p.id)),
      ]
      cursor = feed.nextCursor
    } catch (e) {
      error = e instanceof Error ? e.message : 'Belum dapat memuat pertanyaan.'
    } finally {
      moreBusy = false
    }
  }
</script>

<section class="engagement-page" class:engagement-compact={compact}>
  <header>
    <div>
      <span class="engagement-label">
        <MessageCircle size={16} />Suara komunitas
      </span>
      {#if !compact}<h1>Pertanyaan & tindak lanjut</h1>
        <p>Jajak pendapat, laporan & langkah bersama.</p>{/if}
    </div>
    {#if compact}<a href="/voices">
        Lihat semua <ArrowUpRight size={14} />
      </a>{:else if onAsk}<Button variant="outline" onclick={onAsk}>
        <Plus size={16} />Ajukan pertanyaan
      </Button>{/if}
  </header>
  {#if !compact}<nav class="directory-tabs" aria-label="Partisipasi komunitas">
      {#each [['open', 'Terbuka'], ['closed', 'Ditutup'], ['reports', 'Laporan & tindak lanjut']] as [id, label]}<button
          aria-current={mode === id ? 'page' : undefined}
          onclick={() => (mode = id)}
        >
          {label}
        </button>{/each}
    </nav>{/if}
  {#if pending}<ContentSkeleton rows={1} />{:else if error}<p
      class="search-state"
      role="alert"
    >
      {error}<Button variant="ghost" onclick={() => revision++}>
        <RefreshCw size={14} />Coba lagi
      </Button>
    </p>{:else if mode === 'reports'}
    {#each reports as work}<a
        class="engagement-question"
        href={'/work/' + work.id}
      >
        <ClipboardList size={20} />
        <div>
          <h2>{work.title}</h2>
          <p>
            {work.sponsor.title} · {work.state === 'completed'
              ? 'Selesai'
              : 'Hasil diterbitkan'}
          </p>
        </div>
        <ArrowUpRight size={16} />
      </a>{/each}{#if !reports.length}<p class="engagement-empty">
        Laporan yang diterbitkan sponsor akan muncul di sini.
      </p>{/if}
  {:else}{#each displayed as post}<a
        class="engagement-question"
        href={'/square/' + post.id}
      >
        <span class="question-status" class:closed={post.poll?.closed}></span>
        <div>
          <h2>{post.content?.title || post.text}</h2>
          <p>
            {post.poll?.total ?? 0} jawaban · {post.poll?.closed
              ? 'Ditutup'
              : `Sampai ${new Intl.DateTimeFormat('id', { day: 'numeric', month: 'short' }).format(post.poll!.closesAt)}`}
          </p>
          {#if works.find((w) => w.origin_post_id === post.id)}<small>
              Tindak lanjut · {works.find((w) => w.origin_post_id === post.id)
                ?.sponsor.title}
            </small>{/if}
        </div>
        <ArrowUpRight size={16} />
      </a>{/each}{#if !displayed.length}<p class="engagement-empty">
        Belum ada pertanyaan {mode === 'closed' ? 'yang ditutup' : 'terbuka'} yang
        dimuat.
      </p>{/if}
    {#if !compact && cursor}<Button
        variant="ghost"
        disabled={moreBusy}
        onclick={more}
      >
        Muat pertanyaan lain
      </Button>{/if}
  {/if}
  {#if !compact}<footer>
      <p>
        Jawaban bersifat sukarela. Hasil menggambarkan peserta yang menjawab,
        bukan survei representatif atau pemungutan suara rahasia.
      </p>
      <a href="/work">Jelajahi kerja publik <ArrowRight size={14} /></a>
    </footer>{/if}
</section>
