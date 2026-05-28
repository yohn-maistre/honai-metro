# ETNOS Roadmap

Living persistence doc — what's built, what's queued, why. Each deferred item
cites the memo section it implements (Aksara Reframing Memo v0.3).

---

## ✅ Built (branch `claude/etnos-explore-deploy-pwesg`)

### Batch A — Identity & shell
- ETNOS branding pass (manifest.json, lang="id", default meta description)
- First-visit onboarding popup via existing `Modal` system (localStorage-gated):
  `src/lib/etnos/OnboardingModal.svelte`, mounted in `src/routes/+layout.svelte`
- Thin About page: `src/routes/tentang/+page.svelte` (mission, four trust tiers,
  Abstraksi). For the home-page about widget, populate the backend site
  description — `InstanceCard.svelte` already renders it.
- i18n `etnos.*` keys in `id.json`, `pmy.json`, `en.json`
- `.env.example` (defaults: `piefed.social` + `piefedalpha`; documented Lemmy
  fallback)

### Batch B — Phase 3 Wiki + Dashboard
- `WikiCarousel.svelte` (Hari Ini Dalam Sejarah Papua + Kata Hari Ini) with
  read-aloud via `tts.ts` (SpeechSynthesis, zero dep/key)
- Dynamic Wiki categories: `src/routes/wiki/[category]/+page.svelte` reading
  markdown via `import.meta.glob` over `src/lib/etnos/wiki/*.md`
- Pure-SVG charts (`StatCard`/`BarChart`/`LineChart`) under
  `src/lib/etnos/charts/` — CSP-safe, no Chart.js
- Dashboard rewired with snapshot JSONs in `src/lib/etnos/data/` (all marked
  `demo: true` with a "demo" badge). OTSUS tracker as a dedicated section,
  citing UU 2/2021.

### Batch C — Community / civic surfaces
- `/jelajah` — curated Suku/Komunitas directory grouped by purpose
  (Bahasa, Adat, Pemerintah, Wiki, AI), driven by
  `src/lib/etnos/data/directory.json`
- `PapuaMap.svelte` — inline-SVG stylized province picker (post-2022 6-province
  split). Reserves geographic-accurate upgrade to maplibre — see "Real map" below.
- `/bahasa` — Ruang Bahasa hub with 9 Papuan languages, endangerment badges,
  links to `/c/bahasa-<slug>` communities
- `/registry` — MCP Tool Registry with KYC / malware-scan / TKDN badges
  (memo §5.6 + §6.4)
- Trust-tier / AI-agent badges on user profiles via `UserBadges.svelte`
  (`bot_account` is wired; KTP-verified and Vouched stubs ready for the PieFed
  schema extension)
- AI feed shortcut → `/c/ai-updates` in sidebar + mobile menu (memo §6.4, Phase 4)

---

## ⏳ Deferred (next batches / future grants)

### Offline-first PWA
**Memo §2.3, §6.4.** 40% of villages are unconnected; offline-first is the project's
design primitive. Add a service worker, runtime caching for the feed/wiki, an
"app installed" experience. SvelteKit supports this via `@vite-pwa/sveltekit`.
Manifest is already ETNOS-branded.

### WhatsApp deep-links
Primary channel in the proposal. Trivial: `wa.me/?text=` for share buttons on
posts and pages; `wa.me/<phone>` for "Hubungi kelurahan" CTAs.

### Mode Hemat Data
Low-bandwidth toggle (text-only / image-light) for 3T connectivity. Add a
boolean to `src/lib/app/settings.svelte.ts` and a `ToggleSetting` row in
`src/routes/settings/app/+page.svelte`. Hide thumbnails, defer media.

### Voice / video / image upload with CARE consent labels
**Memo §6.4.** Language-preservation rooms accept voice/video/image with
explicit consent labels (public / province-only / institution-only / dewan-adat).
Needs PieFed backend extension (storage, label field) plus client UI for
consent capture. Threshold cryptography for sacred content via HSM/Dewan Adat
(see two-mode trust below).

### Four-tier registration & community vouching flow
**Memo §6.3.** Display badges are stubbed in `UserBadges.svelte`. The real flow:
- Tier 1 (open reader): already free.
- Tier 2 (registered): phone/email, already in Lemmy/PieFed.
- Tier 3 (KTP-verified): integrate Privy/Verihubs e-KYC; PieFed user field
  `verified_ktp`.
- Tier 4 (community-vouched): vouching record `vouched_by` field; revocation
  endpoint; threshold variant `t-of-n` for sensitive spaces.

### Live data + LLM content automation
- BPS / satudata.go.id fetcher → replace `src/lib/etnos/data/*.json`
  snapshots. Likely a `scripts/fetch-bps.ts` run on a schedule.
