<script lang="ts">
  /**
   * KILAS: the news marquee, ported from detak-detik's front-page ticker
   * (ink strip, terracotta source tab, duplicated belt, pause on hover).
   * News and posts never share a surface: this strip is EXTERNAL press
   * only. Baked sample is labeled CONTOH on the tab itself; when
   * PUBLIC_DETAK_URL is set, the detak worker's hourly /ticker feed
   * flips it to LANGSUNG. Links go out as-is — no tracking, no rewrite.
   */
  import { env } from '$env/dynamic/public'

  interface TickerItem {
    src: string
    teks: string
    url?: string
  }

  // Sample rundown, Papua-framed: real outlets, generic texts, homepage
  // links only (never fake article URLs) — detak's edisi-contoh doctrine.
  const CONTOH: TickerItem[] = [
    { src: 'JUBI', teks: 'Liputan layanan kesehatan kampung di pegunungan tengah', url: 'https://jubi.id' },
    { src: 'BMKG', teks: 'Prakiraan cuaca Tanah Papua: hujan sore di pesisir utara', url: 'https://www.bmkg.go.id' },
    { src: 'SUARA PAPUA', teks: 'Warga soroti akses pendidikan di kabupaten pemekaran', url: 'https://suarapapua.com' },
    { src: 'GFW', teks: 'Peringatan deforestasi terdeteksi di koridor selatan', url: 'https://www.globalforestwatch.org' },
    { src: 'ANTARA', teks: 'Pembangunan infrastruktur distrik dilaporkan berlanjut', url: 'https://papua.antaranews.com' },
    { src: 'BPS', teks: 'Rilis data sosial-ekonomi provinsi terbaru', url: 'https://papua.bps.go.id' },
  ]

  let items = $state<TickerItem[]>(CONTOH)
  let live = $state(false)

  const DETAK_URL = (env.PUBLIC_DETAK_URL as string | undefined)?.replace(
    /\/$/,
    '',
  )

  $effect(() => {
    if (!DETAK_URL) return
    ;(async () => {
      try {
        const res = await fetch(`${DETAK_URL}/ticker`, {
          signal: AbortSignal.timeout(6000),
        })
        if (res.status !== 200) return
        const d: unknown = await res.json()
        const arr = Array.isArray(d) ? d : (d as { items?: unknown[] }).items
        if (!Array.isArray(arr) || !arr.length) return
        const parsed = arr
          .map((x) => x as Record<string, unknown>)
          .filter((x) => typeof x.teks === 'string')
          .map((x) => ({
            src: String(x.src ?? ''),
            teks: String(x.teks),
            url: typeof x.url === 'string' ? x.url : undefined,
          }))
        if (parsed.length) {
          items = parsed
          live = true
        }
      } catch {
        /* baked contoh keeps the strip honest when the feed is dark */
      }
    })()
  })
</script>

<div
  class="ticker"
  aria-label="Berita kilat dari media lain, tautan keluar apa adanya"
>
  <span class="ticker-tab">
    <i class="pulse-dot" aria-hidden="true"></i>
    KILAS · {live ? 'LANGSUNG' : 'CONTOH'}
  </span>
  <div class="ticker-belt">
    <div class="ticker-track">
      {#each [0, 1] as half (half)}
        {#each items as item, i (`${half}-${i}`)}
          {#if item.url}
            <a
              class="ticker-link"
              href={item.url}
              target="_blank"
              rel="noopener"
            >
              <span class="src">{item.src}</span>
              {item.teks}
            </a>
          {:else}
            <span class="ticker-link">
              <span class="src">{item.src}</span>
              {item.teks}
            </span>
          {/if}
          <span class="sep" aria-hidden="true">●</span>
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  /* detak base.css ticker, remapped onto the etnos theme vars */
  .ticker {
    display: flex;
    align-items: stretch;
    background: var(--etnos-ink);
    color: var(--etnos-bg);
    overflow: hidden;
    white-space: nowrap;
    font-family: var(--font-mono);
    font-size: 12.5px;
  }
  .ticker-tab {
    flex: none;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--etnos-accent);
    color: #15130e;
    font-size: 10px;
    letter-spacing: 0.2em;
    padding: 9px 14px;
    font-weight: 700;
  }
  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #15130e;
    animation: tdot 1.4s ease-in-out infinite;
  }
  @keyframes tdot {
    50% {
      opacity: 0.25;
    }
  }
  .ticker-belt {
    overflow: hidden;
    flex: 1;
    mask-image: linear-gradient(90deg, transparent, black 4%, black 96%, transparent);
    padding: 9px 0;
  }
  .ticker-track {
    display: inline-block;
    padding-left: 100%;
    animation: tick 90s linear infinite;
  }
  @media (max-width: 760px) {
    .ticker-track {
      animation-duration: 120s;
    }
  }
  .ticker:hover .ticker-track {
    animation-play-state: paused;
  }
  .ticker .src {
    color: var(--etnos-accent);
    font-weight: 600;
  }
  .ticker-tab .src {
    color: inherit;
  }
  .ticker .sep {
    opacity: 0.45;
    margin: 0 14px;
  }
  .ticker-link {
    color: inherit;
    text-decoration: none;
  }
  .ticker-link:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  @keyframes tick {
    to {
      transform: translateX(-100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ticker-track {
      animation: none;
      padding-left: 0;
    }
  }
</style>
