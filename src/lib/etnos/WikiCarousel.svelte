<script lang="ts">
  import { t } from '$lib/app/i18n'
  import { Button } from 'mono-svelte'
  import { onDestroy, onMount } from 'svelte'
  import {
    ChevronLeft,
    ChevronRight,
    Icon,
    SpeakerWave,
    Stop,
  } from 'svelte-hero-icons/dist'
  import { isTtsAvailable, speak, stop } from './tts'

  interface HistoryEntry {
    title: string
    body: string
    year?: number | null
  }
  interface WordEntry {
    word: string
    language: string
    region?: string
    meaning: string
    example?: string | null
  }

  interface Props {
    history: HistoryEntry
    word: WordEntry
    autoRotateMs?: number
  }

  let { history, word, autoRotateMs = 8000 }: Props = $props()

  let index = $state(0)
  const total = 2
  let speaking = $state(false)
  let timer: ReturnType<typeof setInterval> | null = null

  function next() {
    index = (index + 1) % total
  }
  function prev() {
    index = (index - 1 + total) % total
  }
  function goto(i: number) {
    index = i
  }

  function toggleSpeak(text: string, lang: string = 'id-ID') {
    if (speaking) {
      stop()
      speaking = false
      return
    }
    speak(text, lang)
    speaking = true
    // Poll for end-of-speech; SpeechSynthesis onend can be unreliable on some browsers.
    const poll = setInterval(() => {
      if (typeof window !== 'undefined' && !window.speechSynthesis.speaking) {
        speaking = false
        clearInterval(poll)
      }
    }, 300)
  }

  onMount(() => {
    if (autoRotateMs > 0) {
      timer = setInterval(next, autoRotateMs)
    }
  })

  onDestroy(() => {
    if (timer) clearInterval(timer)
    stop()
  })

  let ttsAvail = $derived(isTtsAvailable())
</script>

<section
  class="bg-white dark:bg-zinc-900 border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700 rounded-2xl shadow-xs overflow-hidden"
  aria-roledescription="carousel"
>
  <div class="relative min-h-44 sm:min-h-40">
    {#if index === 0}
      <div class="p-5 flex flex-col gap-2">
        <span class="text-xs font-semibold text-primary-700 dark:text-primary-300">
          {$t('etnos.wiki.today_in_history')}{#if history.year}<span class="text-slate-500 dark:text-zinc-400 font-normal"> · {history.year}</span>{/if}
        </span>
        <h3 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
          {history.title}
        </h3>
        <p class="text-sm text-slate-700 dark:text-zinc-300">{history.body}</p>
        {#if ttsAvail}
          <Button
            size="sm"
            color="tertiary"
            onclick={() => toggleSpeak(`${history.title}. ${history.body}`)}
            class="self-start mt-1"
          >
            {#snippet prefix()}
              <Icon src={speaking ? Stop : SpeakerWave} micro size="16" />
            {/snippet}
            {speaking
              ? $t('etnos.wiki.stop_reading')
              : $t('etnos.wiki.read_aloud')}
          </Button>
        {/if}
      </div>
    {:else}
      <div class="p-5 flex flex-col gap-2">
        <span class="text-xs font-semibold text-primary-700 dark:text-primary-300">
          {$t('etnos.wiki.word_of_day')} · {word.language}{#if word.region}<span class="text-slate-500 dark:text-zinc-400 font-normal"> · {word.region}</span>{/if}
        </span>
        <h3 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
          {word.word}
        </h3>
        <p class="text-sm text-slate-700 dark:text-zinc-300">{word.meaning}</p>
        {#if word.example}
          <p class="text-sm italic text-slate-500 dark:text-zinc-400">
            "{word.example}"
          </p>
        {/if}
        {#if ttsAvail}
          <Button
            size="sm"
            color="tertiary"
            onclick={() => toggleSpeak(word.word, 'id-ID')}
            class="self-start mt-1"
          >
            {#snippet prefix()}
              <Icon src={speaking ? Stop : SpeakerWave} micro size="16" />
            {/snippet}
            {speaking
              ? $t('etnos.wiki.stop_reading')
              : $t('etnos.wiki.read_aloud')}
          </Button>
        {/if}
      </div>
    {/if}

    <!-- prev / next -->
    <Button
      class="absolute top-1/2 -translate-y-1/2 left-2 opacity-70 hover:opacity-100"
      color="tertiary"
      size="square-sm"
      onclick={prev}
      icon={ChevronLeft}
      aria-label="Previous"
    ></Button>
    <Button
      class="absolute top-1/2 -translate-y-1/2 right-2 opacity-70 hover:opacity-100"
      color="tertiary"
      size="square-sm"
      onclick={next}
      icon={ChevronRight}
      aria-label="Next"
    ></Button>
  </div>

  <!-- dots -->
  <div class="flex items-center justify-center gap-2 pb-3">
    {#each Array(total) as _, i (i)}
      <button
        type="button"
        aria-label="Go to slide {i + 1}"
        aria-current={i === index}
        onclick={() => goto(i)}
        class={[
          'h-1.5 rounded-full transition-all',
          i === index
            ? 'w-6 bg-primary-500'
            : 'w-1.5 bg-slate-300 dark:bg-zinc-700',
        ]}
      ></button>
    {/each}
  </div>
</section>
