# ETNOS — beta-readiness execution plan

> A scoped, ordered punch-list to take ETNOS from its current state to a **publicly-deployable beta on cloud infrastructure**, with backend still riding `piefed.social` for the iteration window. Backend self-hosting and Aksara hardware are explicitly out-of-scope for this plan and tracked separately.
>
> Source-of-truth audits this plan inherits from:
> - `docs/forum-readiness-alpha-beta.md` — 12-section audit with file:line cites and three cut-lines
> - `docs/photon-parity-audit.md` — Photon flagship-feature parity (alpha restore list = empty; four small beta items)
> - `docs/etnos/goal-ux.md` — the product north star
> - `docs/aksara/architecture.md` — Aksara hardware/runtime context (NOT in this plan's scope)
>
> Status: **v0.1**. Owner: ETNOS core. Last revision: 2026-06-08.

---

## The shape of beta

**A reasonable person opens etnos.papua.id on their phone and sees a polished civic forum.** They can read communities, vote, comment, sign up, get a verification email, file a report, switch language, install as a PWA, get a push when someone replies, share a post to WhatsApp. The legal pages are real. The moderators have a queue. The Sorotan board has hand-curated highlights. The map works. The directory works. The about page is real.

What they can NOT yet do (post-beta scope, not blocking):

- Talk to an Aksara node (hardware not yet deployed)
- File a surat domisili (Aksara civic flow)
- See live BPS dashboards (the data is still demo snapshots, clearly badged)
- Use voice input (Web Speech is a stretch goal)
- Participate in a grant-button flow with a Dewan (permission UX waits for Aksara)

This is **a working public-square beta on someone else's federation infrastructure**, ready to take real users while the backend and Aksara tracks mature in parallel.

---

## Cut-line — what makes beta vs what doesn't

### MUST for beta launch

Frontend polish + legal/compliance shell + minimal ops. Twelve items, all owned by us:

1. **Lock the backend target.** `.env.example:7` still points at `piefed.social`. Decide explicitly: stay on `piefed.social` flagship for beta, or stand up a single cloud node (Hetzner / IDCloudHost / Diskominfo VPS). Decision binds the next 6+ months of user-facing comms. ETA: decision = founder; implementation = 1 day either way.
2. **Hide `pmy` from the language picker.** Until the manual translation pass lands, exposing it claims Papuan Malay support we haven't built. One-line change in `src/lib/app/i18n/index.ts:16-20`. ETA: 15 min.
3. **Fill `/legal`.** Draft ToS, Privacy Policy (UU PDP-aligned), and Community Guidelines into Indonesian + English. Wire to `src/routes/legal/+page.svelte:1-21` (currently renders empty `legal_information` field). ETA: 1 day with template starts; 3 days with counsel review. Can ship a v0 in 4 hours.
4. **Populate Sorotan.** Currently `src/routes/explore/+page.svelte:30-40` renders the section header but no highlight cards. Wire a `sorotan.json` seed with 3–5 curated featured items (Hermes Agent intro, a Papuan-language community spotlight, an OTSUS dashboard preview), styled identically to the directory cards. ETA: 30 min for component + JSON.
5. **Localize keyword-filter settings** to `id` / `pmy`. Strings-only update from the Photon parity audit. Small. ETA: 1 hour.
6. **Backfill `id.json` against `en.json`** — close the ~15% gap especially on `moderation.*` and `form.report.*` keys. ETA: 2 hours.
7. **`<InstallBanner />` for PWA install.** ~50 lines per the parity audit; show contextually (after third successful session, dismissible). Critical for Android-mobile audience. ETA: 2 hours.
8. **Web Push** for inbox + mod reports. Service worker `push` handler + VAPID key flow. `src/service-worker.ts` needs the handler. ETA: 1 day.
9. **SSR on for `/`, `/c/[name]`, `/post/...`, `/u/[name]`** for SEO + WhatsApp share previews. Flip `PUBLIC_SSR_ENABLED=true` for production env and verify per-route overrides. ETA: 1 day, plus a verification pass.
10. **Per-post OpenGraph card generation** so WhatsApp share-target sends a nice preview. Server-side `<meta>` injection per route. ETA: 0.5 day.
11. **`sitemap.xml`** generated from communities + posts. SEO + crawl. ETA: 2 hours.
12. **Sentry frontend** with a free-tier DSN, wired through `+layout.ts`. WhatsApp on-call channel with two named admins. Notion incident log template. ETA: 2 hours wiring; 1 hour ops setup.

Total time-to-beta for the frontend slice, assuming a focused engineer-week: **~5 working days of execution**, plus the legal text writing (parallelizable).

### MUST for public exposure (legal / compliance — does not block frontend work)

These need to be done **before public marketing**, not before code freeze:

13. **Kominfo PSE Lingkup Privat registration** filed under PT Abstraksi Data & Kognitek. 2–4 week lead time. Start immediately. Founder track.
14. **UU PDP DSR self-serve** in `/settings/privacy` — export + delete endpoints, server-side scope to upstream backend. Defer if hosted on `piefed.social` umbrella; required if standing up own backend.
15. **abuse@ contact** with documented 24-hour SLA. Set up the email, document the process internally, post to `/legal`. ETA: 2 hours.
16. **Published 72-hour breach-notification policy** in `/legal/privacy`. Template-able, but counsel review recommended. ETA: 0.5 day.

### NICE for beta (do if time, skip if not)

17. **Cloudflare Turnstile** in front of `/signup`. The upstream `RequireApplication` mode is enough for invite-mode but Turnstile is correct for public.
18. **Email verification on by default** when public. (Currently configurable per backend instance.)
19. **Workbox-grade SW runtime caching** for feed / wiki. Stale-while-revalidate, offline-first reading. The current `src/service-worker.ts` is naive.
20. **"Mode Hemat Data" toggle** — data-saver setting that disables images, embeds, video, prefetch. First-class in `/settings`. Goal-UX §9.
21. **`docs/photon-parity-audit.md` item 4**: measure build size with MapLibre + fonts; lazy-load the map if over 250 KB initial budget.
22. **Bundle <250 KB initial** with code-splitting. The MapLibre and markdown editor are the obvious split candidates.
23. **Axe WCAG AA pass** — automated then manual. ETA: 1 day.
24. **Lighthouse throttled-Android-Go run** with regressions flagged on every PR.
25. **Status page** (instatus.com free tier) + UptimeRobot.

### POST-LAUNCH (explicitly not beta-blocking)

- KTP e-KYC for Tier-3 (Privy / Verihubs integration)
- Dewan-Adat vouching flow for Tier-4
- Aksara node onboarding ceremony UI (waits on Aksara hardware)
- Meilisearch sidecar (PieFed search is OK for now)
- Drafts auto-save
- BPS / Satudata live fetchers replacing demo snapshots
- WhatsApp deep-link share buttons (PWA `share_target` already handles inbound)
- Voice / video upload with CARE consent labels
- LightRAG agent memory layer per Aksara
- ActivityPods adapter shim (M2 of grant year, separate track)
- Full ActivityPods migration (2027+ when stack stabilises)

---

## Suggested execution sequence

Beta-readiness is ~5 working days of focused engineering plus the legal text. Sequence matters because some items unlock others.

### Day 0 — decisions

- Founder picks backend target (piefed.social vs own VPS for beta).
- Founder confirms domain (etnos.papua.id? etnos.id?) and DNS pointing at Cloudflare Pages.
- Founder starts Kominfo PSE filing (parallel, 2–4 weeks).
- Founder starts ToS / Privacy / Community Guidelines drafts (parallel, can use templates).

### Day 1 — frontend hygiene

- Hide `pmy` from picker (item 2)
- Localize keyword-filter settings (item 5)
- Backfill `id.json` gap (item 6)
- Wire Sentry frontend (item 12 partial)

### Day 2 — Sorotan + install banner + sitemap

- Populate Sorotan with seed cards (item 4)
- `<InstallBanner />` (item 7)
- `sitemap.xml` generator (item 11)

### Day 3 — SSR + OpenGraph + push

- Flip SSR on for production routes (item 9)
- Server-side OpenGraph injection (item 10)
- Web Push handler + VAPID (item 8)

### Day 4 — performance + a11y + bundle

- Code-split MapLibre + markdown editor (item 22)
- Measure bundle (item 21)
- Axe WCAG AA run (item 23)
- Lighthouse Android-Go run (item 24)

### Day 5 — legal page + comms

- Wire `/legal` content (item 3)
- Wire `abuse@` + post SLA (item 15)
- Publish breach notification policy (item 16)
- Status page + UptimeRobot (item 25)
- Internal: notify on-call channel set up, Notion incident log started (item 12 complete)

### Day 6+ — parallel tracks

- Kominfo PSE filing continues (4-week ETA from Day 0)
- Counsel review of legal text
- Beta invite list curation + first-batch send
- Monitor Sentry + the status page through the soft-launch cohort

---

## Decisions blocking this plan

The plan above assumes founder calls on:

1. **Backend target** — `piefed.social` flagship vs standing up a single cloud node. The plan works for either, but the choice changes the legal/compliance load (own-backend triggers Kominfo PSE + UU PDP DSR sooner; piggyback delays both).
2. **Domain** — `etnos.papua.id`, `etnos.id`, `etnos.papua-tengah.id`, etc. DNS / Cloudflare Pages config waits on this.
3. **Branding for beta vs alpha** — do we publicly call this "beta" or "early access"? Affects copywriting in `OnboardingModal.svelte` and `tentang/+page.svelte`.
4. **First-cohort size + invite plan** — capped at ~200 like the alpha brief suggested, or open from day 1 with rate limits and a polished onboarding?

These do not block engineering work on items 2–12 (those are unambiguously needed regardless), but they do block items 1, 13, 14.

---

## Backend track (deferred, agent-supported per founder)

Out of scope here, tracked for transparency:

- Self-host PieFed + Pictrs + Postgres + Redis + Celery + Gunicorn on Hetzner CAX11 or Indonesian VPS
- Nightly off-site `pg_dump` to Backblaze B2 / Wasabi
- SMTP wiring (Postmark / SES)
- Image-proxy via Cloudflare Image Resizing
- CSAM scanning on the Pictrs upload path (PhotoDNA / Thorn Safer)
- ActivityPods adapter shim (M2 of grant year, see `docs/aksara/proposal-v3.6-amendments.md` Amendment 7)

Founder noted these will be handled with agent support in a separate iteration. **None of them block the frontend beta-readiness plan above** while ETNOS rides `piefed.social`.

---

## Aksara track (deferred, hardware not yet built)

Also out of scope here:

- 10-unit Orange Pi 5 batch assembly (M3–M5 per proposal)
- Aksara device firmware (OS hardening, ATECC608B/Zymkey provisioning)
- LightRAG + sqlite-vec + OpenViking + Hermes Agent stack on the Pi
- First kelurahan pilot deployment (M6–M8)
- Civic Transaction primitive end-to-end test (surat domisili happy path)

These wait until ETNOS-the-public-square is live, which the plan above delivers.

---

## What this plan produces

At the end of ~5 engineer-days plus legal text:

- A polished, public-facing ETNOS forum at a final domain
- All routes localized to `id` + `en`, with `pmy` honestly absent from the picker
- Real `/legal` content
- A populated Sorotan board with curated highlights
- A working PWA install flow on Android
- Web Push notifications for inbox + mod reports
- SSR enabled for crawl + WhatsApp share previews
- A sitemap + OpenGraph cards for SEO
- Sentry + a status page + an on-call channel for ops
- Bundle under 250 KB initial, WCAG AA passing
- Kominfo PSE filing underway (not blocking soft-launch but visible publicly)

This is enough to take real users while the backend self-hosting and the Aksara pilot happen in parallel.
