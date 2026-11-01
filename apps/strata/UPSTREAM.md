# Honai → Strata connected surface

This application ports the owner's selected ETNOS connected preview into a server-backed Strata surface. Visual source: Sites source commit `3d566db` (ETNOS Connected preview, version 3). The connected-preview hierarchy/density are the starting reference. The new runtime uses a customized shadcn-svelte Nova baseline, semantic shared tokens, Instrument Sans and Lucide. Legacy commons.css/connected.css remain historical reference files and are not imported into the build.

The local-storage prototype's accounts, cultural passages, people, projects, metrics and role selector are not migrated as live data. The connected app uses same-origin Strata JSON endpoints and server-issued HttpOnly sessions. localStorage holds theme/accent preferences only. Experimental DMs additionally use a passphrase-encrypted, origin/account-bound IndexedDB key/history vault; app OAuth tokens remain server-side. Aksara remains independently authorized beneath every surface.

Original Honai/Photon source remains in this repository. This independently buildable app allows the new backend contract without claiming Lemmy/PieFed wire compatibility. AGPL-3.0-only; dependency licenses remain their own.

Cloud build: `npm ci --prefix apps/strata --ignore-scripts`, `npm run check --prefix apps/strata`, `npm run build --prefix apps/strata`. Output: `apps/strata/dist`. No build on a phone is needed. Serve the result behind Strata's same-origin Worker; static hosting alone does not provide authentication or mutations.

Copied shadcn-svelte source is MIT-licensed, installed with CLI 1.7.2. See licenses/shadcn-svelte-MIT.txt, licenses/ts-mls-MIT.txt and public/third-party-notices.txt for copied/bundled dependency attribution. Native crypto and browser contracts are cloud checks; no phone install/build is requested.

The forum content pass adapts Photon/PieFed feature behavior to Strata's local API; it does not import their Lemmy/PieFed transport or claim ActivityPub parity. Markdown uses Marked and DOMPurify under the app's generated notices, with an explicit formatting-only allowlist. The existing Taste v2 and [heydamir/unslop](https://github.com/heydamir/unslop) guidance informed progressive form disclosure, compact conversation spacing and neutral primary actions; user-selected customizable family accents take precedence over generic palette guidance. No skill template was copied into the application.
