<script lang="ts">
  import { ArrowLeft, Icon } from 'svelte-hero-icons/dist'
  import type { Snippet } from 'svelte'

  interface Props {
    href: string
    children?: Snippet
  }

  let { href, children }: Props = $props()
</script>

<a
  {href}
  class="inline-flex items-center gap-1.5 w-fit text-sm font-medium
  text-slate-600 dark:text-zinc-400 hover:text-primary-600
  dark:hover:text-primary-400 transition-colors"
>
  <Icon src={ArrowLeft} micro size="14" />
  {@render children?.()}
</a>
