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
| `src/routes/wiki/+page.svelte` | [NEW] Wiki page with placeholder content |
| `src/routes/dashboard/+page.svelte` | [NEW] Dashboard page with placeholder cards |
| `src/lib/ui/sidebar/Sidebar.svelte` | Added ETNOS section with Wiki + Dashboard buttons (marked `<!-- ETNOS: -->`) |

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
