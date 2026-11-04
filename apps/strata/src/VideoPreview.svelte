<script lang="ts">
  import { onMount } from 'svelte'
  import { Play, ExternalLink } from '@lucide/svelte'
  import { videoEmbed, directVideo } from './markdown'
  import { appearance } from './appearance.svelte'
  let { url }: { url: string } = $props()
  let element = $state<HTMLDivElement>(),
    visible = $state(false),
    manual = $state(false),
    playing = $state(false),
    failedImage = $state(false)
  let card = $state<{
    title: string
    provider: string
    image: string | null
  } | null>(null)
  const embed = $derived(videoEmbed(url)),
    native = $derived(directVideo(url))
  const identity = $derived.by(() => {
    if (!embed) return null
    const u = new URL(embed)
    return u.hostname === 'www.youtube-nocookie.com'
      ? { provider: 'youtube', id: u.pathname.split('/').at(-1)! }
      : { provider: 'vimeo', id: u.pathname.split('/').at(-1)! }
  })
  const enabled = $derived(visible && (appearance.externalMedia || manual))
  $effect(() => {
    const video = identity,
      shouldLoad = enabled,
      controller = new AbortController()
    card = null
    playing = false
    failedImage = false
    if (video && shouldLoad)
      void fetch('/v1/video-preview/' + video.provider + '/' + video.id, {
        credentials: 'omit',
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!controller.signal.aborted) card = data
        })
        .catch(() => {})
    return () => controller.abort()
  })
  onMount(() => {
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visible = true
          observer.disconnect()
        }
      },
      { rootMargin: '100px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  })
</script>

{#if embed || native}<div bind:this={element} class="video-card">
    <div class="video-preview">
      {#if playing}
        {#if native}<video
            controls
            playsinline
            preload="metadata"
            src={native}
            aria-label="Video"
          >
            <track kind="captions" />
          </video>
        {:else}<iframe
            title={card?.title || 'Video'}
            src={embed!}
            loading="lazy"
            allow="fullscreen; picture-in-picture; encrypted-media"
            referrerpolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allowfullscreen
          ></iframe>{/if}
      {:else}<button
          type="button"
          class="video-cover"
          aria-label={enabled ? 'Putar video' : 'Muat pratinjau video'}
          onclick={() => {
            if (!enabled) {
              manual = true
              visible = true
            } else playing = true
          }}
        >
          {#if enabled && card?.image && !failedImage}<img
              src={card.image}
              alt=""
              loading="lazy"
              decoding="async"
              onerror={() => (failedImage = true)}
            />{/if}
          <span class="video-play-mark">
            <Play size={25} fill="currentColor" />
          </span>
          <span class="sr-only">
            {enabled ? 'Putar video' : 'Muat pratinjau video'}
          </span>
        </button>{/if}
      {#if !playing}<a
          class="video-card-caption"
          title={card?.title || 'Buka video asli'}
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <span>
            <small>
              {card?.provider ||
                (identity?.provider === 'youtube'
                  ? 'YouTube'
                  : identity?.provider === 'vimeo'
                    ? 'Vimeo'
                    : 'Video')}
            </small>
            <strong>
              {card?.title || 'Tonton video'}
            </strong>
          </span>
          <ExternalLink size={15} />
        </a>{/if}
    </div>
  </div>{/if}
