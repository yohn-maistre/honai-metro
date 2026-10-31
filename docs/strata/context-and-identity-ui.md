# Honai / ETNOS: contexts, identities and public knowledge

Design brief, 1 November 2026. This documents the larger intended experience and the small experiments that should lead toward it. No new screens or backend capabilities are implemented by this document.

Canonical engine decisions: https://github.com/yohn-maistre/strata/blob/feat/connected-oauth/docs/decision-002-groups-knowledge-and-regional-surfaces.md

## Organize discovery around public contexts

A person should be able to move between a general feed, Papua, a city, a language/topic and a participating institution without encountering duplicate conversations or an inferred membership map.

The main distinction is visible in the interface:

| Page type | Answers | Public contents | Does not imply |
| --- | --- | --- | --- |
| Place / cultural-geographical region | What is being discussed, documented or explicitly collected about this context? | Eligible conversations, accepted knowledge, declared collection coverage, voluntarily listed institutions and their public work | Residency, ethnicity, members, leaders or authority over the region |
| Topic / language | What relevant conversations and knowledge are available? | Contextual discussions, reviewed language variants, public resources | That every speaker belongs to a named people or approves a translation |
| Institution / governed community | What does this body choose to publish, offer and undertake? | Its declared profile, public services, conversations, accepted knowledge, sponsored work and expressly authorized Aksara presence | Public staff lists, access to private channels or consent to every incoming request |
| Group / Space | Who governs this scope and what may the current user do here? | Explicitly permitted profile/content and appropriate membership actions | Authority over other groups, institutional originals or unrelated spaces |
| Person / agent | Who authored this contribution and what public representation is actually declared? | Chosen profile and accessible contributions; agent role/operator assertion where approved | Automatically published affiliation, location or a universal trust score |

Public context pages are useful before a general graph editor exists. The graph remains a model for connecting existing records, not a requirement to show a complicated node diagram to ordinary readers.

## Navigation and regional entry

Keep the current compact home, discovery, communities, Wiki and saved navigation. Use a region/context selector near the existing location indicator. On mobile, retain the bottom navigation and one concise context selector; avoid a second permanent navigation bar for every primitive.

Suggested general deployment: etnos.space. Papua can first live at etnos.space/papua, with papua.etnos.space as a regional entry redirect. This is a recommendation to test, not a purchased/configured hostname or a new security boundary. The selected region is a browsing preference; do not infer it from ethnicity, IP or compulsory location access.

Show a small number of context chips on posts, with remaining associations available on demand. A conversation has one stable thread and one home community; its place/topic appearances are filtered views. Use compact type-specific icons, ordinary names and a small type label when ambiguity matters. Do not invent institutional badges, group membership or live counts to make a card look complete.

Possible future routes: /places/:slug, /topics/:slug, /institutions/:slug, /groups/:slug and /work/:id. Stable IDs and alias redirects sit beneath readable slugs. Existing /communities and thread/Wiki URLs must remain usable through migration. A route or hostname is never an authorization decision.

## A regional context screen

Example structure, using hypothetical content:

- Header: Jayapura; a compact place/context label and selected parent/related contexts where useful. Overlapping contexts do not need a forced single hierarchy.
- Main tabs: conversations and knowledge. Add institutional work only when the backend supports it and there is useful eligible content.
- Compact context section: participating institutions, related public topics and declared collection efforts. On desktop this can use the existing right rail; on mobile put it behind one context control or a short section after the main content.
- Relevant discussions remain readable feed rows; an article does not need an eyebrow, title, subtitle and explanatory paragraph together.

A school is listed because its public profile/coverage assertion was approved, not because users were found to work there. Group affiliations and attendance are absent by default. Do not show public inferred counts of residents, ethnic members, institution staff, private spaces or collection participants.

For data collection, display declared scope, source/method, observation period, last update and review status. Quiet data means “no submissions received,” not “no events.” A regional tag is a classification, not a quality certification or a claim to represent everyone in the area.

## Institutional pages and PublicWork

An institution page can grow into: profile, conversations, knowledge and work. Use familiar compact navigation, not a new dashboard application inside every card. Show the institution's public Aksara presence only with an explicit representation assertion, its remit and a usable challenge/contact route. A human operator's name need not become a public staff directory; institutional accountability and private operational verification can be distinct.

