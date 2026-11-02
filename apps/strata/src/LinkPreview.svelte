<script lang="ts">
  import { ExternalLink } from '@lucide/svelte'
  let {
    url,
    title = '',
    enabled = true,
  }: { url: string; title?: string; enabled?: boolean } = $props()
  let preview = $state<{
    title: string
    description: string
    site: string
    image: string | null
  } | null>(null)
  const supported = new Set([
    'github.com',
    'en.wikipedia.org',
    'id.wikipedia.org',
    'www.antaranews.com',
    'suarapapua.com',
    'jubi.id',
    'westpapua.watch',
  ])
  $effect(() => {
    const target = url,
      abort = new AbortController()
    preview = null
    try {
      if (!enabled || !supported.has(new URL(target).hostname)) return
    } catch {
      return
    }
    const timer = setTimeout(
      () =>
        void fetch('/v1/link-preview?url=' + encodeURIComponent(target), {
          credentials: 'omit',
          signal: abort.signal,
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((p) => {
            if (!abort.signal.aborted) preview = p
          })
          .catch(() => {}),
      250,
    )
    return () => {
      clearTimeout(timer)
      abort.abort()
    }
  })
</script>

<a
  class="external-preview"
  href={url}
  target="_blank"
  rel="noopener noreferrer nofollow"
  referrerpolicy="no-referrer"
>
  {#if preview?.image}<img
      src={preview.image}
      alt=""
      loading="lazy"
      onerror={(e) => e.currentTarget.setAttribute('hidden', '')}
    />{/if}
  <div>
    <small>{preview?.site ?? new URL(url).hostname}</small>
    <strong>{preview?.title || title || url}</strong>
    {#if preview?.description}<p>{preview.description}</p>{/if}
  </div>
  <ExternalLink size={16} />
</a>
