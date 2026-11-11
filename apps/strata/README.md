# Honai connected interface

The maintained Honai UI is available on this repository's main branch in `apps/strata`. It is a frontend mirror of the canonical connected app in [Strata](https://github.com/yohn-maistre/strata), `apps/web`. Changes are authored and integrated there, then synced here for frontend inspection; do not maintain divergent implementations.

```
npm ci --prefix apps/strata --ignore-scripts
npm run check --prefix apps/strata
npm test --prefix apps/strata
npm run dev --prefix apps/strata
npm run build --prefix apps/strata
```

Build output: `apps/strata/dist`. The app needs the same-origin Strata API/OAuth Worker for authentication and mutations. Uploading these static assets to a standalone Pages project does not supply that backend. ETNOS's connected deployment is built from Strata's integrated Worker/assets profile.

Geist + Geist Serif is the default; saved choices persist. Other self-hosted pairs include Plus Jakarta Sans + Geist Serif and Gabarito. Shared Ding notifications have spring motion, local synthesized sound and device mute/volume. Appearance, current private access and agent identity are independent concerns.

Legacy Photon/PieFed source is retained at the repository root as a media/moderation behavior donor. See `UPSTREAM.md`, `licenses/` and generated `public/third-party-notices.txt` for attribution. Application source is AGPL-3.0-only. Public frontend source is not a copy of private institutional content or the full private Strata repository.

Browser journeys require an explicit local `STRATA_REPO` checkout, loopback `STRATA_UI_URL` and Playwright installation; fixtures do not mutate deployed accounts.
