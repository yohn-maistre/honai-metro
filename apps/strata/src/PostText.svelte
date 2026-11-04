<script lang="ts">
  let { text, permalink }: { text: string; permalink?: string } = $props()
  // Plain text remains escaped by Svelte. No HTML or remote preview fetching.
  const pieces = $derived(text.split(/(https?:\/\/[^\s<>]+)/g))
</script>

{#each pieces as piece}{#if /^https?:\/\//.test(piece)}<a
      class="post-inline-link"
      href={piece}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      {piece}
    </a>{:else if permalink}<a href={permalink} class="body-permalink">
      {piece}
    </a>{:else}{piece}{/if}{/each}
