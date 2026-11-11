<script lang="ts">
  import { untrack } from 'svelte'
  import { network } from './network.svelte'
  import { palettes } from './appearance.svelte'
  let visible = $state(false), completing = $state(false), progress = $state(0)
  const pending = $derived(network.pending > 0)
  const gradient = palettes.map(p => p.color).join(',')
  $effect(() => {
    const active = pending
    // Only the request lifecycle drives this effect, never its animated state.
    return untrack(() => {
      if (active) {
        if (!visible || completing) progress = 5
        visible = true
        completing = false
        const timer = setInterval(() => {
          progress = Math.min(92, progress + (92 - progress) * .025)
        }, 200)
        return () => clearInterval(timer)
      }
      if (!visible) return
      // Brief gaps between chained requests belong to the same activity batch.
      const finish = setTimeout(() => { progress = 100; completing = true }, 150)
      const hide = setTimeout(() => { visible = false; completing = false; progress = 0 }, 500)
      return () => { clearTimeout(finish); clearTimeout(hide) }
    })
  })
</script>

{#if visible}<div
    class="app-load-line" class:complete={completing}
    role="progressbar" aria-label="Memuat halaman"
    aria-valuemin={0} aria-valuemax={100}
    aria-valuenow={completing ? 100 : undefined}
    style={'--activity-progress:' + progress + '%;--activity-colors:' + gradient}
  ><i></i></div>{/if}
