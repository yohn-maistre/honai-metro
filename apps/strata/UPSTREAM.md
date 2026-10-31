# Honai → Strata connected surface

This application ports the owner's selected ETNOS connected preview into a server-backed Strata surface. Visual source: Sites source commit `3d566db` (ETNOS Connected preview, version 3). `src/commons.css` retains that design system and its Instrument Sans/Serif typography; layout, density, rounded primitives and icon treatment follow the same surface.

The local-storage prototype's accounts, cultural passages, people, projects, metrics and role selector are not migrated as live data. The connected app uses same-origin Strata JSON endpoints and server-issued HttpOnly sessions. Browser storage holds presentation preferences only. Aksara remains independently authorized beneath every surface.

Original Honai/Photon source remains in this repository. This independently buildable app allows the new backend contract without claiming Lemmy/PieFed wire compatibility. AGPL-3.0-only; dependency licenses remain their own.

Cloud build: `npm ci --prefix apps/strata --ignore-scripts`, `npm run check --prefix apps/strata`, `npm run build --prefix apps/strata`. Output: `apps/strata/dist`. No build on a phone is needed. Serve the result behind Strata's same-origin Worker; static hosting alone does not provide authentication or mutations.
