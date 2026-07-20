# ETNOS (honai-metro) — read this first

You are working on **ETNOS**, a federated civic forum for **Tanah Papua**,
live at **https://etnos.pages.dev**. It is a heavily customized fork of
Photon (a SvelteKit client for PieFed/Lemmy), frontend-only, riding the
public `piefed.social` backend by design. ETNOS is one component of
**Aksara** (Communal AI for Indonesian first-layer public service, PT
Abstraksi Data & Kognitek). The ambition, in the owner's words: the moment
Papua gets its agentic layer. Treat cultural content with care and pride;
cite sources; never invent cultural facts.

## Read next, in order

1. `.claude/DESIGN_OVERHAUL.md` — the **REVAMP WAVE** section (2026-07-11)
   at the bottom is the CURRENT design truth: what shipped, needs-from-Yose
   ledger, notes for the next seat. The MIDAS SWEEP section above it holds
   the card-skin standard (still binding). Earlier sections are history.
2. `docs/CODEBASE_GROUNDTRUTH.md` — architecture ground truth.
3. `docs/etnos/` + `docs/aksara/` — specs and the Aksara framing.
4. If the `~/workspace/abstraksi` repo exists on this machine, read its
   README + SESSION_LOG before any Aksara-flavored work.

## The design language: "Honai Metro"

Modern, clean, humanist-tech; the register of "a more polished Reddit /
the new Digg". **Island-agnostic**: no Papua-specific visual motifs — ETNOS
is a template other islands inherit (island flavor arrives later as
content, e.g. footer paintings). Cream + terracotta palette, rounded-2xl,
Plus Jakarta Sans.

Hard rules, all learned the expensive way:

- **Broadsheet, three layers** (2026-07-12, supersedes MIDAS's
  "cards everywhere"). Layer 0, the paper: content sits directly on the
  page field; sections are `SectionHead` (heading + hairline rule) and
  lists are hairline-separated rows, never boxes. Layer 1, instruments:
  only self-contained live objects get the card skin (Papan Sinyal,
  forms/composers, CapabilityCard profiles); the map is full-bleed dots
  ON the paper. Layer 2, floats: dossier, legend, menus, modals carry
  the only shadows. Flat stats = `Figure` (big number + label, no box).
  `Board` and `StatCard` are retired and deleted.
- **When a card IS warranted** use `Material` (`color="default"
rounding="2xl"`; add `interactive` for links). Raw equivalent:
  `bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200
border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700`.
  No `/80` translucency, no gradients (the old btn-primary radial
  gradient was a violation and is now a solid block).
- **Surfaces never repaint on hover; controls may.** Card/row affordance
  = cursor + title color shift or border deepen. `hover:bg-*` only on
  buttons, selects, pills, chips.
- **Dots, not pills.** Status/semantics = a small colored dot on a neutral
  chip (see `Badge.svelte`), never a tinted pill background. Provenance =
  `DataChip` (`langsung` pulsing terracotta / `contoh` hollow / `segera`
  dashed) — the vocabulary is exactly **langsung** and **contoh**; the
  words "demo" and "Simulasi" are banned from user-visible strings.
- **No em dashes anywhere** in user-visible text (house style). No
  uppercase-tracking micro labels. No emoji in UI strings. Formal-warm
  Indonesian, sentence case.
- **Every page opens with `PageHeader`** (real h1). Sections open with
  `SectionHead` (title + optional chip action + rule + optional caption).
  Flat stats = `Figure`. Icon squares = `IconTile`. Back links =
  `BackLink`. All in `src/lib/etnos/ui/`.
- **Honest labels.** A number is langsung only if fetched live; sample
  data is labeled contoh, always. One fact, one owner: never render the
  same number from two components.
- **`bg-white` is NOT white** — it maps to the theme card color (cream
  `#e3dabf` in Honai Metro) via `--color-white`/`other.white`.
- **`--color-primary-900` intentionally equals 700** (`#8c4529`): Photon
  treats primary-100/900 as a semantic on-dark/on-light accent pair, and
  900 is the AA-safe button color. Do not "fix" the duplicate.
- Theme = runtime presets (`src/lib/app/theme/presets.ts`, injected as
  inline vars on `<html>`) + a static mirror in `src/app.css` `@theme`
  (kills FOUC; SPA, SSR off). **Keep the two in sync.**
- i18n: every `etnos.*` key must exist in **all three** of
  `src/lib/app/i18n/{en,id,pmy}.json` (pmy = Papuan Malay: "deng", "sa",
  "ko", simpler grammar). **pmy is LIVE in the picker as of 2026-07-13**
  (loader in `i18n/index.ts` + entry in `settings/app/+page.svelte`
  uncommented): the `etnos.*` strings are real Melayu Papua; the Photon
  CORE strings still mirror id.json until a full translation pass, so the
  UI reads mostly Indonesian with ETNOS surfaces in pmy.
