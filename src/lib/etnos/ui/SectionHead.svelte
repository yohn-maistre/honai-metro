<script lang="ts">
  /**
   * SectionHead: the broadsheet section opener. A real heading, an
   * optional action cluster (chips, links), and a hairline rule filling
   * the remaining width, newspaper-style. On the flat pages this is what
   * separates sections; boxes do not.
   */
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'

  interface Props {
    title: string
    /** heading element, h2 by default (never fake a heading with a div) */
    element?: 'h2' | 'h3'
    /** small muted text after the rule, right-aligned */
    caption?: string
    id?: string
    class?: ClassValue
    action?: Snippet
  }

  let {
    title,
    element = 'h2',
    caption,
    id,
    class: clazz = '',
    action,
  }: Props = $props()
</script>

<div class={['flex items-center gap-3 min-w-0', clazz]} {id}>
  <svelte:element
    this={element}
    class="text-base font-semibold dark:text-white shrink-0"
  >
    {title}
  </svelte:element>
  {@render action?.()}
  <div
    class="flex-1 min-w-4 border-b border-slate-200 dark:border-zinc-700/60"
    aria-hidden="true"
  ></div>
  {#if caption}
    <span class="text-xs text-slate-500 dark:text-zinc-400 shrink-0">
      {caption}
    </span>
  {/if}
</div>
