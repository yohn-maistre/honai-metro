import { browser } from '$app/environment'
import { env } from '$env/dynamic/public'
import { aliases, loadTranslations, locales } from '$lib/app/i18n'
import { settings } from '$lib/app/settings.svelte'

export const ssr = env.PUBLIC_SSR_ENABLED?.toLowerCase() == 'true'

export async function load() {
  if (browser) {
    let initLocale = settings.language ?? navigator?.language ?? 'en'
    
    // Fallback to 'en' if the requested language isn't fully supported yet
    // This prevents sveltekit-i18n from hanging indefinitely on loadTranslations
    if (!locales.get().includes(initLocale) && !aliases.has(initLocale)) {
      console.warn(`[ETNOS] Locale '${initLocale}' not found in loaded configs, falling back to 'en'`);
      initLocale = 'en';
    }

    const resolvedLocale = aliases.get(initLocale) ?? initLocale

    console.log(`Loading locale ${resolvedLocale}`)

    try {
      await loadTranslations(resolvedLocale)
    } catch (e) {
      console.error("[ETNOS] Failed to load translations:", e)
    }
  }

  return
}
