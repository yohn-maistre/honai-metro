# AT Protocol — upstream contribution plan

> We are not adopting atproto as our substrate (decision in `unified-federation-protocol.md`). We are still contributing to it. This document explains why, what, and on what timeline.

Status: **draft v0.1**. Owner: ETNOS core. Review: at minimum one external atproto contributor before declaring v1.

---

## 1. Why contribute upstream if we're not adopting

Three reasons, ordered by weight:

1. **Hedge.** If ActivityPods + NextGraph slips past Q3 2027 and we have to revisit memory-substrate choices, our position will be much stronger if we've been participating in the atproto Private Data Working Group rather than parachuting in. Twelve months of context inside the conversation is cheap insurance.
2. **Cross-pollination.** The permissioned-data UX problem (how does a Dewan grant a researcher 30-day read access without exposing UCAN to the user) is being worked on independently inside the atproto ecosystem, the Solid/ActivityPods world, and inside ETNOS. The vocabulary and design patterns will converge faster if there's cross-talk. We benefit even if we never run a PDS.
3. **Indigenous-sovereignty perspective is under-represented.** Almost no one in the atproto Private Data WG is thinking about Dewan Adat-class governance, sealed-box threshold cryptography, or CARE-labels. That's a perspective ETNOS uniquely has. Bringing it into the conversation makes the spec better and validates the perspective in a venue beyond Indonesia.

---

## 2. What we'd contribute, in order of effort

### Contribution 1 — CARE-labels lexicon (low effort, high value)