- **Density**: `html { font-size: 87.5% }` in app.css (owner call: the UI
  should read like ~85% browser zoom). Everything is rem-based; px values
  (hairlines, flap cells) intentionally stay fixed.
- **Hover doctrine: surfaces never repaint.** Cards/rows get no
  `hover:bg-*`; affordance = cursor, Material `interactive` lift, title
  color shift on list rows, or border deepen on card links. Background
  hovers only on small controls (buttons, selects, pills, chips).

## The deck and the detak-detik integration

The **KILAS wire** is GLOBAL chrome, not a page element, and carries
external press ONLY (never forum posts: the wire renders for every
visitor on every page, so only vetted outlet headlines belong in it).
Live items are detak-detik's kliping CLUSTERS (`kilas-data.ts
fetchKilas` reads `kabar.ts loadKliping`, the same /edisi SWR cache as
the map pins); each click opens `detak-detik.pages.dev/#/kliping/{id}`,
the source label reads "MEDIA +n". ETNOS points at press, never rehosts
it; detak is the press, ETNOS is the square. On md+ the wire rides the
Navbar's center slot (`Navbar.svelte`, mask-image fades both edges, no
band, ink on the navbar surface); on mobile it is a sticky paper strip
at the top of `<main>` in `+layout.svelte` (the mobile navbar is a
bottom dock). `KilasTicker.svelte` takes a `class` prop and is flat.
**Buat** is the single filled control in the navbar (solid primary,
`nav-btn-sm-primary` in `NavButton.svelte`, no gradients).

Page jobs (coherence doctrine, 2026-07-12): Beranda answers "apa yang
terjadi hari ini", Jelajah "siapa dan di mana", Wiki "siapa kami"
(reference desk + almanac), Papan Data "bagaimana keadaan kita".

`/` (Beranda) deck order: h1 header → **PapanSinyal** (the map rides
INSIDE it now) → filter row (Lokasi/Urutkan/Tampilan) → hairline divider
→ feed. No guest redirect; no quick-create box (Buat in the navbar is
the one create entry). The **filter row is a single baseline** below the
board: each mono-svelte `Select` gets `baseClass="flex flex-row
items-center gap-2 *:my-0"` so its `<Label>` renders inline-left of the
select instead of stacked above; `Sort.svelte` forwards `baseClass` to
BOTH its selects (the chained Top-range one has no `...rest`).

**PetaKabar** (`src/lib/etnos/PetaKabar.svelte`) lives INSIDE Papan
Sinyal on the homepage (owner call 2026-07-13: the ticker rows were
useless on phones, the map is the useful thing — so it became the
instrument). It takes `variant: 'paper' | 'ink'` and `onstatus` props.
`variant="ink"` (the board mount): no `SectionHead`, no `-mx` bleed,
shorter canvas (`h-56 sm:h-72 lg:h-80`), legend/dossier pulled to
`right-2`/`left-2`, footer padded. `variant="paper"` is the standalone
full-bleed dress (still available, no longer used on any route). The
palette flips correctly inside the board because `atlas.ts plateColors`
now detects dark via `el.closest('.dark')` (was `documentElement`), so
the board's literal `dark` class forces the ink palette AND the canvas
`ink` color agrees. `onstatus` lifts the per-layer status map up so the
board's "Sinyal langsung" chip derives from it (one owner: the map
computes status). It is a canvas dot-grid of Tanah Papua — no MapLibre,
no tiles: floating overlays detak-detik style (collapsible "Lapisan · n"
legend, kabupaten dossier), dashed kabupaten boundary lines over the
dots (`loadBoundaryPaths` in `atlas.ts`, Path2D per kab). **Seven** data
layers through `src/lib/etnos/layers.ts` (SWR localStorage, Papua-bbox
clip, contract: null=segera, []=nihil, points=langsung, **no fake points
ever**): KABAR (detak /edisi pins via `kabar.ts`, deep-links
`detak-detik.pages.dev/#/kliping/{id}`), GEMPA (BMKG+USGS keyless, 120s,
default ON), CUACA (Open-Meteo at the 6 anchors, default ON, daily
sunrise/sunset per anchor, tz Asia/Jayapura, cache key
`etnos.layers.cuaca.v2`), LAUT (now a MAP layer: `fetchLaut`, Open-Meteo
Marine wave heights at 5 nearshore sea points, keyless, default ON,
`LAYER_COLOR.laut = #0e7490`, label below-right so it never collides
with the cuaca temp above-right at the same anchor), BANJIR (PetaBencana
keyless, OFF), TITIK API + UDARA (detak worker `/geo/kebakaran` +
`/geo/udara`, need `PUBLIC_DETAK_URL`, OFF).

