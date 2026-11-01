<script lang="ts">
  let {
    label = 'Memuat…',
    active = true,
  }: { label?: string; active?: boolean } = $props()
</script>

<span class="pixel-loader" class:active role="status" aria-label={label}>
  <span class="pixel-ring" aria-hidden="true">
    {#each [0, 1, 2, 3, 4, 5, 6, 7] as step}<i
        style={`--step:${step}`}
      ></i>{/each}
  </span>
  <span class="sr-only">{label}</span>
</span>
