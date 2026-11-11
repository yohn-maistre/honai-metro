<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { Spring } from 'svelte/motion'
  import { ArrowRight, ArrowUpRight, X } from '@lucide/svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import LoginForm from '$lib/components/login-form.svelte'
  import BrandWordmark from './BrandWordmark.svelte'
  import LandscapePrint from './LandscapePrint.svelte'
  import { chooseWelcomeArtwork, type WelcomeArtwork } from './site-branding'
  let {
    mode = 'welcome', intro = false, ready = true, exiting = false, handle = $bindable(''),
    publishing = $bindable(false), livePublishing = false,
    busy = false, failed = false, submitError = '', onsubmit, onclose,
    artwork = chooseWelcomeArtwork(),
  }: {
    mode?: 'welcome' | 'login' | 'signup'
    intro?: boolean
    ready?: boolean
    exiting?: boolean
    handle?: string
    publishing?: boolean
    livePublishing?: boolean
    busy?: boolean
    failed?: boolean
    submitError?: string
    onsubmit: (mode: 'login' | 'signup', invitation: string) => void
    onclose: () => void
    artwork?: WelcomeArtwork | null
  } = $props()
  let stage = $state(untrack(() => mode))
  let arriving = $state(untrack(() => intro))
  let artFailed = $state(false)
  let content = $state<HTMLDivElement | null>(null)
  const morph = new Spring(untrack(() => intro ? 0 : 1), {
    stiffness: .075, damping: .83, precision: .001,
  })
  let mounted = $state(false)
  let alive = true
  onMount(() => {
    mounted = true
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const stopMotion = () => {
      if (reduced.matches && ready) {
        void morph.set(1, { instant: true })
        arriving = false
      }
    }
    reduced.addEventListener('change', stopMotion)
    return () => {
      alive = false
      reduced.removeEventListener('change', stopMotion)
      void morph.set(1, { instant: true })
    }
  })
  $effect(() => {
    if (!mounted || !ready || !arriving) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      untrack(() => { void morph.set(1, { instant: true }); arriving = false })
      return
    }
    const timer = setTimeout(() => {
      if (!alive) return
      void morph.set(1).then(() => { if (alive) arriving = false }, (error: unknown) => {
        // Reduced motion or unmount legitimately replaces an in-flight target.
        if (!(error instanceof Error) || error.message !== 'Aborted') throw error
      })
    }, 180)
    return () => clearTimeout(timer)
  })
</script>

<Dialog.Root open onOpenChange={(value) => { if (!value && !busy) onclose() }}>
  <Dialog.Content
    bind:ref={content}
    class="welcome-dialog"
    data-art={!!artwork && !artFailed}
    data-arriving={arriving}
    data-stage={stage}
    data-exiting={exiting}
    style={'--welcome-morph:' + morph.current}
    showCloseButton={false}
    onOpenAutoFocus={(event) => {
      event.preventDefault()
      content?.focus({ preventScroll: true })
    }}
    onEscapeKeydown={(event) => { if (busy) event.preventDefault() }}
    onInteractOutside={(event) => { if (busy) event.preventDefault() }}
  >
    <Dialog.Title class="sr-only">{stage === 'welcome' ? 'Selamat datang di ETNOS' : 'Bergabung atau masuk ke ETNOS'}</Dialog.Title>
    <Dialog.Description class="sr-only">Percakapan, kabar sekitar dan pengetahuan bersama. Kamu dapat menjelajahi ETNOS tanpa akun.</Dialog.Description>
    <div class="welcome-wordmark" aria-hidden="true"><BrandWordmark animate={intro}/></div>
    <Button class="welcome-close" variant="ghost" size="icon" aria-label="Tutup sambutan" disabled={busy} onclick={onclose}><X size={20}/></Button>
    <div class="welcome-form-pane" inert={arriving && morph.current < .65}>
      {#if stage === 'welcome'}
        <div class="welcome-introduction">
          <h2>Tempat bertemu, berbagi, dan merawat pengetahuan bersama.</h2>
          <div class="welcome-actions">
            <Button class="welcome-join" onclick={() => stage = 'signup'}>Bergabung <ArrowRight size={17}/></Button>
            <Button class="welcome-signin" variant="outline" onclick={() => stage = 'login'}>Sudah punya akun? Masuk</Button>
          </div>
          <Button class="welcome-browse" variant="link" onclick={onclose}>Jelajahi dulu <ArrowUpRight size={15}/></Button>
        </div>
      {:else}
        <LoginForm embedded initialMode={stage} bind:handle bind:publishing {livePublishing} {busy} {failed} {submitError} {onsubmit} onbrowse={onclose}/>
      {/if}
    </div>
    {#if artwork && !artFailed}
      <figure class="welcome-art">
        <LandscapePrint {artwork} onerror={() => artFailed = true}/>
        <figcaption><span>{artwork.location}</span><small>{artwork.credit}</small></figcaption>
      </figure>
    {/if}
  </Dialog.Content>
</Dialog.Root>
