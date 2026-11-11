<script lang="ts">
  import { Toaster } from '@yusufceng1z/ding-svelte'
  import { appearance } from './appearance.svelte'
  import { configureNotifications } from './notifications.svelte'
  $effect(() => configureNotifications())
</script>

<div class="etnos-feedback">
  <Toaster
    position="top-center"
    theme={appearance.theme}
    labels={{ region: 'Notifikasi', dismiss: 'Tutup notifikasi' }}
  />
</div>
