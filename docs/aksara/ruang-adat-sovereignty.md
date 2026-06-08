# Ruang adat — indigenous sovereignty model

> Ruang adat is the subset of ETNOS owned by indigenous communities, not by ETNOS, not by the state. The sovereignty here is **structurally different** from the rest of the platform: the Dewan Adat is the data controller, the data subject, the moderator, and the key-holder. This document defines what that means in code.

Status: **draft v0.1**. Owner: ETNOS core + Dewan Adat consultation. Reviewers required: at least three Dewan representatives across distinct adat zones (Mee, Dani, Asmat) before declaring v1.

---

## 1. Why ruang adat is structurally different

The rest of ETNOS — public communities, government Aksara, civic agents — operates under a **cooperative posture** with the Indonesian state. BSrE seals, Dukcapil bridges, Kominfo PSE registration, UU PDP compliance: all of these assume the state and ETNOS are working in the same direction.

Ruang adat does not assume that. Indonesian law recognizes hutan adat as a category (UU 41/1999, MK 35/2012), but enforcement is uneven and the state's historical posture toward indigenous land and knowledge has often been extractive. The technical architecture of ruang adat must respect this:

- **The Dewan Adat is the sovereign,** not the state and not ETNOS Inc.
- **Storage must outlive ETNOS as an institution.** If the platform shuts down or is captured, the community's content must remain accessible to them.
- **State access requires either Dewan consent or a court order**, with the latter producing an audit record visible to the community.
- **The CARE principles ([Local Contexts](https://localcontexts.org))** — Collective benefit, Authority to control, Responsibility, Ethics — are not nice-to-have. They are how the system behaves by default.

This is not a chain or a web3 framing. It is a sovereignty framing. The technical primitives below give the Dewan key control, storage control, governance control, and tamper-evidence — without any of the operational burden of running a consensus network.

---

## 2. The four primitives

The ruang adat sovereignty model is built from four primitives. None is novel; the novelty is in how they compose for this specific governance model.

### Primitive 1 — Dewan-held threshold encryption keys

Every Dewan Adat that owns a ruang controls a **threshold encryption key** for its content. Specifically:

- The Dewan has N members (typically 5–9). Each holds one share of the master decryption key (Shamir's Secret Sharing, threshold M, with M typically 3 of 5 or 5 of 7).
- Content stored in the ruang is encrypted with libsodium's [sealed box](https://doc.libsodium.org/public-key_cryptography/sealed_boxes) construction to the master public key (which is always known).
- Decryption requires M Dewan members to bring their shares together — typically in person or via a co-signing flow in the ETNOS app.
- New Dewan members can be added by an existing M-of-N reshare ceremony; departing members lose their share and a new master is derived.

What this gives the Dewan:
- No one outside the Dewan can read the content. Not ETNOS Inc., not the state, not a single Dewan member acting alone.
- Loss of one share is recoverable (any M can reconstitute).
- Loss of more than M shares means the content is unrecoverable — which is the correct privacy property when a Dewan is dissolved.

What this gives the rest of ETNOS:
- A clean cryptographic boundary. Ruang adat content is opaque to the platform.
- A simple permission model: "Was this UCAN signed by M-of-N Dewan members? Yes → release the decryption envelope. No → reject."

### Primitive 2 — Dewan-controlled storage nodes

Sealed content lives on **storage nodes physically controlled by the Dewan**. Three configurations are supported, in increasing order of sovereignty:

- **Configuration A — Hosted by ETNOS, Dewan keys.** The ciphertext lives on ETNOS infrastructure. Dewan still holds keys, so ETNOS cannot read it. Cheap, easy, but the storage layer depends on ETNOS continuing to exist.
- **Configuration B — Mirrored to a Dewan-owned node.** A storage node physically located in the balai adat (Raspberry Pi 5 + SSD or similar) replicates the ciphertext. If ETNOS goes away, the content is still accessible to the Dewan.
- **Configuration C — Dewan-only.** Storage is entirely on Dewan-owned nodes. ETNOS becomes a federation peer that can request access via UCAN but holds no copy. Highest sovereignty, highest operational burden.

The default is **Configuration A → B as the community matures.** Configuration C is supported for Dewan that explicitly request it but is not the recommended path because storage operations (backup, redundancy, hardware refresh) are a real cost burden on community volunteers.

### Primitive 3 — Daily OpenTimestamps anchor

Every 24 hours, ETNOS computes the **Merkle root** of all new ruang adat records across all Dewans (encrypted at this point — the anchor commits to ciphertext, not plaintext) and submits it to [OpenTimestamps](https://opentimestamps.org), which publishes it to the Bitcoin blockchain.

What this gives the Dewan:
- A free, public, tamper-evident timestamp on every record. The Dewan can prove later — to any auditor, court, or researcher — that a particular record existed in their archive on a particular date, **without revealing the record.**
- Resistance to retroactive editing by ETNOS or any other party. The hashes are committed publicly; any later change to the content would fail verification against the anchor.
- Independence from ETNOS as an institution: even if the platform disappears, the anchors persist on Bitcoin and can be verified by anyone with the Merkle path.

What this is NOT:
- This is **not a chain ETNOS runs.** It is a free public timestamping service that piggybacks on Bitcoin. The Dewan does not run a validator. The Dewan does not hold a wallet. The Dewan does not pay gas. ETNOS bears the (~$0/month) cost of submitting anchors.
- This is **not on-chain storage.** The Bitcoin chain holds only the Merkle root. The content lives on the storage nodes (Primitive 2), keyed by the Dewan (Primitive 1).

### Primitive 4 — UCAN grants for access

When someone outside the Dewan needs read access — a researcher, a journalist, a state actor with a court order — the access path is **always**:

1. Request lands in the Dewan inbox via the ETNOS goal UX flow (`docs/etnos/goal-ux.md` §5).
2. M-of-N Dewan members co-sign a **UCAN** specifying scope, expiration, and audit obligations.
3. The UCAN is published as a typed record in the ruang's archive (so revocation is also a typed record).
4. The grantee's client presents the UCAN to the AppView, which verifies the chain and serves the (decrypted) content.
5. The access is logged in the audit log of every data subject whose record was touched (`docs/etnos/goal-ux.md` §6).

There is **no other path** to read ruang adat content. No backdoor for ETNOS, no special access for the state without a co-signed UCAN, no admin override.

---

## 3. State access and court orders — explicit handling

The state retains lawful authority to request data via court order. ETNOS's response is:

1. The court order is transmitted to the Dewan, not to ETNOS. ETNOS cannot decrypt the content (Primitive 1), so a court order to ETNOS is useless.
2. The Dewan evaluates the order with their own legal counsel and the support of indigenous-rights organizations.
3. If the Dewan complies, they issue a UCAN to the requesting authority via the normal flow (Primitive 4). The UCAN is published as a typed record, so the community can see what was granted and to whom.
4. If the Dewan refuses, the matter proceeds through Indonesian legal channels with the encrypted-at-rest architecture as a defensive posture.

This is not adversarial-to-state-by-default. It is **architecturally consistent with how indigenous sovereignty is supposed to work**: the community is the gatekeeper, not the platform.

---

## 4. Holochain as a future option

If a Dewan asks for **stronger sovereignty than key control gives them**, the next architectural option is [**Holochain**](https://www.holochain.org). Holochain is agent-centric: each agent runs their own source chain, validated by DHT peers, with no global consensus. This maps surprisingly well to indigenous governance: each Dewan member could run their own source chain; each ruang could be a DHT with the Dewan as validators.

ETNOS does not adopt Holochain by default because:

- It is still maturing (Holochain 0.3+ stable in 2025; 1.0 targets late 2026).
- The Aksara device profile (Raspberry Pi 5 or laptop) can support it, but the operations burden falls on Dewan members.
- Most Dewan we have consulted prioritize ease-of-use over maximum sovereignty.

But we **do** keep Holochain as a documented option for any Dewan that asks for it. The migration path: a Dewan that started in Configuration A can migrate to a Holochain hApp without losing data, because Primitives 1, 3, and 4 are substrate-agnostic. Only Primitive 2 changes — from Dewan-owned static nodes to Dewan-validated DHT participation.

This option is **not chain in the cosmos/eth/substrate sense.** It is a P2P distributed validation protocol that happens to be the closest thing to "indigenous chain" without the validator-set ops burden.

---

## 5. What this is NOT

To be explicit, ruang adat sovereignty in ETNOS is:

- **Not** a permissioned chain ETNOS runs (cosmos/substrate/tendermint).
- **Not** an indigenous token or dividend system.
- **Not** smart-contract-anchored access control.
- **Not** on-chain content storage.
- **Not** a Web5 / DWN architecture (TBD sunset Nov 2024).
- **Not** Solid Pods with WebACL (UX too operator-shaped for Dewan elders).
- **Not** atproto PDS with public records (no encryption at rest).

It **is** four boring composable primitives — threshold encryption + community-controlled storage + OpenTimestamps anchoring + UCAN grants — that together give the Dewan everything chain-based architectures claim, with none of the operational burden.

---

## 6. The UX commitment

A Dewan elder using ETNOS to grant access does not see "threshold key share," "UCAN," "OpenTimestamps," or "Bitcoin." They see:

- A request in their inbox: "Peneliti UNCEN ingin akses ke arsip Bahasa Mee selama 30 hari. Tujuan: penelitian kebahasaan."
- A "Setujui" button. If they tap it, their device reconstructs their share and adds their co-signature to the UCAN. If 3 of 5 Dewan tap it, the grant activates.
- A list at any time: who has access right now, until when, who granted it.
- A "Cabut akses" button next to any active grant.

This is the goal UX. The primitives above are how we make it true.

---

## 7. Roadmap status

| Item | Status | Target |
|---|---|---|
| This sovereignty spec | Draft v0.1 | M2 |
| Threshold key ceremony (UI + crypto) | Not started | M3 |
| Configuration A storage (ETNOS-hosted ciphertext) | Not started | M3 |
| Configuration B mirror to Dewan-owned node | Not started | M4 |
| Daily OpenTimestamps anchor | Not started | M3 |
| Dewan UCAN co-signing flow in mobile UI | Not started | M3 |
| Audit log visibility for community members | Not started | M3 |
| Holochain pivot analysis | On-demand only | — |
| First Dewan pilot partner | Not identified | M4 |

---

## 8. Open questions

- **Threshold parameters per Dewan.** 3-of-5? 5-of-7? Variable per Dewan? Migration when Dewan size changes?
- **Cross-Dewan grants** — when one Dewan grants another Dewan read access to a specific record, is that a one-Dewan UCAN or a both-Dewans UCAN?
- **Inheritance** — when a Dewan member dies, their share is irrecoverable. Does the threshold drop, or does the Dewan re-share to a new M-of-N? The default is re-share, but the timing matters.
- **Legal status of UCAN-issued access** in Indonesian courts. Does an Indonesian judge accept a cryptographic capability as evidence of consent? This is a legal question we will not solve here.
- **Holochain pivot trigger** — what's the concrete signal that a Dewan wants to move to Configuration C+Holochain rather than stay in B?

---

*This doc is the sovereignty backbone for ruang adat. It is intentionally short on engineering detail because the cryptographic primitives are off-the-shelf; the work is in the UX, the governance, and the conversations with Dewans about what they actually need.*