- `scripts/generate-content.ts` calling the Anthropic Claude API to refresh
  `onthisday.json` (verified daily) + dashboard narrative summaries.
- `.github/workflows/etnos-content.yml` — daily cron that runs the script and
  commits updated JSON. Requires `ANTHROPIC_API_KEY` secret.
- Wikipedia REST API enrichment in wiki `+page.ts` for province-specific
  articles (CORS-friendly, no key).

### Real map upgrade
Current `PapuaMap.svelte` is a stylized SVG abstraction. Upgrade path when
geographic accuracy / pan-zoom is needed:
- Install `svelte-maplibre-gl` (MIERUNE, Svelte-5-first, MIT/Apache-2.0).
- Use Protomaps `pmtiles` (single file, served from Cloudflare itself → no
  third-party tile host).
- Relax CSP: add `worker-src 'self' blob:` (MapLibre flags this as
  `unsafe-eval`-like) and `img-src 'self' data: blob:`.
- Source: GeoJSON of post-2022 Indonesian provinces. Prefer MIT repos
  (e.g. `superpikar/indonesia-geojson`) over GADM (non-commercial restriction).

### SMS / radio gateways
**Memo §6.4.** Documentation page (`/sms`) explaining how unconnected
communities query and contribute via feature phone / community radio.
Backend later (Twilio / Vonage / local provider).

### Two-mode trust surfacing
**Memo §5.3.** Surface CARE / consent metadata on content: government-mode
posts show "BSrE-signed"; community-mode shows "Dewan Adat consent: t-of-n".
Display-only at first; enforcement needs PieFed federation hooks.

### LLM agent personas
**Memo §4.3 (PNS Digital).** Future: agent-author posts surfaced as Staf
Administrasi Digital / Operator Sistem Digital / Bendahara Digital /
Sekretaris Digital / Arsiparis Digital, with distinct badges and signed
provenance footers.

---

## ⚙️ Deployment

### Frontend — Cloudflare Pages (chosen)
- Free tier: 500 builds/mo, unlimited bandwidth, unique preview URL per
  push/branch (ideal for phone-based review).
- Build is already CF-ready: `svelte.config.js` selects the Cloudflare adapter
  when `CF_PAGES` is set; `wrangler.jsonc` points to `.svelte-kit/cloudflare`.
- Setup: connect the GitHub repo in the CF Pages dashboard once. Set Pages env
  vars (`PUBLIC_INSTANCE_URL`, `PUBLIC_INSTANCE_TYPE`, etc.). Node 20.
- Optional: add `.github/workflows/deploy-pages.yml` using
  `cloudflare/wrangler-action` (`wrangler pages deploy .svelte-kit/cloudflare`)
  gated on `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets, if the
  dashboard Git integration is undesired.

### Backend (own PieFed) — cheapest reference
PieFed (codeberg.org/rimu/pyfedi) needs Python 3.9+, PostgreSQL, Redis/Valkey,
≥1 Celery worker, gunicorn. Realistically ~**2 GB RAM**; 512 MB OOMs; 1 GB only
with swap + tuning. Docker-compose exists upstream.

| Tier | Backend | Domain | Frontend | Catch |
|---|---|---|---|---|
| **$0** | Oracle Always Free ARM A1 (2-4 GB slice) | free `is-a.dev`/`eu.org` subdomain | CF Pages free | ARM "out of capacity" hunting; reclaim if idle; rare account termination → keep daily off-site DB backups |
| **~$2-4/mo** | Hetzner CAX11 ARM ~€3.79 | Porkbun `.xyz` ~$1 yr1 (renews ~$11) | CF Pages free | none major; domain renewal rises |
| **Indonesia-local** | IDCloudHost 2 GB ~$5.5 | free/cheap | CF Pages free | pricier than Hetzner; low local latency |

**Avoid for backend:** Render / Koyeb / Railway / Fly free tiers — they sleep,
ban background workers (no Celery), or lack RAM for Postgres + Redis + Celery +
gunicorn together. Biznet Gio NEO Lite XS (~IDR 50k/$3) is ~1 GB — too small
unless heavily tuned + swap.

---

## 🧭 Phone-based dev workflow

This repo is developed inside Claude Code on the web (ephemeral cloud
container). **No native tunnel** is available — `localhost:5173` can't be
opened on a phone. The loop is:

1. Claude edits files in the container, runs `bun run check` / `bun run build`
   to prove the code is sound.
2. Push to `claude/etnos-explore-deploy-pwesg`.
3. Cloudflare Pages auto-builds a preview URL per push → user opens on phone.

The roadmap items above are added/popped here; the working plan is in
`/root/.claude/plans/root-claude-uploads-98f66fdc-22bf-4a80-ticklish-moonbeam.md`
(session-scoped). `CUSTOMIZATIONS.md` tracks per-file ETNOS edits for upstream
merges.
