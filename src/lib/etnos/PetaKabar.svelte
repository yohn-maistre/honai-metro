<script lang="ts">
  /**
   * Peta Kabar: Tanah Papua as a canvas dot-grid plate (no tiles, no
   * MapLibre), doubling as the real-time news layer. Live mode pins
   * detak-detik kliping clusters onto the kabupaten their headlines name;
   * tapping a pin (canvas or chip) shows the cluster and deep-links into
   * detak-detik's Lembar Kliping. Without a live feed the plate stays
   * honest: the six community anchor cities, no fake news.
   */
  import { onMount } from 'svelte'
  import { ArrowTopRightOnSquare, Icon } from 'svelte-hero-icons/dist'
  import { theme } from '$lib/app/theme/theme.svelte'
  import { loadAtlasGrid, lonLatToCellF, type AtlasGrid } from './atlas'
  import { loadKliping, matchPins, klipingUrl, type KabarPin } from './kabar'
  import { Board, DataChip } from './ui'

  const COLS = 120
  const ROWS = 104

  interface Anchor {
    kota: string
    wilayah: string
    lnglat: [number, number]
  }

  // Six anchor cities of Tanah Papua, west to east.
  const ANCHORS: Anchor[] = [
    { kota: 'Sorong', wilayah: 'Papua Barat Daya', lnglat: [131.2558, -0.8761] },
    { kota: 'Manokwari', wilayah: 'Papua Barat', lnglat: [134.062, -0.8615] },
    { kota: 'Nabire', wilayah: 'Papua Tengah', lnglat: [135.4833, -3.3667] },
    { kota: 'Wamena', wilayah: 'Papua Pegunungan', lnglat: [138.9489, -4.0892] },
    { kota: 'Jayapura', wilayah: 'Papua', lnglat: [140.7181, -2.5337] },
    { kota: 'Merauke', wilayah: 'Papua Selatan', lnglat: [140.4011, -8.4731] },
  ]

  let el = $state<HTMLCanvasElement>()
  let grid: AtlasGrid | null = $state(null)
  let pins = $state<KabarPin[]>([])
  let live = $derived(pins.length > 0)
  let selected = $state<number | null>(null)
  let selectedAnchor = $state<Anchor | null>(null)

  function colors() {
    if (!el) return { ink: '#15130e', accent: '#c0633e', muted: '#5a5345' }
    const css = getComputedStyle(el)
    return {
      ink: css.color,
      accent:
        css.getPropertyValue('--color-primary-500').trim() || '#c0633e',
      muted: css.getPropertyValue('--color-slate-500').trim() || '#6f6757',
    }
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
    const { ink, accent, muted } = colors()

    const dpr = Math.min(window.devicePixelRatio ?? 1, 1.75)
    el.width = Math.round(p.w * dpr)
    el.height = Math.round(p.h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, p.w, p.h)

    // kabupaten that hold the selected pin get darker dots
    const selKab =
      selected != null ? pins[selected]?.kab.nama : undefined
    const kabIndex = new Map(grid.kabs.map((k, i) => [k.nama, i + 1]))
    const selIdx = selKab ? kabIndex.get(selKab) : undefined

    const dot = Math.max(1, p.scale * 0.42)
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const c = grid.cells[gy * COLS + gx]!
        if (!c) continue
        ctx.fillStyle = ink
        ctx.globalAlpha = selIdx && c === selIdx ? 0.85 : 0.3
        ctx.fillRect(
          p.ox + gx * p.scale + (p.scale - dot) / 2,
          p.oy + gy * p.scale + (p.scale - dot) / 2,
          dot,
          dot,
        )
      }
    }
    ctx.globalAlpha = 1

    if (live) {
      // news seals: ring size follows coverage score
      pins.forEach((pin, i) => {
        const [x, y] = pinXY(pin.kab.cen, p)
        const r = Math.min(10, 4 + pin.kliping.skor * 0.18)
        const isSel = selected === i
        ctx.strokeStyle = accent
        ctx.fillStyle = accent
        ctx.lineWidth = isSel ? 2 : 1.4
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.stroke()
        if (isSel) {
          ctx.lineWidth = 0.7
          ctx.beginPath()
          ctx.arc(x, y, r + 5, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(x, y, 1.8, 0, Math.PI * 2)
        ctx.fill()
      })
    } else {
      // anchor cities: quiet rings, terracotta when picked
      for (const a of ANCHORS) {
        const [x, y] = pinXY(a.lnglat, p)
        const isSel = selectedAnchor?.kota === a.kota
        ctx.strokeStyle = isSel ? accent : muted
        ctx.fillStyle = isSel ? accent : muted
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
    let best = -1
    let bestD = 26 * 26
    const targets: [number, number][] = live
      ? pins.map((pin) => pinXY(pin.kab.cen, p))
      : ANCHORS.map((a) => pinXY(a.lnglat, p))
    targets.forEach(([x, y], i) => {
      const d = (x - mx) ** 2 + (y - my) ** 2
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    if (best === -1) return
    if (live) selected = selected === best ? null : best
    else selectedAnchor = selectedAnchor === ANCHORS[best] ? null : ANCHORS[best]!
  }

  onMount(() => {
    let dead = false
    void loadAtlasGrid(COLS, ROWS)
      .then((g) => {
        if (dead) return
        grid = g
        draw()
        return loadKliping()
      })
      .then((kliping) => {
        if (dead || !kliping || !grid) return
        pins = matchPins(kliping, grid.kabs)
        draw()
      })
      .catch(() => {
        /* the plate stays quiet; anchors still render when geo loads */
      })
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
    void selectedAnchor
    void pins
    draw()
  })

  const current = $derived(selected != null ? pins[selected] : null)
</script>

<Board title="Peta Kabar" class="w-full">
  {#snippet action()}
    {#if live}
      <DataChip state="langsung" label="Kabar langsung" />
    {:else}
      <span class="text-xs text-slate-500 dark:text-zinc-400">
        simpul komunitas, satu tanah
      </span>
    {/if}
  {/snippet}

  <div class="text-slate-800 dark:text-zinc-200">
    <canvas
      bind:this={el}
      onclick={hit}
      class="w-full h-52 sm:h-64 block cursor-pointer"
      aria-label="Peta Tanah Papua dengan penanda kabar per kabupaten"
    ></canvas>
  </div>

  {#if live}
    <div
      class="flex gap-1.5 overflow-x-auto px-3 py-2 border-t border-slate-200/70 dark:border-zinc-800"
    >
      {#each pins as pin, i (pin.kliping.id)}
        <button
          type="button"
          class={[
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
            selected === i
              ? 'bg-primary-900 text-slate-25 dark:bg-primary-100 dark:text-zinc-950'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700',
          ]}
          onclick={() => (selected = selected === i ? null : i)}
        >
          {pin.kab.nama}
        </button>
      {/each}
    </div>
  {/if}

  <div
    class="px-4 py-3 border-t border-slate-200/70 dark:border-zinc-800 min-h-14"
  >
    {#if current}
      <div class="flex flex-col gap-1">
        <p
          class="text-sm font-medium text-slate-900 dark:text-zinc-100 line-clamp-2"
        >
          {current.kliping.utama.judul}
        </p>
        <p class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
          {current.kab.nama} · {current.kliping.n_media} media ·
          {current.kliping.n_grup} grup pemilik
          <a
            href={klipingUrl(current.kliping.id)}
            target="_blank"
            rel="noopener noreferrer"
            class="ml-2 inline-flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Buka kliping
            <Icon src={ArrowTopRightOnSquare} micro size="12" />
          </a>
        </p>
      </div>
    {:else if !live && selectedAnchor}
      <p class="text-sm text-slate-700 dark:text-zinc-300">
        <span class="font-medium text-slate-900 dark:text-zinc-100"
          >{selectedAnchor.kota}</span
        >, {selectedAnchor.wilayah} · belum ada instance terpisah
      </p>
    {:else}
      <p class="text-xs text-slate-500 dark:text-zinc-400">
        {live
          ? 'Ketuk penanda untuk membaca kabar dari kabupaten itu.'
          : 'Ketuk kota untuk menyorotnya. Kabar langsung tampil saat sumber berita tersambung.'}
      </p>
    {/if}
  </div>
</Board>
