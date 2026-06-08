# ETNOS vs Photon — Flagship-Feature Parity Audit

Last reviewed against upstream `xyphyn/photon` `main` at v2.3.1 (Apr 2025) and ETNOS
fork-point `photon-lemmy@2.3.0`. The intent: catch anything we silently dropped
that hurts the alpha/beta launch in Papua.

## TL;DR

The honest answer is: **we dropped almost nothing of substance**. The fork
diverged on top of v2.3.0, the same baseline Photon ships in v2.3.1, so the
post/comment/feed/moderation surface is byte-identical for almost every flagship
feature Photon advertises. The only feature classes we should worry about are
**(a)** an explicit PWA install banner (Photon never shipped one either, so this
is a parity-with-LEMMY-UI question, not a parity-with-Photon question);
**(b)** opt-in keyword filtering UI in our localized settings page; and **(c)**
the optional `xylight_mode` donate/credit footer (deliberately suppressed — leave
suppressed). There is **no missing video player, no missing image carousel, no
missing modtools, no missing markdown editor extras, no missing keyboard
palette** — every one of those is present in our tree. The real beta gaps are
ETNOS-original: localized moderation presets, civic-specific reports, and the
PieFed admin federation flow — none of which are Photon's to give.

Net: **restore-now list is empty; restore-for-beta is a list of three small
polish items; skip-permanently is the donate footer and the et/de/fi/ja/pl/etc.
locale dropdown.**

## Flagship Feature Inventory

