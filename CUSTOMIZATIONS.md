# ETNOS Customizations

Documents every upstream Photon file modified for ETNOS, to make upstream merges manageable.

## Bug Fixes (Windows)

### `postform.svelte` case collision (upstream bug)

**Problem:** On Windows (case-insensitive FS), `import from './postform.svelte'` resolves
to `PostForm.svelte` (the component) instead of `postform.svelte.ts` (the module).
This causes `SyntaxError: PostForm.svelte doesn't provide an export named 'PostFormState'`,
which cascades into `Module function declarations have already been instantiated` and
hangs the app on the loading spinner with no visible errors.

**Fix:** Add `.js` extension to disambiguate: `'./postform.svelte'` → `'./postform.svelte.js'`

**Files fixed:**
- `src/lib/feature/post/form/PostForm.svelte` (line 50)
- `src/lib/feature/post/actions/PostActions.svelte` (line 36)
- `src/lib/feature/post/actions/PostActionsMenu.svelte` (line 19)

### Locale fallback in `+layout.ts`

**Problem:** If the browser requests a locale not registered in sveltekit-i18n
(e.g. `id` for Indonesian), the `loadTranslations()` call may hang indefinitely.

**Fix:** Added a guard in `src/routes/+layout.ts` that falls back to `'en'`.

## i18n: Indonesian + Papuan Malay

| File | What changed |
|------|-------------|
| `src/lib/app/i18n/id.json` | [NEW] Indonesian translations (ported from old photon-indo, ~85% coverage) |
| `src/lib/app/i18n/pmy.json` | [NEW] Papuan Malay translations (copy of id.json, refine later) |
| `src/lib/app/i18n/index.ts` | Added `id` + `pmy` loaders, commented out all others (marked `// ETNOS:`) |
| `src/routes/settings/app/+page.svelte` | `localeMap` shows only `en`, `id`, `pmy` (others commented, marked `// ETNOS:`) |
| `src/lib/app/settings.svelte.ts` | Default language → `'id'` (marked `// ETNOS:`) |

## Theme & Branding

| File | What changed |
|------|-------------|
| `src/lib/app/theme/presets.ts` | Added **Honai Metro** warm earthy palette as default; original Mono preserved as preset |
| `src/lib/app/settings.svelte.ts` | Indonesian moderation preset, default feed → `All` |
| `src/app.css` | Satoshi & Nunito `@font-face`, font classes, scrollbar styling |
| `static/font/Satoshi.woff2` | [NEW] Added font file |
| `static/font/Nunito.woff2` | [NEW] Added font file |

## Custom Pages (ETNOS-only, no upstream conflicts)

| File | What it is |
|------|-----------|
| `src/routes/wiki/+page.svelte` + `+page.ts` | Wiki entry: WikiCarousel + category buttons → `/wiki/[cat]` |
| `src/routes/wiki/[category]/+page.svelte` + `+page.ts` | [NEW] Dynamic category renderer (markdown) with TTS |
| `src/routes/dashboard/+page.svelte` + `+page.ts` | Dashboard: real stats, SVG charts, OTSUS tracker |
| `src/routes/tentang/+page.svelte` | [NEW] Thin About page (mission, trust tiers, Abstraksi) |
| `src/lib/etnos/OnboardingModal.svelte` | [NEW] First-visit popup (localStorage-gated) |
| `src/lib/etnos/WikiCarousel.svelte` | [NEW] Carousel: "Hari Ini Dalam Sejarah" + "Kata Hari Ini" + TTS |
| `src/lib/etnos/tts.ts` | [NEW] SpeechSynthesis helper (zero dep, zero key) |
| `src/lib/etnos/charts/{StatCard,BarChart,LineChart}.svelte` | [NEW] Pure-SVG charts (CSP-safe, no Chart.js) |
| `src/lib/etnos/wiki/` | [NEW] `*.md` articles + `onthisday.json` + `kata-hari-ini.json` + `index.ts` (glob registry) |
| `src/lib/etnos/data/` | [NEW] Dashboard snapshot JSONs (pendidikan, ekonomi, infrastruktur, kualitas-hidup, otsus, stats) — clearly marked `demo: true` |
| `src/routes/jelajah/+page.svelte` + `+page.ts` | [NEW] Curated Suku/Komunitas directory + Papua map |
| `src/routes/bahasa/+page.svelte` + `+page.ts` | [NEW] Ruang Bahasa hub (9 Papuan languages, endangerment badges) |
| `src/routes/registry/+page.svelte` + `+page.ts` | [NEW] MCP Tool Registry (KYC / malware-scan / TKDN badges) |
| `src/lib/etnos/PapuaMap.svelte` | [NEW] MapLibre GL JS picker via `svelte-maplibre-gl` — 6 provincial-capital pills, Papua Tengah amber-highlighted, CARTO tile styles, follows theme color scheme |
| `src/lib/etnos/UserBadges.svelte` | [NEW] Trust-tier / AI-agent badges on profile header |
| `src/routes/u/[name]/+page.svelte` | Embedded `<UserBadges />` in EntityHeader nameDetail snippet |
| `src/lib/ui/sidebar/Sidebar.svelte` | ETNOS section: Wiki, Jelajah, Bahasa, Dashboard, Registry, Agen AI, Tentang (marked `<!-- ETNOS: -->`) |
| `src/lib/ui/navbar/Profile.svelte` | Same ETNOS entries in mobile menu |
| `src/routes/+layout.svelte` | Mounted `<OnboardingModal />`, replaced default Photon meta description with ETNOS copy |
| `src/app.html` | `lang="en"` → `lang="id"` |
| `static/manifest.json` | Photon → ETNOS Papua (name, short_name, description, theme/background colors, shortcuts) |
| `.env.example` | [NEW] Documents `PUBLIC_INSTANCE_URL`, `PUBLIC_INSTANCE_TYPE`, language, etc. Default → `piefed.social` / `piefedalpha` |

## Instance Configuration

Configured via `.env` (not committed):
```
PUBLIC_INSTANCE_URL=lemmy.ml        # Change to your Pyfedi backend for production
PUBLIC_LOCK_TO_INSTANCE=true        # Hides instance selector for simpler login
```

## Merge Checklist

When pulling from upstream (`git fetch upstream && git merge upstream/main`):
1. Check conflicts in modified files above (look for `// ETNOS:` markers)
2. New files (`id.json`, `pmy.json`, wiki/, dashboard/) won't conflict
3. Verify Honai Metro colors still render correctly
4. Re-run `bun run dev` and test
