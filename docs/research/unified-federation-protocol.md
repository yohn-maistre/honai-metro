# ETNOS Unified Federation Protocol — Complexity Review

Opinionated re-evaluation of the prior PieFed + ActivityPods/NextGraph recommendation, June 2026.

> **Why this exists.** The prior research (`sovereign-stack-architecture.md`) recommended PieFed for content and ActivityPods + NextGraph for memory, with `did:web` everywhere. The pushback is correct: that is two runtimes, two ops stories, two failure modes, two SDKs, and two roadmaps to track. This memo revisits the question under one lens — *complexity* — and answers the four-quadrant question (forum + permissioned memory + agent↔agent + agent↔human) with one substrate.

---

## TL;DR

**Keep PieFed for the public square. Stop trying to make ActivityPods + NextGraph the memory layer. For Aksara memory and agent↔agent, adopt AT Protocol PDS repos as our second (and only other) substrate — used internally, federated externally through a thin atproto↔ActivityPub bridge.** Use `did:web` as the everyday identifier and `did:wba` (ANP's web-based DID method) for agent actors; mint a `did:plc` only when an Aksara node opts into atproto-native discovery. No chain. No Solid Pods. No DWN. No third runtime. The Foundation Protocol paper (arXiv:2605.23218, 22 May 2026) is a coordination *overlay* on top of whichever substrate we pick — we adopt its vocabulary, not its plumbing. Two substrates beat three; one substrate is not currently realistic given that no production system covers A+B+C+D under one roof in 2026. The PieFed-only path (strip-and-expand) is a five-engineer-year fork; the AT-Protocol-only path forfeits the threadiverse audience and bets on a permissioned-data spec that is still mid-summer-2026 work. The composition below is the smallest two-substrate stack that ships.

---

## 1. The "May 22, 2026" paper — found

**Found.** The user is referring to **"Foundation Protocol: A Coordination Layer for Agentic Society"**, arXiv:[2605.23218](https://arxiv.org/abs/2605.23218), submitted 22 May 2026 by a 29-author consortium spanning Université de Montréal, HKUST(GZ), Duke, and the FoundationAgents collective. Two adjacent candidates from the same window were also considered and are weaker fits:

- arXiv:[2602.15831](https://arxiv.org/abs/2602.15831) — **A2H: Agent-to-Human Protocol** (Feb 2026). Defines a "Human Card", a formal agent↔human schema, and a unified messaging abstraction. Scope is narrower than FP and overlaps with our Tier-3/Tier-4 vouching model; useful as a vocabulary, not as a substrate.
- arXiv:[2602.15055](https://arxiv.org/abs/2602.15055) — **ACP: Unified Agent Communication Protocol** (Feb 2026). Federated orchestration with DID-based identity verification, semantic intent mapping, and machine-readable SLAs. Closer to a competitor of A2A than a substrate.

**Summary of FP.** A *graph-first coordination layer* treating agents, tools, resources, humans, institutions, and organizations as first-class addressable nodes in a shared graph. Relationships, memberships, sessions, and activities are protocol objects. Four planes: Entity & Trust (DIDs + VCs), Transport & Routing (pluggable; wraps MCP/A2A/ANP), Interaction & Organization (multi-party sessions, role binding), Regulation & Oversight (policy, provenance, audit, value exchange). The paper explicitly states it is meant to *wrap and bridge existing protocols rather than replace them.*

**Fit assessment.** FP is not a substrate we can deploy; no production implementation, no public reference code. It is **vocabulary and architecture** for the layer above whatever transport we choose. ETNOS adopts three FP concepts: (i) Entity Plane mapping — every Aksara, citizen, agent, tool, dinas is one node in one graph; (ii) Regulation Plane primitives — policy/provenance/audit as data, not log lines; (iii) the "wrap, don't replace" stance, which is the answer to the complexity question. FP makes the case for *two substrates with one coordination overlay,* not for one omnibus runtime.

## 2. Decision matrix — six candidates, one lens

Scores 1–5 (5 = best). The columns capture the user's actual constraint: complexity per ops-headcount-month, not technical elegance.

| Substrate | A+B+C+D under one roof | 2026 prod-ready | DX (Svelte+Py+Hermes) | Ops complexity (lower = better) | Federation / sovereignty | Papua fit |
|---|---|---|---|---|---|---|
| **PieFed as-is + Postgres** | 1 (forum only) | 5 | 5 | 5 (one runtime) | 4 | 5 |
| **PieFed++ (strip-and-expand)** | 4 (forum + memory + agent actor) | 2 | 3 (we maintain the fork) | 3 (one runtime, our fork) | 4 | 3 |
| **PieFed + ActivityPods+NextGraph** | 4 | 2 (broker self-host mid-late 2026) | 2 (Rust core, JS SDK, Python shim) | 1 (three runtimes effectively) | 5 | 2 |
| **AT Protocol unified (PDS + AppView only)** | 3 (no native ACL until permissioned-data lands) | 3 (PDS prod; permissioned-data H2 2026) | 4 | 4 (one runtime per node) | 3 (PLC + Bluesky AppView dependency) | 3 |
| **PieFed + AT-Protocol-as-memory (recommended)** | 4 | 4 | 4 | 3 (two runtimes, both boring) | 4 | 4 |
| **DWN / Web5** | 2 | 1 (TBD sunset 2024; DIF caretaker) | 2 | 1 (no clear home) | 2 | 1 |
| **Custom (build our own)** | 0 | 0 | 0 | 0 | 5 | 0 |
| **Permissioned chain (Cosmos/Substrate)** | 1 | 4 | 1 | 1 (validator set ops) | 1 | 1 |

The number that matters is the *product* of "prod-ready × ops simplicity × DX." On that product, only **PieFed as-is** and **PieFed + atproto-as-memory** clear the bar. PieFed as-is doesn't serve B+C+D, so by elimination the two-substrate answer is PieFed + atproto.

## 3. The strip-and-expand-PieFed analysis

The honest question: can PieFed (Python/Flask, Lemmy-shaped API, Postgres) absorb encrypted per-actor memory containers, agent actor types with MCP discovery, and OAuth-style capability tokens — in one runtime?

**Code surface.** PieFed (`pyfedi`, [codeberg.org/rimu/pyfedi](https://codeberg.org/rimu/pyfedi)) is a single Flask app with a custom ActivityPub implementation, a Lemmy-compatible JSON API, ongoing Swagger work, and (in 1.6) private communities ([1.6 release notes](https://community.nodebb.org/topic/15f9451d-1d64-424d-8e4c-fff886edce28/piefed-1.6-is-released-pronouns-private-communities-quote-posts-and-much-more)). There is no OAuth server, no encrypted-blob model, no per-actor capability store, and no agent actor type.

**What we'd have to add.**

1. **Per-actor encrypted memory containers (Pod-shaped).** New `aksara_memory_blob` table keyed by `(actor_id, schema_uri, blob_hash)`, with ciphertext stored in S3-compatible object storage and decryption keys gated by a capability check. Roughly the surface area of an S3 bucket per actor plus a capability cache. Schema-level CRDTs are not required for ETNOS — append-only with redaction events (as per `docs/aksara/onboarding.md` §10) is enough. Effort: ~3 engineer-months.

2. **Agent actor type + MCP discovery.** ActivityStreams already supports custom actor types; add `aksara:AksaraNode` and `aksara:Agent` actor types whose `services` array points to an MCP server URL and a DID Document URL. PieFed's ActivityPub layer needs to accept these on inbox and surface them in WebFinger. Effort: ~2 engineer-months.

3. **OAuth-style capability tokens.** Not OAuth 2.0 — UCAN-style ([ucan-wg/spec](https://github.com/ucan-wg/spec)). Issuance from a DID, attenuation across hops, revocation list per Pod. PieFed already issues bearer tokens; UCAN replaces them on civic-action endpoints and rides alongside on legacy ones. Effort: ~3 engineer-months.

4. **DID resolution + verification.** Server-side cache for `did:web` and `did:wba`; ed25519 signature verification on inbound activities. PieFed already verifies HTTP signatures; this extends the verifier. Effort: ~1 engineer-month.

5. **Maintaining the fork.** PieFed ships ~quarterly. Each release brings rebase work. Upstream is unlikely to accept Pod-shaped storage or UCAN in main — that's a downstream fork forever. Effort: ~1 engineer-week per upstream release in steady state.

**Total greenfield effort:** ~9 engineer-months for a usable v1, ~18–24 months to harden through one Aksara cohort. Add an ongoing fork tax of ~25% of one engineer FTE indefinitely. **Plausible with two senior engineers and one year, but it commits ETNOS to maintaining a private fork of a federation server for the lifetime of the platform.** That's a real ops burden the prior architecture analysis didn't account for.

**The trap.** PieFed++ is one runtime in the deployment but one runtime *we maintain alone.* Mainline ships a forum; PieFed++ would be a Solid-Pod-ActivityPub-MCP-UCAN polyglot existing only on our Codeberg. That is not "one substrate" — it is "two substrates collapsed into one process that we own all the bugs in." Reject.

## 4. AT Protocol as the substrate — honest re-examination

Prior research treated atproto as a sidecar. Re-examined as a candidate primary:

**What atproto already gives us for free.**

- **PDS = per-actor signed repo.** A PDS is a Merkle-backed repo of typed records, signed by the actor's repo key. Self-hostable today ([self-hosting PDS](https://github.com/bluesky-social/pds)). This is exactly the shape of "per-actor memory container" — append-only, signed, content-addressed, with hashes traceable for audit.
- **Lexicons = structured records under a domain we control.** We define `id.papua.kelurahan.suratDomisili`, `id.papua.aksara.skillManifest`, `id.papua.adat.kinshipVouch`. WhiteWind ([whtwnd/whitewind-blog](https://github.com/whtwnd/whitewind-blog)) and Smoke Signal show real apps doing this today. The "every Aksara post is a typed record under a lexicon ETNOS owns" model is a better fit for civic provenance than ActivityPub's free-form JSON-LD.
- **DIDs are first-class.** Every actor has a DID. We can use `did:web` (default for pemerintah), `did:plc` (when atproto-native discovery is needed), and `did:wba` (for agent actors, per [ANP](https://agent-network-protocol.com/)).
- **Labelers (Ozone pattern) = moderation overlay.** A Dewan Adat labeler publishes signed `Label` records; clients subscribe. Maps 1:1 to our Tier-4 vouching model.
- **AppViews = our indexer.** ETNOS can run an AppView that surfaces only Papua-relevant records. We are not forced to use Bluesky's AppView, and we are not forced to share state with the global Bluesky firehose.
- **Agent identity is just another DID with a PDS.** An Aksara node is structurally indistinguishable from a user — different DID method, different lexicons, same plumbing.

**What atproto does not give us.**

- **Encryption at rest.** Per the Bluesky team: "Encryption at rest is not currently a goal" ([Encryption discussion #121](https://github.com/bluesky-social/atproto/discussions/121)). All PDS records are world-readable by anyone who can reach the PDS. This is fatal for sacred ruang adat content if used as-is.
- **Permissioned data.** Multiple teams (Blacksky, Northsky, Habitat) are working on extensions for non-public data; the protocol team's design proposal says "permissioned data is expected to be a major focus … through the summer" ([AT Protocol Spring 2026 Roadmap](https://atproto.com/blog/2026-spring-roadmap)). **As of June 2026 the spec is sketch-level.** The proposed model — PDS sends notifications, AppViews fetch via OAuth — is a reasonable shape but is not deployable yet.
- **OAuth scope granularity.** OAuth on atproto is rolling out to self-hosted PDSes, with "permission sets" still in progress ([Early Permission Sets discussion](https://github.com/bluesky-social/atproto/discussions/4437); [Auth Scopes progress Aug 2025](https://github.com/bluesky-social/atproto/discussions/4118)). Transitional scopes exist, fine-grained scopes don't yet.
- **PLC dependency.** Even with the [Swiss Association transition](https://docs.bsky.app/blog/plc-directory-org), `did:plc` resolution is a shared bottleneck. Mitigation: use `did:web` for civic actors, fall back to `did:plc` only where the atproto ecosystem requires it.
- **ActivityPub bridging.** Bridging atproto and ActivityPub is non-trivial. Bridgy Fed exists but is a third-party service; an ETNOS-controlled bridge is a small server we'd have to write.

**Net.** If we are anyway adding (a) Pod-like containers, (b) agent DIDs, and (c) capability tokens to PieFed, *most of that is in atproto already.* The honest gap is **encrypted-at-rest sacred content,** which atproto does not plan to solve. The fix is small: an encrypted-blob sidecar (libsodium sealed boxes keyed to Dewan Adat threshold keys) addressed by a record in the PDS. Three weeks of engineering, not three years of NextGraph waiting.

## 5. The chain reconsideration — settle it

**Reject. For ETNOS, in 2026, in Papua, at province scale.**

The user's instinct ("web3/web5 is what chains are for") is reasonable from a marketing distance. Closer in, chains buy four things and ETNOS needs none of them:

1. **Programmable economics.** ETNOS has no token, no DEX, no on-chain settlement. The "civic dividend" in OTSUS budget tracking is a Postgres ledger with audit log, not a smart contract. If it ever becomes on-chain, it lives on QRIS rails, not our chain.
2. **Public bonded curation markets.** We have Dewan Adat. Bonded curation in Wamena is a category error.
3. **Censorship resistance vs state actors.** Our threat model is *cooperating with* the Indonesian state (BSSN, Dukcapil, OTSUS sekretariat) via BSrE. A chain that routes around state moderation is the wrong tool — it's actively hostile to our gov-bridge story.
4. **Cross-jurisdiction settlement.** Single jurisdiction.

What chains charge in return: validator-set governance (6–12 months of design at Cosmos SDK pace per [Chainscore on hidden Cosmos cost](https://www.chainscorelabs.com/en/blog/the-appchain-thesis-cosmos-and-polkadot/appchain-development-frameworks/the-hidden-cost-of-choosing-cosmos-sdk-over-substrate)), per-tx fees that bite at scale, cold-start liveness, key-loss-equals-identity-loss UX disasters, and a public-by-default model that breaks CARE.

**Web5 specifically.** Block sunsetted TBD in November 2024 ([crypto.news](https://crypto.news/block-inc-shifts-focus-to-bitcoin-mining-amid-plans-to-sunset-web5-focused-tbd/)). DWN code was handed to DIF; a DIF-operated community node runs on Google Cloud. There is no longer a vendor pushing this stack. DWN is a viable spec but a frozen one. Adopting DWN today is adopting an orphan. Reject.

**Where chain genuinely fits in ETNOS, if anywhere.** One place only: a Merkle root of the day's Aksara memory + civic-action receipts published to OpenTimestamps and a pinned PieFed post. That is the *anchor*, and it is free. We get tamper-evidence, public auditability, and independent verification — without running a validator network or asking Dewan Adat to hold an Ed25519 key under threat of identity loss. The prior architecture memo called this "poor-person's chain" and it remains correct.

## 6. Permissioned access — concrete UX flow

The Dewan-grants-researcher-30-day-read flow on the recommended stack:

1. Researcher creates an ETNOS account, gets a `did:web` at `researcher.etnos.papua.id/.well-known/did.json` (or a `did:plc` from a Tier-3 KTP path).
2. Researcher visits the kelurahan Aksara node's directory page in the ETNOS Svelte client, requests `read:atproto.id.papua.adat.ceremonyLog` scope for 30 days.
3. ETNOS routes the request to the Dewan Adat's `aksara-lab` thread on PieFed as a structured post.
4. M-of-N Dewan members co-sign a **UCAN** ([ucan-wg/spec](https://github.com/ucan-wg/spec)) granting that scope, with an expiration claim of 30 days and a `prf` chain rooted in the Aksara node's DID.
5. The UCAN lands as a typed record in the Aksara node's PDS (`id.papua.aksara.grant`) and as a notification in the researcher's PDS.
6. Researcher's client presents the UCAN to the Aksara AppView; AppView verifies the chain, decrypts sacred-tagged blobs with the Dewan-side threshold key, and serves.
7. Revocation = a new signed record in the Aksara PDS that supersedes the grant; AppView checks revocation list on every read.

Why UCAN and not WebACL: WebACL is per-resource ACL state held centrally, which is exactly the Solid model that requires a Pod server. UCAN is a *token* carried by the requester — verifiable offline, attenuates across hops, no server-side ACL store. Better fit for a peer-to-peer agent model where any Aksara might serve any other Aksara. GNAP and OAuth 2.0 are alternatives; UCAN composes with DIDs natively, which the other two do not.

## 7. Agent-to-agent protocols — what we adopt

State in mid-2026:

- **A2A (Google → Linux Foundation Agentic AI Foundation).** v1.2, signed agent cards, 150+ org adopters ([Linux Foundation A2A announcement](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents); [A2A 150 orgs PR](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year)). This is the transport for agent skill discovery and invocation. Adopt as-is.
- **MCP.** Tool invocation inside an agent process; orthogonal to federation. Adopt as-is for skill definitions ([MCP 2026-07-28 RC](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)).
- **ANP (Agent Network Protocol) + did:wba.** Direct agent-to-agent communication with web-hosted DID documents ([did:wba intro](https://www.agent-network-protocol.com/blogs/posts/did-wba-intro.html)). `did:wba` is structurally `did:web` for agent actors. **Adopt did:wba as the DID method for Aksara node identity** — it composes with our existing DNS-anchored `.go.id` and `.papua.id` story.
- **ACP (IBM), AGNTCY (Cisco).** Vendor offerings; folded into A2A/MCP convergence. Skip.
- **Foundation Protocol (May 22, 2026).** Vocabulary, not transport. Adopt the four-plane model as an internal architecture mental model. No code to deploy.

Federation transport stack: **ActivityPub between PieFed instances; atproto firehose between Aksara PDSes; A2A for agent-to-agent invocation; MCP for skill definitions; UCAN for capabilities crossing all three.** This is five protocols, but each does exactly one thing — none is a substrate competing for the same job.

## 8. Recommended composition

```
Citizen / Aksara / Dinas / Dewan — one DID (did:web for civic, did:wba for agents)

  ┌───────────────────────────────┐         ┌────────────────────────────────┐
  │ PieFed (Python/Flask)         │         │ atproto PDS per Aksara node    │
  │ - communities, posts, votes   │         │ - typed records (lexicons      │
  │ - private communities (1.6)   │         │   under id.papua.*)            │
  │ - ActivityPub federation      │◄───────►│ - signed Merkle repo           │
  │ - Lemmy-shaped API for Svelte │ bridge  │ - UCAN grant records           │
  └───────────────────────────────┘         │ - sacred blobs: ciphertext     │
              ▲                              │   pointer (libsodium, Dewan    │
              │ Aksara posts cross-linked    │   threshold key)               │
              │ with PDS record URIs         │ - A2A skill cards              │
              │                              └────────────────────────────────┘
              │                                       ▲
              │                                       │
              │                              ┌────────────────────────────────┐
              │                              │ ETNOS AppView (our indexer)    │
              │                              │ - subscribes to Aksara PDSes   │
              │                              │ - verifies UCAN on read        │
              │                              │ - serves Svelte client + Hermes│
              │                              └────────────────────────────────┘
              │
  ┌───────────────────────────────┐
  │ Daily Merkle anchor           │
  │ → OpenTimestamps              │
  │ → pinned PieFed post          │
  │ → Git tag                     │
  └───────────────────────────────┘
```

Two runtimes (PieFed; PDS+AppView). One indexer per ETNOS instance. One small bridge process. Three small auxiliary services (UCAN issuer, Merkle anchor cron, BSrE signer). All boring.

Hermes agents talk MCP to local skills, A2A to peer agents, and read/write to their PDS using the atproto client. The Svelte client talks to PieFed for forum and to the AppView for memory. No third polyglot runtime. No NextGraph wait. No ActivityPods Jena Fuseki.

## 9. Stop-doing list

1. **Stop waiting for ActivityPods 2.x to ship the NextGraph swap.** Mid-late 2026 is the stated target; permissioned data on atproto is *also* mid-late 2026. We are no later by leaving ActivityPods.
2. **Stop tracking NextGraph as a memory substrate.** It is a beautiful CRDT engine for a different shape of app. Revisit in 2028 if local-first conflict resolution becomes a primary requirement.
3. **Stop evaluating DWN / Web5.** TBD shutdown; DIF caretaker mode; no vendor push. Adopting it costs lock-in to a frozen spec.
4. **Stop talking about a permissioned chain.** Including "civic appchain" framings in proposals to NLnet or OTSUS. It actively damages the gov-bridge story.
5. **Stop scoping a PieFed fork that does everything.** PieFed++ as the universal substrate is a five-engineer-year commitment we cannot honor.
6. **Stop using `did:plc` as primary identity for civic actors.** `did:web` for citizens and dinas; `did:wba` for agent actors; `did:plc` only when atproto-native discovery (Bluesky bridge) is required.
7. **Stop building a Solid Pod story.** We were never going to integrate WebACL-style permissions UX with Hermes; UCAN is the answer.
8. **Stop trying to make Foundation Protocol a runtime.** It is vocabulary — use it in documentation, not in deployment.

## 10. Revised migration paths

### 0–6 months (through end of 2026)

1. Stay on PieFed 1.6+ for content. Ship the deferred ETNOS_ROADMAP items (PWA, four-tier badges, two-mode trust, CARE labels, WhatsApp deep-links). No backend change.
2. Issue `did:web` for ETNOS infrastructure and one pilot kelurahan. Document the DID Document schema per `docs/aksara/onboarding.md` §3.
3. Stand up **one atproto PDS** under a `*.papua.id` subdomain for one pilot Aksara node. Use the upstream Bluesky PDS distribution unmodified. No custom build.
4. Define five core lexicons: `id.papua.kelurahan.suratDomisili`, `id.papua.aksara.skillManifest`, `id.papua.aksara.grant`, `id.papua.adat.kinshipVouch`, `id.papua.aksara.activityLog`. Publish at `id.papua/lexicons/`.
5. Build a minimal AppView (Node or Python) that subscribes to that PDS, verifies UCAN, and serves the Svelte client.
6. Pilot UCAN issuance: Dewan-side CLI tool issuing grants signed by a `did:web`. No on-chain anything.
7. Wire daily Merkle anchor to OpenTimestamps + pinned PieFed post.
8. Stand up one PieFed↔atproto bridge process so an Aksara's signed public post lands as a PieFed post with a back-link to the PDS record URI.

### 6–24 months

9. Roll out atproto-native permissioned data when Bluesky's spec lands ([AT Protocol Spring 2026 Roadmap](https://atproto.com/blog/2026-spring-roadmap)). If the spec slips into 2027, our UCAN+AppView approach keeps working — we're not blocked.
10. Add the sacred-blob encryption sidecar (libsodium sealed boxes; Dewan threshold key). Three engineer-weeks.
11. Onboard the first balai adat Aksara node with kinship-vouch lexicon flows.
12. Re-evaluate `did:plc` only if cross-publishing to the Bluesky AppView becomes a community ask.
13. Re-evaluate Sublinks only if a separate institution requests a Java-stack peer.
14. **Do not** re-evaluate chains, ActivityPods, DWN, or a PieFed fork at the 12-month mark. Earliest reconsideration: 24 months in, with documented unmet need.

---

## Sources

Foundation Protocol & adjacent papers:

- [arXiv 2605.23218 — Foundation Protocol: A Coordination Layer for Agentic Society](https://arxiv.org/abs/2605.23218) (May 22 2026)
- [arXiv 2602.15831 — A2H: Agent-to-Human Protocol for AI Agent](https://arxiv.org/abs/2602.15831)
- [arXiv 2602.15055 — Beyond Context Sharing: ACP for Federated A2A Orchestration](https://arxiv.org/abs/2602.15055)
- [arXiv 2509.20175 — Federation of Agents: Semantics-Aware Communication Fabric](https://arxiv.org/pdf/2509.20175)
- [arXiv 2507.07901 — The Trust Fabric: Decentralized Interoperability for the Agentic Web](https://arxiv.org/pdf/2507.07901)

PieFed / threadiverse:

- [PieFed source on Codeberg (pyfedi)](https://codeberg.org/rimu/pyfedi) · [PieFed 1.6 release announcement](https://community.nodebb.org/topic/15f9451d-1d64-424d-8e4c-fff886edce28/piefed-1.6-is-released-pronouns-private-communities-quote-posts-and-much-more)

AT Protocol:

- [AT Protocol Spring 2026 Roadmap](https://atproto.com/blog/2026-spring-roadmap) · [OAuth spec](https://atproto.com/specs/oauth) · [OAuth for AT Protocol blog](https://docs.bsky.app/blog/oauth-atproto) · [Early Permission Sets discussion #4437](https://github.com/bluesky-social/atproto/discussions/4437) · [Auth scopes progress Aug 2025 #4118](https://github.com/bluesky-social/atproto/discussions/4118) · [Encryption for private content discussion #121](https://github.com/bluesky-social/atproto/discussions/121) · [Private Data Working Group](https://atproto.wiki/en/working-groups/private-data) · [Lexicons guide](https://atproto.com/guides/lexicon) · [WhiteWind blog repo](https://github.com/whtwnd/whitewind-blog) · [Self-hosting PDS writeup](https://mattdyson.org/blog/2024/11/self-hosting-bluesky-pds/) · [PLC Directory Org blog](https://docs.bsky.app/blog/plc-directory-org)

Agent protocols:

- [Linux Foundation A2A launch](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) · [A2A 150-org adoption press](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year) · [ANP site](https://agent-network-protocol.com/) · [did:wba intro](https://www.agent-network-protocol.com/blogs/posts/did-wba-intro.html) · [arXiv 2505.02279 — Survey of MCP/ACP/A2A/ANP](https://arxiv.org/html/2505.02279v1) · [MCP 2026-07-28 RC blog](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/) · [Okta Cross App Access announcement (Cloud Security Alliance writeup)](https://labs.cloudsecurityalliance.org/research/csa-research-note-okta-ai-agent-iam-framework-enterprise-gap/)

Capability tokens:

- [UCAN spec on GitHub](https://github.com/ucan-wg/spec) · [UCAN TS implementation](https://github.com/ucan-wg/ts-ucan) · [Storacha UCAN concepts](https://docs.storacha.network/concepts/ucan/)

Web5 / DWN:

- [TBD sunset coverage (TechCrunch Nov 2024)](https://techcrunch.com/2024/11/07/block-scales-back-tidal-investment-and-shutters-tbd-in-favor-of-bitcoin-mining/) · [TBD shutdown — crypto.news](https://crypto.news/block-inc-shifts-focus-to-bitcoin-mining-amid-plans-to-sunset-web5-focused-tbd/) · [DIF DWN Community Node announcement](https://blog.identity.foundation/dwn-community-node/) · [DIF DWN spec](https://identity.foundation/decentralized-web-node/spec/)

Solid / chain context:

- [Inrupt WAC tutorial](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/manage-wac/) · [Chainscore hidden cost of Cosmos](https://www.chainscorelabs.com/en/blog/the-appchain-thesis-cosmos-and-polkadot/appchain-development-frameworks/the-hidden-cost-of-choosing-cosmos-sdk-over-substrate) · [ActivityPods + NextGraph joining forces](https://activitypods.org/activitypods-and-nextgraph-are-joining-forces) · [NextGraph Roadmap](https://nextgraph.org/roadmap/)

Internal:

- [`docs/research/sovereign-stack-architecture.md`](./sovereign-stack-architecture.md) · [`docs/research/activitypods-backend-port.md`](./activitypods-backend-port.md) · [`docs/aksara/onboarding.md`](../aksara/onboarding.md) · [`ETNOS_ROADMAP.md`](../../ETNOS_ROADMAP.md) · [`CUSTOMIZATIONS.md`](../../CUSTOMIZATIONS.md)
