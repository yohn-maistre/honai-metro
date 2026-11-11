<script lang="ts">
  import { onMount } from 'svelte'
  import { ArrowUpRight, Newspaper } from '@lucide/svelte'
  import { news, loadNews, newsDate } from './news.svelte'
  import ContentSkeleton from './ContentSkeleton.svelte'
  let { compact = false }: { compact?: boolean } = $props()
  let failedPhotos = $state<string[]>([])
  const items = $derived(news.feed?.items.slice(0, compact ? 4 : 3) ?? [])
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
    <a href="/news">
      Lihat semua <ArrowUpRight size={13} />
    </a>
  </div>
  {#if news.pending}<ContentSkeleton rows={2} />
  {:else if items.length}<div class="news-grid">
      {#each items as item, i}{@const photo =
          !!item.image && !failedPhotos.includes(item.id)}
        <a
          class="news-item"
          class:news-lead={!compact && i === 0}
          class:news-photo={!compact && photo}
          class:news-text-only={!compact && !photo}
          href={'/news/' + item.id}
          title={item.title}
        >
          {#if photo}<img
              class:news-compact-thumbnail={compact}
              src={item.image}
              alt=""
              loading="lazy"
              decoding="async"
              onerror={() => {
                failedPhotos = [...failedPhotos, item.id]
              }}
            />{:else if compact}<span class="news-compact-fallback" aria-hidden="true"><Newspaper size={20} /></span>{/if}
          <div class="news-tile-copy">
            {#if !compact && i === 0}<Newspaper
                size={19}
                class="news-mark"
              />{/if}
            <strong>{item.title}</strong>
            {#if !compact && !photo && item.summary}<p
                class="news-fallback-summary"
              >
                {item.summary}
              </p>{/if}
            <span>
              {newsDate(item.publishedAt)}{item.sourceCount
                ? ` · ${item.sourceCount} sumber`
                : ''}<ArrowUpRight size={13} />
            </span>
          </div>
          {#if !compact && photo && item.imageCredit}<small
              class="news-photo-credit"
            >
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
