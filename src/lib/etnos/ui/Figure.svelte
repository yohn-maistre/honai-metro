<script lang="ts">
  /**
   * Figure: a flat broadsheet stat. Big number, small label, set directly
   * on the paper; no box, no border, no shadow. Separation between
   * figures is the parent's job (grid gaps or hairline rules). Live
   * numbers count up like StatCard's; contoh and langsung chips ride
   * inline with the label.
   */
  import { browser } from '$app/environment'
  import DataChip from '$lib/etnos/ui/DataChip.svelte'
  import { Icon, type IconSource } from 'svelte-hero-icons/dist'
  import type { ClassValue } from 'svelte/elements'

  interface Props {
    label: string
    value: string | number
    unit?: string
    icon?: IconSource
    demo?: boolean
    live?: boolean
    class?: ClassValue
  }

  let {
    label,
    value,
    unit = '',
    icon,
    demo = false,
    live = false,
    class: clazz = '',
  }: Props = $props()

  let display = $state<string | number>(value)

  $effect(() => {
    const raw = String(value)
    const m = raw.match(/^([\d.]+)(.*)$/)
    const target = m ? Number(m[1].replace(/\./g, '')) : NaN
    if (
      !live ||
      !browser ||
      !Number.isFinite(target) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      display = value
      return
    }
    const suffix = m?.[2] ?? ''
    const start = performance.now()
    const dur = 700
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      display = Math.round(target * eased).toLocaleString('id-ID') + suffix
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  })
</script>

<div class={['flex flex-col gap-0.5 min-w-0', clazz]}>
  <span
    class="text-2xl font-bold tabular-nums dark:text-white leading-tight truncate"
  >
    {display}{#if unit}<span
        class="text-sm font-medium text-slate-500 dark:text-zinc-400 ml-1"
        >{unit}</span
      >{/if}
  </span>
  <span
    class="text-xs text-slate-500 dark:text-zinc-400 flex items-center flex-wrap gap-x-1.5 gap-y-0.5 min-w-0 leading-tight"
  >
    {#if icon}
      <Icon src={icon} micro size="13" class="shrink-0" />
    {/if}
    <span>{label}</span>
    {#if live}
      <DataChip state="langsung" class="shrink-0" />
    {:else if demo}
      <DataChip state="contoh" class="shrink-0" />
    {/if}
  </span>
</div>
