<script lang="ts">
  import { onMount } from 'svelte'
  import { MapPin, ArrowUpRight } from '@lucide/svelte'
  import { request } from './api'
  let { welcome = false }: { welcome?: boolean } = $props()
  let places = $state<
    { id: string; slug: string; title: string; kind: string }[]
  >([])
  onMount(() => {
    const abort = new AbortController()
    request<typeof places>('/v1/contexts', undefined, abort.signal)
      .then((rows) => {
        if (!abort.signal.aborted)
          places = rows
            .filter((p) => ['place', 'language'].includes(p.kind))
            .slice(0, 3)
      })
      .catch(() => {})
    return () => abort.abort()
  })
</script>

<section class="home-context" aria-label="Jelajahi ETNOS">
  {#if welcome}<div class="home-welcome">
      <h1>Ruang bersama.</h1>
      <p>Cerita, kabar dan pengetahuan Papua.</p>
    </div>{/if}
  <nav aria-label="Tempat dan kegiatan">
    <a href="/contexts"><MapPin size={16} />Tempat & bahasa</a>
    {#each places as place}<a href={'/contexts/' + place.slug}>
        {place.title}
      </a>{/each}
    {#if welcome}<a href="/news">Kabar <ArrowUpRight size={14} /></a>
      <a href="/communities">Komunitas <ArrowUpRight size={14} /></a>{/if}
  </nav>
</section>
