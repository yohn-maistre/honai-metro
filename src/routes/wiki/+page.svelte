<script lang="ts">
  import { t } from '$lib/app/i18n'
  import { meta } from '$lib/etnos/wiki'
  import KataHariIni from '$lib/etnos/KataHariIni.svelte'
  import SejarahHariIni from '$lib/etnos/SejarahHariIni.svelte'
  import WajahTanah from '$lib/etnos/WajahTanah.svelte'
  import { IconTile, PageHeader } from '$lib/etnos/ui'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Material } from 'mono-svelte'
  import {
    ArrowRight,
    ChatBubbleLeftRight,
    Clock,
    Fire,
    GlobeAsiaAustralia,
    Icon,
    MapPin,
    PencilSquare,
    UserGroup,
  } from 'svelte-hero-icons/dist'

  let { data } = $props()

  // ETNOS wiki index: the daily hero (Hari Ini Dalam Sejarah + Kata Hari
  // Ini, with TTS), a category grid with honest derived metadata, and the
  // contribution note. Articles live in src/lib/etnos/wiki/*.md.

  const categories = [
    { slug: 'tempat', icon: MapPin },
    { slug: 'sejarah', icon: Clock },
    { slug: 'biodiversitas', icon: GlobeAsiaAustralia },
    { slug: 'suku-bahasa', icon: UserGroup },
    { slug: 'bahasa', icon: ChatBubbleLeftRight },
    { slug: 'kuliner', icon: Fire },
  ]
</script>

<svelte:head>
  <title>Wiki Tanah Papua · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <PageHeader title="Wiki Tanah Papua" lede={$t('etnos.wiki.lede')} />

  <WajahTanah />

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <SejarahHariIni history={data.todayHistory} />
    <KataHariIni word={data.todayWord} />
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {#each categories as cat (cat.slug)}
      {@const key = cat.slug.replace(/-/g, '_')}
      {@const m = meta[cat.slug]}
      <Material
        element="a"
        href="/wiki/{cat.slug}"
        color="default"
        rounding="2xl"
        padding="lg"
        interactive
        class="flex flex-col gap-3 no-underline group"
      >
        <div class="flex items-center gap-3">
          <IconTile icon={cat.icon} size="md" />
          <span class="text-base font-semibold dark:text-white">
            {$t(`etnos.wiki.categories.${key}`)}
          </span>
          <Icon
            src={ArrowRight}
            micro
            size="16"
            class="ml-auto text-slate-400 dark:text-zinc-500 transition-transform group-hover:translate-x-0.5"
          />
        </div>
        <p class="text-sm text-slate-600 dark:text-zinc-400 leading-snug">
          {$t(`etnos.wiki.desc.${key}`)}
        </p>
        {#if m}
          <span
            class="text-xs text-slate-500 dark:text-zinc-500 tabular-nums mt-auto"
          >
            {m.sections}
            {$t('etnos.wiki.sections')} · {m.minutes}
            {$t('etnos.wiki.minutes')}
          </span>
        {/if}
      </Material>
    {/each}
  </div>

  <EndPlaceholder margin="sm">Berkontribusi</EndPlaceholder>
  <Material color="default" rounding="2xl" padding="lg" class="flex gap-4">
    <IconTile icon={PencilSquare} size="md" class="mt-0.5" />
    <div class="flex flex-col gap-1.5 text-sm">
      <p class="text-slate-700 dark:text-zinc-300 leading-relaxed">
        Wiki ini dirawat manual dan diperkaya kontribusi komunitas lewat forum
        <a
          href="/c/wiki"
          class="font-medium text-primary-600 dark:text-primary-400 hover:underline">c/wiki</a
        >. Gunakan bahasa daerah Anda di forum, tambahkan cerita budaya dan
        sejarah, dan bantu memeriksa terjemahan serta isi artikel.
      </p>
    </div>
  </Material>
</div>