**/wiki opens with the Almanak strip** (tanggal WIT + matahari
terbit/terbenam from the shared cuaca cache, Figures, langsung chip) —
Peta Kabar is gone from /wiki (it moved home). Wiki is now purely the
reference desk: Almanak → Wajah → Sejarah/Kata → categories.

**Clicking a kabupaten opens its dossier** (markers win over regions;
Esc/✕ closes; marker cards offer a "Buka kartu wilayah" hop). The kab
card = Kemendagri reference rows (`src/lib/etnos/data/wilayah.json`, 42
kab subset vendored from detak's idn-wilayah.json, nama joins 1:1 with
papua-kab.geojson) + live crosscuts computed from already-fetched layers
(gempa 24j count, anchor cuaca, banjir/api counts, kabar kliping,
directory komunitas by region, wajah entries by koordinat). Region
clicks NEVER filter the feed. **Raster rule:** `atlas.ts rasterize()`
does one coverage pass PER FEATURE reading only alpha (threshold 32); a
single indexed-color pass corrupts coastal cells via premultiply
(Sorong read as "Merauke" before the 2026-07-12 fix). Never revert to
red-channel-index-in-one-pass.

**PapanSinyal** (`src/lib/etnos/PapanSinyal.svelte`) = the front-page
instrument: the Peta Kabar canvas (`variant="ink"`) on top, then a
Solari split-flap strip of the three rows a map cannot carry, each
optional (empty pool = row absent): PERISTIWA (alert row, exists ONLY
while banjir/titik-api report real points), FORUM (top post PER
community, deduped so the rotation walks across communities), KOMUNITAS
(directory rotation). The sky/sea channels (gempa, cuaca, laut) are map
markers now, NOT flap rows. Berita lives in the wire band; KATA is
wiki-only. The FORUM row uses `fetchHotPosts` (`hot.ts`); it was silently
empty on Lemmy backends because `getPosts` hardcoded `page_cursor:'1'`
(a PieFed-ism Lemmy rejects) — fixed 2026-07-13 (dropped the cursor +
reset `inflight` on empty success; `live.ts` had the same bug).
**The plate is self-colored ink in BOTH themes** (a split-flap board is
black in any light): the `<details>` root carries a literal `dark` class

- explicit zinc-900 skin so children render their on-ink colors; do not
  re-theme it per scheme. Each row is `segs` equal overflow-hidden cells
  holding the full string at `left:-j*100%`; `segs` is a `MediaQuery` (6
  on sm+, **1 on phones** so long lines truncate softly instead of slicing,
  `clip` font drops to 13px), swap/done timings derive from `segs` so the
  text swap lands at the fold midpoint; per-CELL rotateX half-fold with
  45ms stagger (never per-character), WIT clock, day-seeded, **open on all
  breakpoints** (the map is the hero; details stays collapsible).

**Kartu WA** (`src/lib/etnos/kartu.ts` + `KartuWA.svelte`): the post
share menu offers "Kartu WA", a 1080×1080 canvas card (cream, terracotta
bar, wrapped title, c/community, url footer) with Bagikan
(navigator.share files) / Unduh / Buka WhatsApp (wa.me text fallback).
Distribution is WhatsApp-first in Papua; the card is the growth
mechanic. The share button always opens the menu now (local posts used
to share directly).

