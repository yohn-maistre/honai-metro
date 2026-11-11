<script lang="ts">
  import type { WelcomeArtwork } from './site-branding'
  let { artwork, decorative = false, onerror }: {
    artwork: WelcomeArtwork
    decorative?: boolean
    onerror?: () => void
  } = $props()
  let failed = $state(false)
  const uid = $props.id()
  const filterId = 'landscape-ink-' + uid
</script>
<!-- Extract ink density, then print it with the current accent on the current
     paper. Original generated assets stay unchanged; no per-palette downloads. -->
<svg class="landscape-filter" aria-hidden="true" focusable="false" width="0" height="0">
  <defs><filter id={filterId} x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="density"/>
    <feComponentTransfer in="density" result="ink-mask"><feFuncA type="linear" slope="-1.5" intercept="1.4"/></feComponentTransfer>
    <feFlood style="flood-color:var(--brand)" result="ink"/>
    <feComposite in="ink" in2="ink-mask" operator="in" result="print"/>
    <feFlood style="flood-color:#f4f0e5" result="paper"/>
    <feMerge><feMergeNode in="paper"/><feMergeNode in="print"/></feMerge>
  </filter></defs>
</svg>
{#if !failed}<img class="landscape-print" src={artwork.src} width={artwork.width} height={artwork.height} alt={decorative ? '' : artwork.description} style={'filter:url(#' + filterId + ')'} decoding="async" onerror={() => { failed = true; onerror?.() }}/>{/if}
