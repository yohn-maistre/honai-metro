# ETNOS Sovereign Stack: Content + Memory + Identity

A composed architecture recommendation for the Papua civic platform, June 2026.

> **Note on sources:** No `docs/etnos/` directory exists; this report builds on `ETNOS_ROADMAP.md`, `CUSTOMIZATIONS.md`, `.env.example` (`piefed.social` / `piefedalpha`), and the prior `activitypods-backend-port.md` study. Every concrete substrate claim is cited.

---

## TL;DR

**Keep PieFed as content. Add ActivityPods + NextGraph as the Pod layer for Aksara/institutional memory once NextGraph brokers self-host (mid-2026). Make `did:web` the everyday identifier, with BSrE attestations attached as verifiable credentials in DID Document `service` entries for Tier-3 civic actions and government Aksara seals. Do not build a chain.** Permissioned/self-built chains are vanity for a province-scoped deployment; the right primitive is signed, content-addressed CRDT logs with periodic Merkle anchors published to a boring public timestamp (Git tag, OpenTimestamps, a pinned PieFed post). The win is composition: one DID resolves a citizen post, an Aksara memory entry, and a BSrE-sealed dinas notice through one consent model.

---

## Scorecard

Scores 1–5 (5 = best). Weighted toward Papua reality: low-bandwidth, low-headcount-ops, Indonesian regulatory bridges (UU PDP, BSSN), CARE-compatible.

### Content layer

| Substrate | Prod-ready 2026 | Self-host | Federation reach | Gov bridge | CARE fit | DX (Svelte/Py) | Cost |
|---|---|---|---|---|---|---|---|
| **PieFed 1.6** | 5 | 4 | 5 (Lemmy+Mbin+PieFed) | 3 | 4 (private communities ship 1.6) | 5 (Python, our adapter works) | 5 |
| Lemmy (Rust) | 5 | 4 | 5 | 2 | 2 (no private comms until 1.x roadmap) | 3 | 5 |
| Sublinks (Java) | 2 (alpha, Lemmy-API drop-in goal) | 3 | 4 (when stable) | 3 | 2 | 3 | 4 |
| Mastodon/Sharkey | 5 | 4 | 5 microblog | 3 | 2 (wrong shape) | 3 | 4 |
| Custom AS2/AP server | 1 | 5 | 1 at first | 5 | 5 | 1 | 1 |

### Memory layer

| Substrate | Prod-ready 2026 | Self-host | Sovereignty | Gov bridge | CARE fit | DX | Cost |
|---|---|---|---|---|---|---|---|
| **ActivityPods + NextGraph (Pod layer)** | 3 (broker self-host mid-2026) | 3 → 5 | 5 | 3 | 5 (per-actor Pod + ACL) | 3 (JS/TS-first, Python via SemApps) | 3 |
| Solid (CSS) alone | 4 | 4 | 4 | 3 | 4 | 3 | 4 |
| Postgres + S3 + audit log | 5 | 5 | 2 | 5 | 3 | 5 | 5 |
| IPFS + OrbitDB | 2 (browser heavy, gateway-reliant) | 3 | 4 | 2 | 3 | 2 | 3 |
| Holochain | 2 | 3 | 5 | 1 | 3 | 1 (Rust DNAs, no Python SDK) | 2 |
| AT Protocol repos | 4 (PDS works) | 3 | 3 (PLC bottleneck) | 2 | 2 (no native ACL) | 3 | 4 |
| Permissioned chain (Substrate/Cosmos/Fabric) | 4 | 2 | 1 (governance overhead) | 1 | 1 | 1 | 1 |
| Build our own chain | 0 | n/a | 0 | 0 | 0 | 0 | 0 |

### Identity layer

