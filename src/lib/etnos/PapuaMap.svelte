<script lang="ts">
  // Inline SVG Papua province picker. Stylized, NOT geographically accurate —
  // a polygonal abstraction of the 6 current Papuan provinces (post-2022 split).
  // Reserved for upgrade to svelte-maplibre-gl + Protomaps tiles (see ETNOS_ROADMAP.md).
  // CSP-safe: no workers, no WebGL, no external assets.

  interface Province {
    code: string
    name: string
    capital: string
    href?: string
  }

  interface Props {
    instances?: Record<string, string> // optional code → URL map for federated instance links
    selected?: string
    onselect?: (code: string) => void
  }

  let { instances = {}, selected, onselect }: Props = $props()

  // Path data hand-drawn in a 400×280 viewBox, arranged in approximate
  // geographic position: west on the left, south at the bottom.
  const provinces: (Province & { d: string; cx: number; cy: number })[] = [
    {
      code: 'pbd',
      name: 'Papua Barat Daya',
      capital: 'Sorong',
      d: 'M30,80 L80,70 L110,90 L100,130 L60,140 L30,120 Z',
      cx: 65,
      cy: 105,
    },
    {
      code: 'pb',
      name: 'Papua Barat',
      capital: 'Manokwari',
      d: 'M110,90 L160,75 L190,100 L185,135 L130,150 L100,130 Z',
      cx: 145,
      cy: 115,
    },
    {
      code: 'pt',
      name: 'Papua Tengah',
      capital: 'Nabire',
      d: 'M185,135 L240,125 L260,155 L235,180 L180,180 L130,150 Z',
      cx: 200,
      cy: 158,
    },
    {
      code: 'pp',
      name: 'Papua Pegunungan',
      capital: 'Jayawijaya',
      d: 'M235,180 L295,170 L320,200 L290,225 L235,225 L180,200 Z',
      cx: 265,
      cy: 200,
    },
    {
      code: 'p',
      name: 'Papua',
      capital: 'Jayapura',
      d: 'M260,80 L340,75 L370,110 L355,150 L295,170 L240,125 Z',
      cx: 310,
      cy: 115,
    },
    {
      code: 'ps',
      name: 'Papua Selatan',
      capital: 'Merauke',
      d: 'M180,200 L235,225 L290,225 L300,255 L240,265 L170,255 Z',
      cx: 240,
      cy: 235,
    },
  ]

  function classFor(code: string): string {
    const base =
      'transition-colors cursor-pointer stroke-2 stroke-slate-300 dark:stroke-zinc-700'
    if (instances[code]) {
      // Has a federated instance — show in primary.
      return `${base} fill-primary-200 dark:fill-primary-900 hover:fill-primary-400 dark:hover:fill-primary-700`
    }
    return `${base} fill-slate-100 dark:fill-zinc-800 hover:fill-primary-200 dark:hover:fill-primary-900/40`
  }

  function handle(code: string) {
    onselect?.(code)
    const url = instances[code]
    if (url) {
      window.location.href = url
    }
  }
</script>

<div class="w-full">
  <svg
    viewBox="0 0 400 280"
    class="w-full h-auto rounded-2xl"
    role="img"
    aria-label="Peta provinsi-provinsi di Tanah Papua"
  >
    <!-- ocean background -->
    <rect
      x="0"
      y="0"
      width="400"
      height="280"
      class="fill-blue-50/50 dark:fill-blue-950/30"
    />
    {#each provinces as p (p.code)}
      <g
        role="button"
        tabindex="0"
        aria-label={`${p.name}, ibu kota ${p.capital}`}
        aria-pressed={selected === p.code}
        onclick={() => handle(p.code)}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handle(p.code)}
      >
        <path
          d={p.d}
          class={[
            classFor(p.code),
            selected === p.code
              ? 'fill-primary-500 dark:fill-primary-500'
              : '',
          ]}
        />
        <text
          x={p.cx}
          y={p.cy}
          text-anchor="middle"
          font-size="9"
          font-weight="600"
          class="fill-slate-700 dark:fill-zinc-300 pointer-events-none select-none"
        >
          {p.name.split(' ').slice(-1)[0]}
        </text>
      </g>
    {/each}
  </svg>
  <p class="text-xs text-slate-400 dark:text-zinc-500 mt-2 text-center">
    Pilih provinsi untuk membuka instance ETNOS-nya. Provinsi yang sudah punya
    instance ditampilkan dengan warna penuh.
  </p>
</div>
