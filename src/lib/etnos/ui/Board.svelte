<script lang="ts">
  // Header-strip card: a titled surface with a flush body (tables, boards,
  // maps). Wraps Material so every card in the app shares one skin.
  import { Material } from 'mono-svelte'
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'

  interface Props {
    title: string
    caption?: string
    action?: Snippet
    children?: Snippet
    class?: ClassValue
  }

  let { title, caption, action, children, class: clazz = '' }: Props = $props()
</script>

<Material
  element="section"
  color="uniform"
  padding="none"
  rounding="2xl"
  class={['overflow-hidden', clazz]}
>
  <header
    class="px-4 py-3 border-b border-slate-200/70 dark:border-zinc-800
    flex items-center justify-between gap-3"
  >
    <h2 class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
      {title}
    </h2>
    {#if action}
      {@render action()}
    {:else if caption}
      <span class="text-xs text-slate-500 dark:text-zinc-400">{caption}</span>
    {/if}
  </header>
  {@render children?.()}
</Material>
