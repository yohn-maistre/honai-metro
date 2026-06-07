# Forum readiness — alpha & beta punch-list

Audit of the ETNOS forum / public-square surface against two ship gates:

- **Alpha**: closed cohort, ~50–200 invitees, Papua Tengah pilot. Bugs allowed; goal is to learn.
- **Beta**: public launch in a single province, thousands of users. Must be solid — legal cover, on-call, moderation, abuse controls, accessibility.

Current state: a Photon fork (Svelte 5 client) pointing at PieFed's `piefed.social` flagship by default (`.env.example:7`), with ETNOS-original surfaces grafted on (`/explore`, `/agen`, `/wiki`, `/bahasa`, `/dashboard`, `/tentang`). The forum/post/comment/feed path is essentially upstream Photon. Federation works because we ride PieFed's existing alpha; we have not stood up our own backend.

---

## 1. Auth & onboarding

Signup is upstream Photon (`src/routes/signup/[instance]/+page.svelte:43-100`) with captcha, honeypot, registration-mode handling (open / RequireApplication / EmailVerify), and password verify. Login (`src/routes/login/+page.svelte`) supports TOTP. ETNOS adds a first-visit modal (`src/lib/etnos/OnboardingModal.svelte:1-42`) gated on `localStorage`.

- Working: email signup, captcha, registration application, TOTP, password reset.
- Phone verification not implemented. Tier-3 (KTP) / Tier-4 (vouched) badges are stubs (`src/lib/etnos/UserBadges.svelte:32-41`).
- Onboarding modal is four bullets — no language picker, no community-pick, no consent capture.
- No ToS / Privacy click-through gate before account creation.
- **Alpha**: ship as-is with `RequireApplication` mode; hand-screen invitees; add a single ToS checkbox.
- **Beta**: email verification on by default, ToS/Privacy click-gate, language picker in the modal, Cloudflare Turnstile or hCaptcha in front of `/signup`.
- **Post-launch**: KTP e-KYC (Privy/Verihubs) for Tier 3; Dewan-Adat vouching for Tier 4 (memo §6.3).

## 2. Federation backend

`ETNOS_ROADMAP.md:135-149` documents three hosting tiers. Default `.env.example:7` points at `piefed.social` — i.e. we are piggybacking, not running our own.

- Alpha can ride `piefed.social` (zero hosting), but we do not own accounts, mod, or data — fine for 50 invitees, not for "ours."
- Stand-up option: Hetzner CAX11 ARM (~€3.79/mo). ~2 GB RAM is the floor for PieFed + Postgres + Redis + Celery + gunicorn.
- No SMTP configured. PieFed needs one for verify + reset. Postmark or SES with SPF/DKIM/DMARC.
- No Pictrs setup notes — uploads route through the backend's Pictrs; self-hosting means standing one up with size limits, EXIF stripping, S3-or-equivalent retention.
- Backup story is only a footnote (`ETNOS_ROADMAP.md:142`).
- **Alpha**: either `piefed.social` *or* a single Hetzner box with docker-compose, manual backups. Pick one.
- **Beta**: own PieFed instance, SMTP (Postmark), Pictrs with CSAM-scanned uploads, nightly pg_dump to Backblaze B2 / Wasabi, ≥7-day retention.
- **Post-launch**: read-replica, S3-backed Pictrs, per-province peer instances.

## 3. Forum core features

Communities, posts, comments, votes, sorting, modlog, reports, saved, inbox — all upstream Photon + PieFed adapter, all routed (`src/routes/c/[name]/+page.svelte`, `src/routes/post/[instance]/[id=integer]/+page.svelte`, `src/routes/modlog/+page.svelte`, `src/routes/saved/+page.svelte`, `src/routes/inbox/+page.svelte`). Community creation: `src/routes/create/community/+page.svelte:1-8`. Post creation via `PostForm.svelte`.

- Search (`src/routes/search/+page.svelte`) hits the PieFed/Lemmy `/search` endpoint — no Meilisearch, weak Indonesian stemming.
- No drafts UX — `getSessionStorage('lastSeenCommunity')` is the only persistence (`src/routes/create/post/+page.svelte:15`).
- Notifications: in-app inbox works. **Web Push not implemented** (no `PushManager.subscribe`, no VAPID).
- Cross-instance subscribe works via adapter; not load-tested for Papua latency.
- **Alpha**: forum loop works. Accept mediocre search and no push.
- **Beta**: Web Push for inbox + mod reports; sitemap on community/post URLs; verify federation handshake against ≥1 peer end-to-end.
- **Post-launch**: Meilisearch sidecar, drafts auto-save, saved-search alerts.

