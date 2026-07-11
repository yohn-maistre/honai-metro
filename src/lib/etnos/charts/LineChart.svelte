<script lang="ts">
  interface Point {
    x: string | number
    y: number
  }

  interface Props {
    title?: string
    data: Point[]
    unit?: string
    height?: number
    color?: string
  }

  let {
    title,
    data,
    unit = '',
    height = 160,
    color = 'var(--color-primary-500)',
  }: Props = $props()

  const W = 600
  const PADDING = { top: 16, right: 16, bottom: 28, left: 40 }

  let minY = $derived(Math.min(...data.map((p) => p.y)))
  let maxY = $derived(Math.max(...data.map((p) => p.y)))
  let range = $derived(maxY - minY || 1)

  let innerW = $derived(W - PADDING.left - PADDING.right)
  let innerH = $derived(height - PADDING.top - PADDING.bottom)

  function xPos(i: number): number {
    if (data.length <= 1) return PADDING.left + innerW / 2
    return PADDING.left + (i / (data.length - 1)) * innerW
  }

  function yPos(v: number): number {
    return PADDING.top + innerH - ((v - minY) / range) * innerH
  }

  let pathD = $derived(
    data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.y)}`).join(' '),
  )

  let areaD = $derived(
    `${pathD} L ${xPos(data.length - 1)} ${PADDING.top + innerH} L ${xPos(0)} ${PADDING.top + innerH} Z`,
  )

  // integer-friendly, localized axis labels; thin x labels on dense series
  const fmtY = (v: number) =>
    Number.isInteger(Math.round(v * 10) / 10)
      ? Math.round(v).toLocaleString('id-ID')
      : v.toFixed(1)
  let xStep = $derived(data.length > 8 ? 2 : 1)
</script>

<div class="flex flex-col gap-2 w-full">
  {#if title}
    <h4 class="text-sm font-medium text-slate-700 dark:text-zinc-300">
      {title}
    </h4>
  {/if}
  <svg
    viewBox="0 0 {W} {height}"
    preserveAspectRatio="none"
    class="w-full"
    style="height: {height}px;"
    role="img"
    aria-label={title ?? 'Tren data'}
  >
    <!-- horizontal gridlines; the baseline is solid, the rest dashed -->
    {#each [0, 0.25, 0.5, 0.75, 1] as g (g)}
      {@const y = PADDING.top + innerH * (1 - g)}
      <line
        x1={PADDING.left}
        x2={W - PADDING.right}
        y1={y}
        y2={y}
        stroke="currentColor"
        stroke-opacity={g === 0 ? 0.25 : 0.1}
        stroke-dasharray={g === 0 ? undefined : '2 4'}
      />
    {/each}
    <!-- y-axis labels -->
    {#each [0, 0.5, 1] as g (g)}
      {@const v = minY + range * g}
      {@const y = PADDING.top + innerH * (1 - g)}
      <text
        x={PADDING.left - 6}
        y={y + 4}
        text-anchor="end"
        font-size="10"
        class="fill-slate-500 dark:fill-zinc-500 tabular-nums"
      >
        {fmtY(v)}
      </text>
    {/each}
    <!-- x-axis labels, thinned when the series is dense -->
    {#each data as p, i (p.x)}
      {#if i % xStep === 0 || i === data.length - 1}
        <text
          x={xPos(i)}
          y={height - PADDING.bottom + 16}
          text-anchor="middle"
          font-size="10"
          class="fill-slate-500 dark:fill-zinc-500"
        >
          {p.x}
        </text>
      {/if}
    {/each}
    <!-- area under curve -->
    <path d={areaD} fill={color} fill-opacity="0.12" />
    <!-- line -->
    <path d={pathD} fill="none" stroke={color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    <!-- dots -->
    {#each data as p, i (p.x)}
      <circle cx={xPos(i)} cy={yPos(p.y)} r="3" fill={color} />
    {/each}
  </svg>
  {#if unit}
    <span class="text-xs text-slate-400 dark:text-zinc-500 -mt-1">{unit}</span>
  {/if}
</div>
