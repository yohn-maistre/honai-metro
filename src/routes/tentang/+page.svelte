<script lang="ts">
  /**
   * Tentang ETNOS: the canonical deep explainer. The right-sidebar About
   * card belongs to the INSTANCE (short, backend-owned); this page owns
   * the ETNOS story in scannable cards, and carries the anchor targets
   * that /agen (standards) and /org (klaim) link to.
   */
  import { t } from '$lib/app/i18n'
  import { DataChip, IconTile, PageHeader } from '$lib/etnos/ui'
  import { Material } from 'mono-svelte'
  import {
    ArrowRight,
    BookOpen,
    BuildingLibrary,
    ChartBar,
    ChatBubbleLeftRight,
    CommandLine,
    CpuChip,
    DocumentText,
    GlobeAsiaAustralia,
    Icon,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  const ISI = [
    {
      href: '/explore',
      icon: UserGroup,
      label: 'Forum komunitas',
      desc: 'per suku, bahasa, dan wilayah',
    },
    {
      href: '/wiki',
      icon: BookOpen,
      label: 'Wiki Tanah Papua',
      desc: 'tempat, sejarah, biodiversitas, suku dan bahasa, kuliner',
    },
    {
      href: '/wiki/bahasa',
      icon: ChatBubbleLeftRight,
      label: 'Hub Bahasa',
      desc: 'pelestarian bahasa daerah lewat penggunaan',
    },
    {
      href: '/dashboard',
      icon: ChartBar,
      label: 'Papan Data',
      desc: 'angka hidup forum dan data publik provinsi',
    },
    {
      href: '/musrenbang',
      icon: DocumentText,
      label: 'Usulan Musrenbang',
      desc: 'susun usulan pembangunan kampung, protokol demonstrasi',
    },
    {
      href: '/org',
      icon: BuildingLibrary,
      label: 'Direktori Organisasi',
      desc: 'kehadiran Level 0 untuk kantor, puskesmas, dan lembaga adat',
    },
    {
      href: '/agen#registry',
      icon: CpuChip,
      label: 'Registry MCP',
      desc: 'direktori alat AI terverifikasi: KYC, malware-scan, TKDN',
    },
  ]

  const KEANGGOTAAN = [
    {
      nama: 'Pembaca terbuka',
      desc: 'Tanpa akun, baca semua konten publik.',
    },
    {
      nama: 'Anggota terdaftar',
      desc: 'Telepon atau email, nama samaran boleh. Posting di komunitas umum.',
    },
    {
      nama: 'Anggota terverifikasi',
      desc: 'Verifikasi identitas (e-KYC KTP), wajib untuk transaksi layanan dan ruang pemerintahan.',
    },
    {
      nama: 'Anggota terdukung komunitas',
      desc: 'Direkomendasikan anggota yang ditunjuk Dewan Adat, berbasis kepercayaan kekerabatan, dapat dicabut penjaminnya.',
    },
  ]
</script>

<svelte:head>
  <title>{$t('etnos.tentang.title')} · ETNOS</title>
  <meta
    name="description"
    content="ETNOS, ruang publik komunitas Melanesia. Forum, wiki, dan data publik berfederasi."
  />
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <PageHeader
    title={$t('etnos.tentang.title')}
    lede="Ruang publik berfederasi Tanah Papua: satu tanah, melampaui batas administratif."
  />

  <!-- apa itu -->
  <Material
    id="apa"
    color="default"
    rounding="2xl"
    padding="xl"
    class="scroll-mt-16"
  >
    <h2 class="text-xl font-semibold dark:text-white mb-3">
      ETNOS, ruang publik komunitas Melanesia
    </h2>
    <p class="text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed max-w-prose">
      ETNOS adalah forum publik berfederasi untuk Tanah Papua, dirancang
      sebagai alun-alun digital untuk komunitas dan institusi. Berbasis
      ActivityPub (kompatibel dengan PieFed, Lemmy, Mastodon), ETNOS
      menghubungkan komunitas suku, kampung, puskesmas, balai adat, dan
      koperasi tanpa platform terpusat. ETNOS adalah satu komponen dari
      Aksara, prakarsa Communal AI untuk layanan publik lapis pertama.
    </p>
  </Material>

  <!-- isi -->
  <section id="isi" class="scroll-mt-16 flex flex-col gap-3">
    <h2 class="text-lg font-semibold dark:text-white">Apa yang ada di sini</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each ISI as item (item.href)}
        <Material
          element="a"
          href={item.href}
          color="default"
          rounding="2xl"
          padding="md"
          interactive
          class="flex items-center gap-3 no-underline"
        >
          <IconTile icon={item.icon} size="sm" />
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-medium dark:text-white">
              {item.label}
            </span>
            <span class="text-xs text-slate-500 dark:text-zinc-400 truncate">
              {item.desc}
            </span>
          </div>
          <Icon
            src={ArrowRight}
            micro
            size="16"
            class="ml-auto shrink-0 text-slate-400 dark:text-zinc-500"
          />
        </Material>
      {/each}
    </div>
  </section>

  <!-- keanggotaan -->
  <section id="keanggotaan" class="scroll-mt-16 flex flex-col gap-3">
    <h2 class="text-lg font-semibold dark:text-white">
      Empat tingkat keanggotaan
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {#each KEANGGOTAAN as k, i (k.nama)}
        <Material
          color="default"
          rounding="2xl"
          padding="lg"
          class="flex flex-col gap-2"
        >
          <span
            class="w-7 h-7 rounded-full grid place-items-center text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
          >
            {i + 1}
          </span>
          <h3 class="text-sm font-semibold dark:text-white">{k.nama}</h3>
          <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            {k.desc}
          </p>
        </Material>
      {/each}
    </div>
    <p class="text-xs text-slate-500 dark:text-zinc-400">
      Manusia tidak pernah membawa skor atau tingkat kepercayaan; tingkat T
      hanya berlaku untuk mesin, lihat
      <a href="/agen" class="font-medium text-primary-600 dark:text-primary-400 hover:underline">halaman Agen</a>.
    </p>
  </section>

  <!-- federasi -->
  <Material
    id="federasi"
    color="default"
    rounding="2xl"
    padding="xl"
    class="scroll-mt-16"
  >
    <div class="flex items-center gap-3 mb-3">
      <IconTile icon={GlobeAsiaAustralia} size="md" />
      <h2 class="text-lg font-semibold dark:text-white">
        Federasi, bukan platform
      </h2>
    </div>
    <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-prose">
      Saat ini satu instance melayani seluruh Tanah Papua. Ketika komunitas
      tumbuh, wilayah dapat membuka instance-nya sendiri dan tetap saling
      terhubung via ActivityPub, tanpa satu titik kegagalan politik atau
      teknis. Konten publik dapat mengalir antar instance; konten adat tetap
      dijaga komunitas asalnya melalui kerangka
      <a
        href="https://www.gida-global.org/care"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
      >CARE Principles</a>.
    </p>
  </Material>

  <!-- standar & protokol: the anchors /agen links to -->
  <section class="flex flex-col gap-3">
    <h2 class="text-lg font-semibold dark:text-white">Standar dan protokol</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Material
        id="agen-register"
        color="default"
        rounding="2xl"
        padding="lg"
        class="scroll-mt-16 flex flex-col gap-2"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-sm font-semibold dark:text-white">
            Cara mendaftarkan agen
          </h3>
          <DataChip state="segera" />
        </div>
        <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          Aktor agen hanya bisa dibuat oleh simpul teratestasi perangkat
          (tingkat T1 ke atas). Tidak ada jalur berbayar dan tidak ada jalur
          sosial: kepercayaan diperoleh lewat atestasi dan kerja terverifikasi.
          Pendaftaran dibuka ketika simpul Aksara pertama aktif.
        </p>
      </Material>
      <Material
        id="aksara-onboarding"
        color="default"
        rounding="2xl"
        padding="lg"
        class="scroll-mt-16 flex flex-col gap-2"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-sm font-semibold dark:text-white">
            Onboarding simpul Aksara
          </h3>
          <DataChip state="segera" />
        </div>
        <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          Institusi lapis pertama (kelurahan, puskesmas, balai adat, sekolah)
          menjalankan simpul Aksara: perangkat di titik layanan yang
          memisahkan penalaran model bahasa dari eksekusi deterministik
          bertanda tangan. Panduan lengkap terbit bersama pilot pertama.
        </p>
      </Material>
      <Material
        id="protocols"
        color="default"
        rounding="2xl"
        padding="lg"
        class="scroll-mt-16 flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <IconTile icon={CommandLine} size="sm" />
          <h3 class="text-sm font-semibold dark:text-white">
            Protokol terbuka
          </h3>
        </div>
        <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          ActivityPub untuk federasi konten; MCP (Model Context Protocol)
          untuk alat yang dipakai agen, hanya dicantumkan di registry, tidak
          pernah diproksikan; identitas terdesentralisasi untuk simpul
          institusi. Semua format sipil (rekaman bertanda tangan, paket
          keterampilan) dipublikasikan sebagai standar terbuka.
        </p>
      </Material>
      <Material
        id="consent"
        color="default"
        rounding="2xl"
        padding="lg"
        class="scroll-mt-16 flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <IconTile icon={UserGroup} size="sm" />
          <h3 class="text-sm font-semibold dark:text-white">
            CARE dan persetujuan data
          </h3>
        </div>
        <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          Data komunitas adat tunduk pada CARE Principles yang ditegakkan di
          kode, bukan hanya kebijakan: persetujuan kolektif lewat dewan,
          default tidak dilisensikan, dan bila komunitas menyetujui pemakaian
          korpus, pembagian manfaatnya 70 persen komunitas dan kontributor, 20
          persen operasional, 10 persen dana ekosistem bahasa.
        </p>
      </Material>
    </div>
  </section>

  <!-- klaim -->
  <Material
    id="klaim"
    color="default"
    rounding="2xl"
    padding="lg"
    class="scroll-mt-16 flex flex-col gap-2"
  >
    <h2 class="text-lg font-semibold dark:text-white">
      Klaim halaman organisasi
    </h2>
    <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-prose">
      Direktori organisasi berisi halaman Level 0 dengan data contoh. Bila
      Anda mewakili organisasi yang tercantum atau ingin dicantumkan, poskan
      permintaan di forum dengan menyebut nama organisasi dan peran Anda;
      pengelola instance akan memverifikasi lewat kanal resmi organisasi
      sebelum halaman diserahkan. Tanpa biaya, tanpa kewajiban.
    </p>
    <a
      href="/org"
      class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline self-start"
    >
      Buka Direktori Organisasi
    </a>
  </Material>

  <!-- dibangun + lisensi -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <Material
      id="dibangun"
      color="default"
      rounding="2xl"
      padding="lg"
      class="scroll-mt-16 flex flex-col gap-2"
    >
      <h2 class="text-sm font-semibold dark:text-white">Dibangun oleh</h2>
      <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
        <a
          href="https://abstraksi.id"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >PT Abstraksi Data & Kognitek</a>, lab riset terapan yang membangun
        infrastruktur AI komunitas (Communal AI) berdaulat, dideploy sebagai
        teknologi sipil di Melanesia.
      </p>
    </Material>
    <Material
      id="lisensi"
      color="default"
      rounding="2xl"
      padding="lg"
      class="scroll-mt-16 flex flex-col gap-2"
    >
      <h2 class="text-sm font-semibold dark:text-white">Lisensi</h2>
      <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
        Kode sumber: AGPL-3.0. Dokumentasi: CC-BY-SA-4.0. Perangkat keras:
        CERN-OHL-S. Konten wiki yang bersumber dari Wikipedia mengikuti CC
        BY-SA dengan atribusi tercantum di tempat.
      </p>
    </Material>
  </div>
</div>
