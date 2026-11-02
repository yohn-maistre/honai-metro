<script lang="ts">
  import { network } from './network.svelte'
  let visible = $state(false),
    completing = $state(false)
  $effect(() => {
    if (network.pending > 0) {
      visible = true
      completing = false
      return
    }
    if (!visible) return
    // Keep chained request phases together. Only finish after all requests settle.
    const finish = setTimeout(() => (completing = true), 100)
    const hide = setTimeout(() => {
      visible = false
      completing = false
    }, 400)
    return () => {
      clearTimeout(finish)
      clearTimeout(hide)
    }
  })
</script>

{#if visible}<div
    class="app-load-line"
    class:complete={completing}
    role="progressbar"
    aria-label="Memuat halaman"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={completing ? 100 : undefined}
  >
    <i></i>
  </div>{/if}
