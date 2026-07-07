<script lang="ts">
  /**
   * Papan Kilas: the split-flap arrival board — four rows (BERITA /
   * FORUM / KOMUNITAS / KATA), each flipping through its own pool like
   * a Solari placard. Per-ROW half-fold flip only (one CSS transform,
   * never per-character — budget phones), one row advances at a time
   * on a calm clock. Day-clock seeded: every reader sees the same
   * board on the same day. Sources are honest: BERITA rows carry the
   * contoh label until the detak feed is live; FORUM rows are real
   * posts; KOMUNITAS and KATA come from the curated directories.
   */
  import { env } from '$env/dynamic/public'
  import directory from '$lib/etnos/data/directory.json'
  import { fetchHotPosts } from '$lib/etnos/hot'
  import { fetchKilas, KILAS_CONTOH } from '$lib/etnos/kilas-data'
  import { daySeed, rngFrom } from '$lib/etnos/seed'
  import kata from '$lib/etnos/wiki/kata-hari-ini.json'
  import { postLink } from '$lib/feature/post/helpers'

  interface Flap {
    tag: string
    teks: string
    sub: string
    href?: string
    external?: boolean
  }

  const komunitasPool: Flap[] = directory.groups.flatMap((g) =>
    g.communities.map((c) => ({
      tag: 'KOMUNITAS',
      teks: c.name,
      sub: c.subtitle ?? g.category,
      href: `/c/${c.slug}`,
    })),
  )

  const kataPool: Flap[] = kata.words.map((w) => ({
    tag: 'KATA',
    teks: `${w.word} — ${w.meaning}`,
    sub: `${w.language} · ${w.region}`,
    href: '/wiki',
  }))

  let beritaPool = $state<Flap[]>(
    KILAS_CONTOH.map((k) => ({
      tag: 'BERITA',
      teks: k.teks,
      sub: `${k.src} · contoh`,
      href: k.url,
      external: true,
    })),
  )

  let forumPool = $state<Flap[]>([])

  $effect(() => {
    fetchHotPosts().then((posts) => {
      forumPool = posts.slice(0, 6).map((p) => ({
        tag: 'FORUM',
        teks: p.post.name,
        sub: `${p.community.title} · ▲${p.counts.score}`,
        href: postLink(p.post),
      }))
    })
    fetchKilas(env.PUBLIC_DETAK_URL as string | undefined).then((items) => {
      if (items)
        beritaPool = items.map((k) => ({
          tag: 'BERITA',
          teks: k.teks,
          sub: `${k.src} · langsung`,
          href: k.url,
          external: true,
        }))
    })
  })

  // The FORUM row only exists when the backend answered; empty pools
  // drop their row instead of flipping blanks.
  let pools = $derived(
    [beritaPool, forumPool, komunitasPool, kataPool].filter((p) => p.length),
  )

  // Day-seeded starting positions — same board for every reader today.
  const rng = rngFrom(daySeed('papan-kilas'))
  const seedOffsets = Array.from({ length: 4 }, () => rng())

  let indices = $state([0, 0, 0, 0])
  let flipping = $state([false, false, false, false])
  let cursor = 0

  $effect(() => {
    indices = pools.map((p, i) => Math.floor(seedOffsets[i] * p.length))
  })

  const FLIP_MS = 320
  const TICK_MS = 6000

  $effect(() => {
    if (pools.length === 0) return
    const timer = setInterval(() => {
      const row = cursor % pools.length
      cursor++
      if (pools[row].length < 2) return
      flipping[row] = true
      setTimeout(() => {
        indices[row] = (indices[row] + 1) % pools[row].length
      }, FLIP_MS / 2)
      setTimeout(() => {
        flipping[row] = false
      }, FLIP_MS)
    }, TICK_MS)
    return () => clearInterval(timer)
  })
</script>

<div
  class="papan bg-white dark:bg-zinc-900 border border-slate-900/70 dark:border-zinc-700"
>
  <div class="flex items-center justify-between gap-3 px-3 pt-3">
    <span class="inkbar"><span class="dot">●</span>Papan Kilas</span>
    <span class="serial">berganti tiap hari · sama untuk semua pembaca</span>
  </div>
  <div class="flex flex-col px-3 py-2">
    {#each pools as pool, i (pool[0]?.tag)}
      {@const item = pool[Math.min(indices[i] ?? 0, pool.length - 1)]}
      <div class="row" class:flap={flipping[i]}>
        <span class="tag serial shrink-0">{item.tag}</span>
        {#if item.href}
          <a
            class="teks truncate"
            href={item.href}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener' : undefined}
          >
            {item.teks}
          </a>
        {:else}
          <span class="teks truncate">{item.teks}</span>
        {/if}
        <span class="sub serial shrink-0 hidden sm:inline">{item.sub}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .papan {
    perspective: 600px;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 7px 2px;
    border-bottom: 1px solid
      color-mix(in oklab, var(--etnos-line) 25%, transparent);
    transform-origin: center top;
    backface-visibility: hidden;
  }
  .row:last-child {
    border-bottom: none;
  }
  .row.flap {
    animation: flap 0.32s var(--ease-etnos);
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
  .tag {
    width: 88px;
  }
  .teks {
    font-family: var(--font-display);
    font-weight: 650;
    font-size: 14.5px;
    color: inherit;
    text-decoration: none;
    flex: 1;
    min-width: 0;
  }
  a.teks:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--etnos-accent);
  }
  @media (prefers-reduced-motion: reduce) {
    .row.flap {
      animation: none;
    }
  }
</style>
