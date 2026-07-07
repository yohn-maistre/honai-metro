# Codebase ground truth — ETNOS (Honai Metro)

> Generated 2026-06-28 against commit `abbeea90` on branch `main`.
> Coverage: **read in full** — deploy wiring (`svelte.config.js`, `vite.config.ts`, `.github/workflows/`, `wrangler.jsonc`, `.env.example`), API layer (`src/lib/api/base.ts`, `client.svelte.ts`, `piefed/adapter.ts`, `piefed/rewrite.ts`), auth/state (`profile.svelte.ts`, `settings.svelte.ts`, `instance.svelte.ts`, `i18n/index.ts`), routing (`+layout.ts`, `+layout.server.ts`, `modlog`, `moderation`, `signup`, `login`), and the primary direction docs. **Deep-mapped by subagents** — `src/lib/feature/*`, the `mono-svelte` UI lib, the route tree, the ETNOS surfaces. **Sampled** — the 277 individual `.svelte` components were not each read line-by-line. **Verified live** — `piefed.social` CORS + nodeinfo.
> Code is treated as the source of truth; doc claims are cross-checked, not assumed.

---

## 1. Snapshot

- **What it is**: A SvelteKit web client for Lemmy/PieFed forums — a heavy fork of [xyphyn/photon](https://github.com/xyphyn/photon) rebranded "ETNOS," a civic public-square for Papua, Indonesia. It is a **frontend only**; it talks to a PieFed backend (default `piefed.social`) over that backend's HTTP API. The ambitious "agent/wiki/civic/federation" platform described in the docs is product vision — the shipping code is a localized, Papua-themed forum client with bolted-on static-data surfaces.
- **Primary language**: TypeScript + Svelte 5 (runes). **Framework**: SvelteKit 2.50 / Svelte 5.49. **Styling**: Tailwind CSS 4. **Build**: Vite 6 + Bun. **Map**: MapLibre GL + `svelte-maplibre-gl` (the only runtime `dependencies`; everything else is `devDependencies`).
- **Shape**: client-side SPA (SSR off by default), ~501 tracked files, ~277 `.svelte` + ~116 `.ts`. Largest: generated API schema `src/lib/api/piefed/schema.d.ts` (6238 lines), `src/lib/api/types/generated.ts` (2473), `piefed/adapter.ts` (889).
- **How it boots / builds / tests / ships**:
  - build = `bun run build` → `vite build` (`package.json:51`); adapter chosen by env in `svelte.config.js:17-32` (`CF_PAGES=1` → `adapter-cloudflare`).
  - test = `vitest` (`package.json:52`); check = `svelte-kit sync && svelte-check` (`package.json:56`).
  - run (dev) = `bun run dev`; run (node prod) = `node build/index.js` (`package.json:54`).
  - deploy = push to `main` → GitHub Actions `.github/workflows/deploy-cf-pages.yml` builds with the cloudflare adapter and `wrangler pages deploy`. Manual fallback documented in `README.md:177-181`.
- **Entry points**: `src/app.html` (shell), `src/routes/+layout.ts:8` (client bootstrap + i18n), `src/routes/+layout.server.ts:4` (edge: Accept-Language), `src/routes/+page.svelte` (home feed). API entry: `src/lib/api/client.svelte.ts:54` (`client()` factory).

## 2. Architecture and wiring map

```
   Browser (CF Pages edge: Jakarta/Singapore PoPs)
        │  static SPA + tiny edge worker (SSR off)
        ▼
   SvelteKit app ── profile.current {instance, jwt, clientType}  (localStorage + jwt cookie)
        │                         │
        │  client() factory       │  reads at every call (client.svelte.ts:54-88)
        ▼                         ▼
   PiefedClient (Proxy)      LemmyClient
   adapter.ts methods map    lemmy/adapter.ts
        │  ~60 implemented · ~40 'unsupported'(throw)
        ▼
   cross-origin fetch ──────────────────────►  https://piefed.social/api/alpha/*
        ▲  CORS: access-control-allow-origin: *   (verified live)
        │
   ETNOS static surfaces (NO backend):
   src/lib/etnos/{data/*.json, wiki/*.md}  →  /explore /agen /wiki /bahasa /dashboard /tentang
```

- **Layers / boundaries**: (1) **Route/UI layer** `src/routes/*` + `src/lib/feature/*` (post/comment/community/user/inbox/moderation) + `mono-svelte` UI lib (`src/lib/ui/shared`, aliased in `svelte.config.js:35`). (2) **State layer** Svelte-5-runes singletons: `profile` (auth/multi-account), `settings`, `theme`, `site` (`client.svelte.ts:22`). (3) **API abstraction** `BaseClient` (`base.ts`) with two implementations (PieFed via Proxy, Lemmy). (4) **ETNOS content layer** static JSON/markdown bundled at build via `import.meta.glob` (`src/lib/etnos/wiki/index.ts:4`).
- **Control flow (one path, end to end — viewing the feed)**: `+layout.ts:8` boots i18n → `+page.ts`/route `load()` calls `client({func:fetch})` → `client.svelte.ts:54` resolves `profile.current.instance/jwt/client` → constructs `PiefedClient(instanceToURL(host))` → method on the `methods` Proxy (`adapter.ts:846`) → `executeMethod` (`adapter.ts:801`) does `openapi-fetch` GET to `https://piefed.social/api/alpha/post/list` → `transform()` maps PieFed schema → shared types (`rewrite.ts`) → Svelte renders `VirtualFeed.svelte`.
- **Cross-cutting concerns**:
  - **Config**: `$env/dynamic/public` `PUBLIC_*` vars, read in `instance.svelte.ts`, `settings.svelte.ts`, `+layout.ts`. Build-time inlined; set in the workflow `env:` block.
  - **Auth**: JWT in a JS-readable cookie + profiles in `localStorage` (`profile.svelte.ts:14-28,124`); attached as `Bearer` in `client.svelte.ts:81` / `customFetch:41`.
  - **Error handling**: `customFetch` throws SvelteKit `error()` on non-OK (`client.svelte.ts:50`); `executeMethod`/`assertData` throw on API errors (`adapter.ts:86`).
  - **State**: runes + `$effect.root` persistence (`profile.svelte.ts:286`, `settings.svelte.ts:213`).
- **External dependencies / integrations**: the PieFed/Lemmy backend (only true integration); CARTO map tiles (MapLibre, `PapuaMap.svelte`); `@dicebear/initials` for fallback avatars; `marked` for markdown. No database, no server of its own, no third-party SaaS wired yet (Sentry is roadmap).

## 3. Module-by-module ground truth

### API abstraction — `src/lib/api/`
- **Responsibility**: present one `BaseClient` interface (`base.ts`) over two backends; build per-call clients bound to the active profile.
- **Key files**: `base.ts:11` (`ClientType` lemmy=`/api/v3` / piefed=`/api/alpha`), `base.ts:38` (`fetchInfo` autodetects backend via `/nodeinfo/2.1`); `client.svelte.ts:54` (`client()` factory), `:24` (`customFetch` header/error wrapper); `piefed/adapter.ts` (declarative method map + Proxy dispatch); `piefed/rewrite.ts` (schema→shared transforms); `lemmy/adapter.ts` (the parallel Lemmy impl).
- **How it is wired**: every route/component calls `client()`/`getClient()`; the factory reads `profile.current` (`client.svelte.ts:68-78`).
- **Primitives / idioms**: `openapi-fetch` typed client over generated `paths` (`adapter.ts:846`); a `MethodDefinitions` map where each method is a `MethodConfig` (declarative GET/POST + `transform`), a custom `async (client, params) =>`, or the string `'unsupported'` (`adapter.ts:62-65`); dispatch via `Proxy` (`adapter.ts:846-865`).
- **Notable patterns and smells**: `'unsupported'` methods return a thunk that **throws** `"<m> is not supported on PieFed"` (`adapter.ts:855-858`) — see §5. `getSite` stubs all counts to `-1` (`adapter.ts:103-105`); `rewrite.ts toLocalSite` is a dead stub returning `{}` (`rewrite.ts`), so `local_site.*` (captcha_enabled, registration_mode, legal_information) is **always undefined on PieFed**. Author TODO/​confessions throughout (`adapter.ts:809` "i have been up for 3 hours…", `:658`, `:727`).

### Auth & multi-account state — `src/lib/app/auth/profile.svelte.ts`
- **Responsibility**: hold N accounts, the active one, persist them, hydrate user/site on switch.
- **Key files**: `:14-28` localStorage get/set; `:79-89` `current`/`client` `$derived`; `:114-138` `initCookieMigrate` (reads `jwt` cookie when `PUBLIC_MIGRATE_COOKIE`); `:174-214` `fetchUserData` → sets global `site.data`; `:216-241` `add`; `:243-262` `remove`/`move`; `:264-280` `isMod`/`isAdmin`; `:286-306` `$effect.root` persistence.
- **How it is wired**: `Profile.client` is the canonical client source; `fetchUserData` runs on every profile change and seeds `site`.
- **Smells**: documented race — "profile was switched too fast, ID mismatch" (`:191`); JWT in a non-httpOnly cookie + localStorage (XSS exposure, §5); `logout` is `'unsupported'` on PieFed so sign-out is client-side token drop only.

### Settings & theme — `src/lib/app/settings.svelte.ts`, `theme/`
- 100+-field `Settings` (`settings.svelte.ts:26-109`, with a `TODO extract into submodules` at `:7`); defaults pull `PUBLIC_*` env (`:111-192`); **default language `'id'`** (`:183`). Persisted via `mergeDeep` over `localStorage["settings"]` (`:194-225`). Theme default = **Honai Metro** warm palette (`theme/presets.ts`), env-overridable via `PUBLIC_THEME`.

### Routing & rendering — `src/routes/`
- **Upstream forum shell**: `c/`, `f/`, `post/`, `comment/`, `u/`, `inbox/`, `settings/`, `admin/`, `modlog/`, `moderation/`, `instances/`, `search/`, `create/`, `signup/`, `login/`.
- **ETNOS-original**: `explore/`, `agen/`, `bahasa/`, `dashboard/`, `tentang/`, `wiki/[category]/`, plus redirects `jelajah→explore` and `registry→agen#registry` (308) (`jelajah/+page.ts`, `registry/+page.ts`).
- **Rendering**: SSR gated globally by `PUBLIC_SSR_ENABLED` (`+layout.ts:6`, default false → static SPA + hydrate). The lone server load `+layout.server.ts:4` only reads `Accept-Language` (edge-safe). No `prerender` directives anywhere — even static pages (`/tentang`, `/wiki`) are client-rendered per request.

### ETNOS content surfaces — `src/lib/etnos/`
- **Entirely static, zero backend.** `wiki/index.ts:4` eager-globs `*.md`; `data/*.json` holds `directory.json`, `sorotan.json` (`demo:true`, populated), `bahasa.json`, `registry.json` (`demo:true`), and dashboard snapshots (`pendidikan/ekonomi/infrastruktur/kualitas-hidup/otsus/stats`, all `demo:true`). Routes `load()` these JSON/markdown and render with pure-SVG charts (`charts/`) and `PapuaMap.svelte`.
- `PapuaMap.svelte` — real MapLibre map (CARTO tiles, 6 provincial pills, Papua Tengah centered/highlighted, theme-aware). Eagerly imported on `/explore` (bundle-size implication, §7).

### UI library & features — `src/lib/ui/shared` (`mono-svelte`), `src/lib/feature/`
- `mono-svelte` re-exports a full component kit (Button, forms, Modal, Menu, Toast, Badge…). Features: `post/` (`PostForm.svelte` 499, `PostMeta.svelte` 448, `VirtualFeed.svelte` 298), `comment/` (`Comment.svelte` 331), `community/`, `user/` (`PictrsImage.svelte` hits backend media directly), `moderation/` (modals), `inbox/`. Command palette in `ui/navbar/commands/actions.svelte.ts` (434) builds the nav/action groups.

## 4. Doc direction vs. reality

The docs are unusually rich (21 in `docs/` + README + 3 root docs). They describe a multi-year sovereign-civic-agent platform; the code is the forum-client slice of it. The drift below is mostly **stale progress snapshots**, not contradiction.

| Doc claim / stated intent | Source doc | Reality in code | Verdict |
|---|---|---|---|
| "MapLibre is **not yet** added — PapuaMap is inline SVG" | `docs/forum-readiness-alpha-beta.md:91` | `src/lib/etnos/PapuaMap.svelte` uses `svelte-maplibre-gl`; `maplibre-gl` in `package.json:64` | **Drifted (stale)** — shipped after this audit |
| "Sorotan board… no actual highlight cards rendered" | `docs/forum-readiness-alpha-beta.md:104` | `data/sorotan.json` populated (`demo:true`); README marks ✅ | **Drifted (stale)** |
| Day-1/Day-2 items (hide `pmy`, populate Sorotan) are TODO | `docs/etnos/beta-readiness-plan.md:38-40` | `i18n/index.ts` has `pmy` commented out; Sorotan populated | **Drifted (done since)** |
| "/wiki, /dashboard — Placeholder content" | `walkthrough-1.md`, `implementation_plan.md` | Real markdown + demo dashboards (`CUSTOMIZATIONS.md` accurate) | **Stale/orphaned** |
| Moderation: "mod queue, modlog, reports… all functional" | `docs/forum-readiness-alpha-beta.md:51` | On PieFed, `getModlog`/`listPostReports`/`listCommentReports` are `'unsupported'` → routes error (`adapter.ts:760,765,768`) | **Aspirational on PieFed** (true only on Lemmy) |
| "email signup, captcha, registration application… working" | `docs/forum-readiness-alpha-beta.md:16` | `register` is `'unsupported'` on PieFed → in-app signup throws (`adapter.ts:772`) | **Aspirational on PieFed** |
| Backend: Oracle Cloud Always Free Ampere, Singapore | `docs/research/free-cloud-backend.md` | Not built (rides `piefed.social`); independently re-confirmed (see §8) | **Matches (plan, not built)** |
| `.env.example` default points at `piefed.social` | `README.md:147` | `.env.example:7` + workflow `env:` both `piefed.social` | **Matches** |

- **Stated direction**: a federated public-square (PieFed) + wiki + civic-data + agent-interop platform for Papua, with an "Aksara" institutional-agent hardware track and a 2027+ ActivityPods/NextGraph memory plane. Identity via `did:web`/`did:wba` + UCAN. North-star UX in `docs/etnos/goal-ux.md`.
- **Drift**: the two audit docs (`forum-readiness-alpha-beta.md`, the root `ETNOS_ROADMAP.md`/`implementation_plan.md`/`walkthrough-1.md`) predate the MapLibre + Sorotan + wiki/dashboard work and read as "not built" for things that are built. The README is the freshest source.
- **Undocumented behaviour**: the PieFed adapter's broad `'unsupported'` surface (~40 methods) and the `local_site` `{}` stub are real, important, and not mentioned in any doc — they silently disable moderation/admin/account/signup UIs on a PieFed backend.
- **Abandoned / scaffolded**: `ETNOS_ROADMAP.md`, `implementation_plan.md`, `walkthrough-1.md` at repo root are superseded progress logs (Windows paths, old branch name `claude/etnos-explore-deploy-pwesg`) not linked from the README index. Aksara track: 0 code, docs-only (per README, by design).
- **Contradictions**: `CUSTOMIZATIONS.md` "Instance Configuration" example still shows `PUBLIC_INSTANCE_URL=lemmy.ml` while `.env.example`/README use `piefed.social` (minor).

## 5. Code review findings

> Dimensions reviewed: deploy-readiness (CF Pages/edge/CSP), correctness (API layer, auth, routing), security (XSS, JWT, open-redirect), config completeness. Skipped: backend/infra security (no backend in-repo), perf profiling (static read only), full a11y audit. High/critical findings below were adversarially re-read against ground truth; two agent-reported "criticals" were **downgraded** after verification (noted inline).

### Critical / High
- **[HIGH] In-app signup does not work on a PieFed backend** — `src/lib/api/piefed/adapter.ts:772` + `src/routes/signup/[instance]/+page.svelte:78`. What: `register` is `'unsupported'` → the Proxy thunk throws; signup's `submit()` catches it (`+page.svelte:77`) and shows an error, so the page degrades gracefully but **no account is created**. Why: the headline operational caveat — on `piefed.social`, new users must register on PieFed's own web UI, then log in via ETNOS (`login` *is* implemented, `adapter.ts:623`). Fix: detect PieFed and route the "Sign up" CTA to the backend's native signup, or implement PieFed registration when self-hosting (PieFed's API gained registration endpoints — confirm against the target version).
- **[HIGH→ practically MED] `/modlog` and `/moderation` error on PieFed** — `src/routes/modlog/+page.ts:~225` calls `getModlog` unconditionally; `src/routes/moderation/+page.ts:33-41` calls `listPostReports`/`listCommentReports` in a `Promise.all`. Both are `'unsupported'` (`adapter.ts:760,765,768`) → the `load()` throws → SvelteKit renders the error page (not a global crash). Why: broken mod tooling on PieFed; mitigated now because these are mod/admin-only and the user isn't an admin of `piefed.social`. Fix: guard with `if (profile.current.client.name==='piefed') error(501, …)` or hide the nav entries when unsupported.
- **[MED — downgraded from agent "CRITICAL"] CSP may (but probably won't) block MapLibre workers** — `svelte.config.js:42-51` sets only `script-src 'self'`. Adversarial check: per CSP3, `worker-src` falls back to `child-src`→`default-src`, **not** `script-src`; none of those are set, so MapLibre's `blob:` worker is most likely **allowed**, and `script-src` does not govern Worker creation. Verdict: not a confirmed blocker. Fix (cheap hardening + must smoke-test): add `'worker-src': ['self','blob:']` and load `/explore` on the deployed Pages URL — if the map is blank with a CSP console error, this is why.
- **[MED — downgraded from agent "CRITICAL"] Signup hard-codes Lemmy client type** — `src/routes/signup/[instance]/+page.svelte:64` `instanceType = {name:'lemmy', baseUrl:'/api/v3'}`, passed to `profile.add()` at `:93`. Latent: it's *correct* for Lemmy backends, and on PieFed `register()` throws first so `:93` is never reached. Only bites if PieFed signup is later enabled without fixing this. Fix: derive the type from `data.site_view` / `fetchInfo`, don't hard-code.
- **[MED] Post-login redirect not origin-validated** — `src/routes/login/+page.svelte:~47,105` reads `?redirect=` and passes it to `goto(ref)`. Open-redirect risk is partially mitigated (SvelteKit `goto` is built for internal nav and rejects most external URLs), but defense-in-depth is one line. Fix: `goto(ref.startsWith('/') ? ref : '/')`.

### Medium
- **[MED] JWT in a JS-readable cookie + localStorage** — `profile.svelte.ts:124,14-28`. Any XSS → token theft. Inherited from upstream Photon. Markdown is sanitized (see Low), so exposure is low *today*, but keep the markdown/`{@html}` surface tight. Fix: prefer httpOnly cookies if/when a same-origin backend (the single-domain Worker) lands.
- **[MED] `local_site` is an empty stub on PieFed** — `rewrite.ts toLocalSite` returns `{}`. Anything reading `site_view.local_site.*` (captcha_enabled, registration_mode, **legal_information** → `/legal`, site config UIs) silently gets `undefined` on PieFed. Fix: populate `toLocalSite` from the PieFed site payload.
- **[MED] No prerendering for static routes** — `/tentang`, `/wiki/*`, `/dashboard`, `/bahasa` are pure static content but re-render client-side every visit (`+layout.ts:6` SSR off, no `prerender`). Cheap SEO/first-paint win available. Fix: `export const prerender = true` on the static ETNOS routes.

### Low / Nits
- `src/service-worker.ts:55` correctly skips `/api/`; cache-name is versioned so redeploys self-invalidate — acceptable; document a hard-refresh note.
- `src/lib/ui/shared/forms/select/Select.svelte:~172` `{@html option.label}` — all current call sites pass hardcoded i18n strings (safe), but it's an API footgun; sanitize if ever fed user input.
- `src/lib/ui/generic/Avatar.svelte` `{@html}` renders library-generated dicebear SVG from a seed (safe).
- Markdown XSS: **safe** — `src/lib/app/markdown/Markdown.svelte:~32-36` strips `javascript:` and renders via token→Svelte-component renderers (no raw `{@html}` for user content).
- Mixed icon imports: `@xylightdev/svelte-hero-icons` vs `svelte-hero-icons/dist` across files.
- `CUSTOMIZATIONS.md` env example shows `lemmy.ml` (stale).

## 6. Immediate fixes (quick wins)

| # | Fix | Where | Effort | Why it matters |
|---|---|---|---|---|
| 1 | Add `worker-src: ['self','blob:']` to CSP + smoke-test `/explore` after deploy | `svelte.config.js:43` | S | Removes the only plausible map-breaks-on-CF risk |
| 2 | Guard `/modlog` + `/moderation` loads for PieFed (`error(501)` or hide nav) | `src/routes/modlog/+page.ts`, `moderation/+page.ts` | S | Stops error-page UX for mods on PieFed |
| 3 | Point the "Sign up" CTA to PieFed's native signup on PieFed backends | `signup/[instance]/+page.svelte` | S | Users currently cannot create accounts in-app on `piefed.social` |
| 4 | Validate login redirect is same-origin | `login/+page.svelte:105` | S | Closes open-redirect defense-in-depth |
| 5 | `prerender = true` on `/tentang`, `/wiki`, `/dashboard`, `/bahasa` | those `+page.ts` | S | Free SEO + first-paint for static content |
| 6 | Derive signup `clientType` instead of hard-coding `lemmy` | `signup/[instance]/+page.svelte:64` | S | Removes a latent wrong-adapter bug |
| 7 | Delete/Archive superseded root docs into `docs/archive/` | `ETNOS_ROADMAP.md`, `implementation_plan.md`, `walkthrough-1.md` | S | Stops stale "not built" docs misleading readers |

## 7. Areas of improvement

- **PieFed adapter completeness & graceful degradation** — problem: ~40 `'unsupported'` methods throw, and UI doesn't know which features exist per backend; direction: a capability map the UI reads to hide/disable unsupported actions (instead of throwing on click/navigate); payoff: no error pages, honest UX, smoother Lemmy↔PieFed parity. Start with `toLocalSite` population so site-config-driven UI works.
- **Bundle discipline for the 3T/Android-Go audience** — problem: MapLibre (~150KB) eagerly imported on `/explore`, wiki globbed eagerly, no budget; direction: lazy-load `PapuaMap` + markdown editor, code-split, enforce <250KB initial (the docs' own goal, `goal-ux.md:127`); payoff: the actual target users can load it.
- **SSR/prerender strategy** — problem: SSR off everywhere hurts SEO + WhatsApp share previews (a stated beta goal); direction: prerender static ETNOS routes now; enable SSR for `/`, `/c/[name]`, `/post/...`, `/u/[name]` per the beta plan, verified per-route; payoff: shareable, crawlable, faster first paint.
- **Auth hardening** — problem: JWT in JS-readable storage; direction: move to httpOnly same-origin cookies once the single-domain Worker backend lands; payoff: removes the token-theft class.

## 8. Roadmap / implementation plan

1. **Ship the free test deploy (now) — S.** Add 2 CF secrets, push `main`; live at `etnos.pages.dev` against `piefed.social`. Apply quick-fixes #1–#3 first so the map renders and mods/signups don't hit error pages. Depends on: nothing.
2. **Frontend beta polish — M.** Execute `docs/etnos/beta-readiness-plan.md` Days 2–5 (InstallBanner, sitemap, OpenGraph, SSR flip, Sentry, `/legal` content, `id.json` backfill). Depends on: phase 1.
3. **Stand up own backend (free, near Indonesia) — M.** PieFed + Postgres + Redis + Celery + pict-rs via Docker Compose on **Oracle Cloud Always Free Ampere A1, `ap-singapore-1`** (independently re-confirmed 2026-06-28 as the only viable always-free, no-sleep, Asia-region option; ~13–50ms to Jakarta). Self-host Redis (Upstash free dies under Celery polling); nightly `pg_dump` to Cloudflare R2 or Backblaze B2. Depends on: phase 1 validating UX.
4. **Single-domain cutover — M.** Deploy the CF Worker reverse-proxy (`docs/etnos/single-domain-architecture.md`) so `etnos.papua.id` serves frontend + federation; migrate handles `@user@etnos.papua.id`; populate `toLocalSite`; implement PieFed registration. Depends on: phase 3.
5. **Compliance + Aksara (parallel, funded) — L.** Kominfo PSE filing, UU PDP DSR, CSAM scanning; then the Aksara agent track (docs-only today). Depends on: own backend.

## 9. Open questions and unknowns

- Does MapLibre actually render under the current CSP on deployed CF Pages? → resolve by: deploy + load `/explore`, check console for CSP violations.
- Does the target PieFed version expose a registration API (so in-app signup can work when self-hosted)? → resolve by: check PieFed `/api/alpha` docs for the pinned version; test against own instance.
- Are the ~277 components free of other `'unsupported'`-method call sites that throw at runtime (beyond modlog/moderation/signup)? → resolve by: grep route `load()`s + action handlers for adapter methods in the `'unsupported'` list; add the capability-map guard (§7).
- Real bundle size with MapLibre + fonts vs the <250KB goal? → resolve by: `bun run build` + analyze (note: heavy on the dev phone — run in CI).
- Lemmy-backend parity: do the Lemmy-only features (modlog/reports/register) actually work end-to-end, or is the Lemmy adapter also partial? → resolve by: review `lemmy/adapter.ts` (not deeply read this pass).
