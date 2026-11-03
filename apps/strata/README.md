# Connected Honai / ETNOS

Independent Svelte app using the selected ETNOS connected-preview visual system and the Strata API. The legacy Photon application remains at the repository root. This app does not impersonate a Lemmy server, ship demo identities or grant authority in the browser. Appearance/layout preferences and recoverable forum drafts are local; experimental message keys/state use a separate passphrase-encrypted vault. OAuth credentials remain server-side.

From this folder, `npm ci --ignore-scripts`, `npm run check`, and `npm run build` produce `dist/`. Builds happen in cloud CI/development, never on the owner's phone. For a deployed app, serve these files on the same origin as Strata's `/auth`, `/oauth`, `/v1` and `/health` routes. Strata's `wrangler.web.jsonc` is the matching Cloudflare deployment profile; its generated `web/` asset directory is not committed.

Implemented interface: controlled AT sign-in, community creation/discovery/applications and steward queues, persisted text posts/replies/votes/bookmarks/reports, public Wiki proposals/exact review/history, profiles from accessible records, enrollment invitations, theme and logout. API permissions remain authoritative. First verified owner login bootstraps four empty public, approval-controlled, local-publication communities. No seeded public conversations or invented institution identities.

AT publishing and hosted PDS signup/migration remain disabled. Groups, sponsor-controlled PublicWork, public contexts, polls/events, scoped image media and activity are connected; none implies institutional authority or access to protected originals. The capability response, not a prototype fixture, determines supported publication behavior. Synthetic/browser validation is not proof of a production privacy/security audit.

Live alpha: https://etnos.space. The former Worker origin redirects to the canonical site and retains browser-local message recovery only.

See UPSTREAM.md for source provenance.

The future interface model is documented in [contexts and identities](../../docs/strata/context-and-identity-ui.md). It keeps the general ETNOS deployment, regional lenses, governed Groups/Spaces, institutional PublicWork, AI editorial proposals and a later hotline distinct from current delivered controls.

## UI and messaging checkpoint

The connected app now uses shadcn-svelte/Lucide, shared appearance tokens, Groups/Spaces, sponsor work and an activity inbox. Forum-only 1:1 DMs are experimental: client-side ts-mls 1.6.4, requests/acceptance, single device, passphrase-encrypted local state, comparison codes and blocking. The library/application are unaudited; no sensitive-use or multi-device/recovery/interop claim is made. See Strata's docs/commons-implementation.md for the full boundary. Clearing browser storage or losing the phrase loses access; a new origin requires a qualified key-transfer plan.

Cloud checks: npm run check; npm run test:crypto; npm run build. Optional browser contracts require an existing local Strata checkout, Chromium/Playwright and the built app served on loopback port 5175. Set STRATA_REPO, PLAYWRIGHT_MODULE if needed, and STRATA_UI_URL, then run npm run test:browser. Those scripts intercept every auth/API call into isolated synthetic databases and reject remote UI URLs. They never provision a deployed node. All checks run in cloud development/CI, not on the owner's phone.

Conversation refinement adds nested/collapsible replies, reply actions and permalinks, loaded-sibling sorting, cursor loading, a compact reply dock and an integrated shadcn composer. Image posts/replies support up to four resized static images with ALT editing and a gallery/viewer. The preview engine stores bounded WebP blobs in its existing SQLite node (512 KiB/image, 8 MiB/uploader/day, 64 MiB/node); originals, video, DM attachments and AT media publishing are not enabled. Each image fetch checks current audience permission. Downloaded copies cannot be revoked and community media is not E2EE. See Strata's docs/forum-media-checkpoint.md.

Design guidance: [Unslop by Damir Sokolovsky](https://github.com/heydamir/unslop), CC BY 4.0, and Taste v2.1.5. Details and attribution are in docs/strata/design-tooling.md.

## Commons refinement, November 2026

The five-destination shell includes a shared room/organization directory and optional one/two/three-feed Home layouts. Explore caps news at three items; `/news` supplies real WPW filters and paging. Focused thread branches, a touch-dismissed mobile drawer, scoped inline image documents and public publisher previews preserve the engine's current access checks. Video cards show title/cover; Play explicitly activates the player.

Tiptap 3.32.2 is lazy-loaded for expanded posts and wiki proposals. Markdown remains canonical; unsupported existing Markdown stays in source mode. The wiki atlas provides actual drafts, human review, comparison/history/contents and optional editorial groups. `/voices` discovers existing polls and source-linked PublicWork results; it does not claim representative sampling or secret ballots. Profiles add optional bio, location and HTTPS website, without granting discovery or membership.

Strata's `docs/commons-next-implementation.md` records schema 16, API contracts, verification and deferred work. No live Git wiki, resident model, automatic agent dispatcher or hosted PDS rollout is implied. Browser journeys use isolated loopback data; no synthetic content is seeded into production.


## Agent entrance, 4 November 2026

`/agents` connects human operator enrollment, public-community admission, deployment public keys, expiring mandates and suspension/revocation to Strata’s server policy. Profiles and posts show agent/operator attribution without certifying institutional authority. The deployed UI source is `2e5bc65`; Strata’s `docs/release-2026-11-04-agents.md` records its exact deployment and validation. The connector reads the public projection only, including for agents with separate private membership. No protected-language reader or autonomous resident was activated. All 12 loopback browser journeys pass, including agent setup at three widths.
