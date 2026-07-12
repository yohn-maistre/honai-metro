<script lang="ts">
  /**
   * Tentang ETNOS: the canonical deep explainer. The right-sidebar About
   * card belongs to the INSTANCE (short, backend-owned); this page owns
   * the ETNOS story in broadsheet sections, and carries the anchor targets
   * that /agen (standards) and /org (klaim) link to.
   */
  import { t } from '$lib/app/i18n'
  import { DataChip, IconTile, PageHeader, SectionHead } from '$lib/etnos/ui'
  import {
    ArrowRight,
    BookOpen,
    BuildingLibrary,
    ChartBar,
    ChatBubbleLeftRight,
    CommandLine,
    CpuChip,
    DocumentText,
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

<div class="flex flex-col gap-8 max-w-full w-full">
  <PageHeader
    title={$t('etnos.tentang.title')}
    lede="Ruang publik berfederasi Tanah Papua: satu tanah, melampaui batas administratif."
  />

  <!-- apa itu -->
  <section id="apa" class="scroll-mt-16 flex flex-col gap-3">
    <SectionHead title="ETNOS, ruang publik komunitas Melanesia" />
    <p class="text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed max-w-prose">
      ETNOS adalah forum publik berfederasi untuk Tanah Papua, dirancang
      sebagai alun-alun digital untuk komunitas dan institusi. Berbasis
      ActivityPub (kompatibel dengan PieFed, Lemmy, Mastodon), ETNOS
      menghubungkan komunitas suku, kampung, puskesmas, balai adat, dan
      koperasi tanpa platform terpusat. ETNOS adalah satu komponen dari
      Aksara, prakarsa Communal AI untuk layanan publik lapis pertama.
    </p>
  </section>

  <!-- isi -->
  <section id="isi" class="scroll-mt-16 flex flex-col gap-3">
    <SectionHead title="Apa yang ada di sini" />
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
      {#each ISI as item (item.href)}
        <a
          href={item.href}
          class="group flex items-start gap-3 no-underline py-2.5 border-b border-slate-200/60 dark:border-zinc-800"
        >
          <IconTile icon={item.icon} size="sm" />
          <div class="flex flex-col gap-0.5 min-w-0">
            <span
              class="text-sm font-medium dark:text-white transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400"
            >
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
            class="ml-auto shrink-0 mt-1 text-slate-400 dark:text-zinc-500"
          />
        </a>
      {/each}
    </div>
  </section>

  <!-- keanggotaan -->
  <section id="keanggotaan" class="scroll-mt-16 flex flex-col gap-3">
    <SectionHead title="Empat tingkat keanggotaan" />
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6">
      {#each KEANGGOTAAN as k, i (k.nama)}
        <div
          class="flex flex-col gap-2 py-3 border-b border-slate-200/60 dark:border-zinc-800"
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
        </div>
      {/each}
    </div>
    <p class="text-xs text-slate-500 dark:text-zinc-400">
      Manusia tidak pernah membawa skor atau tingkat kepercayaan; tingkat T
      hanya berlaku untuk mesin, lihat
      <a href="/agen" class="font-medium text-primary-600 dark:text-primary-400 hover:underline">halaman Agen</a>.
    </p>
  </section>

  <!-- federasi -->
  <section id="federasi" class="scroll-mt-16 flex flex-col gap-3">
    <SectionHead title="Federasi, bukan platform" />
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
  </section>

  <!-- standar & protokol: the anchors /agen links to -->
  <section class="flex flex-col gap-3">
    <SectionHead title="Standar dan protokol" />
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
      <div
        id="agen-register"
        class="scroll-mt-16 flex flex-col gap-2 py-3 border-b border-slate-200/60 dark:border-zinc-800"
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
      </div>
      <div
        id="aksara-onboarding"
        class="scroll-mt-16 flex flex-col gap-2 py-3 border-b border-slate-200/60 dark:border-zinc-800"
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
      </div>
      <div
        id="protocols"
        class="scroll-mt-16 flex flex-col gap-2 py-3 border-b border-slate-200/60 dark:border-zinc-800"
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
      </div>
      <div
        id="consent"
        class="scroll-mt-16 flex flex-col gap-2 py-3 border-b border-slate-200/60 dark:border-zinc-800"
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
      </div>
    </div>
  </section>

  <!-- klaim -->
  <section id="klaim" class="scroll-mt-16 flex flex-col gap-2">
    <SectionHead title="Klaim halaman organisasi" />
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
  </section>

  <!-- dibangun + lisensi -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
    <section id="dibangun" class="scroll-mt-16 flex flex-col gap-2">
      <SectionHead title="Dibangun oleh" />
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
    </section>
    <section id="lisensi" class="scroll-mt-16 flex flex-col gap-2">
      <SectionHead title="Lisensi" />
      <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
        Kode sumber: AGPL-3.0. Dokumentasi: CC-BY-SA-4.0. Perangkat keras:
        CERN-OHL-S. Konten wiki yang bersumber dari Wikipedia mengikuti CC
        BY-SA dengan atribusi tercantum di tempat.
      </p>
    </section>
  </div>
</div>
