<script lang="ts">
  // Data provenance, one voice everywhere: a dot and a word, no pill.
  // 'langsung' pulses terracotta (fetched from a real source right now),
  // 'contoh' is a hollow dot (sample data, honestly labeled),
  // 'segera' is an outline dot in waiting (announced, not yet live).
  import { t } from '$lib/app/i18n'

  interface Props {
    state: 'langsung' | 'contoh' | 'segera'
    label?: string
    class?: string
  }

  let { state, label, class: clazz = '' }: Props = $props()

  const text = $derived(label ?? t.get(`etnos.chip.${state}`))
  const title = $derived(t.get(`etnos.chip.${state}_title`))
</script>

<span
  {title}
  class={[
    'inline-flex items-center gap-1.5 text-xs font-medium',
    'text-slate-500 dark:text-zinc-400 whitespace-nowrap',
    clazz,
  ]}
>
  {#if state === 'langsung'}
    <span class="w-1.5 h-1.5 rounded-full bg-primary-500 chip-live"></span>
  {:else if state === 'contoh'}
    <span
      class="w-1.5 h-1.5 rounded-full border-[1.5px] border-slate-400 dark:border-zinc-500"
    ></span>
  {:else}
    <span
      class="w-1.5 h-1.5 rounded-full border-[1.5px] border-dashed border-slate-400 dark:border-zinc-500"
    ></span>
  {/if}
  {text}
</span>

<style>
  @keyframes chip-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }
  .chip-live {
    animation: chip-pulse 2.4s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .chip-live {
      animation: none;
    }
  }
</style>
