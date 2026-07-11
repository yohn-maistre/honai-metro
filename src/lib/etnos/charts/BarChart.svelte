<script lang="ts">
  interface Datum {
    label: string
    value: number
    color?: string
  }

  interface Props {
    title?: string
    data: Datum[]
    unit?: string
    max?: number
    showValues?: boolean
    /** faint reference ticks at 50% and 100% of the scale */
    scale?: boolean
  }

  let {
    title,
    data,
    unit = '',
    max,
    showValues = true,
    scale = true,
  }: Props = $props()

  let computedMax = $derived(
    max ?? Math.max(...data.map((d) => d.value), 1) * 1.1,
  )

  const fmt = (v: number) =>
    Number.isInteger(v) ? v.toLocaleString('id-ID') : v.toFixed(1)
</script>

<div class="flex flex-col gap-3 w-full">
  {#if title}
    <div class="flex items-baseline justify-between gap-3">
      <h4 class="text-sm font-medium text-slate-700 dark:text-zinc-300">
        {title}
      </h4>
      {#if scale}
        <span class="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
          skala 0 sampai {fmt(computedMax)}{unit}
        </span>
      {/if}
    </div>
  {/if}
  <div class="flex flex-col gap-2">
    {#each data as d (d.label)}
      {@const pct = Math.max(0, Math.min(100, (d.value / computedMax) * 100))}
      <div class="flex items-center gap-3 text-sm">
        <span
          class="w-32 shrink-0 text-slate-600 dark:text-zinc-400 truncate"
          title={d.label}
        >
          {d.label}
        </span>
        <div
          class="flex-1 h-6 bg-slate-100 dark:bg-zinc-800 rounded-md overflow-hidden relative"
        >
          {#if scale}
            {#each [25, 50, 75] as tick (tick)}
              <div
                class="absolute inset-y-0 w-px bg-slate-300/60 dark:bg-zinc-600/60"
                style="left: {tick}%;"
              ></div>
            {/each}
          {/if}
          <div
            class="h-full rounded-md transition-[width] duration-700 relative"
            style="width:{pct}%; background-color: {d.color ??
              'var(--color-primary-500)'};"
          ></div>
        </div>
        {#if showValues}
          <span
            class="w-16 shrink-0 text-right tabular-nums font-medium text-slate-700 dark:text-zinc-300"
          >
            {d.value}{unit}
          </span>
        {/if}
      </div>
    {/each}
  </div>
</div>
