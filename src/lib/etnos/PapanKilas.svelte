<script lang="ts">
  /**
   * Papan Kilas: a Solari split-flap board, three rows (Berita / Forum /
   * Komunitas), each flipping through its own pool on a calm clock. The
   * text line is divided into equal cells that fold in a staggered
   * left-to-right sweep: per-CELL half-fold, never per-character, so the
   * board reads like a real departure board while staying cheap on budget
   * phones. Day-clock seeded so every reader sees the same board on the
   * same day. Berita rows are external press (contoh-labeled until the
   * detak feed is live); Forum rows are real posts.
   */
  import { env } from '$env/dynamic/public'
  import { t } from '$lib/app/i18n'
  import directory from '$lib/etnos/data/directory.json'
  import { fetchHotPosts } from '$lib/etnos/hot'
  import { fetchKilas, KILAS_CONTOH } from '$lib/etnos/kilas-data'
  import { daySeed, rngFrom } from '$lib/etnos/seed'
  import { postLink } from '$lib/feature/post/helpers'
  import { DataChip } from './ui'

  interface Flap {
    teks: string
    sub: string
    href?: string
    external?: boolean
  }

  const SEGS = 6
  const FLIP_MS = 320
  const STAGGER_MS = 45
  const TICK_MS = 6000

  const komunitasPool: Flap[] = directory.groups.flatMap((g) =>
    g.communities.map((c) => ({
      teks: c.name,
      sub: c.subtitle ?? g.category,
      href: `/c/${c.slug}`,
    })),
  )

  let beritaLive = $state(false)
  let beritaPool = $state<Flap[]>(
    KILAS_CONTOH.map((k) => ({
      teks: k.teks,
      sub: k.src,
      href: k.url,
      external: true,
    })),
  )

  let forumPool = $state<Flap[]>([])

  $effect(() => {
    fetchHotPosts().then((posts) => {
      forumPool = posts.slice(0, 6).map((p) => ({
        teks: p.post.name,
        sub: `${p.community.title} · ▲${p.counts.score}`,
        href: postLink(p.post),
      }))
    })
    fetchKilas(env.PUBLIC_DETAK_URL as string | undefined).then((kilas) => {
      if (kilas) {
        beritaLive = true
        beritaPool = kilas.map((k) => ({
          teks: k.teks,
          sub: k.src,
          href: k.url,
          external: true,
        }))
      }
    })
  })

  type Row = { key: 'berita' | 'forum' | 'komunitas'; pool: Flap[] }
  // Empty pools drop their row instead of flipping blanks.
  let rows = $derived(
    (
      [
        { key: 'berita', pool: beritaPool },
        { key: 'forum', pool: forumPool },
        { key: 'komunitas', pool: komunitasPool },
      ] as Row[]
    ).filter((r) => r.pool.length),
  )

  // Day-seeded starting positions so the board is the same for everyone today.
  const rng = rngFrom(daySeed('papan-kilas'))
  const seedOffsets = Array.from({ length: 3 }, () => rng())

  let indices = $state([0, 0, 0])
  let flipping = $state([false, false, false])
  let cursor = 0

  $effect(() => {
    indices = rows.map((r, i) => Math.floor(seedOffsets[i]! * r.pool.length))
  })

  const SWAP_AT = FLIP_MS / 2 + ((SEGS - 1) * STAGGER_MS) / 2
  const DONE_AT = FLIP_MS + (SEGS - 1) * STAGGER_MS

  $effect(() => {
    if (rows.length === 0) return
    const timer = setInterval(() => {
      const row = cursor % rows.length
      cursor++
      if (rows[row]!.pool.length < 2) return
      flipping[row] = true
      setTimeout(() => {
        indices[row] = (indices[row]! + 1) % rows[row]!.pool.length
      }, SWAP_AT)
      setTimeout(() => {
        flipping[row] = false
      }, DONE_AT)
    }, TICK_MS)
    return () => clearInterval(timer)
  })

  // Papua wall clock, refreshed on a slow tick.
  function witNow() {
    return (
      new Date(Date.now() + 9 * 3600_000)
        .toISOString()
        .slice(11, 16)
        .replace(':', '.') + ' WIT'
    )
  }
  let wit = $state(witNow())
  $effect(() => {
    const timer = setInterval(() => (wit = witNow()), 30_000)
    return () => clearInterval(timer)
  })
