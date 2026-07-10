<script lang="ts">
  // Honai Metro chips: a quiet neutral surface carries the label; semantics
  // are carried by a small dot, never by a tinted pill. 'primary' is the one
  // solid accent chip, reserved for the most important affordance on a
  // surface (it uses the AA-safe on-light accent slot, like buttons).
  const neutral =
    'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'

  const badgeColor = {
    'red-subtle': neutral,
    'green-subtle': neutral,
    'yellow-subtle': neutral,
    'gray-subtle': neutral,
    'blue-subtle': neutral,
    primary: 'bg-primary-900 text-slate-25 dark:bg-primary-100 dark:text-zinc-950',
    custom: '',
  }

  const badgeDot = {
    'red-subtle': 'bg-red-600 dark:bg-red-400',
    'green-subtle': 'bg-green-600 dark:bg-green-400',
    'yellow-subtle': 'bg-amber-500 dark:bg-amber-400',
    'blue-subtle': 'bg-blue-600 dark:bg-blue-400',
    'gray-subtle': '',
    primary: '',
    custom: '',
  }

  const badgeRoundness = {
    full: 'rounded-full',
    md: 'rounded-md',
    custom: '',
  }

  type BadgeColor = keyof typeof badgeColor
  type BadgeRoundness = keyof typeof badgeRoundness

  interface Props {
    label?: string
    color?: BadgeColor
    rounding?: BadgeRoundness
    allowIconOnly?: boolean
    class?: string
    icon?: import('svelte').Snippet
    children?: import('svelte').Snippet
  }

  let {
    label = '',
    color = 'gray-subtle',
    rounding = 'full',
    allowIconOnly = false,
    class: clazz = '',
    icon,
    children,
    ...rest
  }: Props = $props()
</script>

<span
  {...rest}
  class={[
    allowIconOnly && 'max-md:px-1.5 max-md:py-1.5',
    'text-xs font-medium inline-flex items-center gap-1.5 px-2.5 py-0.5',
    badgeRoundness[rounding],
    badgeColor[color],
    clazz,
  ]}
  title={label}
>
  {#if badgeDot[color]}
    <span class={['w-1.5 h-1.5 rounded-full shrink-0', badgeDot[color]]}
    ></span>
  {/if}
  {@render icon?.()}
  <span class={allowIconOnly ? 'sr-only md:contents' : 'contents'}>
    {@render children?.()}
  </span>
</span>
