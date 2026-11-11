# Strata connected web interface

Canonical Svelte/Vite frontend for Strata. It was imported from `yohn-maistre/honai-metro`, branch `feat/strata-connected`, commit `7a35e99` (runtime source at `f489846`), directory `apps/strata`. The legacy Photon/PieFed fork remains a moderation/media behavior donor. See `UPSTREAM.md`, `licenses/` and `public/third-party-notices.txt`; application code is AGPL-3.0-only. No legacy backend/JWT transport is imported.

From the engine root:

```
npm ci --prefix apps/web --ignore-scripts
npm run check:ui
npm run test:ui
npm run build:ui
```

The output is `apps/web/dist`, consumed by `wrangler.web.jsonc`. Authentication and mutations require the same-origin Strata Worker; static hosting alone does not provide them. Local preferences hold appearance, not session credentials. Experimental DM vault boundaries remain documented in `UPSTREAM.md`.

Use `STRATA_REPO` pointing at the engine and a loopback `STRATA_UI_URL` for browser fixtures. Those fixtures never provision a deployed account. The UI defaults to Geist + Geist Serif, with Gabarito, Plus Jakarta Sans and other selectable pairs, user-selectable accents and gradual clock-based themes.

The living implementation ledger is at `../../docs/foundation/README.md`. Update it with actual code/check/release evidence. The old connected app checkout is a frozen donor snapshot; new connected UI implementation belongs here.
