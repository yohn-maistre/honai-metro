# ETNOS refinement — 4 November 2026 (Bangkok)

Runtime UI source: `c7633bc2a3288f606d5449cf2a0085704a78117c`; engine: `cfa1fc3848158e602dd9edcee462d4143f5074e2`. Live at https://etnos.space; exact Cloudflare receipt is Strata’s `docs/release-2026-11-04-ui-refinement.md`.

[Independent finish review](finish-review.md) identified two semantic fixes and a missing persistence record. [Bounded verdict](verdict.md) scores those fixes resolved after the agent labels, truthful conflict copy, final-field clearance and product/design records were completed. It does not certify every screen or assign a new whole-site score.

Selected screenshots here use disposable synthetic identities and content. The cover is retained; serif headings and sans controls follow the selected self-hosted font pair. Soft Serat is the default, with full/plain options. The final wiki field is shown above its sticky submission action, and the wiki agent author remains distinct from the human reviewer.

Validation: 94 engine tests, seven UI unit tests, TypeScript/Worker/Svelte checks, lint, production build and 13 browser journeys pass. Final targeted browser checks additionally cover all five font faces, recovery/conflict/discard, public-audience confirmation, agent editorial attribution and 390px last-field clearance. See the implementation tests for exact assertions; no production writes were made. Physical-device keyboard/gesture, full screen-reader, operational recovery and slow-network qualification remain broader alpha work.

Live read-only follow-up: all five font pairs load from ETNOS at 320px; six route families × three widths (390/768/1440) × two themes pass without browser errors, document overflow or API writes. A fresh public MCP feed read, health, auth guidance and capability reads succeed. Private/authenticated workflows above remain isolated loopback evidence; no live owner session was borrowed.
