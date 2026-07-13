<script lang="ts">
  /**
   * LocatorPlate: a small Papua-only locator canvas. The Tanah Papua
   * dot grid (atlas.ts, same raster the Peta Kabar plate reads) drawn
   * faint, with a terracotta seal ring at one coordinate: "here". Used
   * by the wiki's Wajah feature and the article figures; theme-aware
   * via plateColors and redraws on scheme change and resize.
   */
  import { onMount } from 'svelte'
  import type { ClassValue } from 'svelte/elements'
  import { theme } from '$lib/app/theme/theme.svelte'
  import {
    loadAtlasGrid,
    lonLatToCellF,
    plateColors,
    type AtlasGrid,
  } from './atlas'

  interface Props {
    /** [lat, lon], the wajah.json convention */
    koordinat: number[]
    class?: ClassValue
    cols?: number
    rows?: number
  }

  let {
    koordinat,
    class: clazz = 'h-24',
    cols = 72,
    rows = 62,
  }: Props = $props()

  let el = $state<HTMLCanvasElement>()
  let grid: AtlasGrid | null = null

  function draw() {
    if (!el || !grid) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    const dpr = Math.min(window.devicePixelRatio ?? 1, 1.75)
    el.width = Math.round(w * dpr)
    el.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const colors = plateColors(el)
    const scale = Math.min((w * 0.96) / cols, (h * 0.92) / rows)
    const ox = (w - cols * scale) / 2
    const oy = (h - rows * scale) / 2
    const dot = Math.max(1, scale * 0.42)
    ctx.fillStyle = colors.ink
    ctx.globalAlpha = colors.dark ? 0.42 : 0.3
    for (let gy = 0; gy < rows; gy++)
      for (let gx = 0; gx < cols; gx++) {
        if (!grid.cells[gy * cols + gx]) continue
        ctx.fillRect(
          ox + gx * scale + (scale - dot) / 2,
          oy + gy * scale + (scale - dot) / 2,
          dot,
          dot,
        )
      }
    ctx.globalAlpha = 1
    const [lat, lon] = koordinat
    const [fx, fy] = lonLatToCellF(lon!, lat!, cols, rows)
    const x = ox + fx * scale
    const y = oy + fy * scale
    ctx.strokeStyle = colors.accent
    ctx.fillStyle = colors.accent
    for (const r of [4, 8]) {
      ctx.lineWidth = r === 4 ? 1.6 : 0.8
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(x, y, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }

  onMount(() => {
    let dead = false
    void loadAtlasGrid(cols, rows)
      .then((g) => {
        if (dead) return
        grid = g
        draw()
      })
      .catch(() => {})
    return () => {
      dead = true
    }
  })

  $effect(() => {
    void theme.colorScheme
    void koordinat
    draw()
  })

  $effect(() => {
    if (!el) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(el)
    return () => ro.disconnect()
  })
</script>

<div class="text-slate-800 dark:text-zinc-200">
  <canvas bind:this={el} class={['w-full block', clazz]}></canvas>
</div>
