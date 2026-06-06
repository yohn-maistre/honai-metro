# ETNOS Backend Port: ActivityPods, PieFed, NextGraph

Architectural recommendation, June 2026.

> **Note on sources:** The user-referenced files `docs/etnos/v3.5.md` and `docs/etnos/v0.5-app-nlnet.md` do not exist in this repo (only `ETNOS_ROADMAP.md` and `CUSTOMIZATIONS.md` were available). `.env` does not exist either; `.env.example` confirms the current target: `PUBLIC_INSTANCE_URL=piefed.social`, `PUBLIC_INSTANCE_TYPE=piefedalpha`. Findings below are based on that plus primary web sources.

---

## TL;DR

**Keep PieFed as the content/forum backend. Adopt ActivityPods only as a parallel "Pod layer" for Aksara agent memory and institutional identity — and only after a 6–12 month pilot.** PieFed 1.6 (Feb 2026) is a mature, single-language (Python/Flask) Lemmy-compatible threadiverse server with an actively-maintained Lemmy-shaped API the Photon fork already targets ([PieFed 1.6 release](https://community.nodebb.org/topic/15f9451d-1d64-424d-8e4c-fff886edce28/piefed-1.6-is-released-pronouns-private-communities-quote-posts-and-much-more), [pyfedi on Codeberg](https://codeberg.org/rimu/pyfedi)). ActivityPods 2.0 (Oct 2024) is real, NGI/NLnet-funded, and has one notable production deployment (~500 users in Compiègne) but is a personal-Pod framework, not a forum engine, and is still mid-flight on Solid-OIDC + NextGraph integration ([ActivityPods 2.0 is out](https://activitypods.org/activitypods-2-0-is-out), [Roadmap 2025](https://activitypods.org/our-roadmap-for-2025)). NextGraph is not an ActivityPods alternative — it is being absorbed as ActivityPods' encrypted quad-store, and its own broker self-hosting is not yet production-ready ([NextGraph Roadmap](https://nextgraph.org/roadmap/), [Joining forces post](https://activitypods.org/activitypods-and-nextgraph-are-joining-forces)). There is no Lemmy/PieFed → ActivityPods migration path; a swap would be a rewrite with no data continuity.

---

## Q1. Is ActivityPods production-ready in 2026?

**Verdict: Early-production for the niche it was designed for (personal Pods + small-circle social apps). Not production-ready as a forum/threadiverse backend, because it isn't one.**

Concrete evidence:

- **Latest major release:** ActivityPods 2.0, October 7, 2024 ([announcement](https://activitypods.org/activitypods-2-0-is-out)). v1.5 preceded it; no public 2.x point releases are highlighted on the blog through mid-2026 ([Blog index](https://activitypods.org/blog)).
- **Known production deployments:** "Welcome to my Place" (Feb 2022) and "Mutual Aid" (Mar 2022) are used by a community of ~500 people in the Compiègne area north of Paris, each running their own Pod ([Story of SemApps](https://activitypods.org/the-story-of-semapps-and-future-of-activitypods)). "Mastopod" (Mar 2024) is a Mastodon-compatible client storing data on Pods. That is the entire publicly-named production footprint.
- **Funding signal (positive):** NGI0 Entrust Fund 2023–2025 and NGI0 Commons Fund from 2025, both via NLnet/EC NGI ([NLnet project page](https://nlnet.nl/project/ActivityPods/)). Active 2025 roadmap commits to completing Solid-OIDC + DPoP tokens and swapping Jena Fuseki for NextGraph ([Roadmap 2025](https://activitypods.org/our-roadmap-for-2025)).
- **Risk signal:** In 2026 they are still mid-replacement of the underlying triplestore. Encryption is not yet shipped; the page describes it in future tense ("the immediate benefit *will be* that all data will be encrypted").
- **Underlying framework:** Built on SemApps, a semantic-web/Moleculer toolbox ([ActivityPub middleware](https://semapps.org/docs/middleware/activitypub/)). SemApps is the load-bearing dependency; ActivityPods is the productized stack on top.

For a small-to-medium Papua-scale community deployment (target: thousands of users, forum semantics, mobile-first), ActivityPods is **alpha-grade for that use case** because the use case isn't what it's built for. For "agents-with-Pods storing structured memory and federating between institutions," it is **early-production-grade** with a real but tiny reference deployment.

---

## Q2. ActivityPods AS the backend, or only as the Pod/agent-memory layer?

**Recommendation: Pod layer only. Keep PieFed for content.**

Reasoning:

1. **PieFed is a forum; ActivityPods is not.** PieFed has the threadiverse data model (communities, topics, posts, votes, mod tools, federation with Lemmy/Mbin) baked in. It "made sure to make their API as close to Lemmy's as possible" ([Threadiverse primer](https://cenotaph.prose.sh/threadiverse)), which is why the Photon fork's `piefedalpha` adapter works today. ActivityPods is a generic Solid+ActivityPub substrate; building Reddit-style forum semantics on it would be greenfield app work on top of an evolving 2.x framework.
2. **PieFed is shipping fast and has the features ETNOS already documented as deferred.** PieFed 1.6 (Feb 2026) added pronouns, private communities, quote posts, and more ([PieFed 1.6 announcement](https://community.nodebb.org/topic/15f9451d-1d64-424d-8e4c-fff886edce28/piefed-1.6-is-released-pronouns-private-communities-quote-posts-and-much-more)); 1.0 shipped earlier ([PieFed 1.0 dev update](https://piefed.social/post/956553)). Private communities directly maps to the ETNOS four-tier vouching / Dewan-Adat consent model in `ETNOS_ROADMAP.md`.
3. **Federation reach.** PieFed federates seamlessly with Lemmy and Mbin — Lemmy alone had ~455 instances and 48.6k MAU as of Dec 2025 ([Lemmy Wikipedia entry referenced in search](https://en.wikipedia.org/wiki/Lemmy_(software))). An ActivityPods-only ETNOS would be a federation island talking to a handful of Compiègne apps.
4. **Where ActivityPods fits well: Aksara.** The "agents with institutional memory that federate between Pods" framing is exactly what ActivityPods 2.0 v2 architecture targets — per-app backends, each with its own ActivityPub actor, registering against user/institution Pods via Solid Application Interoperability (SAI) ([Road to ActivityPods 2.0](https://activitypods.org/the-road-to-activitypods-2-0)). For dinas/kelurahan-scoped agents with consent-tagged data this is the right tool. Use it there.

**Architecture sketch:**
- ETNOS frontend (this Svelte fork) → PieFed (forum/feed/identity for citizens) — keep current adapter.
- ETNOS frontend → ActivityPods bridge → per-institution Pods (Aksara agent memory, CARE/consent-labelled artefacts, BSrE-signed government content).
- Cross-link via ActivityPub objects: Aksara-generated posts land in PieFed communities with a signed provenance footer pointing back to the originating Pod.

This isolates ActivityPods risk: if the Pod layer slips, the forum keeps working.

---

## Q3. Migration path PieFed → ActivityPods

**There is none. A switch would be a from-scratch rebuild with no data, no IDs, and no federation continuity.**

Specifics:

- **No format overlap.** PieFed stores its model in PostgreSQL with a Lemmy-shaped schema; ActivityPods stores LDP/JSON-LD resources in a quad-store (currently Jena Fuseki, soon NextGraph) addressed per-Pod ([NextGraph integration](https://activitypods.org/activitypods-and-nextgraph-are-joining-forces)). No exporter exists from one to the other.
- **No ActivityPub-level help.** ActivityStreams 2 has a `Move` activity, but it is not part of ActivityPub itself and "behavior is not standard and will vary between server implementations" ([Steve Bate, Fediverse Account Migration](https://www.stevebate.net/fediverse-account-migration/)). PieFed itself can only `Move` between PieFed instances — "this will only work for PieFed instances as Lemmy does not understand 'Move'" ([PieFed community migration thread](https://piefed.social/post/667045)). ActivityPods is even further from this conversation.
- **Data portability work is still draft.** SWICG's "Data Portability in ActivityPub" and LOLA are in-progress specs, not deployable migration tools ([SWICG data portability draft](https://swicg.github.io/activitypub-data-portability/)).
- **Stable-narwhal's Lemmy-Userdata-Migration** moves a user's subscriptions/saves between Lemmy/PieFed instances ([repo](https://stablenarwhal.github.io/Lemmy-Userdata-Migration/)) — useful inside the threadiverse, irrelevant for a Pod target.
- **ID stability:** PieFed actor IDs are `https://piefed.example/u/<name>` shape. ActivityPods actor IDs live under the user's Pod (`https://pod.example/<user>/...`). Any cutover breaks every existing federation follow and every link.

**Practical implication:** If ETNOS were ever to fully switch, the migration plan is "announce a hard cutoff, dual-run, ask users to re-subscribe on the new identity, accept lost edge data." That is a community-fracturing event. Don't propose it unless the Pod layer first proves itself standalone.

---

## Q4. NextGraph: where does it actually fit?

**Answer: (a), with caveats.** NextGraph is becoming the CRDT/encrypted quad-store **underneath** ActivityPods Pods. It is **not** a competing ActivityPods replacement, and it is **not** a niche per-data-type tool.

Concretely, stripping marketing:

- **It is a local-first, end-to-end-encrypted quad-store + sync engine.** ActivityPods' 2025 plan: "Initially, this integration will involve using NextGraph as ActivityPods' graph database, replacing Jena Fuseki" ([Roadmap 2025](https://activitypods.org/our-roadmap-for-2025)). The joining-forces post confirms: "NextGraph is a decentralized and local-first quad-store, so the first step will be for ActivityPods to use NextGraph as its quad-store" ([Joining forces](https://activitypods.org/activitypods-and-nextgraph-are-joining-forces)).
- **It brings two things ActivityPods lacks:** end-to-end encryption at rest, and capability-based permissions using DIDs that compose with Solid Application Interoperability (SAI) — both projects deliberately picked SAI to make the APIs co-mountable ([Joining forces](https://activitypods.org/activitypods-and-nextgraph-are-joining-forces)).
- **Production status (NextGraph itself):** Not yet self-hostable. "The Core protocol hasn't been finalized yet, so for now self-hosting is not proposed, though in the course of 2026, the broker will become available for self hosting." A Forward Protocol for intermediary Brokers is on the roadmap for January 2026, with self-hosted brokers targeted mid-2026 ([NextGraph Roadmap](https://nextgraph.org/roadmap/), [FOSDEM 2026 talk listing](https://fosdem.org/2026/schedule/event/CRSTQ8-nextgraph/)).
- **Does it federate via ActivityPub on its own?** No — federation in this stack stays at the ActivityPub/Pod layer; NextGraph handles encrypted local-first sync between a user's own devices and the Pod. Think of it as "Solid storage with CRDTs and E2EE."

**So for ETNOS:** if you adopt ActivityPods for the Aksara Pod layer, you inherit NextGraph as the storage substrate by 2026–2027 — you don't pick it separately. Right now, if you stood up an ActivityPods instance today, you'd still be on Jena Fuseki and unencrypted. Wait for the NextGraph swap before treating "encrypted Pods" as a real feature.

---

## Recommended sequencing for ETNOS

1. **Now → 2027:** Stay on PieFed 1.6+. Self-host on Hetzner CAX11 or Oracle Always Free per `ETNOS_ROADMAP.md`. Land the deferred items already scoped: PWA, four-tier vouching, two-mode trust surfacing, CARE consent labels.
2. **Mid-2026 pilot:** Stand up one ActivityPods 2.x instance for a single Aksara persona (e.g. Sekretaris Digital for one kelurahan). Wire ETNOS to *read* its public outbox via the existing ActivityPub plumbing and surface signed posts back into PieFed communities. Cost: low, isolated, reversible.
3. **Late 2026 / 2027:** Re-evaluate once (a) ActivityPods has shipped the NextGraph swap and Solid-OIDC + DPoP, and (b) NextGraph brokers are self-hostable. At that point Aksara Pods become a real product surface, not an experiment.
4. **Never (until proven otherwise):** Do not propose replacing PieFed wholesale. There is no migration path, no comparable federation reach, and no forum data model in ActivityPods.

---

## Sources

- [ActivityPods overview](https://activitypods.org/) · [2.0 release](https://activitypods.org/activitypods-2-0-is-out) · [Road to 2.0](https://activitypods.org/the-road-to-activitypods-2-0) · [Roadmap 2025](https://activitypods.org/our-roadmap-for-2025) · [Story of SemApps](https://activitypods.org/the-story-of-semapps-and-future-of-activitypods) · [Joining forces with NextGraph](https://activitypods.org/activitypods-and-nextgraph-are-joining-forces) · [Solid compliance spec page](https://activitypods.org/specs/solid) · [Blog](https://activitypods.org/blog)
- [SemApps ActivityPub middleware docs](https://semapps.org/docs/middleware/activitypub/)
- [NLnet ActivityPods project page](https://nlnet.nl/project/ActivityPods/)
- [PieFed 1.0 dev update](https://piefed.social/post/956553) · [PieFed 1.6 release](https://community.nodebb.org/topic/15f9451d-1d64-424d-8e4c-fff886edce28/piefed-1.6-is-released-pronouns-private-communities-quote-posts-and-much-more) · [PieFed has a mobile app](https://piefed.social/post/818571) · [PieFed community migration thread](https://piefed.social/post/667045) · [PieFed source (pyfedi on Codeberg)](https://codeberg.org/rimu/pyfedi)
- [Threadiverse primer (Lemmy/PieFed/Mbin)](https://cenotaph.prose.sh/threadiverse) · [Elena Rossini Show-and-Tell pt.4](https://blog.elenarossini.com/the-future-of-social-is-here-a-show-and-tell-part-4-lemmy-piefed-mbin/)
- [Lemmy 1.0 breaking changes announcement](https://join-lemmy.org/news/2025-02-03_-_Breaking_Changes_in_Lemmy_1.0) · [Lemmy releases on GitHub](https://github.com/LemmyNet/lemmy/releases) · [Lemmy on Wikipedia](https://en.wikipedia.org/wiki/Lemmy_(software))
- [SWICG data portability draft](https://swicg.github.io/activitypub-data-portability/) · [LOLA portability spec](https://swicg.github.io/activitypub-data-portability/lola) · [Steve Bate on Fediverse account migration](https://www.stevebate.net/fediverse-account-migration/) · [Lemmy-Userdata-Migration tool](https://stablenarwhal.github.io/Lemmy-Userdata-Migration/)
- [NextGraph site](https://nextgraph.org/) · [NextGraph Roadmap](https://nextgraph.org/roadmap/) · [NextGraph CRDT docs](https://docs.nextgraph.org/en/framework/crdts/) · [FOSDEM 2026: NextGraph E2EE platform](https://fosdem.org/2026/schedule/event/CRSTQ8-nextgraph/) · [FOSDEM 2026: NextGraph sync engine + ORM](https://fosdem.org/2026/schedule/event/J3ZBYC-nextgraph-sync-engine-sdk-reactive-orm/)
- [We Distribute: ActivityPods as Federated Solid Pods (2024)](https://wedistribute.org/2024/04/activitypods-federated-solid-pods/) · [Welcome to my Place repo](https://github.com/activitypods/welcometomyplace) · [Mutual Aid repo](https://github.com/activitypods/mutual-aid.app)
