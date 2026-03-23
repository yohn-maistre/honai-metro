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

> This should be pushed upstream as a PR — using `.js` extensions is the correct
> SvelteKit ESM convention and works on all operating systems.

### Locale fallback in `+layout.ts`

**Problem:** If the browser requests a locale not registered in sveltekit-i18n
(e.g. `id` for Indonesian), the `loadTranslations()` call may hang indefinitely.

**Fix:** Added a guard in `src/routes/+layout.ts` that falls back to `'en'`.

## Theme & Branding

| File | What changed |
|------|-------------|
| `src/lib/app/theme/presets.ts` | Added **Honai Metro** warm earthy palette as default; original Mono preserved as preset |
| `src/lib/app/settings.svelte.ts` | Indonesian moderation preset, default feed → `All` |
| `src/app.css` | Satoshi & Nunito `@font-face`, font classes, scrollbar styling |
| `static/font/Satoshi.woff2` | Added font file |
| `static/font/Nunito.woff2` | Added font file |

## Instance Configuration

Configured via `.env` (not committed):
```
PUBLIC_INSTANCE_URL=lemmy.ml        # Change to your Pyfedi backend for production
PUBLIC_LOCK_TO_INSTANCE=true        # Hides instance selector for simpler login
```

## Custom Components

Custom components live in `src/lib/etnos/` to stay isolated from upstream.

| Component | Purpose |
|-----------|---------|
| *(none yet)* | Wiki page, city dashboard, etc. coming soon |

## Merge Checklist

When pulling from upstream (`git fetch upstream && git merge upstream/main`):
1. Check conflicts in the files listed above
2. Verify Honai Metro colors still render correctly
3. Re-run `bun run dev` and test
