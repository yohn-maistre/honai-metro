# ETNOS Phase 2 Walkthrough

## Windows Case-Collision Fix (Upstream Bug)

Fixed [PostForm.svelte](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/feature/post/form/PostForm.svelte) / [postform.svelte.ts](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/feature/post/form/postform.svelte.ts) collision causing infinite loading on Windows.
3 files patched with [.js](file:///C:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/test_browser.js) extension to disambiguate imports.

## i18n: Indonesian + Papuan Malay

- **[id.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/id.json)** — Ported from old photon-indo (85% coverage, English fallback for missing keys)
- **[pmy.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/pmy.json)** — Copy of [id.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/lemmy/photon-indo/src/lib/i18n/id.json), ready for Papuan Malay refinement
- **[index.ts](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/index.ts)** — Only `en`, `id`, `pmy` loaded; upstream locales preserved as comments
- **[settings +page.svelte](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/routes/settings/app/+page.svelte)** — Dropdown shows English, Bahasa Indonesia, Melayu Papua
- Default language → Indonesian

## New Pages

- **[/wiki](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/routes/wiki/+page.svelte)** — Placeholder content about ETNOS mission, Mee language, contribution guide
- **[/dashboard](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/routes/dashboard/+page.svelte)** — Stat cards + sections for Language Stats and AI Agents
- **[Sidebar](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/ui/sidebar/Sidebar.svelte)** — ETNOS section with Wiki (📖) and Dashboard (📊) buttons

## Modularity

All changes marked with `// ETNOS:` or `<!-- ETNOS: -->` comments. Full inventory in [CUSTOMIZATIONS.md](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/CUSTOMIZATIONS.md).

## Files for Translation Refinement

Edit these directly to refine translations:
- [id.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/id.json) — Bahasa Indonesia
- [pmy.json](file:///c:/Users/jind0sh/Code/abstraksi/etnos/honai-metro/src/lib/app/i18n/pmy.json) — Melayu Papua