## 4. Moderation & safety

Mod queue (`src/routes/moderation/+page.svelte`), modlog (`src/routes/modlog/+page.svelte`), reports (`src/routes/moderation/Report.svelte`) with batch-resolve, registration applications (`src/routes/registration_applications/+page.svelte`), federation block list (`src/routes/admin/federation/+page.svelte`), instance blocks (`src/routes/instances/blocked/+page.svelte`) — all upstream Photon, all functional.

- No CSAM detection. PieFed has none built-in; Pictrs uploads are unscanned. Non-negotiable beta gate.
- No keyword/regex spam filter at the client; relies on backend rate limits.
- `/legal` (`src/routes/legal/+page.svelte:1-21`) renders `local_site.legal_information` markdown — empty until populated.
- No Indonesia-compliance surfaces: no Kominfo PSE tracker, no UU ITE takedown SLA, no UU PDP (Law 27/2022) DSR endpoint, no DMCA contact.
- Indonesian moderation preset exists in `src/lib/app/settings.svelte.ts` (`CUSTOMIZATIONS.md:42`).
- **Alpha**: hand-mod the cohort; two named admins on WhatsApp on-call; ETNOS guidelines sticky in every seeded community. Skip CSAM scanning only if uploads are disabled.
- **Beta**: PhotoDNA-or-Thorn-Safer on Pictrs upload; Kominfo PSE Lingkup Privat registration complete; UU PDP data export + delete; abuse@ contact with 24-hr SLA; ≥3 mods across Papua Tengah + 1 backup.
- **Post-launch**: automated toxicity classification, federation-block decisioning playbook, Dewan-Adat moderation for `ruang-adat` (memo §5.3).

## 5. i18n & localization

Loaders restricted to `en`, `id`, `pmy` (`src/lib/app/i18n/index.ts:11-20`); other 18 upstream locales commented out. `id.json` 1007 lines, `pmy.json` 1007 lines, `en.json` 1130 lines — `id`/`pmy` cover ~89% of English keys.

- `pmy` is **not Papuan Malay yet** — it is a duplicate of `id.json` (`CUSTOMIZATIONS.md:33`).
- ETNOS-specific keys (`etnos.*`) populated in all three.
- Date/number formatting: depends on browser defaults.
- `/bahasa` is real content (`src/routes/bahasa/+page.svelte` + `src/lib/etnos/data/bahasa.json`) — Ruang Bahasa hub with 9 Papuan languages + endangerment badges.
- **Alpha**: ship `id` default, `en` peer, `pmy` *hidden* or labelled "kopi `id`" so we don't promise what we haven't built.
- **Beta**: backfill ~120 missing `id` keys against `en.json`; commission a Papuan-Malay pass over `pmy.json` (or remove from picker); locale-aware date/number formatter.
- **Post-launch**: per-community language tagging; Wamena/Nabire dialect refinements.

## 6. Mobile & PWA

Manifest is ETNOS-branded (`static/manifest.json:1-63`), maskable icon, screenshots, share-target, shortcuts to Wiki/Dashboard/Inbox. Service worker at `src/service-worker.ts:1-89` — naive cache-first for static assets, network-first with cache fallback elsewhere, no runtime strategy for feed/wiki.

- Web Push not wired.
- Offline reading: caches last-successful per URL; no stale-while-revalidate.
- Roadmap acknowledges this (`ETNOS_ROADMAP.md:51-56`).
- Mobile UX: Photon shell is solid; ETNOS routes carried in navbar profile menu.
- **Alpha**: manifest + install banner is enough; document "Add to Home Screen" in the onboarding modal.
- **Beta**: Web Push for inbox; Workbox or `@vite-pwa/sveltekit` runtime caching for feed + wiki; "Mode Hemat Data" toggle for 3T users.
- **Post-launch**: full offline-first with deferred-post outbox; SMS gateway integration.

## 7. Performance & accessibility

SSR is off by default (`PUBLIC_SSR_ENABLED=false`, `+layout.ts:6`); Cloudflare Pages serves static + client hydrate. Correct for free-tier alpha; hurts SEO + first-paint.