| Photon feature | In ETNOS? | If no, why | Restore? | Effort |
| --- | --- | --- | --- | --- |
| Multi-account switching | Yes — `src/lib/feature/user/ProfileSelection.svelte`, wired at `src/lib/ui/sidebar/Sidebar.svelte:52-59` | — | — |
| Lemmy + PieFed dual backend | Yes — `PiefedClient` at `src/lib/feature/post/form/PostForm.svelte:3,69` | — | — |
| Infinite scroll | Yes — `svelte-infinite-scroll` at `src/lib/feature/post/feed/VirtualFeed.svelte:21,295` | — | — |
| Virtualized comment list | Yes — `src/lib/feature/comment/CommentListVirtualizer.svelte` | — | — |
| Image post viewer (lightbox + alt text) | Yes — `src/lib/feature/post/media/PostImage.svelte:23-108`, expand modal via `src/lib/ui/generic/ExpandableImage.svelte:11` | — | — |
| Native video player | Yes — `<video controls>` in `src/lib/feature/post/media/PostIframe.svelte:129-132` | — | — |
| YouTube via Invidious/Piped | Yes — `src/lib/feature/post/media/PostIframe.svelte:13-66` | — | — |
| Click-to-view embeds (bandwidth saver) | Yes — `settings.embeds.clickToView` at `settings.svelte.ts:78,161`, gated at `PostIframe.svelte:114-115,128` | — | — |
| Polls (PieFed v1.4+) | Yes — `src/lib/feature/post/media/PostPoll.svelte` | — | — |
| Events (PieFed v1.4+) | Yes — `src/lib/feature/post/media/PostEvent.svelte` | — | — |
| Custom thumbnails (v2.2.2) | Yes — `PostForm.svelte:76`, persisted in `postform.svelte.ts:98,113` | — | — |
| Markdown toolbar (12 buttons incl spoiler/sub/sup) | Yes — `src/lib/app/markdown/MarkdownEditor.svelte:172-288` | — | — |
| Editor shortcuts (Ctrl+B/I/S/H/K, Ctrl+Enter) | Yes — `MarkdownEditor.svelte:59-65,79-85` | — | — |
| Paste-image-into-editor | Yes — `MarkdownEditor.svelte:309-315` | — | — |
| Spoiler / subtext / table renderers | Yes — `src/lib/app/markdown/renderers/{spoiler,subtext,table}/` | — | — |
| Sub/superscript markdown | Yes — `MdSubscript.svelte`, `MdSuperscript.svelte` | — | — |
| LaTeX / Mermaid | **Never had upstream** — no math/mermaid in `MarkdownEditor` or renderers; grep returns 0 hits in our tree | No | — |
| Theme system (multi-theme, presets, color editor) | Yes — `src/lib/app/theme/theme.svelte.ts`, `presets.ts` (Honai Metro + Mono/Classic/AMOLED/Catppuccin/Neutral), editor at `src/routes/theme/+page.svelte:135-146` | — | — |
| `PUBLIC_THEME` instance default export | Yes — `src/lib/app/theme/presets.ts:85,92,100-102` | — | — |
| Light / dark / system color scheme | Yes — `Sidebar.svelte:131-155` | — | — |
| Command palette (Ctrl-K / Ctrl-P / `/`) | Yes — `src/lib/ui/navbar/commands/CommandsHost.svelte:11-19`, palette at `Commands.svelte:141-187` | — | — |
| Per-action keyboard shortcuts | Yes — `actions.svelte.ts:87,249,380`, dispatcher `Commands.svelte:141-154` | — | — |
| Crosspost flow | Yes — `crosspostB64()` `PostActionsMenu.svelte:30-43,66-70` | — | — |
| Hide / unhide post | Yes — `hidePost()` `helpers.ts:122-133`, button `PostActionsMenu.svelte:86-105` | — | — |
| Mark-read tracking | Yes — auto-mark on open `routes/post/[instance]/[id=integer]/+page.svelte:43-52`, settings `settings.svelte.ts:72,157` | — | — |
| Fade-read posts | Yes — `markReadPosts` flag `settings.svelte.ts:30,114` | — | — |
| Resumables / continue-where-you-left-off | Yes — `resumableStore` `src/lib/feature/legacy/item.ts:87-106`, surfaced in palette via `Commands.svelte:9,31` | — | — |
| Keyword/URL post filters (v2.3.0) | Yes — `src/lib/feature/post/filters.svelte.ts:1-41`, integrated in `PostFeed.svelte:59`, `VirtualFeed.svelte:226` | — | — |
| Filter settings UI | Routes present but **not localized** to `id`/`pmy` | Beta | S |
| PieFed user notes | Yes — `src/lib/feature/user/UserNote.svelte:1-58` | — | — |
| User / instance / community blocks | Yes — `src/routes/profile/(local_user)/settings/+page.svelte` and inbox routes | — | — |
| Full mod menu (ban, remove, lock, feature, view-votes) | Yes — all 9 upstream files in `src/lib/feature/moderation/` | — | — |
| Reports queue + sub-routes | Yes — `src/routes/moderation/{+page,Report,c/[id=integer],communities}` | — | — |
| Modlog | Yes — `src/routes/modlog/`, `modlogCardView` setting `settings.svelte.ts:64,150` | — | — |
| Admin panel (6 subroutes) | Yes — `src/routes/admin/{applications,config,federation,media,taglines,team}` | — | — |
| Registration applications | Yes — `src/routes/registration_applications/` | — | — |
| Inbox (replies, mentions, DMs) | Yes — `src/routes/inbox/`, `InboxItem.svelte` | — | — |
| Private messages w/ markdown | Yes — `settings.messages.fullMarkdown` `settings.svelte.ts:106,189` | — | — |
| Saved items | Yes — `src/routes/saved/` | — | — |
| Multi-language UI | Yes; **ETNOS commented out ~15 upstream locales** to keep `id`/`pmy`/`en` only, per CUSTOMIZATIONS.md | Skip | — |
| PWA + share_target | Yes — `static/manifest.json:53-61`, shortcuts: Wiki/Dashboard/Inbox | — | — |
| Auto cross-server retrieval (v2.3.0) | Yes — inherited via API-adapter rewrite | — | — |
| Auto-detect server software at login (v2.2.0) | Yes — inherited | — | — |
| Cozy / Compact view toggle | Yes — `settings.view` `settings.svelte.ts:9,37,153` | — | — |
| NSFW blur toggle | Yes — `settings.nsfwBlur` `settings.svelte.ts:59,140` | — | — |
| QR code share | Yes — `@svelte-put/qr`, imported in `PostForm.svelte:44` | — | — |
| Donate / Buy-Me-A-Coffee footer | **Suppressed** — `env.PUBLIC_XYLIGHT_MODE` gate `Sidebar.svelte:227` | Skip | — |
| `/translators`, `/activitypub`, verify-email, password-reset routes | Yes — preserved | — | — |

## Mobile UX

Photon's mobile story has always been **PWA-and-CSS**, not gesture-heavy. There
is no swipe-to-vote, no pull-to-refresh, no native gesture library, and no
"Pixels" mode in upstream — grep on the upstream tree for `swipe|touchstart|
gesture` returns nothing, matching our local grep (`Grep swipe|Swipe|touchstart`
in `/src` → 0 hits). The mobile primitives Photon does ship and that we keep:

- **Bottom-row navbar that reorders on mobile.** `src/lib/ui/navbar/Navbar.svelte:103,110`
  uses `order-3 md:order-2` etc. to swap search/create positions, and the
  navbar's whole `flex: 1` distribution flips via `@variant max-md` at
  `:175-182`. This is the closest thing to a "dock" Photon has.
