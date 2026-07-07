<script lang="ts">
  import { t } from '$lib/app/i18n'
  import Markdown from '$lib/app/markdown/Markdown.svelte'
  import BahasaHub from '$lib/etnos/BahasaHub.svelte'
  import { isTtsAvailable, speak, stop } from '$lib/etnos/tts'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Button } from 'mono-svelte'
  import { onDestroy } from 'svelte'
  import {
    ArrowLeft,
    Icon,
    SpeakerWave,
    Stop,
  } from 'svelte-hero-icons/dist'

  let { data } = $props()

  let speaking = $state(false)

  const labelKey = `etnos.wiki.categories.${data.slug.replace(/-/g, '_')}`

  function toggleSpeak() {
    if (speaking) {
      stop()
      speaking = false
      return
    }
    // Strip markdown syntax (very rough) before reading.
    const plain = data.content
      .replace(/[#*_`>[\]()-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    speak(plain, 'id-ID')
    speaking = true
    const poll = setInterval(() => {
      if (typeof window !== 'undefined' && !window.speechSynthesis.speaking) {
        speaking = false
        clearInterval(poll)
      }
    }, 300)
  }

  onDestroy(() => stop())
</script>

<svelte:head>
  <title>{$t(labelKey)} · Wiki Tanah Papua · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-full w-full">
  <div class="flex flex-wrap gap-2 items-center justify-between">
    <a
      href="/wiki"
      class="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400"
    >
      <Icon src={ArrowLeft} micro size="16" />
      Wiki Tanah Papua
    </a>
    {#if isTtsAvailable()}
      <Button size="sm" color="tertiary" onclick={toggleSpeak}>
        {#snippet prefix()}
          <Icon src={speaking ? Stop : SpeakerWave} micro size="16" />
        {/snippet}
        {speaking
          ? $t('etnos.wiki.stop_reading')
          : $t('etnos.wiki.read_aloud')}
      </Button>
    {/if}
  </div>
  <EndPlaceholder size="lg">{$t(labelKey)}</EndPlaceholder>
  <div
    class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800"
  >
    <Markdown source={data.content} />
  </div>

  {#if data.bahasa}
    <BahasaHub languages={data.bahasa} />
  {/if}
</div>
