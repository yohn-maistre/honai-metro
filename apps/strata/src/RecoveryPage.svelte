<script lang="ts">
  import VaultTransfer from './messaging/VaultTransfer.svelte'
</script>

<main class="recovery-page">
  <a href="https://etnos.space" class="recovery-brand">
    etnos
    <span>.</span>
  </a>
  <VaultTransfer recovery />
</main>

<style>
  .recovery-page {
    max-width: 540px;
    margin: 10vh auto;
    padding: 20px;
  }
  .recovery-brand {
    display: block;
    margin: 0 20px 32px;
    font:
      750 36px 'Instrument Sans Variable',
      sans-serif;
    letter-spacing: -0.07em;
  }
  .recovery-brand span {
    color: var(--brand);
  }
</style>
