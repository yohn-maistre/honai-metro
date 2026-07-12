<script lang="ts">
  /**
   * KILAS: the news wire. External press only, never forum posts; the
   * wire is site chrome and renders for every visitor, so only vetted
   * outlet headlines belong here. The baked sample is labeled contoh;
   * when PUBLIC_DETAK_URL is set, the detak worker's hourly /ticker feed
   * flips it to langsung. Links go out as-is, no tracking, no rewrite.
   *
   * Broadsheet treatment: no band, no box. Ink text on whatever surface
   * hosts it (the navbar on md+, a paper strip on mobile), with a
   * mask-image fade on both edges so the belt dissolves into its host.
   */
  import { env } from '$env/dynamic/public'
  import {
    fetchKilas,
    KILAS_CONTOH,
    type TickerItem,
  } from '$lib/etnos/kilas-data'
  import type { ClassValue } from 'svelte/elements'

  interface Props {
    class?: ClassValue
  }

  let { class: clazz = '' }: Props = $props()

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
  class={['ticker flex items-center min-w-0', clazz]}
  aria-label="Berita kilat dari media lain, tautan keluar apa adanya"
>
  <span
    class="flex-none flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 pr-3"
    title={live
      ? 'Berita langsung dari Detak Detik'
      : 'Contoh berita, belum tersambung ke sumber langsung'}
  >
    <span class="pulse-dot" aria-hidden="true"></span>
    Kilas
    <span class="font-medium opacity-70">{live ? 'langsung' : 'contoh'}</span>
  </span>
  <div class="belt overflow-hidden flex-1 min-w-0 py-1">
    <div class="track text-[13px] text-slate-800 dark:text-zinc-200">
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
      black 6%,
      black 94%,
      transparent
    );
    mask-image: linear-gradient(
      90deg,
      transparent,
      black 6%,
      black 94%,
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
    color: var(--color-primary-600);
    font-weight: 600;
    margin-right: 4px;
  }
  :global(.dark) .src {
    color: var(--color-primary-400);
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
