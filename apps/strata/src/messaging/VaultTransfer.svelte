<script lang="ts">
  import { onMount } from 'svelte'
  import { Download, Upload, KeyRound, ArrowUpRight } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import Choice from '../Choice.svelte'
  let { actorId, recovery = false }: { actorId?: string; recovery?: boolean } =
    $props()
  let ids = $state<string[]>([]),
    selected = $state(''),
    passphrase = $state(''),
    file = $state<File | null>(null),
    status = $state(''),
    busy = $state(false)
  onMount(() => {
    void import('./vault')
      .then(async (v) => {
        ids = await v.localVaultIds()
        selected = actorId ?? ids[0] ?? ''
      })
      .catch(() => {
        status = 'Penyimpanan browser tidak tersedia.'
      })
  })
  async function download() {
    busy = true
    status = ''
    try {
      const v = await import('./vault'),
        text = await v.exportVault(actorId ?? selected),
        url = URL.createObjectURL(
          new Blob([text], { type: 'application/json' }),
        ),
        a = document.createElement('a')
      a.href = url
      a.download = 'etnos-encrypted-messages.json'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      status =
        'Cadangan terenkripsi diunduh. Impor di etnos.space dengan frasa sandi pesanmu.'
    } catch (e) {
      status = e instanceof Error ? e.message : 'Cadangan belum dapat diunduh.'
    } finally {
      busy = false
    }
  }
  async function restore() {
    if (!actorId || !file) return
    busy = true
    status = ''
    try {
      if (file.size > 8 * 1024 * 1024) throw Error('Berkas terlalu besar.')
      const v = await import('./vault')
      await v.importVault(actorId, await file.text(), passphrase)
      ids = await v.localVaultIds()
      status = 'Kunci dipulihkan. Buka Pesan untuk melanjutkan.'
      passphrase = ''
      file = null
    } catch (e) {
      status = e instanceof Error ? e.message : 'Kunci belum dapat dipulihkan.'
    } finally {
      busy = false
    }
  }
</script>

<section class="vault-transfer" aria-label="Pindahkan kunci pesan">
  <div class="vault-transfer-heading">
    <KeyRound size={19} />
    <h2>{recovery ? 'Pindahkan pesan ke etnos.space' : 'Cadangan pesan'}</h2>
  </div>
  <p>
    Kunci pesan disimpan di browser ini. Cadangan tetap terenkripsi dengan frasa
    sandi pesanmu.
  </p>
  {#if ids.length}
    {#if recovery && ids.length > 1}<Choice
        bind:value={selected}
        aria-label="Kunci akun"
        items={ids.map((id) => ({
          value: id,
          label: 'Akun ' + id.slice(0, 8),
        }))}
      />{/if}
    <Button
      variant="outline"
      disabled={busy || !(actorId ?? selected)}
      onclick={download}
    >
      <Download size={16} />Unduh cadangan terenkripsi
    </Button>
  {:else}<p>Belum ada kunci pesan di browser ini.</p>{/if}
  {#if recovery}<p>
      Unduh di browser yang sebelumnya dipakai untuk pesan, lalu masuk ke ETNOS
      → Pengaturan → Cadangan pesan. Gunakan cadangan terbaru; jangan memakai
      satu kunci di dua perangkat.
    </p>
    <Button href="https://etnos.space/preferences">
      Lanjut ke ETNOS <ArrowUpRight size={15} />
    </Button>
  {:else if actorId}
    <details>
      <summary>Pulihkan dari browser lama</summary>
      <p>
        Untuk perpindahan domain, ambil cadangan dari <a
          href="https://strata-preview.giyaibo.workers.dev/recover-messages"
          target="_blank"
          rel="noreferrer"
        >
          browser lama <ArrowUpRight size={12} />
        </a>
        . Kunci yang sudah ada tidak akan ditimpa.
      </p>
      <label for="vault-backup-file">Cadangan terenkripsi</label>
      <Input
        id="vault-backup-file"
        type="file"
        accept="application/json,.json"
        onchange={(e) => (file = e.currentTarget.files?.[0] ?? null)}
      />
      <label for="vault-backup-passphrase">Frasa sandi pesan</label>
      <Input
        id="vault-backup-passphrase"
        type="password"
        bind:value={passphrase}
        autocomplete="off"
      />
      <Button
        variant="outline"
        disabled={busy || !file || !passphrase}
        onclick={restore}
      >
        <Upload size={16} />Pulihkan kunci
      </Button>
    </details>
  {/if}
  {#if status}<p role="status">{status}</p>{/if}
</section>
