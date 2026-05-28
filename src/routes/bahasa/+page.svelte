<script lang="ts">
  import { t } from '$lib/app/i18n'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Badge } from 'mono-svelte'

  let { data } = $props()

  const statusColor = (status: string): 'green-subtle' | 'yellow-subtle' | 'red-subtle' => {
    switch (status) {
      case 'vital':
        return 'green-subtle'
      case 'definitely_endangered':
        return 'yellow-subtle'
      case 'severely_endangered':
      case 'critically_endangered':
        return 'red-subtle'
      default:
        return 'yellow-subtle'
    }
  }

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'vital':
        return 'Vital'
      case 'definitely_endangered':
        return 'Terancam'
      case 'severely_endangered':
        return 'Sangat terancam'
      case 'critically_endangered':
        return 'Kritis'
      default:
        return status
    }
  }
</script>

<svelte:head>
  <title>{$t('etnos.bahasa.title')} — ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-full w-full">
  <EndPlaceholder size="lg">{$t('etnos.bahasa.title')}</EndPlaceholder>
  <p class="text-sm text-slate-500 dark:text-zinc-400">
    {$t('etnos.bahasa.subtitle')} — pelestarian melalui penggunaan sehari-hari,
    bukan sekadar dokumentasi.
  </p>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {#each data.bahasa.languages as lang (lang.slug)}
      <div
        class="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-2"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col gap-0.5 min-w-0">
            <h3 class="font-semibold dark:text-white">{lang.name}</h3>
            <p class="text-sm italic text-slate-500 dark:text-zinc-400">
              {lang.native}
            </p>
          </div>
          <Badge color={statusColor(lang.status)} rounding="md">
            {statusLabel(lang.status)}
          </Badge>
        </div>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt class="text-slate-500 dark:text-zinc-500">Penutur</dt>
          <dd class="text-slate-700 dark:text-zinc-300">{lang.speakers}</dd>
          <dt class="text-slate-500 dark:text-zinc-500">Wilayah</dt>
          <dd class="text-slate-700 dark:text-zinc-300">{lang.region}</dd>
          <dt class="text-slate-500 dark:text-zinc-500">Rumpun</dt>
          <dd class="text-slate-700 dark:text-zinc-300">{lang.family}</dd>
        </dl>
        <div class="flex gap-2 mt-2">
          <a
            href="/c/bahasa-{lang.slug}"
            class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            /c/bahasa-{lang.slug} →
          </a>
        </div>
      </div>
    {/each}
  </div>
</div>