- **Long-press / context-menu on home opens command palette.** `Navbar.svelte:34-38`
  catches `oncontextmenu` on the home button and toggles `chords.commands`.
  Discoverable on mobile with a long-press; we should document this in
  `/tentang` for alpha.
- **Mobile profile menu** mirrors the sidebar items — `src/lib/ui/navbar/Profile.svelte`
  carries the ETNOS section per CUSTOMIZATIONS line 70.
- **Compact view defaulted on small screens.** `settings.view` defaults to
  `'compact'` (`settings.svelte.ts:153`), tuned for low-bandwidth Android.
- **PWA install** — manifest is complete (`static/manifest.json`), `share_target`
  present, three shortcuts (Wiki, Dashboard, Inbox). The browser-side install
  banner is the only gap, and **upstream doesn't ship one either**. Worth a
  custom `<InstallBanner />` for Indonesia where add-to-home-screen is the
  dominant install path — see beta list below.
- **Mark-read on jump** (v2.1.0 behavior) — inherited.
- **Reduced JS payload** — Photon ships at ~620 KB compressed (v2.1.0 notes);
  we haven't measured ETNOS post-Honai-fonts and PapuaMap addition, but
  `maplibre-gl` is heavy (~600 KB itself). Worth a build-size check before
  beta — that is an ETNOS-introduced regression, not a Photon drop.

## Modtools Coverage

Photon ships substantial moderator surfaces and **we kept all of them**:

- `BanModal.svelte` — ban with reason, expiry, remove-content toggle
- `RemoveModal.svelte` — remove post/comment with reason
- `ReportModal.svelte` — report submission
- `CommentModerationMenu.svelte`, `ModerationMenu.svelte` — context menus on
  every comment/post for mods
- `ApplicationDenyModal.svelte` — registration-application deny flow
- `ViewVotesModal.svelte` — see who voted (mod-only API)
- `ShieldIcon.svelte` — visible mod-only indicator
- `moderation.ts`, `report.ts` — shared helpers
- Routes: `/moderation`, `/moderation/communities`, `/moderation/c/[id]`,
  `/modlog`, `/admin/*`, `/registration_applications`, `/reports`
- Mod removal-reason **presets** — `settings.svelte.ts:142-149` already has an
  Indonesian-language preset (`"Postingan Anda..."`) wired into the default
  settings. That is an ETNOS edit, not a dropped Photon feature.

The one gap is **localization**: the moderation modals load English strings
unless `id.json` covers them. Sweep the moderation-namespace keys in
`src/lib/app/i18n/id.json` against `en.json` before beta.

## Embed handlers

Photon's `mediaType()` / `iframeType()` decide what to render per URL. We
inherit it verbatim at `src/lib/feature/post/helpers.ts:80-120`:

- **Image** — `isImage(url)` → `<PostImage>`
- **Video file** — `isVideo(url)` → `<video controls>` native
- **YouTube** — `isYoutubeLink(url)` → iframe to YouTube / Invidious / Piped
  per user setting
- **Generic embed** — falls through to `<PostLink>` link-card with metadata
  from `getSiteMetadata` (this is the "auto cross-server retrieval" added in
  v2.3.0)
- **Poll / Event** — PieFed-native, rendered inline

That is **all Photon has**. Twitter/X, Twitch, Reddit, Mastodon, Bluesky,
TikTok, Instagram — none of them are inline-previewed by upstream. Don't expect
them, and don't add them: most are tracker-heavy and would tank low-bandwidth
performance for marginal benefit. Civic posts in Papua will mostly link to
KOMINFO, BPS, news sites, and YouTube — and those all work today through
either the YouTube path or the generic site-metadata link card.

## Recommended action list

### Restore before alpha — none

There is no Photon feature we silently dropped that hurts the forum loop at
alpha. The fork is feature-complete relative to upstream. The alpha-blocking
work is ETNOS-original (PieFed admin onboarding, civic moderation playbook,
the `/wiki` and `/dashboard` quality polish), not Photon-recovery.

### Restore before beta

1. **Localize the keyword-filter settings UI.** The filter engine exists
   (`filters.svelte.ts`, `settings.svelte.ts:95`) but the configuration page
   under `src/routes/settings/other/` ships English strings. For a Papua
   forum where Bahasa-keyword moderation matters more than English-keyword,
   this is a real beta gap. Effort: **S** — strings only, no code.

