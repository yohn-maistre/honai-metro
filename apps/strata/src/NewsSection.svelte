<script lang="ts">
  import { onMount } from 'svelte'
  import { ArrowUpRight, Newspaper } from '@lucide/svelte'
  import { news, loadNews, newsDate } from './news.svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  let { compact = false }: { compact?: boolean } = $props()
  const items = $derived(news.feed?.items.slice(0, compact ? 5 : 9) ?? [])
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
  {#if news.pending}<ContentSkeleton rows={2} />
  {:else if items.length}<div class="news-grid">
      {#each items as item, i}<a
          class="news-item"
          class:news-lead={!compact && i === 0}
          class:news-photo={!compact && !!item.image}
          href={'/news/' + item.id}
        >
          {#if !compact && item.image}<img
              src={item.image}
              alt=""
              loading="lazy"
              decoding="async"
              onerror={(e) => {
                e.currentTarget.setAttribute('hidden', '')
              }}
            />{/if}
          <div class="news-tile-copy">
            {#if !compact && i === 0}<Newspaper
                size={19}
                class="news-mark"
              />{/if}
            <strong>{item.title}</strong>
            <span>
              {newsDate(item.publishedAt)}{item.sourceCount
                ? ` · ${item.sourceCount} sumber`
                : ''}<ArrowUpRight size={13} />
            </span>
          </div>
          {#if !compact && item.imageCredit}<small class="news-photo-credit">
              {item.imageCredit}
            </small>{/if}
        </a>{/each}
    </div>{:else}<p class="news-unavailable">
      Kabar belum dapat dimuat. <a
        href="https://westpapua.watch/news/"
        target="_blank"
        rel="noreferrer"
      >
        Buka WPW <ArrowUpRight size={12} />
      </a>
    </p>{/if}
</section>
