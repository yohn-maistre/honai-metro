<script lang="ts">
  import { t } from '$lib/app/i18n'
  import Markdown from '$lib/app/markdown/Markdown.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'

  // ETNOS: Thin "About" page. The main instance description lives in the
  // backend site description (rendered by InstanceCard on the home sidebar).
  // This page carries the structured ETNOS-specific mission + trust tiers.
  const body = `
## ETNOS — ruang publik komunitas Melanesia

ETNOS adalah forum publik berfederasi untuk Tanah Papua, dirancang sebagai
*town square* digital untuk komunitas dan institusi — satu tanah, melampaui
batas administratif. Berbasis ActivityPub (kompatibel dengan PieFed, Lemmy,
Mastodon), ETNOS menghubungkan komunitas suku, kampung, puskesmas, balai adat,
dan koperasi tanpa platform terpusat.

### Apa yang ada di sini

- **Forum komunitas** per suku, bahasa, dan wilayah
- **[Wiki Tanah Papua](/wiki)** — tempat, sejarah, biodiversitas, suku & bahasa, kuliner
- **[Hub Bahasa](/wiki/bahasa)** — pelestarian bahasa daerah lewat penggunaan
- **[Papan Data](/dashboard)** — data BPS, OTSUS, pendidikan, infrastruktur, kualitas hidup
- **[Usulan Musrenbang](/musrenbang)** — susun usulan pembangunan kampung (protokol demonstrasi)
- **[Direktori Organisasi](/org)** — kehadiran Level 0 untuk kantor, puskesmas, dan lembaga adat
- **[Registry MCP](/agen#registry)** — direktori alat AI terverifikasi (KYC, malware-scan, TKDN)

### Empat tingkat keanggotaan

1. **Pembaca terbuka** — tanpa akun, baca konten publik.
2. **Anggota terdaftar** — telepon atau email, posting di komunitas umum.
3. **Anggota terverifikasi** *(ruang pemerintahan)* — e-KYC (KTP), wajib untuk transaksi sipil.
4. **Anggota terdukung komunitas** *(ruang adat)* — direkomendasikan oleh anggota komunitas yang
   ditunjuk Dewan Adat. Berbasis kepercayaan kekerabatan, dapat dicabut.

### Federasi, bukan platform

Saat ini satu instance melayani seluruh Tanah Papua; ketika komunitas tumbuh,
wilayah dapat membuka instance-nya sendiri dan tetap saling terhubung via
ActivityPub — tidak ada satu titik kegagalan politik atau teknis. Konten
"publik" dapat mengalir antar instance; konten "adat" tetap dijaga komunitas
asalnya melalui kerangka [CARE Principles](https://www.gida-global.org/care).

### Dibangun oleh

[PT Abstraksi Data & Kognitek](https://abstraksi.id) — lab riset terapan yang membangun
infrastruktur AI komunitas (Communal AI) berdaulat, dideploy sebagai
teknologi sipil di Melanesia.

### Lisensi

Kode sumber: AGPL-3.0. Dokumentasi: CC-BY-SA-4.0. Hardware: CERN-OHL-S.
`
</script>

<svelte:head>
  <title>{$t('etnos.tentang.title')} — ETNOS</title>
  <meta
    name="description"
    content="ETNOS — ruang publik komunitas Melanesia. Forum, wiki, dan data publik berfederasi."
  />
</svelte:head>

<div class="flex flex-col gap-4 max-w-full w-full">
  <EndPlaceholder size="lg">{$t('etnos.tentang.title')}</EndPlaceholder>
  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800"
  >
    <Markdown source={body} />
  </div>
</div>
