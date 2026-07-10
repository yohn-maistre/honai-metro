<script lang="ts">
  /**
   * The Level-0 organization directory index: every listed org, one card
   * each, all sample data until real organizations claim them.
   */
  import CapabilityCard from '$lib/etnos/CapabilityCard.svelte'
  import { DataChip, PageHeader } from '$lib/etnos/ui'

  let { data } = $props()
</script>

<svelte:head>
  <title>Direktori Organisasi · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-full w-full">
  <PageHeader
    title="Direktori Organisasi"
    lede="Kehadiran Level 0: organisasi tercantum dengan profil, layanan, dan jam buka, tanpa akun dan tanpa kewajiban. Organisasi yang siap dapat mengklaim halamannya dan bertumbuh menjadi Agen Institusi."
  >
    {#snippet actions()}
      <DataChip state="contoh" />
    {/snippet}
  </PageHeader>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each data.orgs as org (org.slug)}
      <a href="/org/{org.slug}" class="contents">
        <CapabilityCard agent={org} />
      </a>
    {/each}
  </div>

  <p class="text-xs text-slate-400 dark:text-zinc-500">{data.note}</p>
</div>