Ordinary conversation remains the default composer for everyone. There is no global “turn every question into work” automation and no PublicWork switch for ordinary members. Authorized representatives get a contextual “Adopt as public work” action or a creation control inside the sponsoring institution's work area. The action explicitly confirms sponsor, scope, public links and intended result. It does not call private institutional tools.

An institution's Aksara may propose or adopt under a current sponsor-bound mandate. AI detection of an interesting question can suggest adoption to that institution; it cannot create a public undertaking without authority. Any requester can still comment or offer help. Their contribution does not make them the institutional sponsor.

A work item shows accountable sponsor, public purpose, current state, accepted commitments and published results. Display private execution as a bounded public update from the institution, never as a live mirror of an internal task log. An ordinary “Ask Aksara” interaction stays conversation unless an authorized sponsor deliberately adopts it.

## AI knowledge stewardship without a Git interface for readers

Readers see an accepted entry, relevant public sources, language/perspective, revision information and a concise correction/challenge route. Editors can open proposals, compare changes and accept or reject. “Draft,” “Proposed,” “Accepted,” and “Corrected” are more accessible than asking every reader to understand branches and merge requests.

Future AI work is attributed to its agent identity. A proposed revision records the base, exact change, sources, uncertainty, applicable rights and operator/mandate. Draft clustering and relationship suggestions remain within their admitted editorial audience. Sensitive links do not become public merely because a model calls them metadata.

The first agent slice should draft under a new explicit editorial capability while humans accept. A later delegated policy may accept narrowly bounded classes of revisions; it must be visible, revocable and separate from posting. Current Strata Wiki code still requires humans for proposals and decisions. Do not add controls that claim an AI steward is already running or silently replace the server's checks.

Place-specific or culturally contested accounts can retain attributed perspectives rather than one model-generated consensus. Translation variants refer back to an original revision and their own review state. If the public text has been corrected or withdrawn, visible projections and future digests should reflect that lifecycle.

## A hotline is another surface

Later, an institution-sponsored ETNOS hotline could serve a short approved regional audio digest. Use simple keypad controls and cached speech before building a conversational voice agent. One versioned public digest can serve the website, telephone playback and downloadable listening audio.

For future call-in contributions, the shared issuer is clearly identified: for example, “Via Hotline ETNOS · reviewed transcript.” This says how material arrived, not that a caller is a verified resident or member. Keep phone numbers, call metadata, raw voice and private source IDs out of public cards. Publishing requires consent, review and scoped service authentication; a shared account does not bypass moderation or rate budgets.

Listen-only is a sensible first funded pilot; recording/transcription and publication follow separately. Do not display this feature before there is a real service and operating budget. A telephone connection helps without mobile data but is not an offline mesh.

## Experiment without shrinking the target

| Experiment | Evaluate with participants | Preserve in the model |
| --- | --- | --- |
| Papua lens with a few place/topic chips | Can people understand why a thread appears here and find the original community? | Typed contexts, stable record IDs, multiple associations and audience-filtered links |
| One consenting institution and public Aksara profile | Is responsibility clear without exposing private staff or access? | Separate institution, agent, operator/mandate and protected membership |
| One deliberate sponsored work item | Does it feel distinct from an ordinary question and show a useful outcome? | Sponsor authority, explicit adoption, independent execution and reviewed public result |
| One agent-authored Wiki draft | Can a reviewer understand sources, changes and uncertainty? | Explicit editorial authority, restricted proposal access, exact-base review and correction history |
| Two local Spaces with different audiences | Can governance remain clear while private existence stays protected? | Stable Group identity, per-Space grants, revocation and replaceable external bindings |
| One later audio digest | Can callers navigate and understand freshness in their language? | Reusable approved digest, channel provenance and qualified consent/custody for later submissions |

Check 360–430px mobile layouts and desktop, keyboard focus, long local names, several languages, slow connections, empty/error states and inaccessible links. Use actual allowed records, not invented organizations, live counters or role switches. Track delivered behavior in the engine's capability/status ledger before exposing new actions.

Implementation sequence: finish the current login/live-publication prerequisites; then add local Group/Space and contextual bindings, the institution page/adoption flow, and the explicit AI-draft path. Develop the AT Group adapter experimentally alongside the local contract. The hotline stays documented until funded. Larger architecture is retained in stable identities, ownership and rights rather than in placeholder screens.
