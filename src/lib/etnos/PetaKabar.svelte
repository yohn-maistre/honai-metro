<script lang="ts">
  /**
   * Peta Kabar: Tanah Papua as a canvas dot-grid plate (no tiles, no
   * MapLibre), doubling as the real-time layer board. The dithered fill
   * carries dashed kabupaten lines (the cadastral stitch), and six data
   * layers ride on top: kabar (detak-detik kliping pins), gempa (BMKG +
   * USGS), cuaca (Open-Meteo at the anchor cities), banjir (PetaBencana),
   * titik api (NASA FIRMS via the detak worker), udara (WAQI PM2.5, same
   * worker). Every layer is honest: langsung when fetched, nihil when a
   * source answers with zero points, segera when unreachable. No fake
   * points, ever. The static base (dots + boundaries) is cached offscreen
   * so marker redraws stay cheap on phones.
   */
  import { onMount } from 'svelte'
  import { ArrowTopRightOnSquare, Icon } from 'svelte-hero-icons/dist'
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
  import { loadKliping, matchPins, klipingUrl, type KabarPin } from './kabar'
  import {
    ANCHORS,
    fetchBanjir,
    fetchCuaca,
    fetchGempa,
    fetchTitikApi,
    fetchUdara,
    type Anchor,
    type BanjirPoint,
    type CuacaPoint,
    type GempaPoint,
    type LayerId,
    type LayerStatus,
    type TitikApiPoint,
    type UdaraPoint,
  } from './layers'
  import { Board, DataChip } from './ui'

  const COLS = 120
  const ROWS = 104

  // Fixed data-layer colors, same in both themes (detak convention).
  const LAYER_COLOR: Record<string, string> = {
    banjir: '#3f6fa0',
    api: '#c2410c',
    udara: '#7c5cbf',
  }

  let el = $state<HTMLCanvasElement>()
  let grid: AtlasGrid | null = $state(null)
  let bounds: BoundaryPaths | null = $state(null)

  // Layer data + status. Data arrays stay empty until a fetch answers.
  let pins = $state<KabarPin[]>([])
  let gempa = $state<GempaPoint[]>([])
  let cuaca = $state<CuacaPoint[]>([])
  let banjir = $state<BanjirPoint[]>([])
  let api = $state<TitikApiPoint[]>([])
  let udara = $state<UdaraPoint[]>([])
  let status = $state<Partial<Record<LayerId, LayerStatus>>>({})

  let layerOn = $state<Record<LayerId, boolean>>({
    kabar: true,
    gempa: true,
    cuaca: true,
    banjir: false,
    api: false,
    udara: false,
  })

  const live = $derived(pins.length > 0)

  type Sel = { layer: LayerId | 'anchor'; i: number } | null
  let sel = $state<Sel>(null)

  const LAYERS: LayerId[] = ['kabar', 'gempa', 'cuaca', 'banjir', 'api', 'udara']

  async function loadLayer(id: LayerId) {
    if (id === 'kabar') {
      const kliping = await loadKliping()
      if (kliping && grid) pins = matchPins(kliping, grid.kabs)
      status.kabar = pins.length ? 'langsung' : kliping ? 'nihil' : 'segera'
    } else if (id === 'gempa') {
      const r = await fetchGempa()
      if (r) gempa = r
      status.gempa = r === null ? 'segera' : r.length ? 'langsung' : 'nihil'
    } else if (id === 'cuaca') {
      const r = await fetchCuaca()
      if (r) cuaca = r
      status.cuaca = r === null ? 'segera' : 'langsung'
    } else if (id === 'banjir') {
      const r = await fetchBanjir()
      if (r) banjir = r
      status.banjir = r === null ? 'segera' : r.length ? 'langsung' : 'nihil'
    } else if (id === 'api') {
      const r = await fetchTitikApi()
      if (r) api = r
      status.api = r === null ? 'segera' : r.length ? 'langsung' : 'nihil'
    } else if (id === 'udara') {
      const r = await fetchUdara()
      if (r) udara = r
      status.udara = r === null ? 'segera' : r.length ? 'langsung' : 'nihil'
    }
  }

  function toggle(id: LayerId) {
    layerOn[id] = !layerOn[id]
    if (layerOn[id] && status[id] === undefined) void loadLayer(id)
    if (!layerOn[id] && sel?.layer === id) sel = null
  }

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
  type Plate = NonNullable<ReturnType<typeof plate>>

  function pinXY(lnglat: [number, number], p: Plate) {
    const [fx, fy] = lonLatToCellF(lnglat[0], lnglat[1], COLS, ROWS)
    return [p.ox + fx * p.scale, p.oy + fy * p.scale] as [number, number]
  }

  // The kabupaten holding the selected kabar pin gets darker dots + a solid
  // outline; derived here so both base cache key and detail panel share it.
  const selKabIdx = $derived.by(() => {
    if (sel?.layer !== 'kabar') return -1
    const nama = pins[sel.i]?.kab.nama
    if (!nama || !grid) return -1
    return grid.kabs.findIndex((k) => k.nama === nama)
  })

  /* Static base (dots + boundary stitch) cached offscreen; redrawn only
     when size, theme colors, or the selected kabupaten change. */
  let base: HTMLCanvasElement | null = null
  let baseKey = ''

  function ensureBase(p: Plate, dpr: number, c: PlateColors) {
    if (!grid) return
    const key = [p.w, p.h, dpr, c.ink, c.muted, selKabIdx].join('|')
    if (base && baseKey === key) return
    base = document.createElement('canvas')
    base.width = Math.round(p.w * dpr)
    base.height = Math.round(p.h * dpr)
    const ctx = base.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const dot = Math.max(1, p.scale * 0.42)
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const cell = grid.cells[gy * COLS + gx]!
        if (!cell) continue
        ctx.fillStyle = c.ink
        ctx.globalAlpha =
          selKabIdx >= 0 && cell === selKabIdx + 1 ? 0.85 : c.dark ? 0.42 : 0.3
        ctx.fillRect(
          p.ox + gx * p.scale + (p.scale - dot) / 2,
          p.oy + gy * p.scale + (p.scale - dot) / 2,
          dot,
          dot,
        )
      }
    }
    ctx.globalAlpha = 1

    // kabupaten lines: faint dashed stitch, solid terracotta on selection
    if (bounds) {
      ctx.save()
      ctx.translate(p.ox, p.oy)
      ctx.scale(p.scale, p.scale)
      ctx.setLineDash([2 / p.scale, 3 / p.scale])
      ctx.lineWidth = 1 / p.scale
      ctx.strokeStyle = c.muted
      ctx.globalAlpha = 0.5
      for (const path of bounds.paths) ctx.stroke(path)
      if (selKabIdx >= 0 && bounds.paths[selKabIdx]) {
        ctx.setLineDash([])
        ctx.lineWidth = 1.4 / p.scale
        ctx.strokeStyle = c.accent
        ctx.globalAlpha = 1
        ctx.stroke(bounds.paths[selKabIdx]!)
      }
      ctx.restore()
      ctx.globalAlpha = 1
    }
    baseKey = key
  }

  function halo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
    ctx.strokeStyle = color
    ctx.lineWidth = 0.7
    ctx.beginPath()
    ctx.arc(x, y, r + 5, 0, Math.PI * 2)
    ctx.stroke()
  }

  function draw() {
    if (!el || !grid) return
    const ctx = el.getContext('2d')
    const p = plate()
    if (!ctx || !p) return
    const c = colors()

    const dpr = Math.min(window.devicePixelRatio ?? 1, 1.75)
    el.width = Math.round(p.w * dpr)
    el.height = Math.round(p.h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, p.w, p.h)

    ensureBase(p, dpr, c)
    if (base) ctx.drawImage(base, 0, 0, p.w, p.h)

    // markers, bottom to top: udara, api, banjir, cuaca, gempa, kabar
    if (layerOn.udara) {
      ctx.fillStyle = LAYER_COLOR.udara!
      udara.forEach((pt, i) => {
        const [x, y] = pinXY([pt.lon, pt.lat], p)
        const s = Math.min(7, 2.5 + pt.aqi * 0.02)
        ctx.globalAlpha = 0.8
        ctx.fillRect(x - s / 2, y - s / 2, s, s)
        ctx.globalAlpha = 1
        if (sel?.layer === 'udara' && sel.i === i) halo(ctx, x, y, s, LAYER_COLOR.udara!)
      })
    }
    if (layerOn.api) {
      ctx.fillStyle = LAYER_COLOR.api!
      api.forEach((pt, i) => {
        const [x, y] = pinXY([pt.lon, pt.lat], p)
        const s = Math.min(6, 2 + pt.frp * 0.04)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.PI / 4)
        ctx.fillRect(-s / 2, -s / 2, s, s)
        ctx.restore()
        if (sel?.layer === 'api' && sel.i === i) halo(ctx, x, y, s, LAYER_COLOR.api!)
      })
    }
    if (layerOn.banjir) {
      ctx.strokeStyle = LAYER_COLOR.banjir!
      ctx.lineWidth = 1.6
      banjir.forEach((pt, i) => {
        const [x, y] = pinXY([pt.lon, pt.lat], p)
        const s = Math.min(6, 3 + pt.state * 1.2)
        ctx.beginPath()
        ctx.moveTo(x - s, y)
        ctx.lineTo(x + s, y)
        ctx.moveTo(x, y - s)
        ctx.lineTo(x, y + s)
        ctx.stroke()
        if (sel?.layer === 'banjir' && sel.i === i) halo(ctx, x, y, s, LAYER_COLOR.banjir!)
      })
    }
    if (layerOn.cuaca && cuaca.length) {
      ctx.font = '600 10px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      cuaca.forEach((pt, i) => {
        const [x, y] = pinXY([pt.lon, pt.lat], p)
        ctx.fillStyle = c.muted
        ctx.beginPath()
        ctx.arc(x, y, 1.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = c.ink
        ctx.globalAlpha = 0.85
        ctx.fillText(`${pt.t}°`, x + 4, y - 5)
        ctx.globalAlpha = 1
        if (sel?.layer === 'cuaca' && sel.i === i) halo(ctx, x, y, 4, c.accent)
      })
    }
    if (layerOn.gempa) {
      gempa.forEach((pt, i) => {
        const [x, y] = pinXY([pt.lon, pt.lat], p)
        const r = Math.min(12, Math.max(3, 3 + pt.mag * 1.6))
        const isSel = sel?.layer === 'gempa' && sel.i === i
        ctx.strokeStyle = c.ink
        ctx.lineWidth = isSel ? 1.8 : 1.1
        ctx.globalAlpha = 0.8
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.fillStyle = c.ink
        ctx.beginPath()
        ctx.arc(x, y, 1.4, 0, Math.PI * 2)
        ctx.fill()
        if (isSel) halo(ctx, x, y, r, c.ink)
      })
    }
    if (layerOn.kabar && live) {
      pins.forEach((pin, i) => {
        const [x, y] = pinXY(pin.kab.cen, p)
        const r = Math.min(10, 4 + pin.kliping.skor * 0.18)
        const isSel = sel?.layer === 'kabar' && sel.i === i
        ctx.strokeStyle = c.accent
        ctx.fillStyle = c.accent
        ctx.lineWidth = isSel ? 2 : 1.4
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.stroke()
        if (isSel) halo(ctx, x, y, r, c.accent)
        ctx.beginPath()
        ctx.arc(x, y, 1.8, 0, Math.PI * 2)
        ctx.fill()
      })
    } else if (!live && !(layerOn.cuaca && cuaca.length)) {
      // quiet anchor cities when neither news pins nor temps mark them
      for (const a of ANCHORS) {
        const [x, y] = pinXY(a.lnglat, p)
        const isSel = sel?.layer === 'anchor' && ANCHORS[sel.i]?.kota === a.kota
        ctx.strokeStyle = isSel ? c.accent : c.muted
        ctx.fillStyle = isSel ? c.accent : c.muted
        ctx.lineWidth = isSel ? 1.8 : 1.1
        ctx.beginPath()
        ctx.arc(x, y, isSel ? 6.5 : 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  function hit(e: MouseEvent) {
    const p = plate()
    if (!el || !p) return
    const rect = el.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    // top-most layer first; first hit within radius wins
    const groups: {
      layer: NonNullable<Sel>['layer']
      pts: [number, number][]
    }[] = []
    if (layerOn.kabar && live)
      groups.push({ layer: 'kabar', pts: pins.map((pin) => pinXY(pin.kab.cen, p)) })
    if (layerOn.gempa)
      groups.push({ layer: 'gempa', pts: gempa.map((g) => pinXY([g.lon, g.lat], p)) })
    if (layerOn.banjir)
      groups.push({ layer: 'banjir', pts: banjir.map((b) => pinXY([b.lon, b.lat], p)) })
    if (layerOn.api)
      groups.push({ layer: 'api', pts: api.map((a) => pinXY([a.lon, a.lat], p)) })
    if (layerOn.udara)
      groups.push({ layer: 'udara', pts: udara.map((u) => pinXY([u.lon, u.lat], p)) })
    if (layerOn.cuaca && cuaca.length)
      groups.push({ layer: 'cuaca', pts: cuaca.map((cu) => pinXY([cu.lon, cu.lat], p)) })
    if (!live && !(layerOn.cuaca && cuaca.length))
      groups.push({ layer: 'anchor', pts: ANCHORS.map((a) => pinXY(a.lnglat, p)) })

    for (const g of groups) {
      let best = -1
      let bestD = 26 * 26
      g.pts.forEach(([x, y], i) => {
        const d = (x - mx) ** 2 + (y - my) ** 2
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      if (best !== -1) {
        sel =
          sel?.layer === g.layer && sel.i === best
            ? null
            : { layer: g.layer, i: best }
        return
      }
    }
    sel = null
  }

  onMount(() => {
    let dead = false
    let gempaTimer: ReturnType<typeof setInterval> | undefined

    void Promise.all([loadAtlasGrid(COLS, ROWS), loadBoundaryPaths(COLS, ROWS)])
      .then(([g, b]) => {
        if (dead) return
        grid = g
        bounds = b
        draw()
        // default-on layers
        void loadLayer('kabar')
        void loadLayer('gempa')
        void loadLayer('cuaca')
        gempaTimer = setInterval(() => {
          if (layerOn.gempa) void loadLayer('gempa')
        }, 120_000)
      })
      .catch(() => {
        /* the plate stays quiet */
      })

    const ro = new ResizeObserver(draw)
    if (el) ro.observe(el)
    return () => {
      dead = true
      if (gempaTimer) clearInterval(gempaTimer)
      ro.disconnect()
    }
  })

  $effect(() => {
    void theme.colorScheme
    void sel
    void pins
    void gempa
    void cuaca
    void banjir
    void api
    void udara
    void layerOn.kabar
    void layerOn.gempa
    void layerOn.cuaca
    void layerOn.banjir
    void layerOn.api
    void layerOn.udara
    draw()
  })

  const curKabar = $derived(sel?.layer === 'kabar' ? pins[sel.i] : null)
  const curGempa = $derived(sel?.layer === 'gempa' ? gempa[sel.i] : null)
  const curCuaca = $derived(sel?.layer === 'cuaca' ? cuaca[sel.i] : null)
  const curBanjir = $derived(sel?.layer === 'banjir' ? banjir[sel.i] : null)
  const curApi = $derived(sel?.layer === 'api' ? api[sel.i] : null)
  const curUdara = $derived(sel?.layer === 'udara' ? udara[sel.i] : null)
  const curAnchor = $derived<Anchor | null>(
    sel?.layer === 'anchor' ? (ANCHORS[sel.i] ?? null) : null,
  )
</script>

<Board title="Peta Kabar" class="w-full">
  {#snippet action()}
    {#if live}
      <DataChip state="langsung" label={$t('etnos.peta.kabar_live')} />
    {:else}
      <span class="text-xs text-slate-500 dark:text-zinc-400">Tanah Papua</span>
    {/if}
  {/snippet}

  <div class="lg:flex">
    <div class="text-slate-800 dark:text-zinc-200 lg:flex-1 min-w-0">
      <canvas
        bind:this={el}
        onclick={hit}
        class="w-full h-64 sm:h-80 lg:h-[28rem] block cursor-pointer"
        aria-label={$t('etnos.peta.aria')}
      ></canvas>
    </div>

    <aside
      class="lg:w-72 lg:shrink-0 lg:border-l border-slate-200/70 dark:border-zinc-800 flex flex-col"
    >
      <!-- layer legend: neutral toggle chips, status dots in DataChip grammar -->
      <div
        class="flex lg:flex-wrap gap-1.5 overflow-x-auto px-3 py-2 min-h-11 border-t lg:border-t-0 border-slate-200/70 dark:border-zinc-800"
        role="group"
        aria-label={$t('etnos.peta.layers_aria')}
      >
        {#each LAYERS as id (id)}
          {@const st = status[id]}
          <button
            type="button"
            aria-pressed={layerOn[id]}
            class={[
              'shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
              layerOn[id]
                ? 'bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-zinc-100'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700',
            ]}
            onclick={() => toggle(id)}
          >
            {#if st === 'langsung'}
              <span class="w-1.5 h-1.5 rounded-full bg-primary-500 dot-live"
              ></span>
            {:else if st === 'nihil'}
              <span
                class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500"
              ></span>
            {:else if st === 'segera'}
              <span
                class="w-1.5 h-1.5 rounded-full border-[1.5px] border-dashed border-slate-400 dark:border-zinc-500"
              ></span>
            {/if}
            {$t(`etnos.peta.layers.${id}`)}
          </button>
        {/each}
      </div>

      <div
        class="px-4 py-3 border-t border-slate-200/70 dark:border-zinc-800 min-h-14 lg:flex-1"
      >
        {#if curKabar}
          <div class="flex flex-col gap-1">
            <p
              class="text-sm font-medium text-slate-900 dark:text-zinc-100 line-clamp-2"
            >
              {curKabar.kliping.utama.judul}
            </p>
            <p class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
              {curKabar.kab.nama} · {curKabar.kliping.n_media} media ·
              {curKabar.kliping.n_grup} grup pemilik
              <a
                href={klipingUrl(curKabar.kliping.id)}
                target="_blank"
                rel="noopener noreferrer"
                class="ml-2 inline-flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Buka kliping
                <Icon src={ArrowTopRightOnSquare} micro size="12" />
              </a>
            </p>
          </div>
        {:else if curGempa}
          <p class="text-sm text-slate-900 dark:text-zinc-100">
            <span class="font-semibold tabular-nums">M{curGempa.mag}</span>
            · {curGempa.wilayah}
          </p>
          <p class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
            {curGempa.jam} · BMKG / USGS · langsung
          </p>
        {:else if curCuaca}
          <p class="text-sm text-slate-900 dark:text-zinc-100">
            <span class="font-semibold">{curCuaca.kota}</span>
            <span class="tabular-nums">{curCuaca.t}°</span> · {curCuaca.langit}
          </p>
          <p class="text-xs text-slate-500 dark:text-zinc-400">
            Open-Meteo · langsung
          </p>
        {:else if curBanjir}
          <p class="text-sm text-slate-900 dark:text-zinc-100">
            {curBanjir.nama}
          </p>
          <p class="text-xs text-slate-500 dark:text-zinc-400">
            PetaBencana · langsung
          </p>
        {:else if curApi}
          <p class="text-sm text-slate-900 dark:text-zinc-100">
            <span class="font-semibold tabular-nums">{curApi.frp} MW</span>
            · {$t('etnos.peta.api_note')}
          </p>
          <p class="text-xs text-slate-500 dark:text-zinc-400">
            NASA FIRMS · VIIRS · langsung
          </p>
        {:else if curUdara}
          <p class="text-sm text-slate-900 dark:text-zinc-100">
            <span class="font-semibold">{curUdara.nama}</span>
            · PM2.5 <span class="tabular-nums">{curUdara.aqi}</span>
          </p>
          <p class="text-xs text-slate-500 dark:text-zinc-400">
            WAQI · langsung
          </p>
        {:else if curAnchor}
          <p class="text-sm text-slate-700 dark:text-zinc-300">
            <span class="font-medium text-slate-900 dark:text-zinc-100"
              >{curAnchor.kota}</span
            >, {curAnchor.wilayah} · belum ada instance terpisah
          </p>
        {:else}
          <p class="text-xs text-slate-500 dark:text-zinc-400">
            {$t('etnos.peta.identity')}
            <a
              href="/tentang"
              class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {$t('etnos.peta.identity_link')}
            </a>
          </p>
        {/if}
      </div>
    </aside>
  </div>

  {#if live && layerOn.kabar}
    <div
      class="flex gap-1.5 overflow-x-auto px-3 py-2 border-t border-slate-200/70 dark:border-zinc-800"
    >
      {#each pins as pin, i (pin.kliping.id)}
        <button
          type="button"
          class={[
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
            sel?.layer === 'kabar' && sel.i === i
              ? 'bg-primary-900 text-slate-25 dark:bg-primary-100 dark:text-zinc-950'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700',
          ]}
          onclick={() =>
            (sel =
              sel?.layer === 'kabar' && sel.i === i
                ? null
                : { layer: 'kabar', i })}
        >
          {pin.kab.nama}
        </button>
      {/each}
    </div>
  {/if}
</Board>

<style>
  @keyframes dot-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }
  .dot-live {
    animation: dot-pulse 2.4s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .dot-live {
      animation: none;
    }
  }
</style>
