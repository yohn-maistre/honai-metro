<script lang="ts">
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import { ArrowUpRight, Share2, MessageCircle, MapPin, BookOpen } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import ContentSkeleton from './ContentSkeleton.svelte'
  import PostCard from './PostCard.svelte'
  import NewsMap from './NewsMap.svelte'
  import {
    request,
    type Post,
    type Auth,
    type Community,
    type Membership,
  } from './api'
  import { newsDate, type NewsStory } from './news.svelte'
  let {
    id,
    auth,
    communities,
    memberships,
    onError,
    onShare,
  }: {
    id: string
    auth: Auth
    communities: Community[]
    memberships: Membership[]
    onError: (s: string) => void
    onShare: (url: string) => void
  } = $props()
  let story = $state<NewsStory | null>(null),
    posts = $state<Post[]>([]),
    pending = $state(true),
    error = $state(''),
    cursor = $state<string | null>(null),
    moreBusy = $state(false),
    failedImage = $state('')
  const links = $derived(
    story
      ? [
          ...new Set([
            story.url,
            location.origin + '/news/' + story.id,
            ...story.sources.slice(0, 14).map((s) => s.url),
          ]),
        ]
      : [],
  )
  function feedURL(next = '') {
    const q = new SvelteURLSearchParams({
      roots: 'true',
      links: JSON.stringify(links),
    })
    if (next) q.set('cursor', next)
    return '/v1/feed/page?' + q
  }
  $effect(() => {
    const key = id,
      actor = auth.actor?.id,
      controller = new AbortController()
    story = null
    posts = []
    error = ''
    pending = true
    cursor = null
    void (async () => {
      try {
        const result = await request<NewsStory>(
          '/v1/news/' + key,
          undefined,
          controller.signal,
        )
        if (controller.signal.aborted) return
        story = result
        // Use the captured result, not reactive links, so this effect only follows route/auth.
        const related = [
          ...new Set([
            result.url,
            location.origin + '/news/' + key,
            ...result.sources.slice(0, 14).map((s) => s.url),
          ]),
        ]
        const page = await request<{
          items: Post[]
          nextCursor: string | null
        }>(
          '/v1/feed/page?' +
            new SvelteURLSearchParams({
              roots: 'true',
              links: JSON.stringify(related),
            }),
          undefined,
          controller.signal,
        )
        if (!controller.signal.aborted && auth.actor?.id === actor) {
          posts = page.items
          cursor = page.nextCursor
        }
      } catch (e) {
        if (!controller.signal.aborted)
          error = e instanceof Error ? e.message : 'Kabar belum dapat dimuat.'
      } finally {
        if (!controller.signal.aborted) pending = false
      }
    })()
    return () => controller.abort()
  })
  async function more() {
    if (!cursor || moreBusy) return
    moreBusy = true
    try {
      const page = await request<{ items: Post[]; nextCursor: string | null }>(
        feedURL(cursor),
      )
      posts = [
        ...posts,
        ...page.items.filter((p) => !posts.some((old) => old.id === p.id)),
      ]
      cursor = page.nextCursor
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Belum dapat memuat percakapan.')
    } finally {
      moreBusy = false
    }
  }
</script>

{#if pending && !story}<ContentSkeleton />{:else if error}<div
    class="strata-nodata"
  >
    <h2>Kabar belum tersedia</h2>
    <p>{error}</p>
    <Button href="/explore" variant="outline">Jelajah</Button>
  </div>{/if}
{#if story}<article class="news-reader">
    <div class="news-reader-meta">
      <a href="https://westpapua.watch/news/" target="_blank" rel="noreferrer">
        West Papua Watch <ArrowUpRight size={13} />
      </a>
      <span>{newsDate(story.publishedAt)} · {story.sourceCount} sumber</span>
    </div>
    <h1>{story.title}</h1>
    {#if story.image && failedImage !== story.image}<figure>
        <img
          src={story.image}
          alt=""
          onerror={(e) => {
            failedImage = story!.image ?? ''
          }}
        />
        <figcaption>{story.imageCredit}</figcaption>
      </figure>{:else}<div class="news-reader-photo-fallback"><BookOpen size={24}/><span>Foto belum tersedia</span></div>{/if}
    <div class="news-reader-summary">
      <span class="news-summary-label">Ringkasan WPW</span>
      <p>{story.summary}</p>
      {#if story.keyPoints.length}<ul>
          {#each story.keyPoints as point}<li>{point}</li>{/each}
        </ul>{/if}
    </div>
    {#if story.places?.length}<section
        class="news-places"
        aria-label="Tempat dalam liputan"
      >
        <div class="news-place-labels">
          {#each story.places as place}<span>
              <MapPin size={13} />{place.name}
            </span>{/each}
        </div>
        <NewsMap places={story.places} />
      </section>{/if}
    <div class="news-reader-actions">
      <Button
        variant="ghost"
        aria-label="Salin tautan kabar"
        onclick={async () => {
          try {
            await navigator.clipboard.writeText(
              location.origin + '/news/' + story!.id,
            )
            onError('Tautan disalin.')
          } catch {
            onError('Tautan belum dapat disalin.')
          }
        }}
      >
        <Share2 size={17} />
      </Button>
      <a href={story.url} target="_blank" rel="noreferrer">
        Buka WPW <ArrowUpRight size={14} />
      </a>
    </div>
    <section class="news-sources">
      <h2>Sumber liputan</h2>
      {#each story.sources as source}<a
          href={source.url}
          target="_blank"
          rel="noreferrer"
        >
          <span>
            <small>{source.publisher}</small>
            <strong>{source.title}</strong>
            {#if source.summary}<p>{source.summary}</p>{/if}
          </span>
          <ArrowUpRight size={16} />
        </a>{/each}
    </section>
  </article>
  <section class="news-discussion">
    <div class="thread-toolbar">
      <h2>Percakapan terkait</h2>
      <Button onclick={() => onShare(story!.url)}><MessageCircle size={16}/>Bahas di komunitas</Button>
    </div>
    {#each posts as post}<PostCard
        {post}
        community={communities.find((c) => c.id === post.community_id)}
        loggedIn={!!auth.actor}
        canVote={memberships.some((m) => m.community_id === post.community_id)}
        {onError}
      />{/each}{#if pending}<ContentSkeleton
        rows={1}
      />{:else if !posts.length}<div class="news-discussion-empty">
        <p>Belum ada yang membahas kabar ini.</p>

      </div>{/if}{#if cursor}<Button
        variant="ghost"
        disabled={moreBusy}
        onclick={more}
      >
        Muat percakapan lain
      </Button>{/if}
  </section>{/if}
