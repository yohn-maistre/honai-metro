<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { ChevronLeft, ChevronRight, X } from '@lucide/svelte'
  import type { MediaAttachment } from './api'
  let { images }: { images: MediaAttachment[] } = $props()
  let selected = $state(0),
    open = $state(false),
    showAlt = $state(false)
  function move(step: number) {
    selected = (selected + step + images.length) % images.length
    showAlt = false
  }
</script>

<div class="post-gallery" data-count={images.length}>
  {#each images as image, i (image.id)}
    <button
      class="post-image"
      type="button"
      aria-label={'Buka gambar ' +
        (i + 1) +
        (image.alt ? ': ' + image.alt : '')}
      onclick={() => {
        selected = i
        open = true
        showAlt = false
      }}
    >
      <img
        src={image.url}
        alt={image.alt || 'Gambar pada posting'}
        width={image.width}
        height={image.height}
        loading="lazy"
        decoding="async"
      />
      {#if image.alt}<span class="image-alt-label">ALT</span>{/if}
    </button>
  {/each}
</div>
<Dialog.Root bind:open>
  <Dialog.Content
    class="media-viewer"
    showCloseButton={false}
    onkeydown={(e) => {
      if (e.key === 'ArrowLeft') move(-1)
      if (e.key === 'ArrowRight') move(1)
    }}
  >
    <Dialog.Title class="sr-only">
      Gambar {selected + 1} dari {images.length}
    </Dialog.Title>
    <Dialog.Description class="sr-only">
      Gunakan panah untuk melihat gambar lain
    </Dialog.Description>
    <div class="viewer-bar">
      <span>{selected + 1} / {images.length}</span>
      <Dialog.Close aria-label="Tutup gambar" class="viewer-close">
        <X size={20} />
      </Dialog.Close>
    </div>
    <img
      src={images[selected].url}
      alt={images[selected].alt}
      width={images[selected].width}
      height={images[selected].height}
    />
    <div class="viewer-controls">
      {#if images.length > 1}<Button
          variant="ghost"
          size="icon"
          aria-label="Gambar sebelumnya"
          onclick={() => move(-1)}
        >
          <ChevronLeft size={20} />
        </Button>{/if}
      {#if images[selected].alt}<Button
          variant="ghost"
          aria-pressed={showAlt}
          onclick={() => (showAlt = !showAlt)}
        >
          Teks alternatif
        </Button>{/if}
      {#if images.length > 1}<Button
          variant="ghost"
          size="icon"
          aria-label="Gambar berikutnya"
          onclick={() => move(1)}
        >
          <ChevronRight size={20} />
        </Button>{/if}
    </div>
    {#if showAlt}<p class="viewer-alt">{images[selected].alt}</p>{/if}
  </Dialog.Content>
</Dialog.Root>