We define an atproto lexicon for CARE / [Local Contexts](https://localcontexts.org) TK and BC labels, structured as:

```
id.papua.adat.tkLabel — Traditional Knowledge label record
  type: enum (Attribution / Outreach / NonCommercial / etc.)
  scope: NSID array (lexicons this label applies to)
  issued_by: DID of the issuing Dewan
  issued_at: ISO-8601
  conditions: structured text
  revocation: optional revocation URI
```

This is exactly the kind of community-defined lexicon atproto's design encourages, and it costs us ~3 engineer-days to publish at `id.papua/lexicons/`. The contribution is the lexicon plus a short README explaining the CARE framework for atproto developers who haven't seen it.

**Why it matters**: any atproto AppView that reads `id.papua.adat.tkLabel` on a record knows to honor the labelled conditions. If the lexicon is adopted by even one other indigenous-data project, the CARE framework moves from "Solid/RDF world" into "atproto world" — a measurable expansion of CARE's reach.

**Timeline**: 2–3 months from decision. No external dependencies.

### Contribution 2 — Sealed-box sidecar pattern reference impl (medium effort)

We publish a reference implementation of our libsodium sealed-box pattern for encrypting atproto records at rest, with a typed `id.papua.crypto.sealedRecord` lexicon that carries the ciphertext + the key-id pointer.

The pattern: a PDS holds a record like `{ "$type": "id.papua.crypto.sealedRecord", "keyRef": "did:web:dewan-mee.papua.id#enc-key-1", "ciphertext": "..." }`. An AppView that has the decryption authority (via UCAN, see Contribution 3) can decrypt; everyone else sees an opaque record.

This is the gap atproto explicitly does not plan to solve in core. By shipping a reference impl, we make it possible for other projects to adopt encryption-at-rest without modifying the PDS itself. The pattern is upstream-compatible; the encryption is sidecar.

**Why it matters**: it makes atproto usable for sensitive data in non-core ways. Sets a community pattern other teams (Blacksky, Northsky, Habitat) can adopt.

**Timeline**: 4–6 months. Code lives in a new repo (`etnos/atproto-sealed-box`), published with documentation, an Aksara-shaped example, and tests.

### Contribution 3 — UCAN integration pattern for permissioned reads (medium-high effort)

We document and publish a reference flow for **UCAN-gated access** to atproto records:

- A record in a PDS is sealed (Contribution 2).
- A UCAN signed by the authority (Dewan, user, etc.) authorizes a specific subject DID to decrypt records matching a pattern, with an expiration.
- The grantee's AppView presents the UCAN when fetching from the PDS or the sealed-content service. Verification: DID resolution + signature chain + scope match + expiration check.
- Revocation = a new UCAN record that supersedes (we publish a revocation pattern).

This is the harder contribution because it touches three areas: capability tokens (UCAN), key management (where the Dewan keys live), and AppView design (how the grantee actually uses the grant). But it is also the most strategically important: it is the missing piece for atproto-as-permissioned-substrate that the Private Data WG is currently mapping out.

**Why it matters**: gives atproto a concrete, deployable pattern for permissioned access. Aligns with the WG direction.

**Timeline**: 6–9 months. Requires coordination with the Private Data WG so we don't conflict with their direction.

### Contribution 4 — Participate in the Private Data Working Group (ongoing, no fixed end date)

One ETNOS engineer attends the [atproto Private Data WG](https://atproto.wiki/en/working-groups/private-data) regularly, with explicit purpose of representing the **indigenous-sovereignty use case** alongside the personal-privacy and enterprise-confidentiality use cases that dominate the conversation today.

This is a small ongoing time commitment (4–6 hours/month for meetings + correspondence) but a high-leverage one. It positions ETNOS as a recognized voice in the spec direction.

**Why it matters**: it's the cheapest contribution and the highest leverage. It also creates the relationship that makes Contributions 1–3 actually land instead of getting ignored.

**Timeline**: starting now, indefinite.

---

## 3. What we will NOT contribute

To be explicit about scope:

- **Not** core PDS encryption. The Bluesky team has stated this is not a current goal; we will not push against that.
- **Not** a competing forum lexicon. We use PieFed for the forum. We are not trying to bootstrap an atproto-native Reddit/Lemmy alternative.
- **Not** financial contributions. We do not sponsor Bluesky PBC, the Swiss Association for PLC, or any other atproto entity unless funding sources we have agreed-upon allow it.
- **Not** governance positions. We do not seek a board seat on the Swiss Association or any analog.

---

## 4. The honest risk

Contributing to a spec is slow. The atproto Private Data WG is currently working through summer 2026 on a foundational design proposal. Our Contributions 1–3 will land in the WG conversation; some will be adopted, some will be politely rejected, some will be partially absorbed.

This is fine. The point is participation, not victory. The CARE-labels lexicon (Contribution 1) is unambiguously valuable to us regardless of WG outcome — we publish it, we use it for ourselves, anyone else who wants it can use it.

The risk of **not** contributing is larger: if ActivityPods + NextGraph slips and we have to pivot to atproto in 2028, we will be doing it from a cold start, in a spec direction that has been shaped without our input.

---

## 5. Concrete next steps (no commitment, no urgency)

When we're ready to start — likely after the alpha ships, so engineering bandwidth isn't competing with the forum launch:

1. One engineer subscribes to the atproto Private Data WG mailing list and Discord. ~30 minutes.
2. Same engineer drafts the CARE-labels lexicon. ~3 days.
3. We publish at `id.papua/lexicons/` with a short README. ~1 day.
4. Same engineer attends one WG meeting and introduces the CARE perspective. ~1 hour.

That's the first month. After that, Contributions 2 and 3 land as engineering bandwidth allows.

---

## 6. What this is and isn't

**This is** a parallel-bet strategy with low marginal cost and high upside.

**This is not** a back door to switching ETNOS to atproto. The federation-protocol decision stands: PieFed for the forum, ActivityPods + NextGraph for encrypted Pods when stable, Postgres + libsodium + UCAN in the interim. The contribution plan exists because the atproto ecosystem is independently solving problems we care about, and our voice in that conversation is cheap and valuable. Nothing more.

---

## Open questions

- **Funding source for the engineer time.** This is a ~10% FTE allocation. Possible sources: NLnet (if applicable), OTSUS innovation budget if the indigenous-sovereignty framing helps, ETNOS Inc. operational budget. Defer until alpha ships.
- **Whether to also publish in the W3C Solid CG.** The CARE-labels lexicon idea would also be valuable to the Solid/RDF ecosystem. Investigate after the atproto publication.
- **Whether to cross-publish ActivityStreams extensions** for the same labels. Likely yes, low marginal cost.
