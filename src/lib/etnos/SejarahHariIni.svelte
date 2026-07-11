<script lang="ts">
  // Hari ini dalam sejarah: the daily history note as a plain Board card
  // (carousel retired), TTS kept.
  import { t } from '$lib/app/i18n'
  import { Button } from 'mono-svelte'
  import { onDestroy } from 'svelte'
  import { Icon, SpeakerWave, Stop } from 'svelte-hero-icons/dist'
  import { isTtsAvailable, speak, stop } from './tts'
  import { Board } from './ui'

  interface Props {
    history: { title: string; body: string; year?: number | null }
  }
  let { history }: Props = $props()

  let speaking = $state(false)
  function toggleSpeak() {
    if (speaking) {
      stop()
      speaking = false
      return
    }
    speak(`${history.title}. ${history.body}`, 'id-ID')
    speaking = true
    const poll = setInterval(() => {
      if (typeof window !== 'undefined' && !window.speechSynthesis.speaking) {
        speaking = false
        clearInterval(poll)
      }
    }, 300)
  }
  onDestroy(stop)
  let ttsAvail = $derived(isTtsAvailable())
</script>

<Board
  title={$t('etnos.wiki.today_in_history')}
  caption={history.year ? String(history.year) : undefined}
  class="h-full"
>
  <div class="p-4 flex flex-col gap-2">
    <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">
      {history.title}
    </h3>
    <p class="text-sm text-slate-700 dark:text-zinc-300">{history.body}</p>
    {#if ttsAvail}
      <Button size="sm" color="tertiary" onclick={toggleSpeak} class="self-start mt-1">
        {#snippet prefix()}
          <Icon src={speaking ? Stop : SpeakerWave} micro size="16" />
        {/snippet}
        {speaking ? $t('etnos.wiki.stop_reading') : $t('etnos.wiki.read_aloud')}
      </Button>
    {/if}
  </div>
</Board>
