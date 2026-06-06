# Map Library Choice for ETNOS (Papua Tengah, SvelteKit + Svelte 5)

## TL;DR

Use **MapLibre GL JS** rendered through the **MIERUNE `svelte-maplibre-gl`** wrapper (built ground-up for Svelte 5 runes), styled with the **Protomaps basemap themes** ("dark" + "light") loaded from a self-hosted **PMTiles** archive of the Indonesia/Papua region. This combo is open-source, has zero tile fees, ships modern WebGL vector rendering with full custom styling for a Papua-flavored palette, supports keyboard handlers out of the box, and renders province polygons via cheap `feature-state` hover/click. For provincial polygons, pull from **Alf-Anas/batas-administrasi-indonesia** (38-province dataset including Papua Tengah, kabupaten level too) and simplify with `mapshaper`.

---

## Candidate evaluation

### 1. MapLibre GL JS + `svelte-maplibre-gl` (MIERUNE) — RECOMMENDED
- **Bundle:** MapLibre core ~230 KB gz; the MIERUNE wrapper itself is ~113 KB unminified and tree-shakeable; only what you import lands in the bundle ([npm](https://www.npmjs.com/package/svelte-maplibre-gl)).
- **Svelte 5:** Built from scratch for Svelte 5 runes — not a port. Minimally opinionated declarative API (`<MapLibre>`, `<GeoJSONSource>`, `<FillLayer>`, `<FeatureState>`) ([repo](https://github.com/MIERUNE/svelte-maplibre-gl)).
- **Dark mode:** Use Protomaps theme `dark` or CARTO Dark Matter (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) ([CARTO](https://carto.com/blog/getting-to-know-positron-and-dark-matter)). Style JSON is fully editable for a Papua palette.
- **Styling depth:** Highest of any candidate — full MapLibre style-spec (data-driven expressions, gradients, blur, pitch).
- **Tile cost:** $0 with self-hosted PMTiles.
- **Region highlight:** `FillLayer` + `feature-state` for hover/click; native click handlers per layer ([hover example](https://svelte-maplibre-gl.mierune.dev/examples/hover-styles)).
- **Performance:** WebGL; flat after ~1k features ([benchmark](https://www.mdpi.com/2220-9964/14/9/336)). Smooth global zoom.
- **A11y:** Built-in `KeyboardHandler` (+/-, arrows, shift+arrows) ([docs](https://maplibre.org/maplibre-gl-js/docs/API/classes/KeyboardHandler/)); recent ARIA fixes for popups/controls.

### 2. `dimfeld/svelte-maplibre`
Mature alternative (498 ★). v1.0 rewrote internals for Svelte 5 runes ([releases](https://github.com/dimfeld/svelte-maplibre/releases)). More established, more opinionated API. Solid fallback if MIERUNE feels too new. Same underlying MapLibre, so styling/perf/cost identical.

### 3. Leaflet + `sveaflet` or `radiofrance/svelte-leaflet`
- **Bundle:** Leaflet ~42 KB gz — lightest.
- **Svelte 5:** Sveaflet supports Svelte 5; `svelte-leaflet` v1.0+ also ([repo](https://github.com/GrayFrost/sveaflet)).
- **Dark mode:** Only via raster tile providers (CARTO Dark Matter raster, Stadia) — looks dated next to vector basemaps; no smooth zoom/rotate.
- **Styling depth:** Limited — raster + SVG overlays only.
- **Perf:** Scales poorly past 5–10k polygons ([benchmark](https://www.mdpi.com/2220-9964/14/9/336)).
- **Verdict:** Reject — looks "2014-era" for a flagship public UI element.

### 4. Protomaps PMTiles (companion, not standalone)
- A single-file vector tile archive served from any static host (R2/S3/Cloudflare Pages) via HTTP range requests ([docs](https://docs.protomaps.com/pmtiles/)).
- Full-world: ~120 GB; **Indonesia extract** via the `pmtiles extract` CLI is ~1–3 GB; a Papua-only extract drops to <500 MB.
- Ships official MapLibre themes (`light`, `dark`, `white`, `black`, `grayscale`) via `protomaps-themes-base` ([flavors](https://docs.protomaps.com/basemaps/flavors)).
- **Pair with MapLibre** for zero tile fees and full self-hosting. Recommended companion to choice #1.

### 5. Mapbox GL JS
- Free tier: 50k web map loads/mo, then $5 per 1k ([pricing](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/)). For a public Indonesian site that could pull 100k+ visits/mo, costs scale fast. License is **non-OSS** since Dec 2020.
- Polish and Studio UX are better than MapLibre, but the lock-in + cost kill it for a public open project. **Reject.**

### 6. OpenLayers
- Heavier (~400 KB gz), steepest learning curve, no first-class Svelte 5 wrapper. Excellent for GIS-heavy apps; overkill for ETNOS. Slightly faster than MapLibre at >100k features but slower for typical UI scale ([comparison](https://pretius.com/blog/maplibre-vs-openlayers)). **Reject** for this use case.

### 7. d3-geo + custom SVG
- **Bundle:** d3-geo + d3-zoom + topojson ~30 KB gz — tiny.
- **Pros:** Fully stylable; pairs beautifully with existing Papua SVG; pure CSS theming for dark/light + Papua palette.
- **Cons:** No basemap tiles (no streets/labels when zoomed in); SVG perf degrades past a few thousand path nodes; building smooth pan/zoom + a11y is hand-rolled work.
- **Verdict:** Excellent for a **hero/stylized** map or a static landing splash, but **not** for "zoom out to view the world" interactive exploration. Consider as a complementary component, not the primary `/explore` map.

### 8. Worth considering in 2026
- **deck.gl as overlay** on MapLibre — useful later for heatmaps/3D extrusion of village data; MIERUNE wrapper has a [deck.gl overlay example](https://svelte-maplibre-gl.mierune.dev/examples/deckgl-overlay).
- **MapTiler SDK** — MapLibre fork with paid tiles. Skip; same lock-in concerns as Mapbox.

---

## Ranked recommendation

1. **MapLibre GL JS + `svelte-maplibre-gl` (MIERUNE) + Protomaps PMTiles** — best fit on every axis.
2. `dimfeld/svelte-maplibre` + MapLibre + CARTO Dark Matter — slightly safer (older lib, hosted tiles), but CARTO basemaps are free with attribution only up to fair use.
3. d3-geo SVG — only if "interactive" means "click provinces with no zooming into streets".
4. Leaflet — last resort if WebGL is unavailable.

---

## Implementation paths

### If you have 1 day
- `bun add svelte-maplibre-gl maplibre-gl`
- Use the hosted **CARTO Dark Matter** style URL directly — no PMTiles work yet.
- Drop a single province GeoJSON (Papua Tengah only) into `static/geo/`, render as `<FillLayer>` with a Papua-orange fill (`#E89A3C`, 0.35 alpha) and 2 px white border.
- `center: [135.5, -3.7]` (Nabire-ish), `zoom: 6`, `maxZoom: 12`, `minZoom: 1`.
- Wire `onclick` on the layer to update a Svelte 5 `$state` store driving content filters.
- Done. Beautiful, dark, snappy, free.

### If you have 1 week
- Day 1–2: same as above for a working baseline.
- Day 3: Add the other five Papuan provinces as a secondary highlight layer (lower opacity, thinner border, different hue).
- Day 4: Self-host PMTiles. Run `pmtiles extract https://build.protomaps.com/<latest>.pmtiles --bbox=130,-10,142,2 papua.pmtiles`, upload to Cloudflare R2 (project already uses Cloudflare adapter). Generate custom theme JSON via `protomaps-themes-base` with Papua palette (deep teal water, warm earth roads, gold highlights). Light mode toggle.
- Day 5: Add hover state via `<FeatureState>`, polished tooltip card, smooth `flyTo` on click.
- Day 6: Keyboard a11y pass — ensure `MapLibre`'s `keyboard: true` (default), label the canvas with `aria-label="Interactive map of Papua Tengah"`, and provide a parallel `<ul>` of provinces for screen readers + non-WebGL fallback.
- Day 7: kabupaten-level GeoJSON for Papua Tengah (8 regencies including Nabire, Paniai, Mimika, Puncak, etc.) with drill-down behavior on max zoom.

---

## GeoJSON sources for Papua Tengah

Indonesia split Papua into 6 provinces in 2022 (Papua, Papua Tengah, Papua Selatan, Papua Pegunungan, Papua Barat, Papua Barat Daya). **Many older datasets still show 34 provinces — avoid them.**

**Primary recommendation — [Alf-Anas/batas-administrasi-indonesia](https://github.com/Alf-Anas/batas-administrasi-indonesia)**: 38 provinces + 514 regencies/cities + districts + villages, in SHP/KML/GeoJSON/GPKG, sourced from BPS. Confirmed includes "Papua Tengah Kabupaten Nabire". Web portal: <https://batas-admin.geoit.dev/>.

**Backups:**
- **[HDX / geoBoundaries IDN](https://data.humdata.org/dataset/cod-ab-idn)** — humanitarian-grade ADM1/ADM2, last reviewed Oct 2024.
- **[BIG Ina-Geoportal](https://tanahair.indonesia.go.id/portal-web/)** — official government source (slower UX, authoritative).
- **OSM extract via [Geofabrik Indonesia](https://download.geofabrik.de/asia/indonesia.html)** + `osmium extract` for kabupaten polygons by `admin_level=6`.

**Processing tip:** Run through [mapshaper.org](https://mapshaper.org) — simplify to ~5% (Visvalingam, weighted) to drop province GeoJSON from megabytes to tens of KB without visible loss at the zoom levels used. Store under `static/geo/papua-tengah.geo.json` and load as a `<GeoJSONSource>`.

---

## Sources
- [svelte-maplibre-gl repo](https://github.com/MIERUNE/svelte-maplibre-gl) · [docs](https://svelte-maplibre-gl.mierune.dev/) · [npm](https://www.npmjs.com/package/svelte-maplibre-gl)
- [dimfeld/svelte-maplibre](https://github.com/dimfeld/svelte-maplibre) · [releases](https://github.com/dimfeld/svelte-maplibre/releases)
- [MapLibre GL JS docs](https://maplibre.org/maplibre-gl-js/docs/) · [KeyboardHandler](https://maplibre.org/maplibre-gl-js/docs/API/classes/KeyboardHandler/) · [Mapbox migration](https://maplibre.org/maplibre-gl-js/docs/guides/mapbox-migration-guide/)
- [Protomaps PMTiles](https://docs.protomaps.com/pmtiles/) · [Basemap flavors](https://docs.protomaps.com/basemaps/flavors) · [protomaps-themes-base](https://www.npmjs.com/package/protomaps-themes-base) · [build channel](https://build.protomaps.com)
- [CARTO Positron / Dark Matter](https://carto.com/blog/getting-to-know-positron-and-dark-matter)
- [Mapbox GL JS pricing](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/)
- [OpenLayers vs MapLibre](https://pretius.com/blog/maplibre-vs-openlayers) · [Vector render benchmark (MDPI 2025)](https://www.mdpi.com/2220-9964/14/9/336)
- [sveaflet (Svelte 5 Leaflet)](https://github.com/GrayFrost/sveaflet) · [radiofrance/svelte-leaflet](https://github.com/radiofrance/svelte-leaflet)
- [d3-geo-zoom](https://github.com/vasturiano/d3-geo-zoom) · [Zoomable Choropleth (Observable)](https://observablehq.com/@bjnsn/zoomable-choropleth)
- [Alf-Anas Indonesia boundaries (38 provinces)](https://github.com/Alf-Anas/batas-administrasi-indonesia) · [HDX Indonesia ADM](https://data.humdata.org/dataset/cod-ab-idn) · [Ina-Geoportal](https://tanahair.indonesia.go.id/portal-web/) · [Geofabrik Indonesia](https://download.geofabrik.de/asia/indonesia.html)
