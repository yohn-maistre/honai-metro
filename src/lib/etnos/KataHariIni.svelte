<script lang="ts">
  // Kata hari ini: the daily word as a plain Board card (carousel
  // retired), TTS kept. This is the word's only surface besides the wiki
  // language hub; the board's KATA row was retired.
  import { t } from '$lib/app/i18n'
  import { Button } from 'mono-svelte'
  import { onDestroy } from 'svelte'
  import { Icon, SpeakerWave, Stop } from 'svelte-hero-icons/dist'
  import { isTtsAvailable, speak, stop } from './tts'
  import { Board } from './ui'

  interface Props {
    word: {
      word: string
      language: string
      region?: string
      meaning: string
      example?: string | null
    }
  }
  let { word }: Props = $props()

  let speaking = $state(false)
  function toggleSpeak() {
    if (speaking) {
      stop()
      speaking = false
      return
    }
    speak(word.word, 'id-ID')
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
  title={$t('etnos.wiki.word_of_day')}
  caption={word.region ? `${word.language} · ${word.region}` : word.language}
  class="h-full"
>
  <div class="p-4 flex flex-col gap-2">
    <h3 class="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
      {word.word}
    </h3>
    <p class="text-sm text-slate-700 dark:text-zinc-300">{word.meaning}</p>
    {#if word.example}
      <p class="text-sm italic text-slate-500 dark:text-zinc-400">
        "{word.example}"
      </p>
    {/if}
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
