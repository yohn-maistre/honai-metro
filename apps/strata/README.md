# Connected Honai / ETNOS

Independent Svelte app using the selected ETNOS connected-preview visual system and the Strata API. The legacy Photon application remains at the repository root. This app does not impersonate a Lemmy server, ship demo identities, store content/credentials in localStorage or grant authority in the browser. Only the theme preference is persisted locally.

From this folder, `npm ci --ignore-scripts`, `npm run check`, and `npm run build` produce `dist/`. Builds happen in cloud CI/development, never on the owner's phone. For a deployed app, serve these files on the same origin as Strata's `/auth`, `/oauth`, `/v1` and `/health` routes. Strata's `wrangler.web.jsonc` is the matching Cloudflare deployment profile; its generated `web/` asset directory is not committed.

Implemented interface: controlled AT sign-in, community creation/discovery/applications and steward queues, persisted text posts/replies/votes/bookmarks/reports, public Wiki proposals/exact review/history, profiles from accessible records, enrollment invitations, theme and logout. API permissions remain authoritative. First verified owner login bootstraps four empty public, approval-controlled, local-publication communities. No seeded public conversations or invented institution identities.

AT publishing, PDS signup/migration, private-only account onboarding, institutional rights, PublicWork, contexts, events, media and notifications are not connected UI capabilities yet. The capability response, not a prototype fixture, determines supported publication behavior. Synthetic/browser validation is not proof of a completed real-user OAuth callback or of a production privacy/security audit.

Live preview: https://strata-preview.giyaibo.workers.dev

See UPSTREAM.md for source provenance.

The future interface model is documented in [contexts and identities](../../docs/strata/context-and-identity-ui.md). It keeps the general ETNOS deployment, regional lenses, governed Groups/Spaces, institutional PublicWork, AI editorial proposals and a later hotline distinct from current delivered controls.
