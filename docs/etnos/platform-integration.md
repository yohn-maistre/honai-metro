# Native services and upstream-friendly consolidation

## Repository strategy
Choose the application foundation by cost of preserving behavior, not number of dependencies. SvelteKit/Photon already owns forum state/routes/interactions; the Watch engine is independent of Astro.
Compare a pinned clean xyphyn/photon upstream commit against honai-metro before committing to a reset. Recommended experiment: a new branch/worktree from that pinned upstream commit in the existing repository, while main and legacy Honai remain intact. No force-push, no unrelated-history merge, no blanket checkout over local work. If upstream has incompatible PieFed support, retain necessary fork fixes explicitly.
Record upstream URL/base SHA, selected legacy modules, licenses, local patches and test coverage. Keep AGPL notices/source obligations. A folder boundary is not a plugin system: document each unavoidable upstream edit and why.
Suggested boundaries (adapt after inspecting upstream):
- src/lib/etnos/design/: tokens, themes, composed primitives;
- src/lib/etnos/shell/: sidebar, mobile navigation, context panel;
- src/lib/etnos/features/: Explore, issues, library, wiki, Ask;
- src/lib/etnos/adapters/: forum-facing domain conversions;
- src/lib/server/etnos/: server-only Watch access;
- src/routes/(etnos)/: product routes where route groups do not conflict with upstream;
- docs/etnos/upstream-patches.md: minimal integration seam ledger.
Preserve upstream provenance and use a reproducible merge/update process with CI regression tests. Extract reusable packages later if necessary; do not begin with a monorepo migration merely to look modular.

## PieFed capability matrix
Inspect the selected upstream API adapter and generated schema; verify backend via nodeinfo and documented API version. Legacy Honai selects piefedalpha => /api/alpha and defaults to piefed.social. That is a public hosted backend, NOT evidence of an ETNOS-owned pyfedi deployment.
Audit every feature family: login/session/logout, registration/reset, feed sorting and pagination, communities/following, posts/edit/delete, comments/thread/reply/edit/delete, vote/save/report, search/resolve, inbox/private messages/notifications, media uploads, user profiles/settings, moderation/admin.
Legacy adapter has login/createPost/createComment implementations but explicitly unsupported registration, password recovery and several moderation/report methods. Recheck current upstream rather than importing that limitation list as permanent truth. Mark each capability implemented/tested/unsupported/missing. Test mutations only with owner-authorized account and community. Never expose non-working buttons as completed support.
Audit token storage, redirect validation, markdown sanitization, CSRF/origin boundaries and permissions. Preserve federation identifiers and remote actors. A unified UI does not imply a new universal identity across services.

## Watch native boundary
Use the same Watch engine through Cloudflare service binding/server-side integration, not production website scraping. Keep engine deployment, scheduler, D1, R2, queues and AI routes singly owned during frontend consolidation. Do not instantiate a second editorial pipeline.
Observed public engine contracts to reverify:
GET /current (page,limit); GET /development/:id; GET /issues; GET /issue/:slug; GET /places; GET /resources; GET /search; GET /geo/status; GET /geo/fires; POST /ask.
Engine /current has pagination; development IDs/source relationships/canonical bilingual summaries must survive presentation ports. Resources candidate access and operational endpoints require admin authorization. Do NOT proxy arbitrary path/query through a service binding. Allowlist public parameters and methods; omit admin secret from product frontend.
Port Pages endpoint logic into SvelteKit server routes using platform bindings, preserve status/cache/error contracts and make bindings/types explicit. Inspect Ask's input/history/locale contract; budget/rate-limit previews so shared Workers AI/Gateway quotas remain protected. Keep provider routing server-owned.
Port neutral map/runtime code and geographic asset delivery deliberately; preserve PMTiles/R2 range behavior, CSP workers/connect policy, MapLibre 5 and coordinate provenance. Mount map at persistent Explore layout scope; destroy only when leaving that layout. Do not reset camera on a tab click or silently filter feeds on region clicks.
Keep sourced editorial and social discussion distinct even under one app. Link discussions with stable story references; no automatic evidence promotion of votes/comments.

## Preview and eventual cutover
Preserve legacy production temporarily while rebuilding, not as the intended final architecture. New branch preview must have explicit target/build settings. Honai workflow comments historically promised branch preview while actual push trigger selected only main; inspect YAML triggers, don't trust comments.
Native engine binding can expose production data to preview; enforce server allowlists, no migrations/queue writes, no admin tokens and bounded Ask usage. Keep backend write tests isolated.
Before retiring westpapua.watch: feature parity, ingestion/publication liveness, SEO/social previews, old path/query/locale redirects, external links, search indexing, canonical URLs, cache and rollback need proof. Retirement is a separate authorized cutover, not a side effect of frontend preview.

## Acceptance
CI build and static analysis; real forum authenticated and guest journeys; public engine readback; citations/locale parity; map camera/layer/selection tests; library filtering/pagination; error/offline states; keyboard/focus; two theme families times two modes; desktop and mobile screenshots reviewed by parent; actual-device check for GPU/touch limits. Separate completed migrations from unavailable backend features. No fake fallback content or snapshot-backed preview passed off as native live integration.
