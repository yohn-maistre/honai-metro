<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  import Sandpile from './Sandpile.svelte'
  let {
    enabled,
    busy,
    onRefresh,
    children,
  }: {
    enabled: boolean
    busy: boolean
    onRefresh: () => Promise<void>
    children: Snippet
  } = $props()
  let distance = $state(0),
    startY = 0,
    startX = 0,
    tracking = false,
    decided = false
  let refreshing = $state(false)
  function reset() {
    distance = 0
    tracking = false
    decided = false
  }
  function start(e: TouchEvent) {
    const target = e.target as HTMLElement
    if (
      !enabled ||
      busy ||
      refreshing ||
      window.scrollY > 0 ||
      e.touches.length !== 1 ||
      !target.closest('#commons-main') ||
      target.closest(
        'input,textarea,[contenteditable="true"],[role="dialog"],[role="listbox"]',
      )
    )
      return
    startY = e.touches[0].clientY
    startX = e.touches[0].clientX
    tracking = true
    decided = false
  }
  function move(e: TouchEvent) {
    if (!tracking || !enabled || busy || refreshing || e.touches.length !== 1) {
      reset()
      return
    }
    const dy = e.touches[0].clientY - startY,
      dx = Math.abs(e.touches[0].clientX - startX)
    if (!decided && Math.max(dx, Math.abs(dy)) > 8) {
      if (dy < 0 || dx > Math.abs(dy) || window.scrollY > 0) {
        reset()
        return
      }
      decided = true
    }
    if (!decided) return
    if (e.cancelable) e.preventDefault()
    distance = Math.min(84, Math.max(0, dy * 0.5))
  }
  function end() {
    const refresh = distance >= 64 && enabled && !busy && !refreshing
    reset()
    if (refresh) {
      refreshing = true
      void onRefresh()
        .catch(() => {
          /* The parent reports request errors. */
        })
        .finally(() => {
          refreshing = false
        })
    }
  }
  $effect(() => {
    if (!enabled) reset()
  })
  onMount(() => {
    window.addEventListener('touchmove', move, { passive: false })
    return () => window.removeEventListener('touchmove', move)
  })
</script>

<svelte:window ontouchstart={start} ontouchend={end} ontouchcancel={reset} />
{#if enabled && (distance > 8 || refreshing)}<div
    class="pull-refresh"
    class:is-refreshing={refreshing}
    style={`height:${refreshing ? 84 : distance}px`}
    data-state={refreshing
      ? 'refreshing'
      : distance >= 64
        ? 'ready'
        : 'pulling'}
  >
    <Sandpile active={refreshing} />
    <span
      role="status"
      aria-label={refreshing
        ? 'Memuat ulang…'
        : distance >= 64
          ? 'Lepaskan untuk memuat ulang'
          : 'Tarik untuk memuat ulang'}
    >
      {refreshing
        ? 'Memuat ulang…'
        : distance >= 64
          ? 'Lepaskan untuk memuat ulang'
          : 'Tarik untuk memuat ulang'}
    </span>
  </div>{/if}
{@render children()}
