<script lang="ts">
  /**
   * KILAS: the news marquee. External press only, never forum posts.
   * The baked sample is labeled "contoh" on the tab; when
   * PUBLIC_DETAK_URL is set, the detak worker's hourly /ticker feed
   * flips it to "langsung". Links go out as-is, no tracking, no rewrite.
   */
  import { env } from '$env/dynamic/public'
  import {
    fetchKilas,
    KILAS_CONTOH,
    type TickerItem,
  } from '$lib/etnos/kilas-data'

  let items = $state<TickerItem[]>(KILAS_CONTOH)
  let live = $state(false)

  $effect(() => {
    fetchKilas(env.PUBLIC_DETAK_URL as string | undefined).then((parsed) => {
      if (parsed) {
        items = parsed
        live = true
      }
    })
  })
</script>

<div
  class="ticker flex items-stretch overflow-hidden rounded-xl bg-slate-900 text-slate-50"
  aria-label="Berita kilat dari media lain, tautan keluar apa adanya"
>
  <span
    class="flex-none flex items-center gap-2 bg-primary-500 text-white text-[11px] font-semibold uppercase tracking-wider px-3.5"
  >
    <span class="pulse-dot" aria-hidden="true"></span>
    Kilas {live ? 'langsung' : 'contoh'}
  </span>
  <div class="belt overflow-hidden flex-1 py-2.5">
    <div class="track text-[13px]">
      {#each [0, 1] as half (half)}
        {#each items as item, i (`${half}-${i}`)}
          {#if item.url}
            <a
              class="link"
              href={item.url}
              target="_blank"
              rel="noopener"
            >
              <span class="src">{item.src}</span>
              {item.teks}
            </a>
          {:else}
            <span class="link">
              <span class="src">{item.src}</span>
              {item.teks}
            </span>
          {/if}
          <span class="sep" aria-hidden="true">•</span>
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    animation: tdot 1.4s ease-in-out infinite;
  }
  @keyframes tdot {
    50% {
      opacity: 0.25;
    }
  }
  .belt {
    white-space: nowrap;
    -webkit-mask-image: linear-gradient(
      90deg,
      transparent,
      black 4%,
      black 96%,
      transparent
    );
    mask-image: linear-gradient(
      90deg,
      transparent,
      black 4%,
      black 96%,
      transparent
    );
  }
  .track {
    display: inline-block;
    padding-left: 100%;
    animation: tick 90s linear infinite;
  }
  @media (max-width: 760px) {
    .track {
      animation-duration: 120s;
    }
  }
  .ticker:hover .track {
    animation-play-state: paused;
  }
  .src {
    color: var(--color-primary-400);
    font-weight: 600;
    margin-right: 4px;
  }
  .sep {
    opacity: 0.4;
    margin: 0 14px;
  }
  .link {
    color: inherit;
    text-decoration: none;
  }
  .link:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  @keyframes tick {
    to {
      transform: translateX(-100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .track {
      animation: none;
      padding-left: 0;
      white-space: normal;
    }
  }
</style>
