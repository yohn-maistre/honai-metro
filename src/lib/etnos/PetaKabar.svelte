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
   * points, ever.
   *
   * The canvas spans the full card; everything else floats over it,
   * detak-detik style: the layer legend top-right, and a dossier card
   * top-left that opens for a clicked marker OR a clicked kabupaten
   * (the raster feature index makes region hit-testing an O(1) lookup).
   * The kabupaten dossier joins the vendored Kemendagri wilayah rows
   * (ibukota, penduduk, luas) with live crosscuts computed from the
   * already-fetched layers. Clicking a region only opens the card; it
   * never filters the feed.
   */
  import { onMount } from 'svelte'
  import {
    ArrowTopRightOnSquare,
    Icon,
    XMark,
  } from 'svelte-hero-icons/dist'
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
  import directoryData from './data/directory.json'
  import wilayahData from './data/wilayah.json'
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
  import { DataChip, SectionHead } from './ui'
  import wajahData from './wiki/wajah.json'

  const COLS = 120
  const ROWS = 104

  // Fixed data-layer colors, same in both themes (detak convention).
  const LAYER_COLOR: Record<string, string> = {
    banjir: '#3f6fa0',
    api: '#c2410c',
    udara: '#7c5cbf',
  }

  const PROV_NAMA: Record<string, string> = {
    '91': 'Papua Barat',
    '92': 'Papua Barat Daya',
    '94': 'Papua',
    '95': 'Papua Selatan',
    '96': 'Papua Tengah',
    '97': 'Papua Pegunungan',
  }

  type WilayahRow = (typeof wilayahData.rows)[number]
  const wilayahByNama = new Map<string, WilayahRow>(
    wilayahData.rows.map((r) => [r.nama, r]),
  )

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

  let legendaBuka = $state(false)

  const live = $derived(pins.length > 0)

  type Sel = { layer: LayerId | 'anchor' | 'kab'; i: number } | null
  let sel = $state<Sel>(null)

  const LAYERS: LayerId[] = ['kabar', 'gempa', 'cuaca', 'banjir', 'api', 'udara']

  const SUMBER: Record<LayerId, string> = {
    kabar: 'Detak Detik',
    gempa: 'BMKG / USGS',
    cuaca: 'Open-Meteo',
    banjir: 'PetaBencana',
    api: 'NASA FIRMS',
    udara: 'WAQI',
  }
  const sumberAktif = $derived(
    LAYERS.filter((id) => layerOn[id] && status[id] === 'langsung').map(
      (id) => SUMBER[id],
    ),
  )

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
    const scale = Math.min((w * 0.97) / COLS, (h * 0.97) / ROWS)
    return { w, h, scale, ox: (w - COLS * scale) / 2, oy: (h - ROWS * scale) / 2 }
  }
  type Plate = NonNullable<ReturnType<typeof plate>>

  function pinXY(lnglat: [number, number], p: Plate) {
    const [fx, fy] = lonLatToCellF(lnglat[0], lnglat[1], COLS, ROWS)
    return [p.ox + fx * p.scale, p.oy + fy * p.scale] as [number, number]
  }

  /** Kabupaten index (into grid.kabs) at a lon/lat, or -1 at sea. */
  function kabAt(lon: number, lat: number): number {
    if (!grid) return -1
    const [fx, fy] = lonLatToCellF(lon, lat, COLS, ROWS)
    const gx = Math.floor(fx)
    const gy = Math.floor(fy)
    if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return -1
    const cell = grid.cells[gy * COLS + gx]!
    return cell ? cell - 1 : -1
  }

  function openKab(i: number) {
    sel = { layer: 'kab', i }
  }

  // The selected kabupaten (clicked directly, or holding the selected
  // kabar pin) gets darker dots + a solid outline; derived here so both
  // base cache key and dossier share it.
  const selKabIdx = $derived.by(() => {
    if (sel?.layer === 'kab') return sel.i
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
      layer: LayerId | 'anchor'
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
      let bestD = 22 * 22
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

    // no marker hit: the kabupaten under the cursor opens its dossier
    if (grid) {
      const gx = Math.floor((mx - p.ox) / p.scale)
      const gy = Math.floor((my - p.oy) / p.scale)
      if (gx >= 0 && gy >= 0 && gx < COLS && gy < ROWS) {
        const cell = grid.cells[gy * COLS + gx]!
        if (cell) {
          const i = cell - 1
          sel = sel?.layer === 'kab' && sel.i === i ? null : { layer: 'kab', i }
          return
        }
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
  const curKab = $derived(
    sel?.layer === 'kab' && grid ? (grid.kabs[sel.i] ?? null) : null,
  )

  // The kabupaten a selected marker sits in, for the "open region card" hop.
  const markerKab = $derived.by(() => {
    if (!grid) return null
    if (curKabar) {
      const i = grid.kabs.findIndex((k) => k.nama === curKabar.kab.nama)
      return i >= 0 ? { i, nama: curKabar.kab.nama } : null
    }
    const pt = curGempa ?? curCuaca ?? curBanjir ?? curApi ?? curUdara
    if (!pt) return null
    const i = kabAt(pt.lon, pt.lat)
    return i >= 0 ? { i, nama: grid.kabs[i]!.nama } : null
  })

  const fmt = (n: number) => n.toLocaleString('id-ID')

  // Kabupaten filing card: Kemendagri reference rows + live crosscuts
  // computed from whatever layers have already answered.
  const kabDossier = $derived.by(() => {
    if (!curKab || sel?.layer !== 'kab') return null
    const cellIdx = sel.i + 1
    const inKab = (lon: number, lat: number) => {
      const [fx, fy] = lonLatToCellF(lon, lat, COLS, ROWS)
      const gx = Math.floor(fx)
      const gy = Math.floor(fy)
      if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return false
      return grid!.cells[gy * COLS + gx] === cellIdx
    }
    const w = wilayahByNama.get(curKab.nama) ?? null
    let nKab = 0
    let rankPop = 0
    let kepadatan = 0
    if (w) {
      const sib = wilayahData.rows.filter((r) => r.prov === w.prov)
      nKab = sib.length
      rankPop = sib.filter((r) => r.pop > w.pop).length + 1
      kepadatan = w.pop / w.luas
    }
    return {
      w,
      nKab,
      rankPop,
      kepadatan,
      prov: PROV_NAMA[w?.prov ?? ''] ?? '',
      gempaN:
        status.gempa && status.gempa !== 'segera'
          ? gempa.filter((g) => inKab(g.lon, g.lat)).length
          : null,
      cuacaDi: cuaca.find((pt) => inKab(pt.lon, pt.lat)) ?? null,
      banjirN:
        status.banjir && status.banjir !== 'segera'
          ? banjir.filter((b) => inKab(b.lon, b.lat)).length
          : null,
      apiN:
        status.api && status.api !== 'segera'
          ? api.filter((a) => inKab(a.lon, a.lat)).length
          : null,
      kabarDi: pins.filter((pin) => pin.kab.nama === curKab.nama),
      komunitas: directoryData.groups
        .flatMap((g) => g.communities)
        .filter((c) => 'region' in c && c.region === curKab.nama),
      wajah: wajahData.entries.filter(
        (e) => e.koordinat && inKab(e.koordinat[1]!, e.koordinat[0]!),
      ),
    }
  })

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && sel) sel = null
  }
</script>

<svelte:window {onkeydown} />

<section class="flex flex-col gap-2 w-full">
  <SectionHead
    title="Peta Kabar"
    caption={live ? undefined : 'Tanah Papua'}
  >
    {#snippet action()}
      {#if live}
        <DataChip state="langsung" label={$t('etnos.peta.kabar_live')} />
      {/if}
    {/snippet}
  </SectionHead>

  <!-- the plate is the page itself: full-bleed dots on paper, no card -->
  <div class="relative -mx-3 sm:-mx-6 text-slate-800 dark:text-zinc-200">
    <canvas
      bind:this={el}
      onclick={hit}
      class="w-full h-80 sm:h-[26rem] lg:h-[32rem] block cursor-pointer"
      aria-label={$t('etnos.peta.aria')}
    ></canvas>

    <!-- floating layer legend, top-right (detak's kb-legenda pattern) -->
    <div
      class="absolute top-2 right-3 sm:right-6 flex flex-col items-end gap-1.5 max-w-[46%]"
    >
      <button
        type="button"
        aria-expanded={legendaBuka}
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-white dark:bg-zinc-900 border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 shadow-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        onclick={() => (legendaBuka = !legendaBuka)}
      >
        {#if sumberAktif.length}
          <span class="w-1.5 h-1.5 rounded-full bg-primary-500 dot-live"></span>
        {/if}
        {$t('etnos.peta.lapisan')} · {LAYERS.filter((id) => layerOn[id]).length}
      </button>
      {#if legendaBuka}
        <div
          class="flex flex-col gap-1 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 shadow-sm p-1.5 w-40"
          role="group"
          aria-label={$t('etnos.peta.layers_aria')}
        >
          {#each LAYERS as id (id)}
            {@const st = status[id]}
            <button
              type="button"
              aria-pressed={layerOn[id]}
              class={[
                'flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium transition-colors text-left',
                layerOn[id]
                  ? 'bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-zinc-100'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800',
              ]}
              onclick={() => toggle(id)}
            >
              {#if st === 'langsung'}
                <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-primary-500 dot-live"
                ></span>
              {:else if st === 'nihil'}
                <span
                  class="w-1.5 h-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-zinc-500"
                ></span>
              {:else if st === 'segera'}
                <span
                  class="w-1.5 h-1.5 shrink-0 rounded-full border-[1.5px] border-dashed border-slate-400 dark:border-zinc-500"
                ></span>
              {:else}
                <span class="w-1.5 h-1.5 shrink-0"></span>
              {/if}
              {$t(`etnos.peta.layers.${id}`)}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- floating dossier, top-left: fixed corner, never chases the click -->
    {#if sel}
      <div
        class="absolute left-3 sm:left-6 top-2 w-[min(19rem,calc(100%-1.5rem))] max-h-[calc(100%-1rem)] overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 shadow-sm p-3 flex flex-col gap-2"
      >
        <button
          type="button"
          class="absolute top-2 right-2 p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={$t('etnos.peta.tutup')}
          onclick={() => (sel = null)}
        >
          <Icon src={XMark} micro size="14" />
        </button>

        {#if curKab && kabDossier}
          <div class="flex flex-col gap-0.5 pr-6">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {curKab.nama}
            </h3>
            {#if kabDossier.prov}
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                {kabDossier.prov}
              </p>
            {/if}
          </div>

          {#if kabDossier.w}
            <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt class="text-slate-500 dark:text-zinc-400">
                {$t('etnos.peta.dossier.ibukota')}
              </dt>
              <dd class="text-slate-900 dark:text-zinc-100 text-right">
                {kabDossier.w.ibukota}
              </dd>
              <dt class="text-slate-500 dark:text-zinc-400">
                {$t('etnos.peta.dossier.penduduk')}
              </dt>
              <dd class="text-slate-900 dark:text-zinc-100 text-right tabular-nums">
                {fmt(kabDossier.w.pop)}
                <span class="text-slate-400 dark:text-zinc-500">
                  · №{kabDossier.rankPop}/{kabDossier.nKab}
                </span>
              </dd>
              <dt class="text-slate-500 dark:text-zinc-400">
                {$t('etnos.peta.dossier.luas')}
              </dt>
              <dd class="text-slate-900 dark:text-zinc-100 text-right tabular-nums">
                {fmt(Math.round(kabDossier.w.luas))} km²
              </dd>
              <dt class="text-slate-500 dark:text-zinc-400">
                {$t('etnos.peta.dossier.kepadatan')}
              </dt>
              <dd class="text-slate-900 dark:text-zinc-100 text-right tabular-nums">
                {kabDossier.kepadatan < 100
                  ? kabDossier.kepadatan.toFixed(1)
                  : fmt(Math.round(kabDossier.kepadatan))}/km²
              </dd>
            </dl>
            <p class="text-[11px] leading-snug text-slate-400 dark:text-zinc-500">
              {$t('etnos.peta.dossier.sumber_wilayah')}
            </p>
          {/if}

          {#if kabDossier.gempaN !== null || kabDossier.cuacaDi || kabDossier.banjirN || kabDossier.apiN}
            <div
              class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs border-t border-slate-100 dark:border-zinc-800 pt-2"
            >
              {#if kabDossier.gempaN !== null}
                <span class="text-slate-600 dark:text-zinc-300 tabular-nums">
                  {$t('etnos.peta.dossier.gempa24')}:
                  <span class="font-semibold">{kabDossier.gempaN}</span>
                </span>
              {/if}
              {#if kabDossier.cuacaDi}
                <span class="text-slate-600 dark:text-zinc-300 tabular-nums">
                  {kabDossier.cuacaDi.kota}
                  <span class="font-semibold">{kabDossier.cuacaDi.t}°</span>
                  {kabDossier.cuacaDi.langit}
                </span>
              {/if}
              {#if kabDossier.banjirN}
                <span class="text-slate-600 dark:text-zinc-300 tabular-nums">
                  {$t('etnos.peta.layers.banjir')}:
                  <span class="font-semibold">{kabDossier.banjirN}</span>
                </span>
              {/if}
              {#if kabDossier.apiN}
                <span class="text-slate-600 dark:text-zinc-300 tabular-nums">
                  {$t('etnos.peta.layers.api')}:
                  <span class="font-semibold">{kabDossier.apiN}</span>
                </span>
              {/if}
            </div>
          {/if}

          {#if kabDossier.kabarDi.length}
            <div
              class="flex flex-col gap-1 border-t border-slate-100 dark:border-zinc-800 pt-2"
            >
              <p class="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                {$t('etnos.peta.dossier.kabar')}
              </p>
              {#each kabDossier.kabarDi.slice(0, 3) as pin (pin.kliping.id)}
                <a
                  href={klipingUrl(pin.kliping.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-slate-900 dark:text-zinc-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
                >
                  {pin.kliping.utama.judul}
                </a>
              {/each}
            </div>
          {/if}

          {#if kabDossier.komunitas.length}
            <div
              class="flex flex-col gap-1 border-t border-slate-100 dark:border-zinc-800 pt-2"
            >
              <p class="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                {$t('etnos.peta.dossier.komunitas')}
                <span class="font-normal">· contoh</span>
              </p>
              <p class="text-xs text-slate-700 dark:text-zinc-300">
                {kabDossier.komunitas.map((c) => c.name).join(' · ')}
                <a
                  href="/explore"
                  class="ml-1 font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Jelajah
                </a>
              </p>
            </div>
          {/if}

          {#if kabDossier.wajah.length}
            <div
              class="flex flex-col gap-1 border-t border-slate-100 dark:border-zinc-800 pt-2"
            >
              <p class="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                {$t('etnos.peta.dossier.wajah')}
              </p>
              <p class="text-xs text-slate-700 dark:text-zinc-300">
                {#each kabDossier.wajah as e, i (e.id)}
                  {#if i > 0}{' · '}{/if}
                  <a
                    href="/wiki"
                    class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {e.nama}
                  </a>
                {/each}
              </p>
            </div>
          {/if}
        {:else if curKabar}
          <div class="flex flex-col gap-1 pr-6">
            <p
              class="text-sm font-medium text-slate-900 dark:text-zinc-100 line-clamp-3"
            >
              {curKabar.kliping.utama.judul}
            </p>
            <p class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
              {curKabar.kab.nama} · {curKabar.kliping.n_media} media ·
              {curKabar.kliping.n_grup} grup pemilik
            </p>
            <a
              href={klipingUrl(curKabar.kliping.id)}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Buka kliping
              <Icon src={ArrowTopRightOnSquare} micro size="12" />
            </a>
          </div>
        {:else if curGempa}
          <div class="flex flex-col gap-0.5 pr-6">
            <p class="text-sm text-slate-900 dark:text-zinc-100">
              <span class="font-semibold tabular-nums">M{curGempa.mag}</span>
              · {curGempa.wilayah}
            </p>
            <p class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
              {curGempa.jam} · BMKG / USGS · langsung
            </p>
          </div>
        {:else if curCuaca}
          <div class="flex flex-col gap-0.5 pr-6">
            <p class="text-sm text-slate-900 dark:text-zinc-100">
              <span class="font-semibold">{curCuaca.kota}</span>
              <span class="tabular-nums">{curCuaca.t}°</span> · {curCuaca.langit}
            </p>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              Open-Meteo · langsung
            </p>
          </div>
        {:else if curBanjir}
          <div class="flex flex-col gap-0.5 pr-6">
            <p class="text-sm text-slate-900 dark:text-zinc-100">
              {curBanjir.nama}
            </p>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              PetaBencana · langsung
            </p>
          </div>
        {:else if curApi}
          <div class="flex flex-col gap-0.5 pr-6">
            <p class="text-sm text-slate-900 dark:text-zinc-100">
              <span class="font-semibold tabular-nums">{curApi.frp} MW</span>
              · {$t('etnos.peta.api_note')}
            </p>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              NASA FIRMS · VIIRS · langsung
            </p>
          </div>
        {:else if curUdara}
          <div class="flex flex-col gap-0.5 pr-6">
            <p class="text-sm text-slate-900 dark:text-zinc-100">
              <span class="font-semibold">{curUdara.nama}</span>
              · PM2.5 <span class="tabular-nums">{curUdara.aqi}</span>
            </p>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              WAQI · langsung
            </p>
          </div>
        {:else if curAnchor}
          <p class="text-sm text-slate-700 dark:text-zinc-300 pr-6">
            <span class="font-medium text-slate-900 dark:text-zinc-100"
              >{curAnchor.kota}</span
            >, {curAnchor.wilayah} · belum ada instance terpisah
          </p>
        {/if}

        {#if sel.layer !== 'kab' && markerKab}
          <button
            type="button"
            class="self-start text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            onclick={() => openKab(markerKab.i)}
          >
            {$t('etnos.peta.lihat_kab')}: {markerKab.nama}
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- footer: identity line for first-time visitors + active-source credits -->
  <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 min-h-6">
    <p class="text-xs text-slate-500 dark:text-zinc-400">
      {$t('etnos.peta.identity')}
      <a
        href="/tentang"
        class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
      >
        {$t('etnos.peta.identity_link')}
      </a>
    </p>
    {#if sumberAktif.length}
      <p class="text-xs text-slate-400 dark:text-zinc-500 ml-auto tabular-nums">
        {$t('etnos.peta.sumber_aktif')}: {sumberAktif.join(' · ')}
      </p>
    {/if}
  </div>
</section>

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
