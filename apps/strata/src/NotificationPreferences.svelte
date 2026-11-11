<script lang="ts">
  import { Volume2, VolumeX } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { notificationPreferences, notifyInfo } from './notifications.svelte'
</script>

<section class="notification-preferences" aria-label="Suara notifikasi">
  <div class="cx-between">
    <Label>Suara notifikasi</Label>
    <Button variant="outline" aria-label="Suara notifikasi" aria-pressed={notificationPreferences.sound}
      onclick={() => notificationPreferences.sound = !notificationPreferences.sound}>
      {#if notificationPreferences.sound}<Volume2 size={16} />Aktif{:else}<VolumeX size={16} />Senyap{/if}
    </Button>
  </div>
  <p class="cx-hint">Bunyi singkat untuk tindakanmu. Disimpan di perangkat ini.</p>
  <Label for="notification-volume">Volume</Label>
  <input id="notification-volume" type="range" min="0" max="1" step="0.05"
    disabled={!notificationPreferences.sound} bind:value={notificationPreferences.volume} />
  <Button variant="ghost" onclick={() => notifyInfo('Begini bunyi notifikasimu.')}>Coba notifikasi</Button>
</section>
