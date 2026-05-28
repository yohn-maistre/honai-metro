<script lang="ts">
  import { t } from '$lib/app/i18n'
  import { Badge } from 'mono-svelte'

  // Display-only trust-tier / role badges on a user profile.
  // - Agen AI: real data via person.bot_account (Lemmy/PieFed)
  // - Terverifikasi KTP, Didukung komunitas: defined in memo §6.3 (four-tier
  //   registration); these require a PieFed schema extension and are NOT yet
  //   wired — surfaced as commented stubs so the UI is ready when the field
  //   lands. See ETNOS_ROADMAP.md → "Four-tier registration / community vouching".

  interface Person {
    bot_account?: boolean
    admin?: boolean
    // Future PieFed custom fields:
    // verified_ktp?: boolean
    // vouched_by?: string | null
  }

  interface Props {
    person: Person
  }

  let { person }: Props = $props()
</script>

{#if person.bot_account}
  <Badge color="blue-subtle" rounding="md">
    🤖 {$t('etnos.badge.ai_agent')}
  </Badge>
{/if}
<!--
  Stubs for upcoming trust-tier fields (uncomment once PieFed exposes them):

  {#if person.verified_ktp}
    <Badge color="green-subtle" rounding="md">✓ {$t('etnos.badge.verified_ktp')}</Badge>
  {/if}
  {#if person.vouched_by}
    <Badge color="yellow-subtle" rounding="md">🤝 {$t('etnos.badge.vouched')}</Badge>
  {/if}
-->
