<script lang="ts">
  import type { NewsPlace } from './news.svelte'
  import land from './news-land.json'
  const uid = $props.id()
  let { places }: { places: NewsPlace[] } = $props()
  const points = $derived(
    places.filter(
      (p) =>
        p.latitude !== null &&
        p.longitude !== null &&
        p.longitude >= 124 &&
        p.longitude <= 154 &&
        p.latitude >= -12 &&
        p.latitude <= 2,
    ),
  )
</script>

{#if points.length}<div class="news-map">
    <svg
      viewBox="124 -2 30 14"
      role="img"
      aria-label="Peta wilayah yang disebut dalam liputan, bukan lokasi tepat peristiwa"
    >
      <defs>
        <pattern
          id={uid + '-grid'}
          width="2"
          height="2"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 2 0 L 0 0 0 2"
            fill="none"
            stroke="currentColor"
            stroke-width="0.02"
          />
        </pattern>
      </defs>
      <rect
        x="124"
        y="-2"
        width="30"
        height="14"
        fill={'url(#' + uid + '-grid)'}
        opacity=".2"
      />
      <g class="map-land">
        {#each land as path}<path d={path} />{/each}
      </g>
      {#each points as point}<circle
          cx={point.longitude!}
          cy={-point.latitude!}
          r=".2"
        >
          <title>{point.name}</title>
        </circle>{/each}
    </svg>
    <small>Wilayah dalam liputan · Natural Earth</small>
    <div class="map-place-list">
      {#each points as point}<span>{point.name}</span>{/each}
    </div>
  </div>{/if}
