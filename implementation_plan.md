# ETNOS Phase 2: i18n, Wiki, Dashboard & AI Feed

## Part 1: Indonesian + Papuan Malay Language Support

### How it works now

- **Loaders:** [index.ts](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/index.ts) registers each locale with an async JSON import
- **Settings UI:** [+page.svelte](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/routes/settings/app/+page.svelte) has a `localeMap` (lines 43-68) that controls the language dropdown
- **Layout:** [+layout.ts](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/routes/+layout.ts) loads translations on startup  
- **Current [en.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/en.json):** 1032 lines, ~42KB
- **Old [id.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/lemmy/photon-indo/src/lib/i18n/id.json):** 909 lines, ~38KB — covers ~85% of v2.3.0 keys (missing newer keys like polls, feeds, explore, piefed)

### Proposed Changes

#### [MODIFY] [index.ts](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/index.ts)
- Add `id` (Bahasa Indonesia) and `pmy` (Papuan Malay) locale loaders
- Comment out all loaders except `en`, `id`, `pmy` — they stay in the file, just not loaded

#### [NEW] `src/lib/app/i18n/id.json`
- Copy old [id.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/lemmy/photon-indo/src/lib/i18n/id.json) from `photon-indo`, then fill in missing keys from [en.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/en.json)
- Missing keys (~15%) will temporarily fall back to English via sveltekit-i18n's `fallbackLocale`

#### [NEW] `src/lib/app/i18n/pmy.json`
- Starts as exact copy of [id.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/lemmy/photon-indo/src/lib/i18n/id.json)
- You can refine it later with Papuan Malay phrasing

#### [MODIFY] [+page.svelte](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/routes/settings/app/+page.svelte)
- Show only: `en` (English), `id` (Bahasa Indonesia), `pmy` (Melayu Papua)
- Comment out all other entries in `localeMap`

---

## Part 2: Wiki & Dashboard Pages

### How Photon routing works

SvelteKit uses file-based routing in `src/routes/`. Each folder = a URL path.
- [+page.svelte](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/routes/+page.svelte) = the page component
- [+page.ts](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/routes/+page.ts) = data loader (optional)
- The sidebar ([Sidebar.svelte](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/ui/sidebar/Sidebar.svelte)) uses `SidebarButton` components with HeroIcons

### Wiki Page (`/wiki`)

**Purpose:** Community knowledge base. Start static, evolve into interactive with comments/upvotes.

#### [NEW] `src/routes/wiki/+page.svelte`
- Simple markdown-rendered page with title "Wiki"
- Uses Photon's existing `Markdown.svelte` component for rendering
- Initial content can be hardcoded or loaded from a static file in `src/lib/etnos/`

#### [MODIFY] [Sidebar.svelte](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/ui/sidebar/Sidebar.svelte)
- Add `SidebarButton` entries for Wiki and Dashboard under new "ETNOS" section header
- Uses `BookOpen` and `ChartBarSquare` HeroIcons

### Dashboard Page (`/dashboard`)

**Purpose:** City/community dashboard showing local stats, events, community health.

#### [NEW] `src/routes/dashboard/+page.svelte`
- Placeholder page with title "Dashboard Jayapura"
- Will later integrate with Pyfedi API for real data

### Federation implications

> [!IMPORTANT]
> Wiki and Dashboard are **client-only pages** — they don't need any Lemmy/Pyfedi API support initially.
> They're just new SvelteKit routes that render custom content.
> 
> **Future interactive wiki:** Could use a dedicated Lemmy community (e.g. `c/wiki`) where each post = a wiki article. Comments become discussion. Upvotes = community validation. This way it federates for free!

---

## Part 3: AI Agent Feed (Phase 2 — Planning Only)

> [!NOTE]
> This section is for brainstorming. Implementation comes later.

### Concept
Authorized AI agents post to the ETNOS instance. Users can see their posts in a dedicated feed tab.

### Approach Options

| Option | How | Pros | Cons |
|--------|-----|------|------|
| **Filtered feed** | AI agents are bot accounts. Filter feed by `bot: true` | Zero custom code, uses existing Lemmy API | Can't easily separate agent types |
| **Dedicated community** | Create `c/ai-updates` community | Clean separation, federates naturally | Users need to subscribe |
| **Custom tab filter** | Add a tab in the frontpage sort bar (All / Local / Subscribed / **AI**) | Best UX, feels native | Requires custom filter logic |

**Recommended:** Start with a dedicated `c/ai-updates` community (zero code needed on the client). Later add the custom tab filter for polish.

### Pyfedi Backend Needs
- AI agents post via the Lemmy API using bot accounts
- No custom backend modifications needed for basic posting
- Future: custom API endpoint for agent authorization management

---

## User Review Required

> [!IMPORTANT]  
> A few questions to flesh out before implementing:

1. **Wiki content source:** Should the wiki page start with hardcoded placeholder content, or do you want to seed it from an existing document/file?
2. **Dashboard data:** What should the initial dashboard show? Just a title + placeholder cards, or do you have specific data sources in mind?
3. **AI agent feed tab:** Do you want me to implement the custom tab filter now, or start with the community-based approach?
4. **Default language:** Should the app default to `id` (Bahasa Indonesia) instead of `en`? Or keep `en` as default and let users switch?
5. **Translation refinement process:** Happy to create a script that diffs [id.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/lemmy/photon-indo/src/lib/i18n/id.json) vs [en.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/en.json) to show you exactly which keys need translation. Want that?

## Verification Plan

### Automated
- `bun run dev` → verify i18n loads correctly for `en`, `id`, `pmy`
- Switch languages in Settings → UI updates
- Navigate to `/wiki` and `/dashboard` → pages render
- Sidebar shows new buttons with correct icons

### Manual
- User reviews Papuan Malay translations for accuracy
