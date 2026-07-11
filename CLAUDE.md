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

1. `.claude/DESIGN_OVERHAUL.md` — the **MIDAS SWEEP** section (2026-07-10)
   at the bottom is the CURRENT design truth: what shipped, the card-skin
   standard, needs-from-Yose ledger, banked items. Earlier sections are
   history (superseded but kept for context).
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
  "ko", simpler grammar). Parity was 94/94/94 as of 2026-07-10.

## The deck and the detak-detik integration

`/` (Beranda) is the flagship for guests and members alike: KILAS ticker →
sort header → deck (**PetaKabar** map + **PapanKilas** split-flap; tabbed
on mobile) → feed. No guest redirect.

**PetaKabar** (`src/lib/etnos/PetaKabar.svelte`) is a canvas dot-grid
plate of Tanah Papua — no MapLibre, no tiles, no network beyond
`static/data/papua-kab.geojson` (42 kabupaten, centroids precomputed).
The engine (`src/lib/etnos/atlas.ts`) is a port of detak-detik's
`atlas-dots.ts`: polygons rasterized once to a byte grid offscreen.

The news layer (`src/lib/etnos/kabar.ts`): fetches
`{PUBLIC_DETAK_URL}/edisi` (detak-detik's Cloudflare Worker, CORS `*`,
refreshed 04:32/16:32 WIB), gazetteer-matches cluster headlines against
kabupaten names from the same GeoJSON (aliases like wamena→Jayawijaya;
bare "puncak" blocklisted as ambiguous), and deep-links to
`https://detak-detik.pages.dev/#/kliping/{id}`. Clusters carry **no geo
field** upstream; the match is honest best-effort over headline text.
Without `PUBLIC_DETAK_URL`, the map falls back to six anchor cities and
the ticker to a baked sample — both labeled contoh, no fake data ever.

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

## Needs-from-Yose (as of 2026-07-10)

1. Set repo Variable **`PUBLIC_DETAK_URL`** in honai-metro = the
   detak-detik worker origin (value lives in detak-detik's repo Variable
   `AKSARA_URL`, not in its code). Next deploy flips Peta Kabar + KILAS
   from contoh to langsung.
2. Phone screenshots of /, /wiki, /wiki/sejarah, /dashboard, /agen at
   360px (light + dark) + first-visit onboarding tap-through (clear
   localStorage `etnos_onboarded_v1` or use incognito).
3. Keep-or-delete call on repo-root implementation_plan.md /
   walkthrough-1.md.

## Banked (will come back)

Honai Malam dedicated dark-theme pass (current dark kept deliberately) ·
per-category wiki hue experiment · island paintings footer ·
maplibre dependency removal · PapanKilas curated-spotlight row.
