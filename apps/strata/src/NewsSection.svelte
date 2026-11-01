<script lang="ts">
  import { onMount } from 'svelte'
  import { ArrowUpRight, Newspaper } from '@lucide/svelte'
  import { news, loadNews } from './news.svelte'
  import PixelLoader from './PixelLoader.svelte'
  let { compact = false }: { compact?: boolean } = $props()
  const items = $derived(news.feed?.items.slice(0, compact ? 3 : 5) ?? [])
  function date(value: string | null) {
    return value
      ? new Intl.DateTimeFormat('id', {
          day: 'numeric',
          month: 'short',
          timeZone: 'Asia/Jayapura',
        }).format(new Date(value))
      : ''
  }
  onMount(() => {
    void loadNews()
  })
</script>

<section
  class="news-section"
  class:compact
  aria-label="Kabar dari West Papua Watch"
>
  <div class="news-section-head">
    <h2>Kabar</h2>
    <a href="https://westpapua.watch/news/" target="_blank" rel="noreferrer">
      West Papua Watch <ArrowUpRight size={13} />
    </a>
  </div>
  {#if news.pending}<div class="news-pending">
      <PixelLoader label="Memuat kabar…" />
    </div>
  {:else if items.length}<div class="news-grid">
      {#each items as item, i}<a
          class="news-item"
          class:news-lead={!compact && i === 0}
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          {#if !compact && i === 0}<Newspaper
              size={20}
              class="news-mark"
            />{/if}
          <strong>{item.title}</strong>
          <span>
            {date(item.publishedAt)}{item.sourceCount
              ? ` · ${item.sourceCount} sumber`
              : ''}<ArrowUpRight size={13} />
          </span>
        </a>{/each}
    </div>
  {:else}<p class="news-unavailable">
      Kabar belum dapat dimuat. <a
        href="https://westpapua.watch/news/"
        target="_blank"
        rel="noreferrer"
      >
        Buka WPW <ArrowUpRight size={12} />
      </a>
    </p>{/if}
</section>
