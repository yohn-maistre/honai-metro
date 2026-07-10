<script lang="ts">
  // The one rounded icon square. Neutral surface; color belongs to text and
  // accents, not to icon boxes.
  import { Icon, type IconSource } from 'svelte-hero-icons/dist'
  import type { ClassValue } from 'svelte/elements'

  const sizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
  }

  const iconSizes = { sm: '16', md: '20', lg: '22' }

  interface Props {
    icon: IconSource
    size?: keyof typeof sizes
    class?: ClassValue
  }

  let { icon, size = 'md', class: clazz = '' }: Props = $props()
</script>

<div
  class={[
    'grid place-items-center shrink-0',
    'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300',
    sizes[size],
    clazz,
  ]}
>
  <Icon src={icon} size={iconSizes[size]} />
</div>
