<script lang="ts">
  import { browser } from '$app/environment'
  import { t } from '$lib/app/i18n'
  import { action, modal } from '$lib/ui/shared/modal/modal'
  import { onMount } from 'svelte'

  const KEY = 'etnos_onboarded_v1'

  onMount(() => {
    if (!browser) return
    if (localStorage.getItem(KEY)) return
    localStorage.setItem(KEY, '1')
    // Defer two frames so the first navigation (and the router's history
    // bookkeeping) settles before the modal pushes its own history entry.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        modal({
          title: t.get('etnos.onboarding.title'),
          snippet: onboardingContent,
          actions: [
            action({
              type: 'primary',
              content: t.get('etnos.onboarding.start'),
            }),
          ],
        }),
      ),
    )
  })
</script>

{#snippet onboardingContent()}
  <div class="flex flex-col gap-3 text-sm text-slate-700 dark:text-zinc-300">
    <p>{$t('etnos.onboarding.intro')}</p>
    <ul class="flex flex-col gap-2 list-disc list-inside marker:text-primary-500">
      <li>{$t('etnos.onboarding.b1')}</li>
      <li>{$t('etnos.onboarding.b2')}</li>
      <li>{$t('etnos.onboarding.b3')}</li>
      <li>{$t('etnos.onboarding.b4')}</li>
    </ul>
    <a
      href="/tentang"
      class="text-primary-600 dark:text-primary-400 hover:underline mt-1"
    >
      {$t('etnos.onboarding.more')} →
    </a>
  </div>
{/snippet}
