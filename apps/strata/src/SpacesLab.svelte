<script lang="ts">
  import {
    Check,
    FlaskConical,
    ExternalLink,
    ShieldAlert,
  } from '@lucide/svelte'
  import report from './spaces-alpha-report.json'
  const labels: Record<string, string> = {
    'create-private-space': 'Ruang privat dibuat',
    'member-write-on-second-pds': 'Anggota menulis dari PDS kedua',
    'admitted-member-can-mint-credential': 'Anggota mendapat kredensial',
    'cross-pds-authorized-read': 'Baca lintas PDS dan verifikasi MAC',
    'outsider-credential-denied': 'Nonanggota ditolak',
    'anonymous-space-read-denied': 'Baca anonim ditolak',
    'wrong-credential-key-denied': 'Kunci yang berbeda ditolak',
    'absent-from-public-repository-records':
      'Posting tidak ada di API rekaman publik',
    'absent-from-public-collection-list': 'Posting tidak ada di daftar publik',
    'authorized-private-blob-read': 'Gambar privat terbaca oleh anggota',
    'anonymous-private-blob-denied': 'Gambar privat menolak akses anonim',
    'private-blob-absent-from-public-sync':
      'Gambar privat tidak tersedia di sync publik',
    'removed-member-cannot-mint-new-credential':
      'Anggota yang dihapus tidak mendapat kredensial baru',
    'issued-credential-still-readable-immediately-after-removal':
      'Kredensial lama masih dapat membaca setelah penghapusan',
  }
</script>

<div class="cx-page-head">
  <h1 class="lab-heading"><FlaskConical size={18} />AT Spaces</h1>
  <span class="post-state">Eksperimen lokal</span>
</div>
<div class="spaces-lab">
  <p>
    Uji protokol resmi dengan dua PDS dan tiga akun percobaan. Tidak memakai
    akun atau percakapan komunitas.
  </p>
  <div class="lab-warning">
    <ShieldAlert size={18} />
    <div>
      <strong>Penghapusan anggota belum langsung memutus akses.</strong>
      <p>
        Kredensial yang sudah diterbitkan masih dapat membaca pada pengujian
        ini. Masa berlakunya 10 menit.
      </p>
    </div>
  </div>
  <p class="cx-hint">
    Hasil pengujian lokal, bukan PDS yang berjalan di Cloudflare. Forum tetap
    memakai izin Strata saat ini.
  </p>
  <ul>
    {#each report.checks as item}<li>
        <Check size={16} />
        <span>{labels[item.name] ?? item.name}</span>
      </li>{/each}
  </ul>
  <p class="cx-hint">
    Spaces mengatur akses. Hosting operator masih dapat membaca data; ini bukan
    enkripsi ujung ke ujung.
  </p>
  <details class="form-details">
    <summary>Versi dan langkah berikutnya</summary>
    <code>{report.snapshot}</code>
    <p>
      OAuth, pencabutan kredensial, sinkronisasi indeks, cadangan dan pembatasan
      layanan masih perlu diuji sebelum memakai data komunitas.
    </p>
  </details>
  <a
    class="post-inline-link"
    href="https://github.com/yohn-maistre/strata/tree/feat/connected-oauth/labs/spaces"
    target="_blank"
    rel="noopener noreferrer"
  >
    Kode dan hasil lengkap <ExternalLink size={14} />
  </a>
</div>