- No bundle-size budget (`vite.config.ts:1-18`).
- MapLibre is **not yet** added — current `PapuaMap.svelte` is inline SVG (`CUSTOMIZATIONS.md:67`). The ~150 KB MapLibre cost is hypothetical until the geographic upgrade ships per `docs/research/map-library-choice.md`.
- Dark mode: covered by upstream Photon.
- WCAG AA: skip-nav wired (`src/routes/+layout.svelte:130-135`); no formal audit; needs an axe run.
- Android Go target untested. Feed is virtualized (`VirtualFeed.svelte`).
- CSP: `script-src 'self'` report-only (`svelte.config.js:42-51`).
- **Alpha**: ship as-is; tell invitees it is alpha.
- **Beta**: bundle budget <250 KB initial; axe AA pass; Lighthouse throttled-Android-Go run; SSR on for `/`, `/c/[name]`, `/post/...`, `/u/[name]`; image `loading="lazy"` audit on `PictrsImage.svelte`.
- **Post-launch**: AVIF transcoding, CDN-side resize, Mode Hemat Data toggle.

## 8. Discovery & curation

`/explore` (`src/routes/explore/+page.svelte:23-135`) is the hub: Papua map, Sorotan section (header only — **no actual highlight cards rendered**, `:30-40`), directory groups from `src/lib/etnos/data/directory.json`, then upstream Communities/Feeds/Topics tabs. `/jelajah` redirects here. `/agen` hosts open MCP registry + Aksara placeholder.

- Sorotan board is a structural stub.
- Curated directory is a static JSON edited in-repo; no admin UI, no review workflow.
- SEO: `robots.txt` sensible (`static/robots.txt:1-19`). No sitemap. No OpenGraph generator (per-page `<meta>` only).
- `static/llms.txt` + `static/ai.txt` declare AI ingest policy.
- **Alpha**: hand-curate `directory.json`; empty Sorotan is acceptable.
- **Beta**: populate Sorotan (admin-editable, not JSON-in-repo); `sitemap.xml` from communities + posts; per-post OpenGraph for WhatsApp shares.
- **Post-launch**: server-side OG image generation; weekly editorial digest.

## 9. Operations

- No Sentry, no OpenTelemetry, no analytics. Cloudflare Pages gives Workers analytics; nothing app-level.
- No status page, no incident playbook, no on-call rota.
- Deploy: CF Pages auto-build from `claude/etnos-explore-deploy-pwesg` (`ETNOS_ROADMAP.md:122-133`). `.github/workflows/` has `docker-image.yml`, `lint.yml` only.
- Logs: whatever CF Pages + PieFed give; no aggregation.
- **Alpha**: Sentry frontend (free ≤5k events/mo); WhatsApp on-call with two admins; a Notion incident log.
- **Beta**: status page (instatus.com free); written incident playbook with severity tiers; UptimeRobot; backend logs to Grafana Loki on the Hetzner box; deploy gate (lint + check must block).
- **Post-launch**: OpenTelemetry traces, Prometheus, SLO dashboard.

## 10. Legal & policy

- `/legal` (`src/routes/legal/+page.svelte:1-21`) renders the backend `legal_information` field — **empty**.
- No `/privacy`, no `/community-guidelines`, no `/dmca` route.
- README mentions Local Contexts + CARE — content policy, not legal compliance.
- Indonesia: Kominfo PSE Lingkup Privat registration is mandatory (Permenkominfo 5/2020); non-registration → access blocking. UU PDP requires DSR endpoints + 72-hr breach notification. UU ITE governs takedown.
- **Alpha**: ToS draft + Indonesian counsel review; Privacy Policy stub; `/wiki/panduan` community guidelines; abuse@ email. Kominfo PSE started but not blocking.
- **Beta**: Kominfo PSE *complete* before public launch (~2–4 week process — start now); UU PDP DSR self-serve in `/settings/privacy`; takedown email + 48-hr SLA; published breach-notification policy.
- **Post-launch**: per-province legal review as we federate.

## 11. Content seeding

- 9 Papuan-language communities wired via `directory.json` + `bahasa.json`, surfaced at `/bahasa`.
- Wiki articles (`src/lib/etnos/wiki/*.md`): tempat, sejarah, biodiversitas, suku-bahasa, kuliner — real content (`CUSTOMIZATIONS.md:60-61`).
- `tentang/+page.svelte:9-49` is real (mission, four trust tiers, Abstraksi).
- Dashboard data: snapshot JSONs in `src/lib/etnos/data/*.json`, all `demo: true` with badge.
- No first-50 onboarding plan in-repo. No seed-post list. No "first thread to reply to" sticky.
- **Alpha**: 10–15 seed communities (9 Papuan-language + Papua Tengah pemerintah + Wamena + Nabire + 1–2 wiki); 3 seed posts per community by hand; one "Selamat datang" sticky per room; invite first 20 by name.
- **Beta**: editorial calendar (weekly Sorotan editor); directory expanded to all 6 provinces' anchor communities; `/tentang` translated; `/wiki` index; replace demo dashboard with live BPS fetch.
- **Post-launch**: WhatsApp-deeplink share buttons on every post.

