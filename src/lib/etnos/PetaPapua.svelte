<script lang="ts">
  /**
   * Peta Papua: the front plate of ETNOS, ported from detak-detik's
   * act-1 Peta Kabar (its DINAS engraved-atlas skin over OpenFreeMap
   * vector tiles — khaki paper, ink coastlines, dashed province lines,
   * engraved city labels). Framed on Tanah Papua as ONE land: the six
   * capitals are community anchors, not a province picker. Dark mode
   * keeps the previous basemap untouched this wave (Honai Malam later).
   */
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { t } from '$lib/app/i18n'
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
    lnglat: [number, number]
  }

  interface Props {
    instances?: Record<string, string>
    selected?: string
    onselect?: (code: string) => void
  }

  let { instances = {}, selected, onselect }: Props = $props()

  // Six anchor cities of Tanah Papua — community entry points, west to east.
  const anchors: Anchor[] = [
    { code: 'pbd', kota: 'Sorong', lnglat: [131.2558, -0.8761] },
    { code: 'pb', kota: 'Manokwari', lnglat: [134.062, -0.8615] },
    { code: 'pt', kota: 'Nabire', lnglat: [135.4833, -3.3667] },
    { code: 'pp', kota: 'Wamena', lnglat: [138.9489, -4.0892] },
    { code: 'p', kota: 'Jayapura', lnglat: [140.7181, -2.5337] },
    { code: 'ps', kota: 'Merauke', lnglat: [140.4011, -8.4731] },
  ]

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

  /* the DINAS plate, verbatim from detak-detik PetaKabar: engraved paper
     over OpenFreeMap vector tiles. Colors are the Honai Siang tokens. */
  const DINAS_STYLE = {
    version: 8 as const,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      ofm: { type: 'vector' as const, url: 'https://tiles.openfreemap.org/planet' },
    },
    layers: [
      {
        id: 'bg',
        type: 'background' as const,
        paint: { 'background-color': '#d6cbac' },
      },
      {
        id: 'water',
        type: 'fill' as const,
        source: 'ofm',
        'source-layer': 'water',
        paint: { 'fill-color': '#c5b893' },
      },
      {
        id: 'coast',
        type: 'line' as const,
        source: 'ofm',
        'source-layer': 'water',
        paint: {
          'line-color': '#15130e',
          'line-width': 0.9,
          'line-opacity': 0.55,
        },
      },
      {
        id: 'batas-prov',
        type: 'line' as const,
        source: 'ofm',
        'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 4],
        paint: {
          'line-color': '#15130e',
          'line-width': 0.6,
          'line-dasharray': [2, 3],
          'line-opacity': 0.4,
        },
      },
      {
        id: 'kota',
        type: 'symbol' as const,
        source: 'ofm',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10.5,
          'text-letter-spacing': 0.12,
          'text-transform': 'uppercase' as const,
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#15130e',
          'text-halo-color': '#d6cbac',
          'text-halo-width': 1.2,
        },
      },
    ],
  }

  let mapStyle = $derived(
    isDark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : (DINAS_STYLE as never),
  )

  // Frames all six anchors; the koordinat strip reads off the bound center.
  let center = $state<[number, number]>([136.5, -3.8])
  const initialZoom = 5.2

  let koordinat = $derived(
    `${Math.abs(center[1]).toFixed(2)}°${center[1] < 0 ? 'LS' : 'LU'} · ${center[0].toFixed(2)}°BT`,
  )

  function pick(code: string) {
    onselect?.(code)
    const url = instances[code]
    if (url) {
      if (url.startsWith('http')) window.location.href = url
      else goto(url)
    }
  }
</script>

<div class="w-full flex flex-col gap-2">
  <div class="flex items-end justify-between gap-3 flex-wrap">
    <span class="inkbar"><span class="dot">●</span>{$t('etnos.map.inkbar')}</span>
    <span class="serial tabular-nums">{koordinat}</span>
  </div>

  <div class="border border-slate-900/70 dark:border-zinc-700">
    <MapLibre
      style={mapStyle}
      bind:center
      zoom={initialZoom}
      minZoom={1.5}
      maxZoom={13}
      attributionControl={false}
      class="w-full h-72 sm:h-96 overflow-hidden"
    >
      <NavigationControl position="top-right" showCompass={false} />
      <AttributionControl position="bottom-right" compact={true} />

      {#each anchors as a (a.code)}
        {@const hasInstance = !!instances[a.code]}
        {@const isSelected = selected === a.code}
        <Marker lnglat={a.lnglat} onclick={() => pick(a.code)}>
          {#snippet content()}
            <button
              type="button"
              aria-label={a.kota}
              aria-pressed={isSelected}
              class={[
                'group flex items-center gap-1.5 px-2.5 py-1 border transition-colors',
                'font-mono text-[10.5px] tracking-[0.12em] uppercase whitespace-nowrap',
                hasInstance ? 'cursor-pointer' : 'cursor-default',
                'bg-white/95 text-slate-900 border-slate-900/70',
                'dark:bg-zinc-900/95 dark:text-zinc-200 dark:border-zinc-700',
                hasInstance ? 'hover:bg-primary-900 hover:text-white' : '',
                isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : '',
              ]}
              onclick={(e) => {
                e.stopPropagation()
                pick(a.code)
              }}
            >
              <span
                class="inline-block w-1.5 h-1.5 rounded-full bg-primary-500"
              ></span>
              {a.kota}
            </button>
          {/snippet}
        </Marker>
      {/each}
    </MapLibre>
  </div>

  <div class="flex items-baseline justify-between gap-3 flex-wrap">
    <p class="fig text-sm">{$t('etnos.map.caption')}</p>
    <span class="serial">OpenFreeMap · OSM · ODbL</span>
  </div>
</div>
