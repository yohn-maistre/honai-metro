<script lang="ts">
  /**
   * The language directory cards, moved from the retired /bahasa route
   * into the wiki language hub (/wiki/bahasa) — one fact, one owner:
   * explore's Bahasa cluster keeps community LINKS only, this hub owns
   * the language DATA. Honest labels: speaker counts are estimates and
   * say so.
   */
  import { Badge } from 'mono-svelte'

  interface Language {
    name: string
    native: string
    speakers: string
    region: string
    family: string
    slug: string
    status: string
  }

  interface Props {
    languages: Language[]
  }

  let { languages }: Props = $props()

  const statusColor = (
    status: string,
  ): 'green-subtle' | 'yellow-subtle' | 'red-subtle' => {
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

<div class="flex flex-col gap-3">
  <div class="flex items-end justify-between gap-3 flex-wrap">
    <span class="inkbar"><span class="dot">●</span>Direktori Bahasa</span>
    <span class="serial">Ethnologue / Badan Bahasa · perkiraan</span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {#each languages as lang (lang.slug)}
      <div
        class="bg-white dark:bg-zinc-900 rounded p-5 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-2"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col gap-0.5 min-w-0">
            <h3 class="font-semibold font-display dark:text-white">
              {lang.name}
            </h3>
            <p class="fig text-sm">{lang.native}</p>
          </div>
          <Badge color={statusColor(lang.status)} rounding="md">
            {statusLabel(lang.status)}
          </Badge>
        </div>
        <div class="ledger text-sm">
          <div>
            <span>Penutur</span>
            <span class="v">{lang.speakers}</span>
          </div>
          <div>
            <span>Wilayah</span>
            <span class="v">{lang.region}</span>
          </div>
          <div>
            <span>Rumpun</span>
            <span class="v">{lang.family}</span>
          </div>
        </div>
        <a
          href="/c/bahasa-{lang.slug}"
          class="serial mt-2 hover:text-primary-600 dark:hover:text-primary-400"
        >
          /c/bahasa-{lang.slug} →
        </a>
      </div>
    {/each}
  </div>
</div>

<style>
  /* long region values wrap instead of overflowing the card */
  .ledger .v {
    white-space: normal;
    text-align: right;
  }
</style>
