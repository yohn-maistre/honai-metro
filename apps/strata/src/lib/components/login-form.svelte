<script lang="ts">
  // Adapted from shadcn-svelte login-01 (MIT). Authentication remains AT OAuth.
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
  } from '$lib/components/ui/field/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { ArrowUpRight, LoaderCircle, KeyRound } from '@lucide/svelte'
  import { onMount, untrack } from 'svelte'
  import { request } from '../../api'
  let {
    handle = $bindable(''),
    publishing = $bindable(false),
    livePublishing = false,
    busy = false,
    failed = false,
    submitError = '',
    onsubmit,
    initialMode,
    embedded = false,
    onbrowse,
  }: {
    handle?: string
    publishing?: boolean
    livePublishing?: boolean
    busy?: boolean
    failed?: boolean
    submitError?: string
    initialMode?: 'login' | 'signup'
    embedded?: boolean
    onbrowse?: () => void
    onsubmit: (mode: 'login' | 'signup', invitation: string) => void
  } = $props()
  let signup = $state(
    untrack(() => initialMode ? initialMode === 'signup' : new URLSearchParams(location.search).get('mode') === 'signup'),
  )
  let invitation = $state('')
  let enrollment = $state<'open' | 'invite' | 'closed' | null>(null)
  let optionsError = $state(false)
  async function options() {
    optionsError = false
    try {
      const result = await request<{
        enrollment: 'open' | 'invite' | 'closed'
      }>('/auth/options')
      enrollment = result.enrollment
    } catch {
      optionsError = true
    }
  }
  onMount(() => {
    void options()
  })
</script>

<Card.Root class={'login-card' + (embedded ? ' login-card-embedded' : '')}>
  <Card.Header>
    <KeyRound size={23} class="text-primary mb-3" /><Card.Title class="text-xl">
      {signup ? 'Bergabung dengan ETNOS' : 'Masuk ke ETNOS'}
    </Card.Title><Card.Description>
      {signup
        ? 'Buat akun Bluesky atau gunakan akun yang sudah ada.'
        : 'Gunakan akun Bluesky atau akun AT yang sudah terhubung.'}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      onsubmit={(e) => {
        e.preventDefault()
        if (!signup || enrollment === 'open' || enrollment === 'invite')
          onsubmit(signup ? 'signup' : 'login', invitation.trim())
      }}
    >
      <FieldGroup>
        {#if !signup}<Field>
            <FieldLabel for="at-handle">Handle akun</FieldLabel><Input
              id="at-handle"
              bind:value={handle}
              placeholder="nama.bsky.social"
              autocomplete="username"
              autocapitalize="none"
              spellcheck={false}
              required
            /><FieldDescription>
              Kata sandi tetap di penyedia akunmu.
            </FieldDescription>
          </Field>{:else}
          <p class="text-sm text-muted-foreground">
            Kamu akan kembali ke ETNOS setelah menyelesaikan pendaftaran di
            Bluesky. Kata sandi tetap di Bluesky.
          </p>
          {#if enrollment === 'invite'}<Field>
              <FieldLabel for="enrollment-invitation">
                Kode undangan ETNOS
              </FieldLabel>
              <Input
                id="enrollment-invitation"
                bind:value={invitation}
                required
                autocomplete="off"
                autocapitalize="none"
                spellcheck={false}
              />
            </Field>{:else if enrollment === 'closed'}<p role="status">
              Pendaftaran sedang ditutup. Kamu tetap dapat membaca.
            </p>
          {:else if optionsError}<p role="alert">
              Pendaftaran belum dapat diperiksa.
            </p>
            <Button type="button" variant="outline" onclick={options}>
              Coba lagi
            </Button>{/if}
        {/if}
        {#if livePublishing && !signup}<Field orientation="horizontal">
            <Checkbox
              id="publishing-consent"
              bind:checked={publishing}
            /><FieldLabel for="publishing-consent">
              Izinkan penerbitan ke AT
            </FieldLabel>
          </Field>{/if}
        {#if submitError}<p role="alert" class="cx-form-error">{submitError}</p>{:else if failed}<p role="alert" class="cx-form-error">
            Masuk belum selesai. Jika akun Blueskymu sudah dibuat, gunakan akun
            itu saat mencoba lagi.
          </p>{/if}
        <Button
          type="submit"
          disabled={busy ||
            (signup && (!enrollment || enrollment === 'closed'))}
          class="w-full"
        >
          {#if busy}<LoaderCircle class="animate-spin" />{/if}{signup
            ? 'Lanjutkan dengan Bluesky'
            : 'Lanjutkan'}<ArrowUpRight size={16} />
        </Button>
        <FieldDescription>
          {signup
            ? 'Ruang privat tetap memerlukan persetujuan komunitas.'
            : 'Baru di ETNOS? Pilih Bergabung untuk menghubungkan akunmu.'}
        </FieldDescription>
      </FieldGroup>
    </form>
  </Card.Content>
  <Card.Footer class="border-t text-sm text-muted-foreground">
    <a href="/explore" class="cx-text-link" onclick={(event) => { if (onbrowse) { event.preventDefault(); event.stopPropagation(); onbrowse() } }}>Tetap membaca tanpa masuk</a>
    <Button
      type="button"
      variant="link"
      class="px-0"
      disabled={busy}
      onclick={() => {
        signup = !signup
        invitation = ''
      }}
    >
      {signup ? 'Sudah bergabung? Masuk' : 'Baru di ETNOS? Bergabung'}
    </Button>
  </Card.Footer>
</Card.Root>
