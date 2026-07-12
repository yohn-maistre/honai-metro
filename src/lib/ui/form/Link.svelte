<script lang="ts" module>
  export const parseURL = (href: string) => {
    try {
      return new URL(href)
    } catch {
      return undefined
    }
  }
</script>

<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements'

  interface Props extends HTMLAnchorAttributes {
    href: string
    highlight?: boolean
    children?: import('svelte').Snippet
    class?: string
    icon?: import('svelte').Snippet
  }

  let {
    href,
    highlight = false,
    children,
    class: clazz = '',
    icon,
    ...rest
  }: Props = $props()
</script>

<a
  {...rest}
  {href}
  class={[
    'hover:underline max-w-full inline-flex items-center gap-1',
    highlight && 'text-primary-700 dark:text-primary-400',
    clazz,
  ]}
>
  {@render icon?.()}
  {@render children?.()}
</a>
