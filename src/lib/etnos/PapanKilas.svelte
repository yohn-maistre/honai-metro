<script lang="ts">
  /**
   * Papan Kilas: a split-flap board with four rows (Berita / Forum /
   * Komunitas / Kata), each flipping through its own pool one at a time
   * on a calm clock. Per-row half-fold flip only, never per-character,
   * to stay light on budget phones. Day-clock seeded so every reader
   * sees the same board on the same day. Berita rows are external press
   * (labeled until the detak feed is live); Forum rows are real posts.
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
      tag: 'Komunitas',
      teks: c.name,
      sub: c.subtitle ?? g.category,
      href: `/c/${c.slug}`,
    })),
  )

  const kataPool: Flap[] = kata.words.map((w) => ({
    tag: 'Kata',
    teks: `${w.word}: ${w.meaning}`,
    sub: `${w.language} · ${w.region}`,
    href: '/wiki',
  }))

  let beritaPool = $state<Flap[]>(
    KILAS_CONTOH.map((k) => ({
      tag: 'Berita',
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
        tag: 'Forum',
        teks: p.post.name,
        sub: `${p.community.title} · ▲${p.counts.score}`,
        href: postLink(p.post),
      }))
    })
    fetchKilas(env.PUBLIC_DETAK_URL as string | undefined).then((kilas) => {
      if (kilas)
        beritaPool = kilas.map((k) => ({
          tag: 'Berita',
          teks: k.teks,
          sub: `${k.src} · langsung`,
          href: k.url,
          external: true,
        }))
    })
  })

  // Empty pools drop their row instead of flipping blanks.
  let pools = $derived(
    [beritaPool, forumPool, komunitasPool, kataPool].filter((p) => p.length),
  )

  // Day-seeded starting positions so the board is the same for everyone today.
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

<section
  class="papan bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden"
>
  <div
    class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-zinc-800"
  >
    <h2 class="font-semibold dark:text-white">Papan Kilas</h2>
    <span class="text-xs text-slate-400 dark:text-zinc-500">
      berganti tiap hari
    </span>
  </div>
  <div class="flex flex-col px-2 sm:px-3 py-1">
    {#each pools as pool, i (pool[0]?.tag)}
      {@const item = pool[Math.min(indices[i] ?? 0, pool.length - 1)]}
      <div class="row" class:flap={flipping[i]}>
        <span class="tag">{item.tag}</span>
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
        <span class="sub hidden sm:inline">{item.sub}</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .papan {
    perspective: 600px;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 9px 8px;
    border-bottom: 1px solid rgb(0 0 0 / 0.06);
    transform-origin: center top;
    backface-visibility: hidden;
  }
  :global(.dark) .row {
    border-bottom-color: rgb(255 255 255 / 0.06);
  }
  .row:last-child {
    border-bottom: none;
  }
  .row.flap {
    animation: flap 0.32s cubic-bezier(0.7, 0, 0.3, 1);
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
    width: 84px;
    flex: none;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary-600);
  }
  .teks {
    font-size: 14px;
    font-weight: 500;
    color: inherit;
    text-decoration: none;
    flex: 1;
    min-width: 0;
  }
  a.teks:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--color-primary-500);
  }
  .sub {
    flex: none;
    font-size: 11px;
    color: var(--color-slate-500);
  }
  :global(.dark) .sub {
    color: var(--color-zinc-500);
  }
  @media (prefers-reduced-motion: reduce) {
    .row.flap {
      animation: none;
    }
  }
</style>
