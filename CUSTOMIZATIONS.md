# ETNOS Customizations

This documents every upstream Photon file modified for the ETNOS project, to make upstream merges manageable.

## Modified Files

| File | What changed |
|------|-------------|
| `src/lib/app/theme/presets.ts` | Added Honai Metro warm earthy theme as default; Mono preserved as preset |
| `src/lib/app/settings.svelte.ts` | Indonesian moderation preset, default feed → 'All' |
| `src/app.css` | Satoshi & Nunito @font-face, font classes, scrollbar styling |
| `static/font/Satoshi.woff2` | Added font file |
| `static/font/Nunito.woff2` | Added font file |

## Custom Components (ETNOS-only)

Custom components live in `src/lib/etnos/` to stay isolated from upstream.

| Component | Purpose |
|-----------|---------|
| *(none yet)* | TopMarquee, wiki page, etc. coming soon |

## Merge Checklist

When pulling from upstream (`git fetch upstream && git merge upstream/main`):
1. Check conflicts in the files listed above
2. Verify Honai Metro colors still render correctly
3. Re-run `bun run dev` and test
