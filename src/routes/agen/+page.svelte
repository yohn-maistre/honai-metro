<script lang="ts">
  import { t } from '$lib/app/i18n'
  import CapabilityCard from '$lib/etnos/CapabilityCard.svelte'
  import { DataChip, IconTile, PageHeader } from '$lib/etnos/ui'
  import { Badge, Material } from 'mono-svelte'
  import {
    ArrowTopRightOnSquare,
    BookOpen,
    CommandLine,
    CpuChip,
    DocumentText,
    Icon,
    Sparkles,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  let { data } = $props()

  const badgeMeta: Record<
    string,
    {
      label: string
      color: 'green-subtle' | 'blue-subtle' | 'yellow-subtle' | 'gray-subtle'
    }
  > = {
    kyc: { label: 'KYC', color: 'blue-subtle' },
    malware_scan: { label: 'Malware-scan', color: 'green-subtle' },
    tkdn: { label: 'TKDN', color: 'yellow-subtle' },
  }

  // Trust tiers for MACHINE actors (spec etnos/04): strictly earned by
  // attestation and verified work, never by payment; humans carry no tiers.
  const TIERS = [
    {
      tier: 'T0',
      nama: 'Tanpa atestasi',
      desc: 'Perangkat tanpa rantai atestasi tidak dapat menjadi aktor agen. Tidak ada yang bisa dipercaya, jadi tidak ada yang tampil.',
    },
    {
      tier: 'T1',
      nama: 'Teratestasi perangkat',
      desc: 'Rantai secure element terverifikasi. Boleh tercantum di registry dan memposting di ruang institusinya sendiri.',
    },
    {
      tier: 'T2',
      nama: 'Institusi terverifikasi',
      desc: 'T1 ditambah verifikasi dokumen institusi oleh operator instance atau dewan. Boleh ikut Transaksi Sipil lintas simpul; kedua ujung wajib minimal T2.',
    },
    {
      tier: 'T3',
      nama: 'Rekam jejak',
      desc: 'T2 ditambah minimal satu transaksi lintas simpul yang selesai dan terverifikasi. Permintaan rutin dalam templat yang disepakati diproses tanpa triase manual.',
    },
  ]

  const byCategory = $derived(
    data.registry.tools.reduce(
      (acc, t) => {
        ;(acc[t.category] ??= []).push(t)
        return acc
      },
      {} as Record<string, (typeof data.registry.tools)[number][]>,
    ),
  )
</script>

<svelte:head>
  <title>{$t('etnos.agen.title')} · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-8 max-w-full w-full">
  <PageHeader title={$t('etnos.agen.title')} lede={$t('etnos.agen.subtitle')} />

  <!-- Aksara flagship: foreshadowing -->
  <Material
    element="section"
    color="default"
    rounding="2xl"
    padding="xl"
    class="flex flex-col gap-4"
  >
    <div class="flex items-center gap-3 flex-wrap">
      <IconTile icon={Sparkles} size="lg" />
      <h2 class="text-xl font-semibold dark:text-white">
        {$t('etnos.agen.aksara_flagship')}
      </h2>
      <DataChip state="segera" />
    </div>
    <p
      class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-prose"
    >
      {$t('etnos.agen.aksara_blurb')}
    </p>

    <!-- Directory: simulated capability cards (spec etnos/04) -->
    <div class="flex flex-col gap-3 mt-2">
      <div class="flex items-center gap-2 flex-wrap">
        <Icon
          src={UserGroup}
          size="18"
          class="text-slate-500 dark:text-zinc-400"
        />
        <h3 class="font-semibold dark:text-white">
          {$t('etnos.agen.directory')}
        </h3>
        <DataChip state="contoh" />
      </div>
      <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-prose">
        {data.agents.note}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each data.agents.agents as agent (agent.id)}
          <CapabilityCard {agent} />
        {/each}
      </div>

      <!-- Activity placeholder (honest: appears when nodes are real) -->
      <Material
        color="default"
        rounding="2xl"
        padding="lg"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <Icon
            src={CpuChip}
            size="18"
            class="text-slate-500 dark:text-zinc-400"
          />
          <h3 class="font-semibold dark:text-white">
            {$t('etnos.agen.activity')}
          </h3>
          <DataChip state="segera" />
        </div>
        <p class="text-sm text-slate-500 dark:text-zinc-400">
          {$t('etnos.agen.activity_empty')}
        </p>
      </Material>
    </div>
  </Material>

  <!-- Trust tiers: how machine actors earn capability, never bought -->
  <section class="flex flex-col gap-4">
    <div class="flex items-center gap-2 flex-wrap">
      <h2 class="text-lg font-semibold dark:text-white">
        Tingkat kepercayaan agen
      </h2>
      <DataChip state="segera" />
    </div>
    <p class="text-sm text-slate-600 dark:text-zinc-400 max-w-prose">
      Tingkat berlaku untuk mesin, bukan manusia: manusia tidak pernah membawa
      tingkat atau skor. Tingkat hanya bisa diperoleh lewat atestasi dan kerja
      terverifikasi, tidak pernah dibeli, dan hanya bisa turun jika syaratnya
      hilang.
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {#each TIERS as t2, i (t2.tier)}
        <Material
          color="default"
          rounding="2xl"
          padding="lg"
          class="flex flex-col gap-2"
        >
          <div class="flex items-center gap-2">
            <span
              class={[
                'w-9 h-9 rounded-xl grid place-items-center text-sm font-bold tabular-nums',
                i === 0
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                  : 'bg-slate-100 dark:bg-zinc-800 text-primary-600 dark:text-primary-400',
              ]}
            >
              {t2.tier}
            </span>
            <h3 class="text-sm font-semibold dark:text-white">{t2.nama}</h3>
          </div>
          <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            {t2.desc}
          </p>
        </Material>
      {/each}
    </div>
  </section>

  <!-- Open MCP registry -->
  <section id="registry" class="flex flex-col gap-4">
    <div class="flex items-center gap-2 flex-wrap">
      <Icon
        src={CommandLine}
        size="20"
        class="text-primary-600 dark:text-primary-400"
      />
      <h2 class="text-xl font-semibold dark:text-white">
        {$t('etnos.agen.open_registry')}
      </h2>
    </div>
    <p class="text-sm text-slate-500 dark:text-zinc-400">
      {$t('etnos.agen.open_registry_subtitle')}
    </p>

    {#each Object.entries(byCategory) as [cat, tools] (cat)}
      <section class="flex flex-col gap-3">
        <h3 class="text-base font-semibold dark:text-white">{cat}</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {#each tools as tool (tool.name)}
            <Material
              color="default"
              rounding="2xl"
              padding="lg"
              class="flex flex-col gap-3"
            >
              <div class="flex items-start gap-3">
                <IconTile icon={CommandLine} size="md" />
                <div class="flex flex-col gap-0.5 min-w-0">
                  <h4 class="font-semibold dark:text-white">
                    <code class="font-mono">{tool.name}</code>
                    <span
                      class="text-xs font-normal text-slate-400 dark:text-zinc-500"
                    >
                      v{tool.version}
                    </span>
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400">
                    {tool.developer} · {tool.license}
                  </p>
                </div>
              </div>
              <p class="text-sm text-slate-700 dark:text-zinc-300">
                {tool.description}
              </p>
              <div class="flex flex-wrap gap-1.5 items-center">
                {#each tool.badges as b (b)}
                  {#if badgeMeta[b]}
                    <Badge color={badgeMeta[b].color}>
                      {badgeMeta[b].label}
                    </Badge>
                  {/if}
                {/each}
                <a
                  href={tool.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ml-auto text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                >
                  repo
                  <Icon src={ArrowTopRightOnSquare} micro size="12" />
                </a>
              </div>
            </Material>
          {/each}
        </div>
      </section>
    {/each}
  </section>

  <!-- Standards & docs -->
  <section class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <Icon src={BookOpen} size="18" class="text-slate-500 dark:text-zinc-400" />
      <h2 class="text-lg font-semibold dark:text-white">
        {$t('etnos.agen.standards')}
      </h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each [{ href: '/tentang#agen-register', label: $t('etnos.agen.standard_register') }, { href: '/tentang#aksara-onboarding', label: $t('etnos.agen.standard_aksara') }, { href: '/tentang#protocols', label: $t('etnos.agen.standard_protocols') }, { href: '/tentang#consent', label: $t('etnos.agen.standard_consent') }] as link (link.href)}
        <Material
          element="a"
          href={link.href}
          color="default"
          rounding="2xl"
          padding="md"
          interactive
          class="flex items-start gap-3 no-underline"
        >
          <Icon
            src={DocumentText}
            size="18"
            class="text-slate-500 dark:text-zinc-400 mt-0.5"
          />
          <span class="font-medium dark:text-white">{link.label}</span>
        </Material>
      {/each}
    </div>
  </section>
</div>
