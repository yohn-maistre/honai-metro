# Connected Honai / ETNOS

Independent Svelte app using the selected ETNOS connected-preview visual system and the Strata API. The legacy Photon application remains at the repository root. This app does not impersonate a Lemmy server, ship demo identities, store content/credentials in localStorage or grant authority in the browser. Only the theme preference is persisted locally.

From this folder, `npm ci --ignore-scripts`, `npm run check`, and `npm run build` produce `dist/`. Builds happen in cloud CI/development, never on the owner's phone. For a deployed app, serve these files on the same origin as Strata's `/auth`, `/oauth`, `/v1` and `/health` routes. Strata's `wrangler.web.jsonc` is the matching Cloudflare deployment profile; its generated `web/` asset directory is not committed.

Implemented interface: controlled AT sign-in, community creation/discovery/applications and steward queues, persisted text posts/replies/votes/bookmarks/reports, public Wiki proposals/exact review/history, profiles from accessible records, enrollment invitations, theme and logout. API permissions remain authoritative. First verified owner login bootstraps four empty public, approval-controlled, local-publication communities. No seeded public conversations or invented institution identities.

AT publishing, PDS signup/migration, private-only account onboarding, institutional rights, PublicWork, contexts, events, media and notifications are not connected UI capabilities yet. The capability response, not a prototype fixture, determines supported publication behavior. Synthetic/browser validation is not proof of a completed real-user OAuth callback or of a production privacy/security audit.

Live preview: https://strata-preview.giyaibo.workers.dev

See UPSTREAM.md for source provenance.

The future interface model is documented in [contexts and identities](../../docs/strata/context-and-identity-ui.md). It keeps the general ETNOS deployment, regional lenses, governed Groups/Spaces, institutional PublicWork, AI editorial proposals and a later hotline distinct from current delivered controls.

## UI and messaging checkpoint

The connected app now uses shadcn-svelte/Lucide, shared appearance tokens, Groups/Spaces, sponsor work and an activity inbox. Forum-only 1:1 DMs are experimental: client-side ts-mls 1.6.4, requests/acceptance, single device, passphrase-encrypted local state, comparison codes and blocking. The library/application are unaudited; no sensitive-use or multi-device/recovery/interop claim is made. See Strata's docs/commons-implementation.md for the full boundary. Clearing browser storage or losing the phrase loses access; a new origin requires a qualified key-transfer plan.

Cloud checks: npm run check; npm run test:crypto; npm run build. Optional browser contracts require an existing local Strata checkout, Chromium/Playwright and the built app served on loopback port 5175. Set STRATA_REPO, PLAYWRIGHT_MODULE if needed, and STRATA_UI_URL, then run npm run test:browser. Those scripts intercept every auth/API call into isolated synthetic databases and reject remote UI URLs. They never provision a deployed node. All checks run in cloud development/CI, not on the owner's phone.

Conversation refinement adds nested/collapsible replies, reply actions and permalinks, loaded-sibling sorting, cursor loading, a compact reply dock and an integrated shadcn composer. Image posts/replies support up to four resized static images with ALT editing and a gallery/viewer. The preview engine stores bounded WebP blobs in its existing SQLite node (512 KiB/image, 8 MiB/uploader/day, 64 MiB/node); originals, video, DM attachments and AT media publishing are not enabled. Each image fetch checks current audience permission. Downloaded copies cannot be revoked and community media is not E2EE. See Strata's docs/forum-media-checkpoint.md.

Design guidance: [Unslop by Damir Sokolovsky](https://github.com/heydamir/unslop), CC BY 4.0, and Taste v2.1.5. Details and attribution are in docs/strata/design-tooling.md.
