<script lang="ts">
  import { t } from '$lib/app/i18n'
  import { Button, Modal, Spinner } from 'mono-svelte'
  import {
    ArrowDownTray,
    ChatBubbleOvalLeft,
    Share,
  } from 'svelte-hero-icons/dist'
  import { kartuText, renderKartu } from './kartu'

  interface Props {
    open?: boolean
    title: string
    community: string
    author?: string
    url: string
  }

  let {
    open = $bindable(false),
    title,
    community,
    author,
    url,
  }: Props = $props()

  let imgUrl = $state<string | null>(null)
  let failed = $state(false)
  let canShareFile = $state(false)
  let file: File | null = null

  const waHref = $derived(
    `https://wa.me/?text=${encodeURIComponent(kartuText({ title, community, url }))}`,
  )

  $effect(() => {
    if (!open) return
    const opts = { title, community, author, url }
    let cancelled = false
    failed = false
    renderKartu(opts)
      .then((blob) => {
        if (cancelled) return
        file = new File([blob], 'kartu-etnos.png', { type: 'image/png' })
        imgUrl = URL.createObjectURL(blob)
        try {
          canShareFile = navigator.canShare?.({ files: [file] }) ?? false
        } catch {
          canShareFile = false
        }
      })
      .catch(() => {
        if (!cancelled) failed = true
      })
    // Runs when the modal closes or the component unmounts: the preview
    // object URL is always revoked.
    return () => {
      cancelled = true
      if (imgUrl) URL.revokeObjectURL(imgUrl)
      imgUrl = null
      file = null
      canShareFile = false
    }
  })

  async function shareCard() {
    if (!file) return
    try {
      await navigator.share({ files: [file], title })
    } catch {
      // the user dismissed the share sheet
    }
  }
</script>

<Modal bind:open title={$t('etnos.kartu.title')}>
  <div class="flex flex-col gap-4">
    {#if imgUrl}
      <img
        src={imgUrl}
        alt={title}
        class="w-full rounded-xl border border-slate-200 dark:border-zinc-800"
      />
    {:else if !failed}
      <div
        class="w-full aspect-square rounded-xl border border-slate-200 dark:border-zinc-800 grid place-items-center"
      >
        <Spinner width={24} />
      </div>
    {/if}
    <div class="flex flex-wrap gap-2">
      {#if canShareFile}
        <Button color="primary" size="lg" onclick={shareCard} icon={Share}>
          {$t('etnos.kartu.share')}
        </Button>
      {/if}
      <Button
        size="lg"
        href={imgUrl ?? undefined}
        download="kartu-etnos.png"
        disabled={!imgUrl}
        icon={ArrowDownTray}
      >
        {$t('etnos.kartu.download')}
      </Button>
      <Button
        size="lg"
        href={waHref}
        target="_blank"
        rel="noopener"
        icon={ChatBubbleOvalLeft}
      >
        {$t('etnos.kartu.wa')}
      </Button>
    </div>
  </div>
</Modal>
