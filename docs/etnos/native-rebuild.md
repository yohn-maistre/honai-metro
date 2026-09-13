# ETNOS native rebuild

## Foundation and preservation
Upstream xyphyn/photon pinned at dd17609d7b5aea54f5410d5498e748f592deece9.
Legacy local branch backup/honai-before-etnos-rebuild points at d247957e2d01917d3de767111eaf4bb56401b2a2; main remains there.
Working branch feat/etnos-native-platform starts from upstream history, not a wholesale legacy copy. A legacy untracked pnpm-lock.yaml was stashed separately after switching. Do not drop that stash or rewrite main.

## Product
One ETNOS: full forum plus Explore (news, issues, wiki, library and persistent adaptive map), and Services. Watch is a shared internal engine, not a permanent second public product. Preserve production temporarily for rollback; domain retirement requires a later verified cutover.
Design authority: etnos-platform-design skill and its copied references in this directory. Upstream forum behavior is retained while presentation is replaced deliberately. This initial commit is foundational, not a completed redesign.

## Services: capabilities, not a bot gallery
- Agents: verified identity, controller, declared capabilities, provenance and access scope. Verification is not a general trustworthiness badge.
- Musrenbang: proposals, discussions, sources, deliberation and recorded follow-up. An agent may assist drafting; it cannot claim community consent or approve public decisions.
- Requests: scoped tasks with requester, assigned actor, review boundary, deadline, evidence and outcome. Separate read/research from publishing or external effects.
- Shared archive: intentional capture of useful knowledge from wiki, evidence and consented contributions. Never ingest all private threads by default.
- Permissions and activity: grants, expiry/revocation, visible action receipts and appeal/correction trails. Security audit records are not automatically public.
- Nodes: community/institution/local-node capability and sync status. Avoid fake connected-agent counts.

All current service catalog entries are explicitly planned; no pretend agents, mutations, or authentication flows.

## Agent-native access design (not yet implemented)
Start with versioned API schemas and stable entity identifiers. A machine-readable capabilities endpoint may expose public descriptors, not private operational topology. Choose interoperable identity/auth protocol only after backend capability/security review; authenticated agent is not the same thing as authorized agent.
Use grants bounded by actor, community, resource, operation, purpose and expiry; enforce on every request. Keep humans and agents attributable, support revocation, prevent cross-tenant access. Do not equate a PieFed login token with universal ETNOS engine authority.
Use idempotency keys for mutation retries and append action receipts with evidence/provenance. Require approval for public posting, sensitive edits and external side effects. Agent-fetched text is untrusted data, not instructions or a grant.
Collective memory supports access tiers, community stewardship, cultural restrictions, provenance, correction and retention/deletion policies. Public publication is opt-in, not the default consequence of indexing.

## Wiki scope
Long-lived knowledge: culture, history, music, sculpture, painting, languages, locations and maps. Model people, works, places, events and sources as linked entities. Preserve contributor and license attribution, contested accounts and community restrictions; never reduce oral/cultural knowledge to unsourced generated encyclopedia copy.
Forum threads can propose knowledge edits; review establishes a durable version with citations. Not every conversation belongs in collective memory.

## Initial code
src/lib/server/etnos/watch.mjs + /api/etnos/watch/[...path] implement a native, GET-only allowlisted service-binding adapter. No westpapua.watch scraping or snapshot fallback. Candidate resources/admin/Ask mutations are not exposed. Missing binding returns 503. Ask requires a separate bounded endpoint and quota/security review.
src/lib/etnos/features/services/catalog.mjs and /services provide a truthful initial service inventory. Presentation is provisional; the complete shadcn-svelte theme/shell work remains pending.

## Upstream seam ledger
- src/app.d.ts: optional typed WATCH_ENGINE platform binding.
- Additional ETNOS routes/modules do not replace upstream authentication, editor or feed logic.
- Upstream already owns /explore/* (communities/feeds/topics). Reconcile routing explicitly; do not create conflicting route groups or silently break federation discovery.
- Preserve AGPL/source notices. Keep future upstream edits minimal and documented here.

## Verification and remaining work
Native tests cover read allowlist, forbidden operations, query filtering, missing binding and upstream errors. Full Svelte build and browser verification must run on CI, not the constrained phone. No deployment configured or triggered by this foundation pass.
Next gates: compare legacy PieFed fixes, choose shadcn-svelte integration matching Svelte 5/Tailwind 4, token/theme matrix, actual shell and full forum journeys, native engine readback, Explore map/data/detail views, agent permission design with tests. Do not call Services functional simply because its catalog renders.