2. **Add an install-banner component for PWA on Android.** Photon never had
   one, but ETNOS's audience is overwhelmingly mobile-Android low-bandwidth,
   and "Tambah ke Layar Utama" is the dominant install path. A small
   `OnboardingModal` sibling that surfaces `beforeinstallprompt` would
   materially lift retention. Effort: **S-M**. ~50 lines, drop in
   `src/lib/etnos/InstallBanner.svelte`.

3. **Audit moderation-namespace i18n keys.** `id.json` is ~85% coverage per
   CUSTOMIZATIONS.md. The 15% gap likely overlaps with mod modals, which is
   the worst place for an English fallback during civic moderation. Walk
   `en.json` keys starting `moderation.*` and `form.report.*` against
   `id.json`. Effort: **S** (mechanical).

4. **Measure build size** with the MapLibre + custom fonts addition.
   Photon's stated win is ~620 KB. ETNOS adds `maplibre-gl` (~600 KB),
   `svelte-maplibre-gl`, Satoshi + Nunito (~80 KB combined). If we're over
   1.5 MB on first paint, lazy-load the map. Effort: **M** — one dynamic
   import.

### Skip permanently

- **`xylight_mode` donate / Buy-Me-A-Coffee footer.** Already gated off via
  `env.PUBLIC_XYLIGHT_MODE` at `Sidebar.svelte:227`. ETNOS is publicly-funded
  civic infrastructure; surfacing personal donations is wrong frame.
- **Mass locale dropdown** (de, fr, ja, nl, pl, pt, ru, tr, zh-Hans, zh-Hant,
  bg, et, fi, hu, tok). Already removed in CUSTOMIZATIONS.md. Translators
  who want them can re-add for their fork.
- **LaTeX / Mermaid in markdown.** Neither upstream nor ETNOS has them. The
  audience (civic users, Aksara node operators, agen-AI authors) does not
  need diagram or equation rendering at alpha/beta; if a wiki author does,
  they can prerender to image and upload.
- **Reddit / X / Twitch inline embeds.** Tracker-heavy, low-bandwidth-hostile,
  not upstream behavior. The generic link-card path is sufficient.
- **Swipe-to-vote / pull-to-refresh.** Photon doesn't ship gesture libs;
  adding one would be a meaningful new dependency for very marginal lift.
  Long-press-for-palette is the only mobile gesture in the codebase and we
  inherit it.

## Upstream-sync risk

We are still close enough to upstream that `git fetch upstream && git merge`
should mostly merge cleanly. Files with `// ETNOS:` markers per
CUSTOMIZATIONS.md are the conflict surface. The areas of highest sync risk:

- **`src/lib/app/settings.svelte.ts`** — upstream rewrites this regularly
  (the v2.3.0 settings redesign was substantial). Our edits are minimal
  (language default at line 183, moderation preset at lines 142-149,
  feed/view defaults at lines 121-123, 153). Low risk per merge, but
  attentive.
- **`src/lib/app/theme/presets.ts`** — we added `HONAI_METRO` (lines 45-82),
  changed `getDefaultColors()` and `getDefaultTheme()`, and inserted Honai
  Metro into the presets list. Upstream rarely touches this file. Low risk.
- **`src/lib/app/i18n/index.ts`** — we commented out loaders. Upstream adds
  new locales periodically — will conflict on every add. Acceptable: just
  re-comment new ones.
- **`src/lib/ui/sidebar/Sidebar.svelte`** — we inject ETNOS nav items at
  lines 96-124. Upstream rewrites this file when nav structure changes.
  Medium risk.
- **`src/routes/+layout.svelte`** — onboarding modal mount + meta description.
  Low risk.
- **`src/app.html`, `static/manifest.json`** — fully ETNOS-branded; upstream
  rewrites do not normally touch these. Low risk.
- **API adapter (`src/lib/api/piefed/adapter.ts`, `client.svelte.ts`)** — the
  v2.3.0 API-adapter rewrite is the biggest upstream surface in motion. We
  did not edit it. **High risk** for the next major-version sync; expect to
  re-port everything if upstream goes v3.

Bottom line on the sync question: ETNOS is still a thin overlay on Photon
v2.3.0+. The custom surfaces (`/wiki`, `/dashboard`, `/jelajah`, `/bahasa`,
`/agen`, `/tentang`, `/registry`) are new files with no upstream conflict
surface, and the modifications we did make to upstream files are small and
clearly marked. The audit answer for the user's actual question is: **don't
delay alpha to chase Photon parity. We have it.**
