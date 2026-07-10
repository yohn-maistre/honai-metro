<script lang="ts">
  // ETNOS page title: the same full-width band Photon's feed uses, so every
  // page opens with a real h1 in one consistent voice.
  import { Header } from '$lib/ui/layout'
  import type { Snippet } from 'svelte'

  interface Props {
    title: string
    lede?: string
    actions?: Snippet
  }

  let { title, lede, actions }: Props = $props()
</script>

{#if lede || actions}
  <Header pageHeader size="md" class="font-semibold">
    {title}
    {#snippet extended()}
      <div class="flex items-end justify-between gap-3 flex-wrap">
        {#if lede}
          <p class="text-sm text-slate-600 dark:text-zinc-400 max-w-prose">
            {lede}
          </p>
        {/if}
        {@render actions?.()}
      </div>
    {/snippet}
  </Header>
{:else}
  <Header pageHeader size="md" class="font-semibold">{title}</Header>
{/if}