| Substrate | Prod-ready 2026 | Self-host | Rotation | Gov bridge | CARE fit | DX | Cost |
|---|---|---|---|---|---|---|---|
| **did:web** | 5 | 5 | 2 (key roll = DNS update) | 5 (BSrE binds via service entry) | 4 | 5 | 5 |
| did:plc | 4 | 3 (PLC dir is shared) | 5 (recovery key, 72h) | 3 | 3 | 4 | 4 |
| did:key | 5 | 5 | 0 | 1 | 2 | 5 | 5 |
| did:ion | 3 | 3 | 4 | 2 | 3 | 2 (slow updates) | 3 |
| did:ethr | 4 | 3 | 4 | 1 | 1 (gas) | 3 | 2 |
| Solid-OIDC (WebID) | 4 | 5 | 3 | 3 | 4 | 4 | 5 |
| **BSrE/Dukcapil bridge** | 5 (mandatory for civic) | n/a (gov ToS) | 5 (BSSN cert lifecycle) | 5 | 2 | 3 (PHP/Node SDKs) | 4 |
| FedCM | 4 (Chrome 117+, Firefox shipping 2025–26) | n/a (browser API) | n/a | 3 | 3 | 4 | 5 |

---

## Substrate-by-substrate findings (skeptical mode)

### Content: PieFed wins by default and on merit

