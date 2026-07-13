# ETNOS beta design overhaul — FINAL PLAN

## Context

ETNOS is live at etnos.pages.dev (alpha, borrowed piefed.social backend by design). Everything except /agen is carried-over Photon chrome. This is the last stretch before PUBLIC BETA. Yose's brief (2026-07-06, 11 screenshots reviewed): award-aiming design with our own language (sibling to detak-detik + the Aksara device), IA consolidation, label rewrite, light theme recolored to detak-detik's cream scheme, wiki components, live dashboard data, island-not-province framing, news surfaces, Level-0 org pages + usulan composer, cleanup for beta. A fresh executor agent picks this up: **step one is copying this plan into the repo** (see Phase P-1). Build ritual on this phone: `NODE_OPTIONS=--max-old-space-size=1536 bun run build` (~3 min), never stack heavy work, commit per phase.

## Design language: "Honai Siang / Honai Malam"

One family, three products (newspaper detak-detik / device aksara-papan / forum ETNOS). Tokens from detak-detik `src/styles/tokens.css`, voice differences deliberate:

- **Light (Honai Siang) = DINAS cream**: bg `#d6cbac`, card `#e3dabf`, ink `#15130e`, muted `#5a5345`, soft line `#aaa085`, hard lines = ink. **Accent = terracotta `#C0633E`** (device language; NOT detak's service orange — forum is the hearth, not the presses). Radius 4px.
- **Dark (Honai Malam) = MESIN**: bg `#100f0d`, card `#1a1815`, ink `#f2efe6`, muted `#8f897c`, gold `#cdb47a` as accent2; terracotta stays on agent/civic chrome.
- **Grammar layer** (port from detak base.css): paper grain (feTurbulence data-URI, 0.05), `.eyebrow` (mono 10.5px uppercase 0.18em), `.inkbar` (reversed kicker + terracotta dot), `.rule`/`.rule2` (self-drawing), receipt `.chip` (⊙ tick, ink-sweep hover), `.stamp` (rotated, back.out thump), `.ledger` (mono tabular rows), inline honest labels "(data contoh)". NO registration marks (too literary for a forum).
- **Type**: Archivo Variable 800 display (-0.02em, lh 1.02) + Geist Mono for ALL micro-labels/meta/numbers (tabular) + Instrument Serif italic only in wiki captions. Body stays system sans. Self-host woff2 latin subsets in `static/font/` (repo convention), budget ≤ ~180KB added.
- **Motion**: CSS transforms+opacity only, 0.32s `cubic-bezier(0.7,0,0.3,1)`; rules draw, chips sweep, stamps thump, dashboard numbers count up; detak's global `prefers-reduced-motion` collapse block copied verbatim (repo has only ONE reduced-motion rule today). NO GSAP/Lenis.
- **Icons**: svelte-hero-icons stays (already consistent). Emoji only as content; wiki emoji chips become mono-label chips. Stempel suasana glyphs (○◔◑●) as decorative status marks on agent cards/dashboard corners (visual only this wave).
- **Seeded variety**: port detak `seed.ts` (cyrb128+splitmix32) + day-clock pattern — same rotation for every reader.

## IA target

- **Sidebar ETNOS group (5, Indonesian-first, all i18n)**: Jelajah(/explore), Wiki(/wiki), Papan Data(/dashboard), Agen(/agen), Tentang(/tentang). Removed: Ruang Bahasa (merges into wiki), "AI · Updates" (just a community; lives in explore cluster).
- **Hamburger (Profile.svelte L71-93)**: mirror sidebar exactly. Fix drift: /jelajah→/explore, delete standalone "Registry MCP" (/registry already 308s to /agen#registry), Agen entry → /agen (not /c/ai-updates).
- **Top bar**: label via `routes.explore.title` added to id.json+pmy.json ("Jelajah").
- **Guest home = curated Jelajah hub** (Yose decision): `/` load redirects logged-out users → /explore; logged-in keep feed.
- **/bahasa → /wiki/bahasa**: content moves into a real wiki language hub (BahasaHub component: status cards Vital/Terancam, penutur/wilayah/rumpun, each language → its c/ community + article); /bahasa becomes 308 (pattern: src/routes/jelajah/+page.ts). Explore's Bahasa cluster keeps COMMUNITY links only (one fact one owner).
- **Map**: replace MapLibre tile map on /explore with **PapuaPlate.svelte** — seeded dot-grid island plate (port detak atlas-dots.ts + engrave.ts + seed.ts approach; Papua GeoJSON: copy/simplify from detak-detik's assets, fallback = engraved-hatch outline), city anchor dots, theme-aware, zero tile/CDN dep. Island framing copy ("Tanah Papua", "simpul komunitas" — no province-picker language). MapLibre dep likely droppable from explore bundle.
- **News trio (Yose decision, present variants at review)**: (1) **KILAS marquee** = NEWS from detak-detik's edisi JSON (LiveKliping shape; endpoint not provisioned yet → baked sample labeled "(contoh)" + SWR live-flip when `PUBLIC_DETAK_URL` lands); (2) **Papan Kilas SPLIT-FLAP board** = hero showpiece on /explore: Solari-style rows flipping between headline/trending post/community spotlight/kata hari ini — per-ROW half-fold CSS 3D flip (never per-character; budget phones), day-clock seeded; (3) **Sorotan scoreboard** = trending posts as ledger rows w/ ghost numerals in the feed area (live getPosts). News and posts never share a surface; every item carries a source chip.
- **Cleanup**: hide dead PieFed surfaces (signup→note+link to piefed.social; modlog/reports/password nav gated by instance-type capability), /util unguarded links removed, honest-label audit.

## Ground-truth corrections (from stress-test — executor MUST know)

1. `/explore/+layout.ts` L12-15 already defaults Local when instance-locked; prod lemmy.world leak likely dev-only (no .env → lemdro.id). Real prod gap: `PUBLIC_DEFAULT_FEED` missing from workflow env (settings.svelte.ts L122 defaults 'All'). Note: localStorage settings (ver 8) override for existing users — acceptable.
2. **~50 currently-dead `primary-*` utility classes go live** when the full ramp lands (Tailwind 4 only generates stops declared in app.css `@theme`; runtime injects only 100/900 today). Pre-grep: `grep -rEn 'primary-(50|300|400|500|600|700|950)' src` and eyeball each hit post-swap. Biggest surprise-change risk.
3. **Chart bug (latent)**: LineChart.svelte L20 + BarChart.svelte L51 use `rgb(var(--color-primary-500))` — var doesn't exist yet and calculateVars() emits already-rgb()-wrapped values → would become invalid `rgb(rgb(...))`. Fix to bare `var(...)` in the same commit as the ramp.
4. **`other.white` IS the card color** (app.css L30) — set to `#e3dabf` for cream cards; audit all 12 `text-white` files (PapuaMap pills, buttons on terracotta).
5. **Every slate stop is used** (200×103 borders, 600×80 muted text, etc.) and zinc has nonstandard 925 (×22, and app.css L20 is missing its rgb() wrapper — fix). Regenerated ramps must fill ALL stops, monotonic lightness, contrast: 600-on-50 and 900-on-50 ≥ 4.5:1.
6. **FOUC**: theme vars are client-side inline styles post-hydration (SPA, SSR off). Mirror the full new ramps statically in app.css `@theme` — kills FOUC and is the dist-grep proof.
7. No prerendered routes exist; keep it that way for new routes.
8. `listCommunities` response has NO total count and adapter drops `next_page` → count by paging limit:50 while full, cap 4 pages, render "200+".
9. i18n fallback safe (en); new keys go to en+id+pmy all three.
10. Old palette preserved verbatim as preset `{id:-12, name:'Honai Metro (Lama)'}` for rollback.

## Phases (each = one build-verified commit; deploy-watch P0/P1/P4 minimum)

**P-1. Plan docs into repos (S)** — copy this plan to `honai-metro/.claude/DESIGN_OVERHAUL.md`; write the design-language section as `abstraksi/specs/etnos/10_design-language.md` (DRAFT, cite D-numbers + horizon items); commit both repos. Also update abstraksi SESSION_LOG (wave open).

**P0. Credibility hotfixes (S)** — Profile.svelte L71-93 (fix 3 drifts, mirror sidebar, i18n-ify hardcoded labels); Sidebar.svelte L96-124 (5-item target, remove /bahasa + /c/ai-updates, i18n-ify "Wiki"/"Dashboard"); add `routes.explore.title` + `etnos.nav.wiki` + `etnos.nav.dashboard` ("Papan Data") to en/id/pmy, delete `etnos.nav.registry`; workflow env += `PUBLIC_DEFAULT_FEED: Local`; new `.env.example` (piefed.social + piefedalpha + lock + id + Local — fixes dev lemdro.id permanently).
Proof: dist has `Papan Data`; dist lacks `"/jelajah"`, `/c/ai-updates`, `Registry MCP`.

**P1. Theme preset swap ALONE (L risk — bisectable)** — presets.ts: rewrite HONAI_METRO id 0 (cream slate ramp 25-950 per corrections #5, MESIN zinc ramp incl. 925 monotonic, FULL terracotta primary ramp 50-950 with Photon's inverted convention: 900=accent-on-light #C0633E, 100=accent-on-dark gold-leaning), other.white=#e3dabf; add old ramp as id -12 preset; app.css @theme: mirror full ramps statically + fix zinc-925 wrapper + add missing primary stops; fix the two chart var bugs.
Proof: `rgb(214 203 172)` + `192 99 62` in dist CSS; `bg-primary-600` utility exists. Manual: light+dark sweep of home/explore/dashboard/agen//theme, audit 12 text-white files + 5 vendored mono-svelte files with raw hex (FileInput, Select, ModalContainer, Search, ToastContainer). Deploy + verify pre-hydration cream paint.

**P2. Fonts + grammar layer (M)** — static/font/ woff2s (Archivo Variable, Geist Mono, Instrument Serif italic; latin subsets); app.css @font-face (existing L53-75 pattern) + `--font-mono`/`--font-display` + grammar classes (.eyebrow/.inkbar/.rule/.rule2/.chip/.stamp/.ledger/.grain) + motion tokens + verbatim reduced-motion block. Optional Eyebrow/Inkbar primitives in new `src/lib/etnos/ui/`. Don't restyle EndPlaceholder yet.
Proof: `.eyebrow`, `cubic-bezier(0.7`, ≥2 `prefers-reduced-motion` in dist CSS; fonts ≤ ~180KB added.

**P3. Explore hub + PapuaPlate + guest home (M/L)** — new `PapuaPlate.svelte` (canvas dot-grid, seeded; GeoJSON from detak assets or simplified outline; city anchors; theme-aware) replaces PapuaMap on /explore (keep PapuaMap component in tree); island copy reframe (i18n: etnos.map.subtitle "simpul komunitas", hero "Tanah Papua"); cluster headers get inkbar/eyebrow; /explore/communities visible filter chips Local/Semua Federasi; `/` +page.ts: logged-out → redirect /explore.
Proof: dist has `simpul komunitas`, lacks `membuka instance ETNOS`; guest / lands on hub; 360px check.

**P4. Dashboard live + Sumber (M/L)** — new `src/lib/etnos/live.ts` (SWR module, localStorage `etnos.live.v1`): users via getSite (ONLY user_count real — others are -1, never render), local communities via paged listCommunities (cap 4 pages → "200+"), posts-24h via getPosts New/50 client-count ("50+" if saturated); calls from onMount (browser, CORS-open). StatCard gains `live` variant ("LANGSUNG" chip). Dashboard: title → "Papan Data Tanah Papua", island framing, live row on top, DEMO tiles stay chipped, in-page Sumber section (receipt chips, sumber.astro pattern). Count-up animation.
Proof: dist has `LANGSUNG` + `Papan Data Tanah Papua`, lacks `Dashboard Papua`; offline → honest contoh fallback, no unhandled rejections.

**P5. News trio (M)** — new `KilasTicker.svelte` (marquee: terracotta KILAS tab, duplicated track, pause-on-hover, reduced-motion → static list; data = detak LiveKliping-shaped baked sample labeled "(contoh)" + SWR flip to LANGSUNG when `PUBLIC_DETAK_URL` env set); new `PapanKilas.svelte` split-flap (per-ROW half-fold flip, 4 row types: headline/trending post (live getPosts)/community spotlight (directory.json)/kata hari ini (existing json); day-clock seeded) on /explore hero; Sorotan scoreboard (ledger rows + ghost numerals, live getPosts) in feed area. Mount ticker on `/` above Header (outside VirtualFeed measurement).
Proof: dist has `KILAS`; no CLS at 360px; reduced-motion static.

**P6. Wiki overhaul + bahasa merge (M/L)** — new `BahasaHub.svelte` (cards from /bahasa restyled; bahasa.json enriched w/ wiki+community links); wiki/[category] special-cases bahasa (+ new `bahasa.md` intro — no glob collision with suku-bahasa.md); /bahasa route → 308 /wiki/bahasa (jelajah pattern; both files replaced); wiki index restyle (welcome card → grammar, emoji chips → mono chips); WikiCarousel restyle (keep TTS untouched); article typography (serif captions, rules, eyebrows).
Proof: dist has `/wiki/bahasa`; cold deep-link /bahasa lands right; Kuliner article renders new components; TTS speaks.

**P7. Civic surfaces (L)** — extract `CapabilityCard.svelte` from /agen (behavior-identical commit FIRST, restyle separately); new `orgs.json` + `/org/[slug]` (Level-0 pages: CapabilityCard + profil/layanan/jam/WA + "naik kelas" note; unknown slug → error(404)); new `/musrenbang` (usulan composer: jurisdiction/category/narrative/cost-band via vendored forms, 5-stage tracker, PROTOKOL DEMONSTRASI stamp; submit = compose markdown → hand to existing /create/post flow if it accepts params, else render + copy button — NO parallel submit path). Nav: no sidebar slot; link from /tentang + explore civic cluster (Yose can promote later).
Proof: dist has `PROTOKOL DEMONSTRASI`; /org/<slug> renders, /org/nope 404s; /agen pixel-parity after extraction.

**P8. Cleanup + audit + docs (M)** — signup → note+link to piefed.social registration; gate modlog/reports/password nav by instance capability (small `capabilities.ts` helper); /util links removed from any nav; honest-label audit (every demo number chipped, every LANGSUNG backed by real fetch); i18n flatten-diff en/id/pmy for etnos.* → zero missing; update docs/CODEBASE_GROUNDTRUTH.md (COMMIT it — currently untracked), CUSTOMIZATIONS.md, ETNOS_ROADMAP.md; ask Yose about repo-root implementation_plan.md/walkthrough-1.md before deleting (may be his).

## Final verification (after P8)

Build + deploy green (`gh run watch`); re-shoot all 11 screenshot surfaces + /musrenbang + /org; both themes incl. /theme editor + Lama rollback preset; reduced-motion emulation; 360px pass; offline honest-fallback pass; /bahasa deep link; logged-in smoke on piefed.social (vote/comment — vendored modal/toast chrome intact); mood + session log + LEDGER updates in abstraksi.

## Risk top-5 (full register in conversation)

R1 slate ramp regeneration (all stops live) → monotonic + contrast-checked + id -12 rollback. R2 dead primary classes going live (~50) → pre-grep + post-sweep. R3 other.white recolor (12 files) → audit. R5 FOUC/static-mirror → @theme greps. R15 live-tile rate/latency unknowns → SWR + caps + honest fallback.

## AMENDMENTS (Yose, 2026-07-06, post-approval — these override the plan above)

1. **LIGHT THEME ONLY this wave.** P1 swaps the slate ramp + full primary (terracotta) ramp + `other.white` card cream ONLY. The zinc dark ramp stays UNTOUCHED (current dark look is kept; Honai Malam is a later wave). This halves R1 risk. Dark-mode sweeps in verification = confirm dark is UNCHANGED.
2. **Animations: keep only zero-latency CSS.** No JS animation work this wave beyond count-up. Grammar-layer animations (rules draw, chip sweep) are pure CSS transform/opacity and ship; anything that would add a lib, a scroll listener, or main-thread work does NOT. Reduced-motion block still ships. Split-flap Papan Kilas (P5) stays CSS-only per-row; if it measures janky on the A12, degrade to a simple rotating card (no 3D flip).
3. **Type is SITE-WIDE**: Archivo display + Geist Mono furniture apply across all pages, not just ETNOS routes (map `--font-display` into headings globally, mono into meta/labels where classes exist).
4. **Map (P3): NOT dot-grid.** Port the ACTUAL act-1 main atlas map from detak-detik's front page (whatever component renders the big island map in act 1 — inspect `src/pages/index.astro` act 1 + its island imports; likely the engrave plate). Executor: read that component first, then port its rendering approach for Tanah Papua with city anchors.
5. **Sorotan posts placement: decide during P5.** Current lean: desktop = right sidebar (Shell suffix area), mobile = section on /explore. Ticker stays top of feed/home.

## EXECUTION STATE (2026-07-06 — update this block every wave)

- ✅ P-1 done (this doc + abstraksi 10_design-language.md, commits 7d6b0e10 / 87f8d0b)
- ✅ P0 done, deployed, LIVE-VERIFIED (f5dd250f: 5-item nav both surfaces, drift fixed, i18n en/id/pmy, PUBLIC_DEFAULT_FEED=Local in workflow + .env.example)
- ✅ P1 done, deployed, CI green (4d64c2f9: Honai Siang preset — cream slate ramp, terracotta primary full ramp, other.white=#e3dabf card, zinc/dark UNTOUCHED per amendment 1, Lama rollback preset id -12, app.css static mirror, chart rgb(rgb()) fixes). Deployed run 28772489351 success. NOTE: visual sweep NOT yet eyeballed — Yose should screenshot-review light mode; rollback = select 'Honai Metro (Lama)' in /theme or revert 4d64c2f9.
- ✅ P2 done (0123e37f fonts + follow-up commit): static/font/ woff2s (ArchivoVariable, GeistMonoVariable, InstrumentSerif-Italic; 87KB latin); app.css @font-face ×3 (variable weight 100-900); @theme --font-display='Archivo Variable' + --font-mono='Geist Mono' + --font-fig='Instrument Serif' + --ease-etnos/--ease-etnos-out; all .font--* classes (except .font--serifs opt-out) put Archivo in the display slot → site-wide per amendment 3; grammar layer appended at end of app.css (--etnos-* semantic vars mapped to Photon theme vars + .dark remap, body::after grain 0.05, .eyebrow .inkbar .rule .rule2 .chip .serial .stamp .ghost-num .ledger .fig, verbatim reduced-motion block incl. .ticker-track exemption for P5).
- ✅ P3a done, deployed green (159de4ce → run success): PetaPapua.svelte = detak act-1 PetaKabar's DINAS_STYLE ported verbatim (OFM vector tiles, khaki paper, ink coast, dashed admin-4 lines, engraved city labels; dark keeps carto dark-matter untouched); inkbar header + koordinat serial strip (bind:center stays a tuple — svelte-maplibre-gl formatLngLat preserves array shape) + fig caption + ODbL receipt; explore swapped to PetaPapua + rule2/font-display section grammar; etnos.map i18n en/id/pmy ("simpul komunitas" caption); guest `/` → redirect(302,'/explore') via profile.current.jwt (localStorage-synchronous, safe). REMAINING P3: /explore/communities filter chips, cluster-card restyle, MapLibre-dep question (PapuaMap.svelte kept in tree).
- ✅ P4 done, deployed green (27e8a588): src/lib/etnos/live.ts (SWR localStorage etnos.live.v1, 10-min stale; users=getSite user_count only-real-field, communities=paged listCommunities limit:50 cap-4 → "200+", posts24h=New/50 client-count → "50+", failed sweep keeps last good copy, no-TZ PieFed timestamps parsed as UTC); StatCard `live` variant (LANGSUNG terracotta chip, rAF count-up 0.7s suffix-safe, reduced-motion instant, font-display tabular-nums); dashboard = "Papan Data Tanah Papua", live row w/ per-tile honest demo fallback, Sumber ledger (satu angka satu sumber). NOT yet eyeballed live — verify tiles flip demo→LANGSUNG against piefed.social.
- ✅ P5a deployed green (6a95092c, run 28835626455): KilasTicker.svelte (detak front-page ticker port: ink strip, terracotta tab "KILAS · CONTOH" → "· LANGSUNG" when PUBLIC_DETAK_URL /ticker responds with {src,teks,url}[], duplicated belt, pause-on-hover, mask fade, scoped reduced-motion; contoh items = real outlets + generic texts + homepage URLs only). Mounted top of `/` and /explore. PUBLIC_DETAK_URL documented in .env.example — needs detak worker URL from Yose to go live.
- ✅ P5b deployed green + LIVE-VERIFIED (d84fc59c, run 28836031641): SorotanBoard.svelte — trending posts as scoreboard (getPosts Hot/Local live, ledger rows + ranked mono numerals via .serial, postLink() canonical links, filters deleted/removed/nsfw, renders NOTHING on failed fetch — absence is content). Mounted on /explore below the map plate. app.css .ledger now accepts `a` rows. Curated highlights section renamed "Pilihan"/"Curated picks" so only the scoreboard owns the word Sorotan. Desktop right-sidebar promotion = Yose's call at review.
- 🔎 LIVE PROOF SWEEP (2026-07-07): fresh /explore node (nodes/42.ntD0DMpQ.js, 1.09MB) carries 'Papan Sorotan', 'openfreemap'×2, 'cartocdn' (dark fallback), 'ODbL', 'dari forum', anchors Sorong/Manokwari/Nabire/Wamena/Jayapura/Merauke; root CSS carries grammar layer + #d6cbac; fonts 200 OK. i18n strings (Simpul komunitas/Pilihan) live in lazy locale chunks — same mechanism P0 verified. VERIFIER GOTCHA: when bulk-downloading /_app/immutable assets, a foreground-timeout kill mid-loop leaves TRUNCATED files that grep clean — always compare byte sizes or re-fetch the specific file before declaring a string missing. NOTE: explore node is 1.09MB because maplibre-gl bundles into it (was true pre-overhaul too) — bundle-split question banked for P8.
- ✅ P5c deployed green (7aa80f51): PapanKilas.svelte split-flap — 4 rows BERITA/FORUM/KOMUNITAS/KATA, per-ROW half-fold CSS flip (rotateX keyframe, content swap at midpoint), calm 6s round-robin clock, day-clock seeded via seed.ts port (cyrb128+splitmix32+daySeed — deterministic for all readers), empty pools drop their row. Shared primitives: kilas-data.ts (one contoh owner + fetchKilas), hot.ts (ONE Hot/Local fetch per page shared by PapanKilas + SorotanBoard). Mounted on /explore between ticker and map.
- ✅ P6 deployed green (f06cfe05): bahasa→wiki merge — BahasaHub.svelte (grammar cards: inkbar/ledger/fig, Ethnologue receipt serial, wrap-safe values), bahasa.md intro (honest numbers w/ receipts), /wiki/bahasa via existing glob + loader special-case, /bahasa → 308 /wiki/bahasa, wiki index = mono .chip categories (emoji retired) + "Wiki Tanah Papua" island framing, WikiCarousel grammar pass (paper card, eyebrows, display type, .fig example — TTS untouched).
- ✅ P7 deployed green (64a5a568): CapabilityCard.svelte extracted verbatim from /agen (behavior-identical); orgs.json (3 honest contoh Level-0 orgs) + /org index + /org/[slug] (profil ledger, naik-kelas Note, 404 on unknown slug); /musrenbang usulan composer (judul/kampung/kabupaten/kategori/biaya-band/narasi via vendored forms, 5-stage tracker w/ stage-1-only honesty, PROTOKOL DEMONSTRASI stamp + markdown blockquote, submit = goto /create/post?crosspost=JSON — the EXISTING PostFormInit param, no parallel path; salin-markdown fallback); tentang rewritten island-framing + civic links; sorotan.json: bahasa href → /wiki/bahasa, musrenbang highlight added.
- ✅ P8 (this commit): capabilities.ts (hasModlog/hasSignup — piefed detection via profile.current.client.name); modlog links gated ×3 (InstanceCard, CommunityCard, CommunityHeader); /signup replaced with honest register-on-piefed.social page (verified https://piefed.social/auth/register = 200; +page.ts keeps the /signup/[instance] redirect for lemmy-type locks only); /util already gated by settings.debugInfo (left as-is); i18n flatten-diff en/id/pmy etnos.* → zero missing (pmy gained directory_demo + sorotan_open); docs/CODEBASE_GROUNDTRUTH.md committed.
- ⏭️ REMAINING (Yose review gates): screenshot pass all surfaces; Sorotan right-sidebar promotion?; PUBLIC_DETAK_URL for live KILAS; repo-root implementation_plan.md/walkthrough-1.md keep-or-delete (NOT deleted — awaiting his word); P3 leftovers (communities filter chips, cluster-card deep restyle, maplibre bundle-split); dark theme (Honai Malam) is a later wave; final verification ritual per "Final verification" section above.
- Build ritual: local builds OOM-crash when Yose's other session runs — use CI as the builder (push → `gh run watch --exit-status` → grep live assets via /_app/immutable/... with cache-buster `?x=$RANDOM`; shell HTML is edge-cached).

## FINAL LIVE SWEEP (2026-07-07, post-P8, all full-fetch size-checked)
Route nodes on etnos.pages.dev entry app.* (P8 deploy 28839471379): explore/42 carries Papan Kilas + Papan Sorotan + openfreemap×2; musrenbang/64 carries PROTOKOL DEMONSTRASI + crosspost handoff; org/65-66 carry Level 0 + Naik kelas; signup/96 carries auth/register; wiki-category/112 carries Direktori Bahasa. P0–P8 all deployed and live-verified. Beta gate = Yose screenshot review.

## REVERT + POLISH WAVE (2026-07-07, Yose screenshot feedback)

Yose reviewed the live P0-P8 build and steered:
1. **Backed off the detak-detik grammar** (it clashed with ETNOS's rounded corners + design language) AND the site-wide Archivo/mono typography.
2. Labels "screaming slop", especially wiki (carried-over copy).
3. Map was inert ("doesn't check anything").
4. No em dashes anywhere.
5. Reuse existing primitives (Material/Badge/Note) but polish; fix colored labels used as boxes/containers.

Shipped (commits 7578f844 revert, 894adf6c polish, 1916e6d4 Material fix):
- **app.css**: reverted @theme type to Inter/system + ui-monospace, removed the 3 ETNOS @font-face (woff2 files kept in static/font/ but unreferenced), removed the whole grammar layer (eyebrow/inkbar/ledger/chip/stamp/serial/rule/ghost-num/fig) + paper grain body::after + --etnos-* vars. KEPT the cream+terracotta color mirror. Result: rounded, Inter-native, cream.
- **All etnos components re-dressed** to rounded-2xl cards, no mono imposition: StatCard, WikiCarousel (reverted to original gradient hero), SorotanBoard, KilasTicker (rounded ink strip, theme colors, fixed rgb(rgb()) bug), PapanKilas (rounded card, kept flip), BahasaHub (original rounded cards), dashboard Sumber (dl not ledger), explore, musrenbang, org, org/[slug], signup, wiki index (rounded chips, no emoji, cleaned intro) / category.
- **Map (PetaPapua)**: pins now respond (flyTo + live caption naming city/wilayah) instead of dead clicks; rounded container; DINAS engraved look kept (renders fine, endpoints all 200 - the deadness was inert pins with empty instances{}).
- **Colored-label-boxes fixed**: explore highlight + community cards de-tinted to neutral Material cards (accent only in icon/link, not the whole box); agen Aksara flagship amber-gradient -> clean card w/ small amber chip; standalone "Data contoh" badges folded into EndPlaceholder action snippet (proper inline label) on /org + /org/[slug].
- **Reuse Material**: explore cards (x7), org profil, musrenbang tracker now use mono-svelte `<Material>`. Back button added to /org/[slug].
- **Material card-color fix (systemic)**: `.material-*` used literal `background-color: white`, so cream theme's bg-white (#e3dabf) diverged from Material's #fff. Changed to `var(--color-white)` so ALL cards (feed included) use the theme card surface. Cohesive cream in Honai Siang, still white in default themes, dark unaffected. THIS IS THE FIX that made Material reuse consistent - the pre-existing feed was rendering bright white on cream.
- **Em dashes**: 0 remain site-wide. 65 swept by a background general-purpose agent across 25 data/i18n/code files (colon after label/definition, comma for clause breaks); rest by hand.
- NEXT / open for Yose review: WikiCarousel keeps its soft primary->amber gradient (original hero, left intact); dark theme (Honai Malam) still deferred; confirm cream Material feed reads well.

---

# MIDAS SWEEP (2026-07-10) — coherence + polish overhaul [EXECUTION STATE]

Supersedes the P0-P8 plan above as the current design truth. Plan file:
~/.claude/plans/peaceful-stargazing-narwhal.md. Design language named
**Honai Metro** (per Yose): modern polished forum register ("polished
Reddit / new Digg"), island-agnostic (NO Papua-specific motifs; ETNOS is a
template other islands inherit), cream + terracotta kept, dark mode kept.

## Shipped (all CI green, per-wave commits)

- **W0 modal fix** (85c170ca): the onboarding "Mulai jelajah" trap. Root
  cause: Modal.svelte history effects fought the by-value `open` prop and
  a pushState during router init could kill the effect tree. Now: one
  close path (`Modal.close()`, exported), try/catch on pushState,
  ModalContainer buttons close via the modal ref (history entry always
  popped), OnboardingModal defers two rAFs past the first navigation.
- **W1 foundation** (14677bc3): Plus Jakarta Sans variable (27KB latin,
  static/font/PlusJakartaSansVariable.woff2, default font, settings option
  'jakarta'; Archivo/GeistMono/InstrumentSerif orphans deleted). Badge
  redesigned: neutral chip + status DOT (no more tinted pill + ring-black
  "Lovable" look); new `primary` accent variant. New primitives in
  src/lib/etnos/ui/: DataChip (langsung=pulsing terracotta dot / contoh=
  hollow dot / segera=dashed dot), PageHeader (real h1 band, wraps
  Photon Header), IconTile, BackLink, Board (titled flush-body card).
  Material got `interactive` prop (hover lift). Theme preset renamed
  "Honai Metro". Also fixed: font-class remover never removed
  font--serifs. NOTE: primary-900 == 700 is INTENTIONAL (Photon semantic
  100/900 accent pair, AA-safe on-light slot) — do not "fix" again.
- **W2 deck** (7add011e): PetaKabar.svelte = canvas dot-grid Papua plate
  (port of detak-detik atlas-dots; static/data/papua-kab.geojson, 42 kab,
  52KB, centroids precomputed) + news layer: fetches
  `PUBLIC_DETAK_URL/edisi` (CORS-open detak worker, refreshed 04:32/16:32
  WIB), gazetteer-matches headline text vs kabupaten names+aliases
  (kabar.ts; "puncak" blocklisted as ambiguous), pins sized by skor,
  deep-links `https://detak-detik.pages.dev/#/kliping/{id}`. Honest
  fallback = 6 anchor cities, no fake pins. Feed (/) now carries the deck:
  ticker → header → [PetaKabar 3col | PapanKilas 2col] (mobile: tab
  switcher) → feed. Guest redirect to /explore REMOVED. /explore =
  community directory (clusters w/ hero-icons, SorotanBoard, browse-all;
  curated sorotan.json grid retired+deleted). Nav: Layanan group
  (Musrenbang, Organisasi) in sidebar + hamburger. MapLibre no longer
  imported anywhere (PetaPapua.svelte + PapuaMap.svelte deleted).
- **W3 wiki** (e7fe2fe6): index = PageHeader + de-gradient carousel +
  6 category Material cards (icon, description, derived "n bagian · m
  menit baca" from wiki/index.ts meta). Article page: md's own `# Title`
  becomes the single page title, TOC from ## headings (sticky aside ≥lg,
  <details> on mobile, IntersectionObserver active-section), scroll via
  nth-h2 (no renderer changes), TTS kept.
- **W4 surfaces** (f7873bec): dashboard/agen/org/musrenbang/tentang all on
  Material + PageHeader + IconTile + DataChip; Sumber = receipt rows w/
  DataChips; Sorotan Digg-style rank numerals; CapabilityCard opaque +
  standard skin, 🤖 dropped; onboarding copy rewritten (deck-aware);
  stat icon color coding neutralized (live=terracotta, contoh=slate).
- **W5** (this commit): UserBadges 🤖→CpuChip icon; sorotan.json deleted;
  Sonnet wording sweep (langsung/contoh vocabulary, no em dashes, formal
  register, i18n en/id/pmy parity); docs.

## Card skin standard (use everywhere)

Material color="default" rounding="2xl" (padding md=tile lg=card xl=feature),
or raw: `bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border
border-slate-200 border-b-slate-300 dark:border-zinc-800
dark:border-t-zinc-700`. Interactive cards add Material `interactive`.
No /80 translucency, no gradients, no uppercase-tracking micro labels,
no colored pill backgrounds (dots carry status).

## Needs-from-Yose (ordered)

1. **PUBLIC_DETAK_URL**: set repo Variable in honai-metro = the detak
   worker origin (detak-detik repo Variable `AKSARA_URL` has it,
   `https://detak-detik-worker.<subdomain>.workers.dev`). Flips Peta
   Kabar + KILAS from contoh to langsung on next deploy. Until then
   everything is honestly labeled contoh.
2. Phone screenshots: / (deck, light+dark, 360px), /wiki, /wiki/sejarah,
   /dashboard, /agen, /explore + first-visit onboarding tap-through test
   (clear localStorage key `etnos_onboarded_v1` or use incognito).
3. Decide repo-root implementation_plan.md / walkthrough-1.md (keep/delete).

## Banked / deferred

- Remove maplibre-gl + svelte-maplibre-gl from package.json: needs
  `bun install` lockfile regen (CI uses --frozen-lockfile); deps are
  tree-shaken out of the bundle already, so zero user cost. Do on a
  beefier session.
- Honai Malam dark-theme dedicated pass (current dark kept per Yose).
- Per-category wiki hues experiment; island paintings footer.
- PapanKilas spotlight row could take curated highlights if wanted
  (sorotan.json data was deleted; directory.json spotlight remains).

---

# REVAMP WAVE (2026-07-11) — live deck + civic suite [EXECUTION STATE]

Supersedes MIDAS SWEEP as current design truth. Yose brief (laptop session,
15 screenshots): map to the top full-width "snatched from detak-detik with
all the real time data stuff", Papan Kilas full-width real flipboard (KATA
dropped), jelajah/wiki/papan-data/musrenbang/org/agen/tentang all fleshed
out. Decisions taken with Yose: map IS the home banner (no image banner),
FULL detak layer set, /tentang kept + redesigned, wiki = curated + live
Wikipedia. Filter row (Lokasi/Urutkan/Tampilan) moved to sit right-aligned
directly above the posts (his note). Plan file:
~/.claude/plans/hey-broski-let-s-pick-drifting-hare.md

## Shipped (each CI green + deployed)

- **W1 deck** (0a2c52da): PetaKabar = full-width hero, lg two-column
  (canvas left h-64/80/28rem, side panel right: legend chips + detail).
  New src/lib/etnos/layers.ts: typed fetchers w/ SWR localStorage
  (etnos.layers.*.v1), Papua bbox clip, contract null=segera / []=nihil /
  points=langsung, NO fake points ever. Layers: KABAR (existing pins),
  GEMPA (BMKG gempaterkini + USGS 2.5_day, proximity-dedupe, WIT times,
  120s interval, default ON), CUACA (Open-Meteo multi-point at 6 anchors,
  default ON), BANJIR (PetaBencana, OFF), TITIK API + UDARA (detak worker
  /geo/kebakaran + /geo/udara via PUBLIC_DETAK_URL, OFF, segera until env).
  atlas.ts gained loadBoundaryPaths() (Path2D per kab, cached); dashed
  kabupaten stitch drawn over dots, selected kab solid terracotta. Static
  base (dots+boundaries) cached offscreen, markers drawn per frame.
  DataChip gained 4th state `nihil` (solid muted dot). PapanKilas rewritten
  as Solari board: 3 rows (Berita/Forum/Komunitas, KATA killed), SEGS=6
  equal overflow-hidden cells each holding the full string at
  left:-j*100%, per-cell rotateX half-fold with 45ms stagger sweep, WIT
  clock in header, day-seed kept. Home order: Header h1 -> ticker ->
  PetaKabar -> PapanKilas -> filter row (justify-end) -> feed; deckTab
  killed. BUG FOUND+FIXED: KilasTicker had been rendered ABOVE Header
  pageHeader whose -mt-64 pt-64 band painted over it — the ticker was
  invisible in prod since P5a; now lives below the header.
- **W2 jelajah** (dcc70813): PetaSimpul.svelte (anchors as node rings +
  per-province community counts via geojson prov codes 91=PB 92=PBD 94=PA
  95=PS 96=PT 97=PP, west-east dashed network line, kab-with-community
  denser dots); directory.json communities gained optional region (exact
  geojson nama, only where subtitle already stated it); explore page:
  stats strip (39 komunitas / 9 kategori / 9 bahasa, derived), client
  search + category filter chips, honest empty state.
- **W3 wiki** (pushed same day): wajah.json = 13 entries, EVERY ONE
  live-verified 2026-07-11 (id.wikipedia REST 200 + Commons imageinfo
  extmetadata license CC/PD + attribution copied exactly; Suku Ekagi/Tifa/
  Kasuari gelambir-tunggal dropped as 404; Cenderawasih image dropped as
  unattributable -> gambar null; Arnold Ap has no image -> locator).
  WajahTanah.svelte: 12h slot floor(now/43200000)%n over id-sorted
  entries, live REST fetch may only LENGTHEN the reviewed extract (cap 900
  chars word boundary), langsung chip when live else "arsip redaksi",
  Commons caption "nama, atribusi (lisensi), via Wikimedia Commons",
  mini locator plate (60x52 grid + seal ring). Wiki index: WajahTanah ->
  SejarahHariIni + KataHariIni Board cards (TTS kept) -> categories.
  WikiCarousel deleted.
- **W4 papan data** (29158875702 run): sticky pill jump-nav (#forum
  #pendidikan #ekonomi #infrastruktur #kualitas-hidup #otsus #agen
  #sumber, scroll-mt-16); Gempa 24 Jam Papua live tile reusing
  fetchGempa() (same SWR cache as map, one fact one owner, links to /);
  live row lg:grid-cols-5; BarChart scale ticks 25/50/75 + "skala 0
  sampai X" label; LineChart solid baseline, id-ID ints, thinned x labels
  >8 pts; Sumber gained BMKG+USGS row.
- **W5 musrenbang**: "Apa yang terjadi dengan usulan saya" explainer;
  stepper with connector hairlines (stage 1 terracotta only); composer
  untouched (same crosspost handoff); "Usulan di forum" Board via new
  musrenbang.ts (MUSRENBANG_COMMUNITY: string|null = null — Yose names
  the slug when a community exists; until then honest empty state + link
  /search?q=%5BUSULAN%5D); panduan cards x3 (jadwal = contoh chip). No
  voting UI, no consensus meters, ever.
- **W6 org+agen** (29159234425 run): orgs.json 3 -> 8 contoh entries
  (distrik, puskesmas, dewan adat, SD, koperasi, PKK, klasis, BUMKam) w/
  jenis enum + structured jam {hari:[a,b],buka,tutup}|null; org.ts
  bukaSekarang() = WIT wall-clock (+9h getUTC*), null jam renders
  nothing; /org: jenis filter chips, buka/tutup-sekarang dot on cards
  ("menurut jam tercantum"), tangga kehadiran Level 0/1/2 card, klaim CTA
  -> /tentang#klaim; CapabilityCard gained optional open prop
  (behavior-identical when absent); /agen: T0-T3 trust tier cards
  (wording from abstraksi specs/etnos/04 table, "tingkat untuk mesin,
  bukan manusia").
- **W7 tentang+sweep** (this commit): /tentang markdown wall -> cards
  with anchors #apa #isi #keanggotaan #federasi #agen-register
  #aksara-onboarding #protocols #consent #klaim #dibangun #lisensi (the
  /agen standards links finally resolve); i18n parity 126/126/126 etnos.*
  keys (was 94); banned-string audit clean (0 em dashes, no Simulasi, no
  maplibre imports, no uppercase-tracking); docs updated.

## Needs-from-Yose (refreshed)

1. PUBLIC_DETAK_URL repo Variable (unchanged ask): now flips KILAS +
   kabar pins + TITIK API + UDARA layers. Gempa/cuaca/banjir are langsung
   WITHOUT it since W1.
2. Musrenbang community: create/designate a community slug, then set
   MUSRENBANG_COMMUNITY in src/lib/etnos/musrenbang.ts.
3. Screenshot review: / (deck w/ layers, light+dark, 360px), /explore,
   /wiki (Wajah feature), /dashboard, /musrenbang, /org, /agen, /tentang.
4. Approve wajah.json entry list (13 entries, all verified) and the 8
   contoh org entries' wording.
5. Standing: repo-root implementation_plan.md / walkthrough-1.md call;
   maplibre package.json removal (lockfile regen fine on this laptop now
   — bun 1.3.14 installed via npm/Volta).

## Notes for the next seat

- This laptop: bun installed globally via npm (Volta shim). Local
  builds ~20-45s. Dev server + playwright-core (msedge channel)
  screenshot loop in scratchpad works well for visual verification.
- Wikipedia REST rate-limits: space requests >=3s (429 otherwise).
- svelte-check has 3 PRE-EXISTING errors (ErrorContainer, StatCard
  ts-expect, agen Capability union) — not gated by CI, untouched.
- Feed "No posts" on dev with Lokal+Aktif filter is pre-existing
  (verified against stashed baseline), not a deck regression.

---

# POLISH WAVE (2026-07-12) — density, wire band, dossier, Papan Sinyal

Yose's screenshot review of the REVAMP WAVE surfaced: hover repaints
read cheap, dark theme had invisible strokes, 100% zoom too big (80%
ideal), map should be full-width with detak-style region dossiers
"decoupled from lensa wilayah", ticker + Papan Kilas berita row were
redundant. Direction confirmed via brainstorm: ticker goes global,
Papan Kilas becomes Papan Sinyal (his pick from 4 options). Four
commits P1-P4, each build-verified + screenshot-verified.

## P1 polish foundations (f5a27e76)

- html { font-size: 87.5% } (reads like his 80-85% zoom reference; all
  rem-based so spacing scales with it).
- Hover doctrine: surfaces never repaint. Stripped hover:bg from
  VirtualFeed rows, PostLink (border deepen instead), CommunityItemBig,
  SorotanBoard rows + musrenbang usulan rows (title color shift
  instead). Controls keep bg hovers.
- Dark fix, ROOT CAUSE: canvases read --color-slate-500 for muted
  strokes, but the slate ramp is cream-tuned (dark warm gray) so dark
  mode painted boundaries near-black on near-black. New plateColors(el)
  in atlas.ts: dark swaps muted to zinc #a1a1aa, accent to primary-400,
  exposes a dark flag; PetaKabar/PetaSimpul/WajahTanah dot alphas
  boosted in dark. PapanSinyal flap cells: dark bg 0.03->0.06, borders
  0.07->0.12, tag primary-400, sub zinc-400.

## P2 global wire band + deck order (22716722)

- KilasTicker gains band + class props. Rendered in +layout.svelte
  TWICE: under Navbar inside the shell-navbar-holder (md+; holder is
  position:sticky top-0 there) and as a md:hidden sticky top-0 strip at
  the top of <main> (mobile navbar is a BOTTOM dock; a band in the
  holder would sit at the bottom).
- Home deck: inline ticker removed; filter row moved back above the
  map (his call).

## P3 map dossier (97203537)

- PetaKabar full-width: side aside + bottom pin-chip row deleted;
  canvas h-72/h-96/h-[30rem]; legend = floating collapsible pill
  top-right; footer = identity line + "Sumber aktif" (langsung sources
  only).
- Kab click -> floating dossier top-left (fixed corner, detak's
  kb-dossier pattern, never point-anchored). Content: Kemendagri rows
  (ibukota, penduduk + rank/prov, luas, kepadatan) from NEW
  src/lib/etnos/data/wilayah.json (42-kab Tanah Papua subset of detak's
  idn-wilayah.json; names join 1:1 with papua-kab.geojson, verified) +
  live crosscuts (gempa 24j in-kab, anchor cuaca, banjir/api counts,
  kabar kliping links, directory komunitas by region tagged contoh,
  wajah entries by koordinat) with honest empties. Markers win over
  region clicks; marker cards offer "Buka kartu wilayah"; Esc/X close.
  Region clicks never filter the feed.
- FOUND+FIXED (pre-existing): rasterize() encoded the kab index in the
  red channel in one pass; anti-aliased coastal pixels premultiply and
  getImageData un-premultiplies them into WRONG indices (probe: Sorong
  -> "Merauke", Nabire -> "Mimika", Manokwari -> "Lanny Jaya"). Was
  invisible when the raster only drove dot rendering; fatal once it
  drove hit-testing + dossier attribution. Fix: one coverage pass per
  feature reading only alpha (threshold 32 keeps islets + forgiving
  coastal taps). Probe after: all 6 anchors resolve correctly.

## P4 Papan Sinyal (3829065a)

- PapanKilas.svelte -> PapanSinyal.svelte. Rows now live channels:
  GEMPA (M + wilayah + WIT, BMKG/USGS, honest nihil line when the feed
  answers empty, row drops when unreachable), CUACA (rotating anchors,
  Open-Meteo), FORUM (hot posts), KOMUNITAS (directory). Berita row
  retired: the wire band owns news. Gempa/cuaca reuse layers.ts SWR
  caches (one fact, one owner). Header chip "Sinyal langsung" only when
  a live feed answered. Same flip engine + day seed ('papan-sinyal').
- i18n: papan.berita_src + rows.berita removed; rows.gempa, rows.cuaca,
  sinyal_label, gempa_nihil added; peta.lapisan/tutup/lihat_kab/
  sumber_aktif/dossier.* added. Parity 141/141/141.

## Notes for the next seat (delta)

- raster-probe.js + shot-click.js in scratchpad: probe validates anchor
  cell attribution in a real browser; shot-click clicks fractional
  canvas coords before screenshotting. Rebuild them if the scratchpad
  is gone; both are ~40 lines of playwright-core.
- The 87.5% root means screenshots at 1440px now show more content;
  Yose's own 80% zoom habit should no longer be needed.

---

# BROADSHEET WAVE (2026-07-12, same night) — the de-carding

Yose's second screenshot review after POLISH WAVE: "I think it's the
cards, and the material ui like components that look so ugly... let's
rethink everything from the bottoms up." Diagnosis confirmed by count:
dashboard alone nested 15 Material cards; cream's two surface tones are
~8% apart so borders did all the separating and every page read as an
admin template. Direction (approved, all five waves): the three-layer
broadsheet model.

## The doctrine (now in CLAUDE.md hard rules)

- Layer 0 paper: content directly on the page field; SectionHead
  (heading + rule) + hairline rows structure everything.
- Layer 1 instruments: card skin ONLY for self-contained live objects
  (Papan Sinyal, forms/composers, CapabilityCard profiles).
- Layer 2 floats: dossier/legend/menus/modals carry the only shadows.
- New primitives src/lib/etnos/ui: SectionHead (title + action snippet
  + rule + caption), Figure (flat stat, count-up kept). Board + StatCard
  RETIRED and deleted.
- Wire = external press only, never posts (chrome renders for every
  visitor; post titles from federated instances cannot be site chrome
  until ETNOS runs its own moderated server). Papan Sinyal owns the
  forum-post highlight (FORUM row).

## F1 primitives (d8e0d02e)
btn-primary radial gradient (house-rule violation, vendored) → solid
primary-900/primary-100; btn-secondary bordered-white-pill → flat
neutral fill, no border (Selects render as btn-secondary so every
select flattened for free); btn-ghost border removed; TextInput default
shadow off; CommunityItem subscribe no longer rounded-full; comment
thread lines + corners dark zinc-800 → zinc-700 (were sub-threshold on
zinc-925).

## F2 deck (9c0b775a)
KilasTicker rewritten flat (no black band; terracotta Kilas dot-label,
ink belt, mask fades) and mounted in Navbar's center flex slot on md+;
mobile keeps a sticky paper strip in +layout. Map hero de-carded:
SectionHead + full-bleed canvas (-mx-3 sm:-mx-6, h-80/26rem/32rem, fit
0.97), floats realigned to content padding, footer flat. PapanSinyal
lost its shadow. Deck order: map → board → hairline divider → filter
row → feed (his call: filters right above the feed, divider between).

## F3 dashboard (6f0fc15c)
15 Materials → 0. Hero stats = Figure ledger band (border-y); sections
= SectionHead + subtitle + Figure grids + unboxed charts; sumber dl
flat. Figure labels wrap (truncation fix).

## F4 explore + wiki (ed56daa2)
PetaSimpul + SorotanBoard de-carded (SectionHead + flat rows);
explore stats → Figure band; directory groups → SectionHead + hairline
row grid (gap-x-6, group-hover title shift); browse-all rows flat.
Wiki: WajahTanah = editorial lead story between border-y rules;
Sejarah/Kata daily Boards → flat sections; category grid → IconTile
rows; kontribusi flat. New i18n key etnos.wiki.kategori_head ×3.

## F5 civic pages + sweep (this commit)
agen: flagship/directory/tiers/registry/standards all flat (tool cards
→ hairline rows, tier cards → celled rows). tentang: all 11 anchors
survive as flat sections (verified). org index: ladder flat; org cards
stay CapabilityCard (instrument profiles). org/[slug]: profil dl →
ruled rows. musrenbang: explainer/stepper/usulan/panduan flat; the
composer form remains the page's single card, deliberately.
Board.svelte + charts/StatCard.svelte deleted; ui/index exports
SectionHead + Figure. Em-dash sweep clean; parity 142/142/142.

## Notes for the next seat
- If a new surface wants a "titled flush card", that is the smell that
  Board used to satisfy: use SectionHead + rows on paper instead.
- mono-svelte Button/Select styling now lives further from upstream
  Photon; when merging upstream, keep .btn-primary solid and
  .btn-secondary borderless.
- Settings/admin pages inherit the primitive restyle only; they still
  use their own Material rows (Photon internals, out of scope, look
  fine in the canary).

---

# FINAL POLISH PASS (2026-07-12, third run) — consolidation + inbox

Yose's morning review of the broadsheet wave. Items landed this pass:

- Navbar "Jelajah" now points to /explore (was /explore/communities,
  duplicating the sidebar entry with a different page).
- Markdown + highlight link color: blue-600 → primary-700/primary-400
  (blue clashed with cream). OP/BOT blues kept (semantic), XYLIGHT
  links kept (env-gated off).
- Comment thread lines dark: zinc-700 → zinc-600 (still sub-threshold
  on zinc-925 at 700).
- Mobile wire strip: fixed the sm-breakpoint margin mismatch
  (-mt-3 vs sm:pt-6) that let a sliver of page show above the ticker;
  z-30 → z-40 so Photon's floating post-title pill slides under it.
- "Lompat" (common.jump) renamed "Lihat percakapan" / "View
  conversation" ×3 locales.
- Papan Sinyal is now a <details> instrument: open on lg+, collapsed
  to its header row on phones (matchMedia on mount). The deck breathes.
- Quick create: a one-tap composer row above the feed ("Bagikan sesuatu
  ke komunitas Anda" → /create/post, guests → /login). i18n
  etnos.deck.quick_create(_cta) ×3. No new posting path; it opens the
  existing form.
- MCP registry: new ToolCard.svelte (compact spec-sheet card), inbox
  items flattened with unread = 2px terracotta left border, messages
  page restyled as a proper chat (theirs zinc bubbles, mine
  primary-900/primary-100) with dark mode fixed.
- Next wave scoped and committed as docs/etnos/10_federation-wave-plan
  (DRAF): MapLibre Peta Kabar v2, AP location property on Group actors
  (PieFed patch), Peta Nusantara multi-island Jelajah, agent Service
  actors with aksara:attestation sandboxed on a throwaway PieFed
  instance (never piefed.social), notification bell. CLAUDE.md updated
  (maplibre now KEEP).

## COHERENCE WAVE (2026-07-12, evening)

Yose's morning review verdict: the quick-create box was a mistake, the
light board looked flat, and the site needed one story. Doctrine landed
this wave: every page answers ONE question (Beranda "apa yang terjadi",
Jelajah "siapa dan di mana", Wiki "siapa kami", Papan Data "bagaimana
keadaan kita"), and across products detak is the press, ETNOS is the
square: ETNOS points at press, never rehosts it.

- Quick-create box removed; navbar Buat is the single filled control
  (solid primary both breakpoints; the old radial gradient in
  nav-btn-sm-primary was our last gradient violation, now dead).
- Papan Sinyal recolored: the plate is self-colored INK in both themes
  (details root carries a literal `dark` class + zinc-900 skin; a
  split-flap board is black in any light). His "light looks flatter"
  observation, answered structurally.
- KILAS wire now carries detak kliping CLUSTERS: fetchKilas reads
  loadKliping (same /edisi SWR cache as map pins), src label "MEDIA +n",
  click opens detak-detik/#/kliping/{id}. /ticker retired.
- Board grew: LAUT (Open-Meteo Marine, 5 nearshore sea points, keyless
  langsung day one), MATAHARI (terbit/terbenam WIT; sunrise/sunset now
  ride the cuaca request, tz Asia/Jayapura, cache key cuaca.v2),
  PERISTIWA (alert row that EXISTS only while banjir/titik-api report
  real points), FORUM deduped to top post per community. Up to 7 rows,
  each optional.
- Peta Kabar moved home -> /wiki (his call: the kab dossier is
  encyclopedic; wiki = reference desk). Home deck = board, divider,
  filters, feed. /wiki gained the Almanak strip (tanggal WIT +
  matahari Figures, langsung chip, same cuaca cache).
- WajahTanah locator is now the whole-Indonesia plate (atlas-id.ts +
  static/data/idn-prov.geojson vendored from detak, same per-feature
  raster rule), Papua provinces printed heavier, seal ring at entry
  koordinat, always rides the entry.
- Jelajah is alive: /explore search also queries the server
  (client().search type Communities, debounced 350ms, stale-response
  guard), results langsung above the curated contoh directory, honest
  loading/empty/error lines. Verified live: "news" returns 20 federated
  communities; "papua" shows the honest nihil (borrowed backend truth).
- Kartu WA shipped: post share menu -> "Kartu WA" opens a modal with a
  1080x1080 canvas card (cream, terracotta bar, ETNOS wordmark, wrapped
  title, c/community, url footer) + Bagikan (navigator.share files) /
  Unduh / Buka WhatsApp (wa.me text). Distribution mechanic for the
  WhatsApp-first audience. NOTE: share button now always opens the menu
  (local posts previously shared directly; one extra tap, accepted).
- i18n parity 157/157/157. The bigger brainstorm list (Edisi Pagi,
  Warta Suara, Lembar Kampung, Kampung Saya, Mode Balai, Tolong
  Dijawab, Musim Musrenbang, Mode Hemat Data) awaits his picks.

# BETA WAVE (2026-07-13) — map into the board, broadsheet wiki, beta sweep

Yose's Round-5 review (screenshots 48-57), aimed at public beta. Verdict:
the ticker rows were useless on phones, the Forum row never appeared, the
filter labels looked wrong stacked, wiki articles were bland, and the
site had beta-blockers (no link previews, duplicate nav, scrollbar over
chips). His two locked calls: filter row below the board with inline
labels; enable Melayu Papua now. Everything below shipped, `bun run
check` clean (0 errors), `bun run build` green, verified locally on the
fused board (desktop + 400px) and the wiki broadsheet.

**Part 1 — Papan Sinyal v2 (the map is the instrument):**
- Peta Kabar moved home INTO Papan Sinyal (reverses the COHERENCE WAVE
  move to /wiki). New `variant: 'paper' | 'ink'` prop: `ink` = no
  SectionHead, no bleed, shorter canvas, legend/dossier at right-2/left-2,
  padded footer. Mounted with `<PetaKabar variant="ink" onstatus={...}>`.
- `atlas.ts plateColors` dark detection changed `documentElement` ->
  `el.closest('.dark')` so the board's literal `dark` class flips the
  canvas palette (and the `ink` color) together. Audited all four callers
  (PetaKabar/PetaSimpul/WajahTanah/LocatorPlate); global behavior
  unchanged (`.dark` lives on `<html>`).
- `onstatus` lifts the per-layer status map; the board's "Sinyal
  langsung" chip is `$derived` from it (one owner: map computes status).
- LAUT is a MAP layer now (was board-only): added to `LayerId`, exported
  `LAUT_ANCHORS`, `LAYER_COLOR.laut = #0e7490`, wave-height label
  below-right so it never collides with the cuaca temp above-right,
  dossier card, hit-test, default ON. Seven layers total.
- PapanSinyal pruned to three flap rows (PERISTIWA/FORUM/KOMUNITAS); the
  sky/sea rows deleted (they're on the map). **Forum row un-broken**:
  `hot.ts` (and `live.ts`) hardcoded `page_cursor:'1'`, a PieFed cursor
  Lemmy backends reject -> silent `[]`; dropped it + reset `inflight` on
  empty success. Mobile flaps: `segs` is a `MediaQuery` (6 sm+, 1 on
  phones) so long lines truncate softly instead of slicing; swap/done
  timings derive from segs; 13px clip font on phones. Board now opens on
  every breakpoint (was folded < lg).
- Filter row is a single baseline below the board: `baseClass="flex
  flex-row items-center gap-2 *:my-0"` on each Select renders the Label
  inline-left; `Sort.svelte` forwards baseClass to both its selects.
- /wiki dropped Peta Kabar; opens with the Almanak strip (reference desk).

**Part 2 — Wiki broadsheet articles:**
- NEW `LocatorPlate.svelte` (Papua-only seal-ring plate, extracted from
  WajahTanah, atlas.ts grid, module-cached). WajahTanah consumes it;
  atlas-id.ts now unimported (kept tree-shaken for Peta Nusantara).
- `[category]/+page.svelte` rewritten: markdown split by `## ` into
  standfirst + numbered sections (terracotta `01` + h2 + rule, no Material
  card, on paper). Wajah figures name-matched to sections (verified
  placements: tempat Danau Sentani/Lembah Baliem/Raja Ampat/Danau Paniai
  each get a right-column figure + LocatorPlate; suku-bahasa 4 suku ->
  "Suku-suku besar" grid; noken + frans-kaisiepo -> terkait strip;
  biodiversitas mambruk -> "Burung"; kuliner/bahasa typographic). TOC:
  sticky rail with terracotta active tick (IO in an `$effect` keyed on
  parsed sections) + de-carded mobile details. End matter: terkait strip
  -> BahasaHub (now hairline ledger, was card grid) -> prev/next pager.

**Part 3 — beta sweep:**
- Post pages got a BackLink (afterNavigate captures the referrer, falls
  back to `/`).
- /explore: curated rows whose slug matches a live server result are
  dropped (no double-listing); chip counts follow the needle-filtered set
  (fixes the "Bahasa 6 vs 5" mismatch).
- `.scrollbar-none` utility in app.css, applied to the three overflow-x
  chip rows (explore/dashboard/org) — the 3px track was painting over the
  chips on Windows.
- Sidebar ETNOS group dropped Jelajah (navbar + mobile dock are canonical;
  it was listed twice).
- Melayu Papua LIVE in the picker (loader + settings entry uncommented);
  new etnos.* keys carry real pmy, core strings mirror id until a full pass.
- Social meta: `src/app.html` now carries static OG/Twitter tags +
  `static/og.png` (1200x630 cream/terracotta card) so WhatsApp link
  previews work (SSR is off, client-injected tags were invisible to
  scrapers). theme-color per scheme.
- Onboarding b4 reworded to the fused board (no key bump).
- `bun run check` taken to 0 errors (fixed 6 pre-existing: 2 comment-route
  `resolve` route-id typos, 3 PetaKabar dossier null-safety, 1 agen
  Capability `tier: null`). 147 warnings remain, all Tailwind-4
  `@variant`/`@reference` CSS parser noise, not ours.

i18n: added etnos.peta.layers.laut, etnos.wiki.wajah_terkait/prev/next,
etnos.post.back; updated wajah_plate; removed dead papan.gempa_nihil +
rows.{gempa,cuaca,laut,matahari}. Parity held across en/id/pmy.

Still banked from COHERENCE: Edisi Pagi, Warta Suara, Lembar Kampung,
Kampung Saya, Mode Balai, Tolong Dijawab, Musim Musrenbang, Mode Hemat
Data. Standing gates unchanged (PUBLIC_DETAK_URL, musrenbang slug).
