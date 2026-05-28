// Tiny SpeechSynthesis wrapper. Browser-only, zero dep, zero API key.
// Used by the Wiki read-aloud button and Kata Hari Ini.

import { browser } from '$app/environment'

let currentUtterance: SpeechSynthesisUtterance | null = null

export function isTtsAvailable(): boolean {
  return browser && typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return undefined
  // Prefer exact lang match, then prefix match, then any.
  return (
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(lang.split('-')[0])) ??
    voices[0]
  )
}

export function speak(text: string, lang: string = 'id-ID'): void {
  if (!isTtsAvailable() || !text) return
  stop()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 1
  u.pitch = 1
  const voice = pickVoice(lang)
  if (voice) u.voice = voice
  currentUtterance = u
  window.speechSynthesis.speak(u)
}

export function stop(): void {
  if (!isTtsAvailable()) return
  window.speechSynthesis.cancel()
  currentUtterance = null
}

export function isSpeaking(): boolean {
  return isTtsAvailable() && window.speechSynthesis.speaking
}
