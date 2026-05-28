<script lang="ts">
  import { Icon, type IconSource } from 'svelte-hero-icons/dist'

  interface Props {
    label: string
    value: string | number
    unit?: string
    icon?: IconSource
    color?: string
    demo?: boolean
  }

  let {
    label,
    value,
    unit = '',
    icon,
    color = 'text-primary-500',
    demo = false,
  }: Props = $props()
</script>

<div
  class="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 items-center text-center relative"
>
  {#if demo}
    <span
      title="data demo"
      class="absolute top-2 right-2 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
    >
      demo
    </span>
  {/if}
  {#if icon}
    <Icon src={icon} size="24" class={color} />
  {/if}
  <span class="text-2xl font-bold dark:text-white leading-tight">
    {value}{#if unit}<span class="text-base font-medium text-slate-500 dark:text-zinc-400 ml-1">{unit}</span>{/if}
  </span>
  <span class="text-sm text-slate-500 dark:text-zinc-400">{label}</span>
</div>