Other maps, one engine: **PetaSimpul** on /explore (anchor node rings +
per-province directory counts; /explore also has LIVE community search
against the server via `client().search`, results labeled langsung
above the curated contoh directory — and curated rows whose slug matches
a live result are DROPPED so nothing double-lists; the category-chip
counts follow the same needle-filtered set, killing the old "Bahasa 6
chip vs 5 header" mismatch). The **Papua-only locator** is now
`LocatorPlate.svelte` (`loadAtlasGrid` + `lonLatToCellF` from `atlas.ts`,
module-cached so N plates share one rasterize; seal ring r=4/8 + center
dot at the koordinat). **WajahTanah** consumes it (was the whole-Indonesia
`atlas-id.ts` grid; that file + `static/data/idn-prov.geojson` are now
unimported, kept tree-shaken for a future Peta Nusantara, same as
maplibre). Wiki's Wajah Tanah Papua = `wiki/wajah.json`, 13 entries each
live-verified against id.wikipedia + Commons licensing (NEVER add entries
without the same verification; unattributable image = gambar null), 12h
deterministic rotation, live extract may only lengthen.

**Wiki article pages** (`src/routes/wiki/[category]/+page.svelte`) are
broadsheet features (2026-07-13): the markdown body is split by `## `
into a standfirst (intro's first paragraph, large) + numbered sections
(terracotta `01` numeral + h2 + hairline rule, NO Material card, content
straight on paper). `wajah.json` entries with `kategori === slug` and an
image attach as figures to the section whose heading or body contains the
entry `nama` (candidate tiers: full nama → strip `Suku|Kepulauan` prefix
→ first word ≥6 letters); single figures sit in an lg right column, and
tempat entries also render a `LocatorPlate`; unmatched entries go to a
"Wajah terkait" end strip. TOC = sticky desktop rail (terracotta active
tick, IntersectionObserver in an `$effect` keyed on the parsed sections)

- de-carded mobile `<details>`. End matter: terkait strip → BahasaHub
  (now hairline ledger rows, was a card grid) → prev/next category pager.
  Never invent images: kuliner/bahasa have no verified Commons entries and
  stay purely typographic.

## Deploy ritual (non-negotiable)

Push to main → GitHub Actions → Cloudflare Pages. Then:
`gh run watch --exit-status <run-id>` to conclusion, and verify the change
landed by grepping the deployed `/_app/immutable/...` assets with a
cache-buster. Never claim "deployed" before the run is green. Terse
one-line commit messages. (On the original dev phone builds were CI-only;
on a laptop `bun install && bun run build` is fine — repo is
**bun-canonical**, `bun.lock` tracked, CI uses `--frozen-lockfile`.)

Local dev: `bun install`, copy `.env.example` → `.env`, `bun run dev`.

## Social meta / link previews

SSR is off (`PUBLIC_SSR_ENABLED` unset → `+layout.ts` sets `ssr=false`),
so `<svelte:head>` tags are client-injected and INVISIBLE to non-JS
scrapers (WhatsApp, most crawlers). The **static shell** `src/app.html`
therefore carries the baseline OG/Twitter tags (title, description,
og:image → `static/og.png`, a 1200×630 cream/terracotta card, theme-color
per scheme). Per-page `<svelte:head>` tags (e.g. the post page's
og:title/og:image) still layer on top for JS-capable clients. If you
change the card, regenerate `static/og.png` (the scratchpad
`og-card.js` renders it on a canvas inside the live site so Plus Jakarta
Sans is loaded).

## Known sharp edges

- PieFed adapter (`src/lib/api/piefed/adapter.ts`): ~40 methods are
  `'unsupported'` and THROW. In-app **signup is broken** on piefed.social
  (register there, log in via ETNOS); /modlog and /moderation error;
  `local_site` is an empty stub. `capabilities.ts` gates some of this.
- The onboarding modal (fixed 2026-07-10, commit 85c170ca): all modal
  dismissal must go through `Modal.close()` — it pops the pushState
  history entry. Don't add close paths that only clear the store.
- `maplibre-gl` + `svelte-maplibre-gl` are still in package.json but
  imported nowhere (tree-shaken; zero bundle cost). KEEP them: Peta
  Kabar v2 (MapLibre basemaps, pan/zoom) is planned, see
  `docs/etnos/10_federation-wave-plan.md`.
- `implementation_plan.md` + `walkthrough-1.md` at repo root: provenance
  unclear, owner hasn't decided keep-or-delete. Ask before touching.

## Needs-from-Yose (as of 2026-07-11)

1. Set repo Variable **`PUBLIC_DETAK_URL`** in honai-metro = the
   detak-detik worker origin (value lives in detak-detik's repo Variable
   `AKSARA_URL`, not in its code). Flips KILAS + kabar pins + titik api +
   udara to langsung; gempa/cuaca/banjir are langsung WITHOUT it.
2. Musrenbang community: designate a slug, set `MUSRENBANG_COMMUNITY` in
   `src/lib/etnos/musrenbang.ts` (null = honest empty state).
3. Screenshot review of /, /explore, /wiki, /dashboard, /musrenbang,
   /org, /agen, /tentang (light + dark, 360px) + onboarding tap-through
   (clear localStorage `etnos_onboarded_v1` or incognito).
4. Approve wajah.json entries (13, all verified) + the 8 contoh orgs.
5. Keep-or-delete call on repo-root implementation_plan.md /
   walkthrough-1.md.

## Next wave (planned, not built)

`docs/etnos/11_agentic-infrastructure-plan.md` (DRAF, 2026-07-21) is
the current implementation plan for the owned PieFed deployment,
`aksara` command, `aksara-agent`, `aksara-mem`, A2A task plane, OASF
capability manifests, grants, receipts, and long-horizon agent network.
The map and place work remains in the historical
`docs/etnos/10_federation-wave-plan.md`. Never run experimental agent
actors on piefed.social.

## Banked (will come back)

Honai Malam dedicated dark-theme pass (current dark kept deliberately) ·
per-category wiki hue experiment · island paintings footer ·
maplibre dependency removal · PapanKilas curated-spotlight row.