</script>

<section
  class="papan bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 overflow-hidden"
>
  <div
    class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-zinc-800"
  >
    <h2 class="font-semibold dark:text-white">Papan Kilas</h2>
    <div class="flex items-center gap-3">
      <DataChip
        state={beritaLive ? 'langsung' : 'contoh'}
        label={$t('etnos.papan.berita_src')}
      />
      <span
        class="text-xs text-slate-400 dark:text-zinc-500 tabular-nums whitespace-nowrap"
      >
        {wit}
      </span>
    </div>
  </div>

  <div class="flex flex-col px-2 sm:px-3 py-1.5">
    {#each rows as row, i (row.key)}
      {@const item = row.pool[Math.min(indices[i] ?? 0, row.pool.length - 1)]!}
      <div class="row">
        <span class="tag">{$t(`etnos.papan.rows.${row.key}`)}</span>
        <svelte:element
          this={item.href ? 'a' : 'span'}
          class="flapline"
          href={item.href}
          target={item.external ? '_blank' : undefined}
          rel={item.external ? 'noopener' : undefined}
        >
          {#each Array(SEGS) as _, j (j)}
            <span
              class="cell"
              class:flip={flipping[i]}
              style="--j:{j}"
            >
              <span class="clip">{item.teks}</span>
            </span>
          {/each}
        </svelte:element>
        <span class="sub hidden sm:inline">{item.sub}</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .papan {
    perspective: 700px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 7px 8px;
    border-bottom: 1px solid rgb(0 0 0 / 0.06);
  }
  :global(.dark) .row {
    border-bottom-color: rgb(255 255 255 / 0.06);
  }
  .row:last-child {
    border-bottom: none;
  }
  .tag {
    width: 84px;
    flex: none;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary-600);
  }
  :global(.dark) .tag {
    color: var(--color-primary-400);
  }
  .flapline {
    flex: 1;
    min-width: 0;
    display: flex;
    text-decoration: none;
    color: inherit;
    /* right-edge fade so the last cell truncates softly */
    mask-image: linear-gradient(to right, black 92%, transparent);
  }
  a.flapline:hover .clip {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--color-primary-500);
  }
  .cell {
    flex: 1 1 0;
    min-width: 0;
    position: relative;
    overflow: hidden;
    height: 28px;
    border-right: 1px solid rgb(0 0 0 / 0.07);
    background: rgb(0 0 0 / 0.025);
    transform-origin: center top;
    backface-visibility: hidden;
  }
  .cell:first-child {
    border-radius: 4px 0 0 4px;
  }
  .cell:last-child {
    border-right: none;
    border-radius: 0 4px 4px 0;
  }
  :global(.dark) .cell {
    border-right-color: rgb(255 255 255 / 0.12);
    background: rgb(255 255 255 / 0.06);
  }
  /* the split-flap midline every real board carries */
  .cell::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: rgb(0 0 0 / 0.05);
    pointer-events: none;
  }
  :global(.dark) .cell::after {
    background: rgb(255 255 255 / 0.09);
  }
  .clip {
    position: absolute;
    top: 0;
    line-height: 28px;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    padding-left: 8px;
    /* each cell shows the next slice of one continuous string:
       -100% here is a cell width, cells are equal flex columns */
    left: calc(var(--j) * -100%);
  }
  .cell.flip {
    animation: flap 0.32s cubic-bezier(0.7, 0, 0.3, 1);
    animation-delay: calc(var(--j) * 45ms);
  }
  @keyframes flap {
    0% {
      transform: rotateX(0);
    }
    49% {
      transform: rotateX(-88deg);
    }
    51% {
      transform: rotateX(-88deg);
    }
    100% {
      transform: rotateX(0);
    }
  }
  .sub {
    flex: none;
    max-width: 30%;
    font-size: 11px;
    color: var(--color-slate-500);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.dark) .sub {
    color: var(--color-zinc-400);
  }
  @media (prefers-reduced-motion: reduce) {
    .cell.flip {
      animation: none;
    }
  }
</style>
