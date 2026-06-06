<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { theme } from '$lib/app/theme/theme.svelte'
  import {
    AttributionControl,
    MapLibre,
    Marker,
    NavigationControl,
    ScaleControl,
  } from 'svelte-maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'

  interface Province {
    code: string
    name: string
    capital: string
    lnglat: [number, number]
  }

  interface Props {
    instances?: Record<string, string>
    selected?: string
    onselect?: (code: string) => void
  }

  let { instances = {}, selected, onselect }: Props = $props()

  const provinces: Province[] = [
    { code: 'pbd', name: 'Papua Barat Daya', capital: 'Sorong', lnglat: [131.2558, -0.8761] },
    { code: 'pb', name: 'Papua Barat', capital: 'Manokwari', lnglat: [134.062, -0.8615] },
    { code: 'pt', name: 'Papua Tengah', capital: 'Nabire', lnglat: [135.4833, -3.3667] },
    { code: 'pp', name: 'Papua Pegunungan', capital: 'Wamena', lnglat: [138.9489, -4.0892] },
    { code: 'p', name: 'Papua', capital: 'Jayapura', lnglat: [140.7181, -2.5337] },
    { code: 'ps', name: 'Papua Selatan', capital: 'Merauke', lnglat: [140.4011, -8.4731] },
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

  let styleUrl = $derived(
    isDark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  )

  // Default view centers on Papua Tengah (Nabire) and frames all 6 provinces.
  const center: [number, number] = [136.5, -3.8]
  const initialZoom = 5.2

  function pick(code: string) {
    onselect?.(code)
    const url = instances[code]
    if (url) {
      if (url.startsWith('http')) window.location.href = url
      else goto(url)
    }
  }
</script>

<div class="w-full">
  <MapLibre
    style={styleUrl}
    {center}
    zoom={initialZoom}
    minZoom={1.5}
    maxZoom={13}
    attributionControl={false}
    class="w-full h-72 sm:h-96 rounded-2xl overflow-hidden"
  >
    <NavigationControl position="top-right" showCompass={false} />
    <ScaleControl position="bottom-left" maxWidth={120} unit="metric" />
    <AttributionControl
      position="bottom-right"
      compact={true}
    />

    {#each provinces as p (p.code)}
      {@const hasInstance = !!instances[p.code]}
      {@const isSelected = selected === p.code}
      <Marker lnglat={p.lnglat} onclick={() => pick(p.code)}>
        {#snippet content()}
          <button
            type="button"
            aria-label={`${p.name}, ibu kota ${p.capital}`}
            aria-pressed={isSelected}
            class={[
              'group flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md border transition-all cursor-pointer',
              'text-xs font-medium whitespace-nowrap',
              hasInstance
                ? 'bg-primary-500 text-white border-primary-600 hover:bg-primary-600'
                : 'bg-white/95 dark:bg-zinc-900/95 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:border-primary-400 dark:hover:border-primary-600',
              isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : '',
              p.code === 'pt'
                ? 'border-amber-400 dark:border-amber-600 bg-amber-50/95 dark:bg-amber-950/80 text-amber-900 dark:text-amber-100'
                : '',
            ]}
            onclick={(e) => {
              e.stopPropagation()
              pick(p.code)
            }}
          >
            <span
              class={[
                'inline-block w-1.5 h-1.5 rounded-full',
                hasInstance ? 'bg-white' : 'bg-primary-500 dark:bg-primary-400',
                p.code === 'pt' ? 'bg-amber-500 dark:bg-amber-400' : '',
              ]}
            ></span>
            {p.capital}
          </button>
        {/snippet}
      </Marker>
    {/each}
  </MapLibre>

  <p class="text-xs text-slate-400 dark:text-zinc-500 mt-2 text-center">
    Pilih ibu kota provinsi untuk membuka instance ETNOS-nya. Papua Tengah
    disorot dalam warna kuning. Zoom keluar untuk tampilan dunia.
  </p>
</div>