PieFed 1.6 (Feb 2026) shipped **private communities** (no federation, role-gated invites, members-only posts) — the exact primitive *ruang adat* needs — plus pronouns-as-flair, quote posts, per-community downvote disable, and reply-block auto-delete on remote instances ([PieFed 1.6 on NodeBB](https://community.nodebb.org/topic/15f9451d-1d64-424d-8e4c-fff886edce28/piefed-1.6-is-released-pronouns-private-communities-quote-posts-and-much-more); [PieFed 1.6 on piefed.social](https://piefed.social/c/fediverse/p/1728637/piefed-1-6-is-released-pronouns-private-communities-quote-posts-and-much-more); [Lemmy is still implementing the same feature via NLnet](https://nlnet.nl/project/Lemmy-PrivateCommunities/)). The Photon `piefedalpha` adapter targets this today. Sublinks ([sublinks.org](https://sublinks.org/), [sublinks-api](https://github.com/sublinks-java/sublinks-api)) is interesting but pre-1.0 with no production footprint; picking it over PieFed today is ideological. Mastodon/Misskey/Sharkey are microblog-shaped and wrong here.

**Verdict:** PieFed. Re-evaluate Sublinks in 2027.

### Memory: signed CRDTs in personal Pods, not a chain

The "on-chain duplicated memory with permission" idea is mostly vanity at our scale. What you want from a chain is **(a)** tamper-evident log, **(b)** independent replication, **(c)** deterministic audit. Signed CRDTs in NextGraph give you (a) and (b) directly — events are signed, content-addressed, E2E-encrypted, and the broker only forwards ciphertext it cannot read ([NextGraph encryption docs](https://docs.nextgraph.org/en/encryption/); [roadmap](https://nextgraph.org/roadmap/)). (c) is a daily Merkle root posted to OpenTimestamps + Git + a pinned PieFed post. That is "checkpointed CRDT," not "chain," and it costs ~zero ops headcount.

A Substrate/Cosmos appchain instead buys a governance system you didn't ask for (Cosmos SDK governance takes 6–12 months to design, audit, stress-test; per-tx bridge floor cost ~$0.50–$5; [Chainscore: hidden cost](https://www.chainscorelabs.com/en/blog/the-appchain-thesis-cosmos-and-polkadot/appchain-development-frameworks/the-hidden-cost-of-choosing-cosmos-sdk-over-substrate)), a hard-fork upgrade ceremony per change, and a validator set you must recruit and police. For a 4.3M-person province across six regencies with patchy connectivity, "21 validators with 99.9% uptime" is an unforced error.

**Self-built chain:** never. The conditions that justify one (multi-jurisdiction settlement, adversarial fork pressure, a native token economy) are absent. We'd lose time-to-ship, audit budget, and the ability to fix bugs by rolling forward Postgres. We'd gain a marketing line. **Reject.**

Holochain matches the "each Aksara is its own agent with its own chain" framing on paper ([Holochain glossary](https://developer.holochain.org/resources/glossary/)) but DNAs are Rust-only with thin Python/JS surface and a thin production footprint. Hold for 2028 reconsideration.

IPFS+OrbitDB browser story is heavy and gateway-reliant ([orbitdb.org](https://orbitdb.org/); [GenosDB 2026 comparison](https://genosdb.com/popular-p2p-distributed-databases)) — wrong for low-end Android in Wamena.

AT Protocol PDS repos are signed, lexicon-typed, self-hostable ([self-hosting PDS](https://mattdyson.org/blog/2024/11/self-hosting-bluesky-pds/)) but **everything in a repo is world-readable** — fatal for *ruang adat* sacred content. Borrow atproto's lexicons and the Ozone labeler pattern, don't adopt it as memory substrate.

**NextGraph readiness, honestly:** Repository format + social queries land Jan 2026; WebRTC connect-to-IP self-hosted + Forward Protocol broker March 2026; self-hostable broker "in the course of 2026" ([roadmap](https://nextgraph.org/roadmap/); [FOSDEM 2026 talk](https://fosdem.org/2026/schedule/event/CRSTQ8-nextgraph/)). SDK is Rust-core with TS/Svelte/**Python** bindings ([nextgraph-rs](https://github.com/nextgraph-org/nextgraph-rs)) — real win for Svelte client + Flask PieFed + Hermes agents reading the same quad-store. Catch: ActivityPods 2.0 still uses Jena Fuseki and has not shipped the NextGraph swap or Solid-OIDC+DPoP work ([2.0 announcement](https://activitypods.org/activitypods-2-0-is-out); [2025 roadmap](https://activitypods.org/our-roadmap-for-2025); [join post](https://activitypods.org/activitypods-and-nextgraph-are-joining-forces)). "Encrypted Pods on NextGraph" is **late-2026 reality, not mid-2026**.

### Identity: did:web everyday, BSrE attached, never did:plc as root

`did:web` is trivial to operate (DNS + `/.well-known/did.json`), lets every Aksara/dinas be its own DID via subdomain (`balai-adat-jayapura.etnos.papua.id`), and composes natively with the web. The honest weakness is **no rotation story** beyond "rotate keys, push to DNS." That weakness is small in our threat model: civic actors with HSM-backed BSrE keys roll via BSSN's certificate lifecycle, not DID rotation; ordinary citizens roll like changing an email password.

`did:plc` is mutable, fast, has a 72h-recovery-key window, is the atproto default ([DID spec](https://atproto.com/specs/did)) — but the PLC directory is operated by Bluesky PBC, transitioning to a Swiss Association in 2026 ([PLC Directory Org blog](https://docs.bsky.app/blog/plc-directory-org)). Anchoring "Papua's civic identity" in a Swiss NGO is a sovereignty marketing problem we don't need. Use `did:plc` for the atproto bridge only, never as primary.

`did:key` is fine for ephemeral agents; `did:ion` has slow updates; `did:ethr` adds a token dependency we will not explain to Dewan Adat.

**Composition that works:** every entity gets a `did:web` whose DID Document includes:

1. `verificationMethod` — the entity's everyday Ed25519 key.
2. `service` entry of type `BSrEAttestation` — for Tier-3 KTP-verified citizens and government Aksaras, a verifiable credential whose subject is the DID and issuer is BSSN/Dukcapil, signed by BSrE per the standard `/api/sign/pdf` flow ([pemkotbekasi/node-esign-BSrE](https://github.com/pemkotbekasi/node-esign-BSrE); [OpenSID/E-Sign-BSrE](https://github.com/OpenSID/E-Sign-BSrE); [BSrE portal](https://portal-bsre.bssn.go.id/)). The VC is a separate document so it can be revoked without burning the DID.
3. `service` entry of type `DewanAdatVouch` — for Tier-4 community-vouched members, a t-of-n threshold signature from the relevant Dewan Adat keys. Revocable. Optional.
4. `service` entry of type `SolidPod` — the pod URL where the entity stores its memory (per ActivityPods / Solid Application Interoperability).
5. `service` entry of type `ActivityPubInbox` — the PieFed inbox of the actor (or, for institutional Aksaras, the ActivityPods actor inbox).
6. `service` entry of type `LinkedAtProto` (optional) — the `did:plc` of an atproto repo for the same entity, so labelers and the wider atproto ecosystem can be opt-in consumed.

FedCM is interesting at the **browser** layer: it lets ETNOS surface "Sign in with Dukcapil" alongside "Sign in with WhatsApp" without third-party cookies and is mandatory for Google One Tap as of August 2025 ([MDN FedCM](https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API); [Chrome FedCM overview](https://developer.chrome.com/docs/identity/fedcm/overview)). Treat it as a presentation-layer convenience, not the identity substrate.

### CARE / TK Labels: not a substrate, a metadata vocabulary that crosses all three layers

The CARE Principles (Collective Benefit, Authority to Control, Responsibility, Ethics) and the **TK Labels** vocabulary from Local Contexts ([gida-global.org CARE Principles](https://www.gida-global.org/careprinciples); [localcontexts.org TK Labels](https://localcontexts.org/labels/traditional-knowledge-labels/)) are the right vocabulary to attach to *every* piece of content in *all three layers*. Concretely: PieFed post metadata, Pod resources, DID Document attestations all carry the same `tk:Label` predicate. This is what makes "consent-tagged duplication" real without invoking a blockchain.

---

## Composition diagram (textual)

```
                           ┌────────────────────────────────────┐
                           │     Citizen / Agent / Institution  │
                           │            did:web identifier      │
                           │ ─────────────────────────────────  │
                           │  + BSrE VC (gov / Tier-3)          │
                           │  + Dewan Adat threshold (Tier-4)   │
                           │  + Solid Pod URL                   │
                           │  + ActivityPub inbox URL           │
                           │  + (optional) did:plc link         │
                           └────────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
   ┌────────────────┐        ┌──────────────────┐        ┌────────────────┐
   │ PieFed (Flask) │        │ ActivityPods 2.x │        │ BSrE / Dukcapil│
   │ Postgres+Redis│        │ + NextGraph CRDT  │        │ (BSSN gov PKI) │
   │ Lemmy-ish API │        │ E2EE quad-store   │        │ HTTPS APIs     │
   │ ActivityPub   │        │ WebACL+SAI        │        │                │
   └──────┬─────────┘        └─────────┬────────┘        └────────┬───────┘
          │ federates with             │ ActivityPub             │ signs VCs
          │ Lemmy / Mbin / PieFed      │ between Pods            │ attached
          ▼                            ▼                          ▼
   ┌────────────────┐        ┌──────────────────┐        ┌────────────────┐
   │ Public square: │        │ Aksara memory:   │        │ Tier-3 + gov   │
   │ communities,   │◄──────►│ per-institution  │◄──────►│ seal layer:    │
   │ ruang adat     │ signed │ Pods, conversation│ VC-in │ KTP-verified,  │
   │ (private)      │ refs   │ history, skills  │ DID   │ BSrE-signed    │
   └────────────────┘        └──────────────────┘        └────────────────┘
                                       │
                                       ▼
                           ┌──────────────────────────┐
                           │ Daily Merkle checkpoint  │
                           │ → OpenTimestamps + Git   │
                           │ → pinned PieFed post     │
                           │ (poor-person's "chain")  │
                           └──────────────────────────┘
```

Cross-cutting layers not in the question but needed:

- **Labeler / moderation network.** Borrow the Bluesky Ozone pattern as architecture, not dependency ([Ozone repo](https://github.com/bluesky-social/ozone); [moderation architecture](https://docs.bsky.app/blog/blueskys-moderation-architecture)). A labeler is an actor publishing signed `Flag`/`Label` activities. Run one per authority: Dewan Adat (cultural protocol), kelurahan (civic spam), volunteers (hate speech). Users subscribe.
- **Reputation / vouching.** Tier-4 vouch is a labeler whose subjects are DIDs and predicate is `vouchedBy`; threshold variant `t-of-n` for sacred spaces.
- **Key management / HSM.** Required by BSSN for government seals. Integrate via BSrE PDF/PKCS#7 API; don't build.
- **Discovery.** WebFinger, `/.well-known/did.json`, Solid type indexes. All adopted, none built.
- **Indexing / search.** PieFed built-in for forum; one per-instance SPARQL endpoint for Pods.
- **Notification fan-out.** ActivityPub inbox + WhatsApp deep-links (already in roadmap).
- **Payments.** **ETNOS does not need a payments layer in v1.** No civic token. Future disbursement flows use QRIS/GovTech rails.

---

## What we don't know yet

1. **Does ActivityPods 2.x ship the NextGraph swap on schedule?** Mid-2026 is the public target. If it slips into 2027, plan B is ActivityPods on Jena Fuseki + at-rest disk encryption + the daily Merkle checkpoint.
2. **Does BSrE accept DID-bound signing or only PDF/PKCS#7?** All public SDKs are PDF-shaped ([OpenSID](https://github.com/OpenSID/E-Sign-BSrE); [Arra Digital writeup](https://arradigital.com/post/integrasi-tanda-tangan-digital-bsre-untuk-dokumen-resmi-instansi-pemerintah)). Likely we sign canonical JSON-LD VCs inside a PDF envelope. Pending confirmation.
3. **Dukcapil API access tier.** Gated by MoU; per-call cost and latency at province scale unknown.
4. **NextGraph SDK Python parity.** Bindings exist; maturity uneven — Hermes agents may need a Rust shim.
5. **Whether PieFed accepts upstream patches for TK Label fields**, or we maintain a fork (CUSTOMIZATIONS.md already tracks edits).
6. **PLC directory governance after Swiss Association handover** — if clean, `did:plc` becomes a more defensible cross-link.

---

## Migration path

### Now → end of 2026 (6 months)

1. **Stay on PieFed.** Ship the deferred items in `ETNOS_ROADMAP.md`: PWA, four-tier badges, two-mode trust surfacing, CARE consent labels in post metadata, WhatsApp deep-links.
2. **Stand up `did:web` for ETNOS infrastructure.** Issue a DID Document at `https://etnos.papua.id/.well-known/did.json` for the platform itself; one per Aksara persona; document the schema (verificationMethod, service entries).
3. **Pilot BSrE integration with one kelurahan.** Use [pemkotbekasi/node-esign-BSrE](https://github.com/pemkotbekasi/node-esign-BSrE) or the OpenSID PHP package; sign one weekly bulletin PDF; attach the signed PDF hash to a `BSrEAttestation` VC and link via DID Document.
4. **Adopt TK Labels vocabulary** end-to-end. Display-only at first.
5. **Stand up one ActivityPods 2.x instance** on Jena Fuseki for the Sekretaris Digital persona. Read its outbox; surface signed posts back into PieFed.

### Late 2026 → end of 2027 (24 months)

6. **Swap ActivityPods storage to NextGraph** as soon as the broker self-hosts and the NextGraph swap lands in ActivityPods main. Encrypted Pods become a real feature.
7. **Daily Merkle checkpoint of Aksara memory.** Publish to OpenTimestamps + a Git repo + a pinned PieFed post. This is our "permissioned chain" — without the chain.
8. **Roll out Tier-4 Dewan Adat threshold vouches** as labelers consuming the DID layer.
9. **Re-evaluate Sublinks** if a separate institution wants a parallel Java-stack content node; otherwise stay on PieFed.
10. **Re-evaluate atproto** as a *cross-publish target* for public Aksara content — never as the primary store. Linked via the `LinkedAtProto` service entry.
11. **Do not re-evaluate chains.** Revisit only if multi-province / multi-jurisdiction settlement becomes a real requirement.

The composition is defensible end-to-end today on paper, gracefully degrades to "PieFed + Postgres + did:web + BSrE PDFs" if the Pod layer slips, and never requires us to ship a validator network.

---

## Sources

- ETNOS prior research: `/home/user/honai-metro/docs/research/activitypods-backend-port.md`.
- PieFed: [1.6 release on NodeBB community](https://community.nodebb.org/topic/15f9451d-1d64-424d-8e4c-fff886edce28/piefed-1.6-is-released-pronouns-private-communities-quote-posts-and-much-more) · [1.6 release on piefed.social](https://piefed.social/c/fediverse/p/1728637/piefed-1-6-is-released-pronouns-private-communities-quote-posts-and-much-more) · [Features page](https://join.piefed.social/features/) · [NLnet Lemmy private communities](https://nlnet.nl/project/Lemmy-PrivateCommunities/).
- Sublinks: [sublinks.org](https://sublinks.org/) · [sublinks-java/sublinks-api](https://github.com/sublinks-java/sublinks-api).
- ActivityPods + NextGraph: [Joining forces](https://activitypods.org/activitypods-and-nextgraph-are-joining-forces) · [2.0 release](https://activitypods.org/activitypods-2-0-is-out) · [2025 roadmap](https://activitypods.org/our-roadmap-for-2025) · [NextGraph roadmap](https://nextgraph.org/roadmap/) · [NextGraph encryption docs](https://docs.nextgraph.org/en/encryption/) · [nextgraph-rs repo](https://github.com/nextgraph-org/nextgraph-rs) · [FOSDEM 2026 NextGraph talk](https://fosdem.org/2026/schedule/event/CRSTQ8-nextgraph/) · [ActivityPub compatibility in NextGraph](https://docs.nextgraph.org/en/activitypub/).
- Solid / WebACL / Solid-OIDC: [Solid-OIDC TR](https://solidproject.org/TR/oidc) · [Inrupt WAC tutorial](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/manage-wac/) · [Solid Pods data sovereignty paper](https://dl.acm.org/doi/pdf/10.1145/3771554).
- AT Protocol: [DID spec](https://atproto.com/specs/did) · [Self-hosting PDS](https://mattdyson.org/blog/2024/11/self-hosting-bluesky-pds/) · [Account migration](https://atproto.com/guides/account-migration) · [PLC Directory Org blog](https://docs.bsky.app/blog/plc-directory-org) · [Resolving identities](https://docs.bsky.app/docs/advanced-guides/resolving-identities) · [Ozone repo](https://github.com/bluesky-social/ozone) · [Bluesky moderation architecture](https://docs.bsky.app/blog/blueskys-moderation-architecture).
- DIDs and FedCM: [MDN FedCM](https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API) · [Chrome FedCM overview](https://developer.chrome.com/docs/identity/fedcm/overview).
- BSrE / BSSN: [BSrE portal](https://portal-bsre.bssn.go.id/) · [BSrE landing](https://bsre.bssn.go.id/) · [pemkotbekasi/node-esign-BSrE](https://github.com/pemkotbekasi/node-esign-BSrE) · [OpenSID/E-Sign-BSrE](https://github.com/OpenSID/E-Sign-BSrE) · [Arra Digital integration writeup](https://arradigital.com/post/integrasi-tanda-tangan-digital-bsre-untuk-dokumen-resmi-instansi-pemerintah).
- CARE / TK Labels: [GIDA CARE Principles](https://www.gida-global.org/careprinciples) · [Local Contexts TK Labels](https://localcontexts.org/labels/traditional-knowledge-labels/) · [Wikipedia CARE Principles](https://en.wikipedia.org/wiki/CARE_Principles_for_Indigenous_Data_Governance).
- Holochain: [holochain.org What is](https://www.holochain.org/what-holochain/) · [Holochain glossary](https://developer.holochain.org/resources/glossary/).
- Appchains and the "build a chain" question: [Chainscore Cosmos vs Substrate hidden cost](https://www.chainscorelabs.com/en/blog/the-appchain-thesis-cosmos-and-polkadot/appchain-development-frameworks/the-hidden-cost-of-choosing-cosmos-sdk-over-substrate) · [Zeeve appchain frameworks](https://www.zeeve.io/blog/building-custom-blockchain-solutions-cosmos-sdk-substrate-rollups/).
- IPFS / OrbitDB: [orbitdb.org](https://orbitdb.org/) · [GenosDB P2P comparison 2026](https://genosdb.com/popular-p2p-distributed-databases).
