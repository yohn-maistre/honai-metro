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

- **One card skin.** Use `Material` (`color="default" rounding="2xl"`,
  padding md=tile / lg=card / xl=feature; add `interactive` for links).
  Raw equivalent: `bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border
  border-slate-200 border-b-slate-300 dark:border-zinc-800
  dark:border-t-zinc-700`. No `/80` translucency, no gradients.
- **Dots, not pills.** Status/semantics = a small colored dot on a neutral
  chip (see `Badge.svelte`), never a tinted pill background. Provenance =
  `DataChip` (`langsung` pulsing terracotta / `contoh` hollow / `segera`
  dashed) — the vocabulary is exactly **langsung** and **contoh**; the
  words "demo" and "Simulasi" are banned from user-visible strings.
- **No em dashes anywhere** in user-visible text (house style). No
  uppercase-tracking micro labels. No emoji in UI strings. Formal-warm
  Indonesian, sentence case.
- **Every page opens with `PageHeader`** (real h1). `EndPlaceholder` is a
  section divider only. Icon squares = `IconTile`. Back links = `BackLink`.
  Titled flush-body cards = `Board`. All in `src/lib/etnos/ui/`.
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
  "ko", simpler grammar). Parity was 141/141/141 as of 2026-07-12.
- **Density**: `html { font-size: 87.5% }` in app.css (owner call: the UI
  should read like ~85% browser zoom). Everything is rem-based; px values
  (hairlines, flap cells) intentionally stay fixed.
- **Hover doctrine: surfaces never repaint.** Cards/rows get no
  `hover:bg-*`; affordance = cursor, Material `interactive` lift, title
  color shift on list rows, or border deepen on card links. Background
  hovers only on small controls (buttons, selects, pills, chips).

## The deck and the detak-detik integration

The **KILAS wire band** is GLOBAL, not a page element: rendered in
`+layout.svelte` twice, a `band` variant under the Navbar (md+, sticky
via the shell-navbar-holder) and a mobile-only sticky strip at the top of
`<main>` (the mobile navbar is a bottom dock, so the band can't live
there). `KilasTicker.svelte` takes `band` + `class` props.

`/` (Beranda) deck order: h1 header → filter row (Lokasi/Urutkan/
Tampilan, right-aligned) → **PetaKabar** full-width live-map hero →
**PapanSinyal** Solari board → feed. No guest redirect.

**PetaKabar** (`src/lib/etnos/PetaKabar.svelte`) is a canvas dot-grid
plate of Tanah Papua — no MapLibre, no tiles. Full-width canvas with
floating overlays, detak-detik style: layer legend top-right
(collapsible "Lapisan · n" pill), dossier card top-left, and a footer
row with the identity line + "Sumber aktif" credits (only langsung
sources listed). Dashed kabupaten boundary lines ride over the dots
(`loadBoundaryPaths` in `atlas.ts`, Path2D per kab). Six data layers
through `src/lib/etnos/layers.ts` (SWR localStorage, Papua-bbox clip,
contract: null=segera, []=nihil, points=langsung, **no fake points
ever**): KABAR (detak /edisi pins via `kabar.ts`, deep-links
`detak-detik.pages.dev/#/kliping/{id}`), GEMPA (BMKG+USGS keyless, 120s,
default ON), CUACA (Open-Meteo at the 6 anchors, default ON), BANJIR
(PetaBencana keyless, OFF), TITIK API + UDARA (detak worker
`/geo/kebakaran` + `/geo/udara`, need `PUBLIC_DETAK_URL`, OFF).

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

**PapanSinyal** (`src/lib/etnos/PapanSinyal.svelte`) = 4-row Solari
split-flap of live channels (Gempa/Cuaca/Forum/Komunitas; berita retired
to the wire band; KATA retired earlier, kata-hari-ini.json is
wiki-only). Gempa + cuaca rows reuse the layers.ts SWR caches (one fact
one owner); an answering-but-empty gempa feed shows an honest nihil
line, an unreachable feed drops its row. Each row is 6 equal
overflow-hidden cells holding the full string at `left:-j*100%`, per-CELL
rotateX half-fold with 45ms stagger (never per-character), WIT clock,
day-seeded.

Other maps, one engine three dresses: **PetaSimpul** on /explore (anchor
node rings + per-province directory counts), mini locator plates in
**WajahTanah** (wiki). Wiki's Wajah Tanah Papua = `wiki/wajah.json`, 13
entries each live-verified against id.wikipedia + Commons licensing
(NEVER add entries without the same verification; unattributable image =
gambar null), 12h deterministic rotation, live extract may only lengthen.

## Deploy ritual (non-negotiable)

Push to main → GitHub Actions → Cloudflare Pages. Then:
`gh run watch --exit-status <run-id>` to conclusion, and verify the change
landed by grepping the deployed `/_app/immutable/...` assets with a
cache-buster. Never claim "deployed" before the run is green. Terse
one-line commit messages. (On the original dev phone builds were CI-only;
on a laptop `bun install && bun run build` is fine — repo is
**bun-canonical**, `bun.lock` tracked, CI uses `--frozen-lockfile`.)

Local dev: `bun install`, copy `.env.example` → `.env`, `bun run dev`.

## Known sharp edges

- PieFed adapter (`src/lib/api/piefed/adapter.ts`): ~40 methods are
  `'unsupported'` and THROW. In-app **signup is broken** on piefed.social
  (register there, log in via ETNOS); /modlog and /moderation error;
  `local_site` is an empty stub. `capabilities.ts` gates some of this.
- The onboarding modal (fixed 2026-07-10, commit 85c170ca): all modal
  dismissal must go through `Modal.close()` — it pops the pushState
  history entry. Don't add close paths that only clear the store.
- `maplibre-gl` + `svelte-maplibre-gl` are still in package.json but
  imported nowhere (tree-shaken; zero bundle cost). Removing them needs a
  lockfile regen (`bun install`) — safe on a laptop, was skipped on the
  phone. First good cleanup task for the new machine.
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

## Banked (will come back)

Honai Malam dedicated dark-theme pass (current dark kept deliberately) ·
per-category wiki hue experiment · island paintings footer ·
maplibre dependency removal · PapanKilas curated-spotlight row.
