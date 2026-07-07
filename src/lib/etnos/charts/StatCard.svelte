<script lang="ts">
  import { browser } from '$app/environment'
  import { Icon, type IconSource } from 'svelte-hero-icons/dist'

  interface Props {
    label: string
    value: string | number
    unit?: string
    icon?: IconSource
    color?: string
    demo?: boolean
    live?: boolean
  }

  let {
    label,
    value,
    unit = '',
    icon,
    color = 'text-primary-500',
    demo = false,
    live = false,
  }: Props = $props()

  // Live numbers count up (rAF, ~0.7s ease-out); anything non-numeric,
  // demo, or reduced-motion renders as-is. Suffixes like "200+" survive.
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

<div
  class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 items-center text-center relative"
>
  {#if live}
    <span
      title="Data langsung dari server"
      class="absolute top-2 right-2 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300"
    >
      Langsung
    </span>
  {:else if demo}
    <span
      title="Data demo"
      class="absolute top-2 right-2 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
    >
      demo
    </span>
  {/if}
  {#if icon}
    <Icon src={icon} size="24" class={color} />
  {/if}
  <span class="text-2xl font-bold tabular-nums dark:text-white leading-tight">
    {display}{#if unit}<span
        class="text-base font-medium text-slate-500 dark:text-zinc-400 ml-1"
        >{unit}</span
      >{/if}
  </span>
  <span class="text-sm text-slate-500 dark:text-zinc-400">{label}</span>
</div>
