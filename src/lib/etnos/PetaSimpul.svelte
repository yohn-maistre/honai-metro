<script lang="ts">
  /**
   * Peta Simpul: the network plate of Jelajah. The same dithered atlas as
   * Peta Kabar, dressed as a directory: the six anchor cities as node
   * rings joined west to east, each carrying the count of directory
   * communities in its province; kabupaten that hold a located community
   * get denser dots. Purely a visualization of the curated directory
   * (contoh), no live feeds here; the live map lives on the front page.
   */
  import { onMount } from 'svelte'
  import { t } from '$lib/app/i18n'
  import { theme } from '$lib/app/theme/theme.svelte'
  import {
    loadAtlasGrid,
    loadBoundaryPaths,
    lonLatToCellF,
    plateColors,
    type AtlasGrid,
    type BoundaryPaths,
    type PlateColors,
  } from './atlas'
  import { ANCHORS, type Anchor } from './layers'
  import { Board } from './ui'

  interface Props {
    /** kabupaten nama (GeoJSON exact) -> number of communities there */
    regionCounts?: Record<string, number>
  }
  let { regionCounts = {} }: Props = $props()

  const COLS = 120
  const ROWS = 104

  // GeoJSON prov code per anchor (codes as used in papua-kab.geojson).
  const ANCHOR_PROV: Record<string, string> = {
    Sorong: '92',
    Manokwari: '91',
    Nabire: '96',
    Wamena: '97',
    Jayapura: '94',
    Merauke: '95',
  }

  let el = $state<HTMLCanvasElement>()
  let grid: AtlasGrid | null = $state(null)
  let bounds: BoundaryPaths | null = $state(null)
  let selected = $state<Anchor | null>(null)

  // per-anchor community counts, derived from regionCounts via kab -> prov
  const anchorCounts = $derived.by(() => {
    const counts: Record<string, number> = {}
    if (!grid) return counts
    const provByKab = new Map(grid.kabs.map((k) => [k.nama, k.prov]))
    for (const a of ANCHORS) counts[a.kota] = 0
    for (const [kab, n] of Object.entries(regionCounts)) {
      const prov = provByKab.get(kab)
      if (!prov) continue
      const anchor = ANCHORS.find((a) => ANCHOR_PROV[a.kota] === prov)
      if (anchor) counts[anchor.kota] = (counts[anchor.kota] ?? 0) + n
    }
    return counts
  })

  function colors(): PlateColors {
    if (!el)
      return { dark: false, ink: '#15130e', accent: '#c0633e', muted: '#5a5345' }
    return plateColors(el)
  }

  function plate() {
    if (!el) return null
    const w = el.clientWidth
    const h = el.clientHeight
    const scale = Math.min((w * 0.94) / COLS, (h * 0.94) / ROWS)
    return { w, h, scale, ox: (w - COLS * scale) / 2, oy: (h - ROWS * scale) / 2 }
  }

  function pinXY(lnglat: [number, number], p: NonNullable<ReturnType<typeof plate>>) {
    const [fx, fy] = lonLatToCellF(lnglat[0], lnglat[1], COLS, ROWS)
    return [p.ox + fx * p.scale, p.oy + fy * p.scale] as [number, number]
  }

  function draw() {
    if (!el || !grid) return
    const ctx = el.getContext('2d')
    const p = plate()
    if (!ctx || !p) return
    const { ink, accent, muted, dark } = colors()

    const dpr = Math.min(window.devicePixelRatio ?? 1, 1.75)
    el.width = Math.round(p.w * dpr)
    el.height = Math.round(p.h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, p.w, p.h)

    // kabupaten with located communities read denser
    const located = new Set(
      Object.entries(regionCounts)
        .filter(([, n]) => n > 0)
        .map(([kab]) => kab),
    )
    const kabIndex = new Map(grid.kabs.map((k, i) => [k.nama, i + 1]))
    const denseIdx = new Set(
      [...located].map((kab) => kabIndex.get(kab)).filter(Boolean),
    )

    const dot = Math.max(1, p.scale * 0.42)
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const c = grid.cells[gy * COLS + gx]!
        if (!c) continue
        ctx.fillStyle = ink
        ctx.globalAlpha = denseIdx.has(c) ? (dark ? 0.75 : 0.65) : dark ? 0.38 : 0.28
        ctx.fillRect(
          p.ox + gx * p.scale + (p.scale - dot) / 2,
          p.oy + gy * p.scale + (p.scale - dot) / 2,
          dot,
          dot,
        )
      }
    }
    ctx.globalAlpha = 1

    if (bounds) {
      ctx.save()
      ctx.translate(p.ox, p.oy)
      ctx.scale(p.scale, p.scale)
      ctx.setLineDash([2 / p.scale, 3 / p.scale])
      ctx.lineWidth = 1 / p.scale
      ctx.strokeStyle = muted
      ctx.globalAlpha = dark ? 0.5 : 0.4
      for (const path of bounds.paths) ctx.stroke(path)
      ctx.restore()
      ctx.globalAlpha = 1
    }

    // the network line, west to east through the anchors
    ctx.strokeStyle = accent
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 1
    ctx.setLineDash([1, 4])
    ctx.beginPath()
    ANCHORS.forEach((a, i) => {
      const [x, y] = pinXY(a.lnglat, p)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // node rings + counts
    ctx.font = '600 10px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    for (const a of ANCHORS) {
      const [x, y] = pinXY(a.lnglat, p)
      const isSel = selected?.kota === a.kota
      const n = anchorCounts[a.kota] ?? 0
      ctx.strokeStyle = isSel ? accent : muted
      ctx.fillStyle = isSel ? accent : muted
      ctx.lineWidth = isSel ? 1.8 : 1.2
      ctx.beginPath()
      ctx.arc(x, y, isSel ? 7 : 5.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x, y, 1.6, 0, Math.PI * 2)
      ctx.fill()
      if (n > 0) {
        ctx.fillStyle = isSel ? accent : muted
        ctx.fillText(String(n), x, y - 10)
      }
    }
  }

  function hit(e: MouseEvent) {
    const p = plate()
    if (!el || !p) return
    const rect = el.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let best: Anchor | null = null
    let bestD = 26 * 26
    for (const a of ANCHORS) {
      const [x, y] = pinXY(a.lnglat, p)
      const d = (x - mx) ** 2 + (y - my) ** 2
      if (d < bestD) {
        bestD = d
        best = a
      }
    }
    if (best) selected = selected?.kota === best.kota ? null : best
  }

  onMount(() => {
    let dead = false
    void Promise.all([loadAtlasGrid(COLS, ROWS), loadBoundaryPaths(COLS, ROWS)])
      .then(([g, b]) => {
        if (dead) return
        grid = g
        bounds = b
        draw()
      })
      .catch(() => {})
    const ro = new ResizeObserver(draw)
    if (el) ro.observe(el)
    return () => {
      dead = true
      ro.disconnect()
    }
  })

  $effect(() => {
    void theme.colorScheme
    void selected
    void regionCounts
    draw()
  })
</script>

<Board title={$t('etnos.explore.simpul_title')} class="w-full">
  {#snippet action()}
    <span class="text-xs text-slate-500 dark:text-zinc-400">
      {$t('etnos.explore.simpul_caption')}
    </span>
  {/snippet}

  <div class="text-slate-800 dark:text-zinc-200">
    <canvas
      bind:this={el}
      onclick={hit}
      class="w-full h-56 sm:h-72 block cursor-pointer"
      aria-label={$t('etnos.explore.simpul_title')}
    ></canvas>
  </div>

  <div
    class="px-4 py-3 border-t border-slate-200/70 dark:border-zinc-800 min-h-12"
  >
    {#if selected}
      <p class="text-sm text-slate-700 dark:text-zinc-300">
        <span class="font-medium text-slate-900 dark:text-zinc-100"
          >{selected.kota}</span
        >, {selected.wilayah}
        · {anchorCounts[selected.kota] ?? 0} komunitas tercatat
      </p>
    {:else}
      <p class="text-xs text-slate-500 dark:text-zinc-400">
        {$t('etnos.explore.simpul_hint')}
      </p>
    {/if}
  </div>
</Board>
