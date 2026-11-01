<script lang="ts">
  import {
    ExternalLink,
    Play,
    CalendarDays,
    MapPin,
    Check,
    LockKeyhole,
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import PostText from './PostText.svelte'
  import PostMedia from './PostMedia.svelte'
  import { markdown, videoEmbed } from './markdown'
  import { request, type Post } from './api'
  let {
    post,
    detail = false,
    canVote = false,
    onError,
  }: {
    post: Post
    detail?: boolean
    canVote?: boolean
    onError: (s: string) => void
  } = $props()
  let revealed = $state(false),
    expanded = $state(false),
    playing = $state(false),
    busy = $state(false)
  const embed = $derived(videoEmbed(post.content?.url ?? ''))
  const truncated = $derived(!detail && !expanded && post.text.length > 900)
  async function act(route: string, b: unknown) {
    if (busy) return
    busy = true
    try {
      Object.assign(
        post,
        await request<Post>(`/v1/posts/${post.id}/${route}`, b),
      )
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Belum tersimpan.')
    } finally {
      busy = false
    }
  }
</script>

<div class="rich-post">
  {#if post.deleted}<p class="post-tombstone">
      Posting dihapus oleh penulis.
    </p>{:else}
    {#if post.content?.warning && !revealed}<div class="content-warning">
        <span>{post.content.warning}</span>
        <Button variant="outline" size="sm" onclick={() => (revealed = true)}>
          Tampilkan
        </Button>
      </div>{:else}
      {#if post.content?.title}<h2 class="post-title">
          <a href={'/square/' + post.id}>{post.content.title}</a>
        </h2>{/if}
      <div class="cx-post-body strata-body" class:post-clamped={truncated}>
        {#if post.content?.format === 'markdown'}<div class="post-markdown">
            {@html markdown(post.text)}
          </div>{:else}<PostText
            text={post.text}
            permalink={!detail ? '/square/' + post.id : undefined}
          />{/if}
      </div>
      {#if truncated}<button
          class="post-read-more"
          onclick={() => (expanded = true)}
        >
          Baca selengkapnya
        </button>{/if}
      {#if post.media?.length}<PostMedia images={post.media} />{/if}
      {#if post.content?.url}<div class="post-link-card">
          {#if embed && playing}<iframe
              title="Video"
              src={embed}
              loading="lazy"
              allow="fullscreen; picture-in-picture"
              referrerpolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allowfullscreen
            ></iframe>
          {:else if embed}<Button
              variant="outline"
              class="video-load"
              onclick={() => (playing = true)}
            >
              <Play size={22} />Muat video
              <span>YouTube / Vimeo</span>
            </Button>
            <small>Memuat akan menghubungkan ke layanan video.</small>{/if}
          <a
            href={post.content.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            referrerpolicy="no-referrer"
          >
            <span>
              <small>{new URL(post.content.url).hostname}</small>
              {post.content.title || post.content.url}
            </span>
            <ExternalLink size={16} />
          </a>
        </div>{/if}
      {#if post.poll}<div class="post-poll" aria-label="Jajak pendapat">
          {#each post.poll.options as option, i}<button
              class:chosen={post.poll.myVote === i}
              disabled={busy || post.poll.closed || !canVote}
              onclick={() =>
                act('poll', { choice: post.poll?.myVote === i ? null : i })}
            >
              <span
                class="poll-fill"
                style={'width:' +
                  (post.poll.total ? option.votes / post.poll.total : 0) * 100 +
                  '%'}
              ></span>
              <span>
                {option.label}{#if post.poll.myVote === i}<Check
                    size={14}
                  />{/if}
              </span>
              <small>{option.votes}</small>
            </button>{/each}
          <small>
            {post.poll.total} suara · {post.poll.closed
              ? 'Ditutup'
              : new Date(post.poll.closesAt).toLocaleString(
                  'id-ID',
                )}{#if !canVote && !post.poll.closed}
              · Gabung untuk memilih{/if}
          </small>
        </div>{/if}
      {#if post.event}<div class="post-event">
          <CalendarDays size={20} />
          <div>
            <strong>
              {new Date(post.event.startsAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </strong>
            {#if post.event.location}<span>
                <MapPin size={13} />{post.event.location}
              </span>{/if}
            <small>
              {post.event.going} ikut · {post.event.interested} tertarik
            </small>
          </div>
          <Button
            variant={post.event.myResponse === 'going' ? 'default' : 'outline'}
            size="sm"
            disabled={!canVote || busy}
            onclick={() =>
              act('rsvp', {
                response: post.event?.myResponse === 'going' ? null : 'going',
              })}
          >
            {post.event.myResponse === 'going' ? 'Akan ikut' : 'Ikut'}
          </Button>
        </div>{/if}
    {/if}
    {#if post.locked}<small class="post-state">
        <LockKeyhole size={12} />Percakapan dikunci
      </small>{/if}
  {/if}
</div>
