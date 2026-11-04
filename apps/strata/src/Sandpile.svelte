<script lang="ts">
  import { onMount } from 'svelte'
  let { active = false }: { active?: boolean } = $props()
  const cols = 37,
    rows = 14
  // Original falling-sand cellular automaton: one grain per cell, downward
  // movement followed by alternating diagonals. Staggered release breaks up
  // the mound instead of translating a solid triangle. No external assets.
  function seed() {
    const cells = new Set<number>()
    for (let y = 1; y <= 5; y++)
      for (let x = 18 - y * 2; x <= 18 + y * 2; x++) cells.add(y * cols + x)
    return cells
  }
  let pixels = $state([...seed()])
  let reduced = $state(true)
  onMount(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reduced = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  })
  $effect(() => {
    let cells = seed(),
      frame = 0,
      tick = 0,
      previous = 0
    pixels = [...cells]
    if (!active || reduced) return
    function draw(now: number) {
      if (now - previous >= 65 && !document.hidden) {
        previous = now
        tick++
        const next = new Set(cells)
        for (let y = rows - 1; y >= 0; y--) {
          for (let offset = 0; offset < cols; offset++) {
            const x = tick % 2 ? offset : cols - 1 - offset,
              cell = y * cols + x
            if (!cells.has(cell) || (x + y + tick) % 3 === 0) continue
            if (y === rows - 1) {
              next.delete(cell)
              continue
            }
            const side = (x + tick) % 2 ? -1 : 1
            for (const dx of [0, side, -side]) {
              const target = (y + 1) * cols + x + dx
              if (x + dx >= 0 && x + dx < cols && !next.has(target)) {
                next.delete(cell)
                next.add(target)
                break
              }
            }
          }
        }
        cells = next.size ? next : seed()
        pixels = [...cells]
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  })
</script>

<svg
  class="refresh-sandpile"
  viewBox="0 0 148 56"
  aria-hidden="true"
  shape-rendering="crispEdges"
  data-motion={active && !reduced ? 'falling' : 'still'}
>
  {#each pixels as cell (cell)}<rect
      x={(cell % cols) * 4}
      y={Math.floor(cell / cols) * 4}
      width="3"
      height="3"
    />{/each}
</svg>

<style>
  .refresh-sandpile {
    width: 148px;
    height: 56px;
    flex: none;
    fill: var(--brand);
  }
</style>
