<script lang="ts">
  /**
   * Peta Papua: Tanah Papua as one land. The six capitals are community
   * anchors, not a province picker. Tapping an anchor flies the map to it
   * and names it below, so the map always responds; when per-city
   * instances exist, the anchor also opens them. Engraved DINAS plate
   * over OpenFreeMap vector tiles in light; carto dark-matter in dark.
   */
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { theme } from '$lib/app/theme/theme.svelte'
  import {
    AttributionControl,
    MapLibre,
    Marker,
    NavigationControl,
  } from 'svelte-maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'

  interface Anchor {
    code: string
    kota: string
    wilayah: string
    lnglat: [number, number]
  }

  interface Props {
    instances?: Record<string, string>
    onselect?: (code: string) => void
  }

  let { instances = {}, onselect }: Props = $props()

  // Six anchor cities of Tanah Papua, west to east.
  const anchors: Anchor[] = [
    { code: 'pbd', kota: 'Sorong', wilayah: 'Papua Barat Daya', lnglat: [131.2558, -0.8761] },
    { code: 'pb', kota: 'Manokwari', wilayah: 'Papua Barat', lnglat: [134.062, -0.8615] },
    { code: 'pt', kota: 'Nabire', wilayah: 'Papua Tengah', lnglat: [135.4833, -3.3667] },
    { code: 'pp', kota: 'Wamena', wilayah: 'Papua Pegunungan', lnglat: [138.9489, -4.0892] },
    { code: 'p', kota: 'Jayapura', wilayah: 'Papua', lnglat: [140.7181, -2.5337] },
    { code: 'ps', kota: 'Merauke', wilayah: 'Papua Selatan', lnglat: [140.4011, -8.4731] },
  ]

  let map = $state<import('maplibre-gl').Map | undefined>()
  let selected = $state<Anchor | null>(null)

  let isDark = $state(false)
  $effect(() => {
    if (!browser) return
    const compute = () => {
      if (theme.colorScheme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      } else {
        isDark = theme.colorScheme === 'dark'
      }
    }
    compute()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', compute)
    return () => mq.removeEventListener('change', compute)
  })

  /* the engraved DINAS plate: OpenFreeMap vector tiles, khaki paper, ink
     coastlines. Same approach as detak-detik's front map. */
  const DINAS_STYLE = {
    version: 8 as const,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      ofm: { type: 'vector' as const, url: 'https://tiles.openfreemap.org/planet' },
    },
    layers: [
      { id: 'bg', type: 'background' as const, paint: { 'background-color': '#d6cbac' } },
      { id: 'water', type: 'fill' as const, source: 'ofm', 'source-layer': 'water', paint: { 'fill-color': '#c5b893' } },
      { id: 'coast', type: 'line' as const, source: 'ofm', 'source-layer': 'water', paint: { 'line-color': '#15130e', 'line-width': 0.9, 'line-opacity': 0.55 } },
      {
        id: 'batas', type: 'line' as const, source: 'ofm', 'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 4],
        paint: { 'line-color': '#15130e', 'line-width': 0.6, 'line-dasharray': [2, 3], 'line-opacity': 0.35 },
      },
      {
        id: 'kota', type: 'symbol' as const, source: 'ofm', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 10.5, 'text-letter-spacing': 0.1, 'text-transform': 'uppercase' as const, 'text-max-width': 8 },
        paint: { 'text-color': '#15130e', 'text-halo-color': '#d6cbac', 'text-halo-width': 1.2 },
      },
    ],
  }

  let mapStyle = $derived(
    isDark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : (DINAS_STYLE as never),
  )

  const center: [number, number] = [136.5, -3.8]
  const initialZoom = 5.2

  function pick(a: Anchor) {
    selected = a
    onselect?.(a.code)
    map?.flyTo({ center: a.lnglat, zoom: 7, speed: 0.8 })
    const url = instances[a.code]
    if (url) {
      if (url.startsWith('http')) window.location.href = url
      else goto(url)
    }
  }
</script>

<div class="w-full flex flex-col gap-2">
  <div class="flex items-baseline justify-between gap-3 flex-wrap">
    <h2 class="text-lg font-semibold dark:text-white">Tanah Papua</h2>
    <span class="text-xs text-slate-400 dark:text-zinc-500">
      simpul komunitas, satu tanah
    </span>
  </div>

  <MapLibre
    style={mapStyle}
    bind:map
    {center}
    zoom={initialZoom}
    minZoom={1.5}
    maxZoom={13}
    attributionControl={false}
    class="w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800"
  >
    <NavigationControl position="top-right" showCompass={false} />
    <AttributionControl position="bottom-right" compact={true} />

    {#each anchors as a (a.code)}
      {@const hasInstance = !!instances[a.code]}
      {@const isSelected = selected?.code === a.code}
      <Marker lnglat={a.lnglat} onclick={() => pick(a)}>
        {#snippet content()}
          <button
            type="button"
            aria-label={`${a.kota}, ${a.wilayah}`}
            aria-pressed={isSelected}
            class={[
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm cursor-pointer',
              'text-xs font-medium whitespace-nowrap transition-colors',
              isSelected
                ? 'bg-primary-500 text-white border-primary-600'
                : 'bg-white/95 dark:bg-zinc-900/95 text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 hover:border-primary-400',
            ]}
            onclick={(e) => {
              e.stopPropagation()
              pick(a)
            }}
          >
            <span
              class={[
                'inline-block w-1.5 h-1.5 rounded-full',
                isSelected ? 'bg-white' : 'bg-primary-500',
              ]}
            ></span>
            {a.kota}
          </button>
        {/snippet}
      </Marker>
    {/each}
  </MapLibre>

  <p class="text-xs text-slate-500 dark:text-zinc-400 min-h-4">
    {#if selected}
      <span class="font-medium text-slate-700 dark:text-zinc-200"
        >{selected.kota}</span
      >, {selected.wilayah}{#if instances[selected.code]}
        &nbsp;· membuka instance{:else}&nbsp;· belum ada instance terpisah{/if}
    {:else}
      Ketuk kota untuk menyorotnya. OpenFreeMap / OSM, ODbL.
    {/if}
  </p>
</div>
