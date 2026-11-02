<script lang="ts">
  let { rows = 3 }: { rows?: number } = $props()
</script>

<div class="content-skeleton" role="status" aria-label="Memuat konten">
  {#each Array(rows)}<div class="skeleton-post">
      <span class="skeleton-avatar"></span>
      <div>
        <i></i>
        <i></i>
        <i></i>
        <span></span>
      </div>
    </div>{/each}
</div>