## 12. Server-side / API

- SSR off (`+layout.ts:6` reads `PUBLIC_SSR_ENABLED`; default false). Per-route ssr overrides on `/util/instance`, `/profile/+layout.ts`, `/activitypub/externalInteraction/+page.ts`.
- No image proxy — `PictrsImage.svelte` hits the backend directly.
- No frontend rate limiting; depends on backend.
- Federation handshake testing not in CI.
- **Alpha**: leave SSR off — static shell + client hydrate is fine for an invite cohort.
- **Beta**: SSR on for `/`, `/c/[name]`, `/post/...`, `/u/[name]` (SEO + first-paint); image proxy via Cloudflare Image Resizing or thin Worker (perf + referrer-leak); manual end-to-end federation test against piefed.social before public switch.
- **Post-launch**: ActivityPub conformance suite in CI.

---

## Cut-line: must-have for alpha (closed cohort, can be rough)

- Lock backend: `piefed.social` *or* one Hetzner CAX11 — pick one, document in `.env` (`.env.example:7`).
- SMTP wired (Postmark/SES) — password reset + verification emails actually send.
- `RequireApplication` registration mode + ToS checkbox on signup (`src/routes/signup/[instance]/+page.svelte:43`).
- ToS + Privacy + Community Guidelines drafts in `/legal` and `/wiki/panduan` (`src/routes/legal/+page.svelte:14`).
- Hide `pmy` from picker until it is not a copy of `id.json` (`src/lib/app/i18n/index.ts:16-20`).
- Sentry frontend; one WhatsApp on-call channel with two named admins.
- 10–15 seed communities with sticky welcome posts; 3 seed posts each.
- Invite list capped, sent by hand, with personalized DM.
- Onboarding modal mentions Install-to-Home-Screen (`src/lib/etnos/OnboardingModal.svelte:26-42`).

## Cut-line: must-have for beta (public, thousands, must be solid)

- Self-hosted PieFed + Pictrs + Postgres + Redis on a real VPS with nightly off-site pg_dump.
- Kominfo PSE Lingkup Privat registration complete (start now — 2–4 weeks).
- CSAM scanning on the Pictrs upload path (PhotoDNA via Cloudflare or Thorn Safer).
- UU PDP DSR self-serve in `/settings/privacy`; published 72-hr breach policy; abuse@ with 48-hr SLA.
- Cloudflare Turnstile (or hCaptcha) on `/signup` + login; email verification on by default.
- Web Push for inbox + mod reports (`src/service-worker.ts` needs a `push` handler + VAPID keys).
- Workbox-grade SW runtime caching for feed/wiki; "Mode Hemat Data" toggle for 3T users.
- SSR on for `/`, `/c/[name]`, `/post/...`, `/u/[name]`; per-post OpenGraph for WhatsApp; `sitemap.xml`.
- `id.json` backfilled against `en.json` gap; `pmy.json` real translation pass *or* `pmy` removed from picker.
- Bundle budget <250 KB initial; axe WCAG AA pass; Lighthouse Android Go run.
- Status page + uptime monitor + written incident playbook + ≥3 mods across Papua Tengah.
- Sorotan board populated by admin UI (not JSON-in-repo); directory editable without a deploy.
- Federation handshake verified end-to-end against ≥1 peer instance.

## Cut-line: post-launch / not blocking

- KTP e-KYC (Tier 3) + Dewan-Adat vouching (Tier 4) per memo §6.3 — `UserBadges.svelte` stubs go live.
- MapLibre geographic upgrade to `PapuaMap.svelte` (~150 KB gzipped budget impact).
- Meilisearch sidecar for Indonesian-stemmed search.
- Drafts auto-save; saved-search alerts.
- BPS/Satudata live fetcher replacing `src/lib/etnos/data/*.json` snapshots; LLM content automation per roadmap.
- WhatsApp deep-link share buttons; SMS / radio gateway docs page.
- Voice/video uploads with CARE consent labels (memo §6.4).
- Aksara node ceremony surface (`docs/aksara/onboarding.md` → real flow at `/agen/aksara/log`).
- ActivityPub conformance suite in CI; OpenTelemetry traces; per-province peer instances.
- LLM agent personas (memo §4.3) with signed provenance footers.
