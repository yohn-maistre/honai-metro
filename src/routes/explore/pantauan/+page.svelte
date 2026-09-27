<script lang="ts">
  import { t } from '$lib/app/i18n'
  import PapanSinyal from '$lib/etnos/PapanSinyal.svelte'
  import { BackLink } from '$lib/etnos/ui'
</script>

<svelte:head>
  <title>Pantauan · ETNOS</title>
</svelte:head>

<div class="etnos-editorial-page">
  <BackLink href="/explore">{$t('routes.explore.title')}</BackLink>
  <header class="etnos-editorial-heading">
    <span>ETNOS</span>
    <h1>Pantauan</h1>
    <p>Peta kabar dan sinyal publik.</p>
  </header>
  <PapanSinyal />
</div>
