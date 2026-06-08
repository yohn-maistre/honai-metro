# Aksara Master Proposal v3.5 — Digest and Drift Analysis

A faithful summary of the v3.5 Master Proposal (Edisi Publik, Juni 2026) and an opinionated comparison against the architecture currently committed in `docs/research/unified-federation-protocol.md`, `docs/research/decentralized-agent-memory.md`, `docs/aksara/onboarding.md`, and `docs/aksara/ruang-adat-sovereignty.md`.

Source: `/tmp/aksara-master.md` (converted from `def9f606-Aksara_Master_Proposal_v3_5.docx`). All section numbers below refer to that document unless prefixed.

---

## Part 1 — What the proposal says

### What Aksara is

The proposal frames Aksara at three altitudes and the framings imply different commitments. **User-facing (Ringkasan Eksekutif, §8):** Aksara is **"PNS Digital"** — a digital civil servant that never takes leave, never rotates, never forgets, embodied as five personas (Staf Administrasi, Operator Sistem, Bendahara, Sekretaris, Arsiparis Digital). **Technical (§6 Communal AI):** Aksara is a *substrate* for Communal AI — primitives that let AI serve communities and institutions rather than individuals, with collective consent, institutional memory, hardware-rooted trust, and signed provenance as first-class capabilities. Each primitive is "a communal transformation of a personal-AI primitive" (single-user sessions → multi-party with role-bound checkpoints; individual consent → threshold collective consent; device trust → community-verifiable institutional trust; personal memory → Frozen Intent institutional memory; cloud sync → delay-tolerant federation including USB transport; activity log → third-party-verifiable provenance). **Product (§19):** Aksara is **one product with two reaches** — *Aksara* (in-place node at kelurahan / puskesmas / balai adat / BPP / sekolah) and *Aksara Go* (field device for midwives, penyuluh, rangers). *Pro* (mini PC) and *Hub* (provincial GPU rack) are scale configurations, not separate SKUs.

**Hardware (§19).** Aksara runs on **Orange Pi 5** (RK3588S, NPU, 8–16 GB RAM) with Gemma 4 E4B locally for routine tasks and cloud LLM for heavy reasoning. Secure element: **ATECC608B** or **Zymkey**. IoT SIM connectivity, OLED strip for an animated-eye presence indicator, e-ink strip for status display. Aksara Go uses Orange Pi Zero 3 + Gemma 4 E2B, BLE, no display (phone via WhatsApp / ETNOS app). Hardware designs published under **CERN-OHL-S**.

**Runtime (§13).** Reasoning: **Hermes Agent** (Nous Research, open-weights) as planner-executor — adopted explicitly, not "TBD." Models are tiered: **DeepSeek V4 Flash** at the Hub, **Qwen 3.6 35B-A10B** at Pro, **Gemma 4 E4B** on flagship Aksara, **Gemma 4 E2B** on Aksara Go. Memory: **HippoRAG 2** for episodic + **OpenViking** for long-term, isolated per-deployment, aggregated only at the Hub with anonymization. PII: **Presidio-ID** (Indonesia-aware Microsoft Presidio fork). Deterministic execution: **aksara-cli**, a Go binary with no runtime dependencies, exposing a deterministic tool surface to both humans (terminal) and agents (MCP server, JSON mode).

**Institutional-actor model (§7, §10).** The core primitive is the *Civic Transaction*: intent (WhatsApp/voice/SMS/radio in local language) → plan (Hermes + aksara-cli) → consent (CARE checkpoint) → execution (two-leg bridge to government systems) → signed record (institutional Pod + Merkle log). Reasoning and execution are explicitly separated; any output with legal consequence must traverse the deterministic aksara-cli path (template + validation + cryptographic primitives + audit emission).

### What ETNOS is

ETNOS is the public-square / forum / federation layer (§15). **It launches first** — before any Aksara hardware ships — because it is "trust-builder and community-formation vehicle." Sequence: months 1–2 ETNOS Papua live as a web forum with seeded content; months 2–3 aksara-cli published; months 3–4 first Aksara node deploys into an already-active ETNOS; months 4+ further nodes join existing activity.

The proposal is **unambiguous about ETNOS's lineage** (§15): "ETNOS adalah heavy fork dari Photon (klien Svelte, AGPL-3.0), **di-rework dari API Lemmy ke API ActivityPods**." Each province is its own ActivityPods instance (ETNOS Papua, ETNOS Papua Tengah), federating among themselves.

Four-tier registration (§15): open reader / registered (phone or email) / verified for gov spaces (KTP + e-KYC via Privy or Verihubs) / community-vouched for adat spaces (Dewan-designated, t-of-n threshold for sensitive zones).

**Two federation planes (§15)** — important and clearer than our docs: a **content plane** following standard ActivityPub per-instance choices, and a **memory plane** that separately governs whether an institution's communal memory can be reached by agents at another instance. "Communities set their social reach and their memory access as two different decisions, both under CARE."

### Aksara ↔ ETNOS interoperation

Named explicitly (§14): **"aksara-cli is the hand (tooling, bridging, signing, sensor, memory, provenance); ETNOS is the town square (forum, cultural preservation, open data, MCP registry, community communication)."** ETNOS launches first as pure software on a VPS; Aksara nodes deploy *into* the existing federation. Each node has a DID and stores institutional memory in an ActivityPods Pod that federates inside ETNOS, with the memory-plane separation governing reachability.

### First civic flow / validation pilot

MVP (§28) is **Paket Kelurahan**: 5–7 pilot kelurahan in Papua Tengah, seven civic tools (surat domisili, SKTM, surat pengantar nikah, izin keramaian, surat keterangan ahli waris, surat keterangan kelahiran, surat keterangan kematian). Stack: WhatsApp/voice/scan intake → Presidio-ID + Gemma 4 E4B OCR → Hermes reasoning on-device → aksara-cli → Peruri e-meterai + BSrE → Kepala Desa approval via WhatsApp → WhatsApp delivery + thermal print + audit log. Primary demo (§29): the surat civic flow with the computer-use bridge visible; secondary demo: the bidan double-entry (one voice note fanned out to SATUSEHAT, PCare, local report).

Success metrics (§30): document turnaround <5 min for surat domisili / <10 min for SKTM; 500 docs/month/unit by month six; NIK OCR accuracy >98%; first-attempt e-meterai/BSrE success >95%; SPBE provincial uplift ≥0.3 points; citizen CSI ≥80; unit retention >85% at 12 months. Timeline (§28): M0–M2 software prototype + Peruri/Hermes sandbox; M3–M5 10-unit Orange Pi 5 batch assembly + OS hardening; M6–M8 1–2 kelurahan deployment; M9–M12 scale to 5–7 kelurahan.

### Substrate commitments

§14 is explicit: **ActivityPods + NextGraph + Foundation Protocol vocabulary** is the federation/data stack, after evaluation against ActivityPub-alone, AT Protocol, NextGraph-alone, and Solid. Aksara contributes four upstream extensions: CARE checkpoint, Merkle provenance anchoring, HSM-attestation trust signals, delay-tolerant transport profile. Other commitments: **Hermes** as runtime; **aksara-cli** as Go binary; **MCP** as tool protocol; **Solid Pods** (via ActivityPods) for memory containers; **Solid WAC + ACP** extended by **CARE-as-Code consent tokens** (§16); **DIDs** as identity primitive (method unspecified in the published doc); **HSM attestation** as device trust root; **OpenTimestamps-style Merkle anchoring** for provenance; **SATUSEHAT, PCare, DAPODIK, SISKEUDES, Dukcapil, BSrE, Peruri, OSS** as integration targets.

### Non-goals and beyond-grant scope

§23: Aksara is co-pilot / bridge / memory **on top of** existing systems, not a replacement: "tidak menggantikan SATUSEHAT, SIMLUHTAN, SMART Patrol, atau DAPODIK." Procurement framing: acceleration of already-budgeted systems, not a new budget category. §36 plans scale via province Hubs peer-to-peer through ETNOS, sectoral skill packs, and Hub-level federated learning evolving into a foundation model with corpus in community custody (differential privacy at parameter merge). Appendix C plans an academic paper trail: Attested CARE (Q3 2026), Frozen Intent (Q1 2027), ETNOS (Q2 2027), Communal AI (2027), Civic Dynamical Substrate (2028–2029).

---

## Part 2 — Architectural drift vs current docs

The proposal and the locked architecture in `unified-federation-protocol.md` are pointing in the same general direction — civic, federated, CARE-respecting, sovereign — but they diverge on substrate choices in ways that matter. Each item below is classified.

### 1. Photon→ActivityPods rework — **contradictory**

The proposal commits unambiguously (§15): ETNOS is "heavy fork dari Photon … **di-rework dari API Lemmy ke API ActivityPods**." This is the exact NLnet-application commitment, and exactly what `unified-federation-protocol.md` rejected: "**Forum layer: PieFed, no migration**. The UI rebuild cost (3–6 months to replace the Photon Svelte client against atproto lexicons) is not justified before 2029."

These two statements cannot both be policy. The memo rejects the Lemmy→ActivityPods rework on the same cost grounds it cites for atproto. The proposal funds and schedules that rework anyway. The user must decide which doc is authoritative because the NLnet deliverables are written against the proposal.

### 2. Memory substrate — **contradictory** (compound)

Proposal (§14): **ActivityPods + NextGraph** as the institutional-memory substrate, v1. Current `unified-federation-protocol.md`: **Postgres + libsodium sealed boxes + UCAN guards** as the 2026 interim, ActivityPods + NextGraph deferred to 2027+ pending NextGraph's encrypted-Pods stability. The proposal is silent on the Postgres-interim bridge — it treats ActivityPods+NextGraph as the substrate, period.

The decentralized-agent-memory memo goes further: LightRAG + SQLite + sqlite-vec + Memori per-Aksara *now*, with ActivityPods+NextGraph as a 24-month re-evaluation. The proposal does not mention LightRAG, Memori, SQLite, or sqlite-vec — its memory layer is **HippoRAG 2 + OpenViking** (§13), which the memo explicitly rejects: "HippoRAG 2 in its OSU-NLP form needs four H100s to index 10k documents in 4 hours … not deployable on a Hetzner CAX21."

Three drifts in one section: (a) ActivityPods+NextGraph as v1 vs Postgres-interim bridge; (b) HippoRAG 2 + OpenViking vs LightRAG + SQLite; (c) the proposal's silence on the "PDS-as-canonical-signed-source / SQLite-as-derived-index" pattern. (a) and (b) are substantive contradictions specifying different stacks. (c) is reconcilable in a v3.6 rewrite.

### 3. Capability model — **reconcilable**

Proposal (§16): **CARE-as-Code** consent tokens *as extension over* Solid WAC + ACP. Current docs: **UCAN**, no WebACL. CARE is policy semantics; UCAN is a token format. They reconcile by saying "CARE is the semantics; UCAN is the wire format for our deployment; WAC/ACP-style is the equivalent inside an ActivityPods Pod when that substrate lands." Single docs update.

### 4. Identity / DID method — **reconcilable**

Proposal (§17, §16): DIDs are used, methods unspecified. Current docs are precise: **did:web** for citizens/dinas/pemerintah Aksara, **did:wba** for agents, **did:plc** deferred (`unified-federation-protocol.md`); onboarding spec also names did:plc for adat/pendidikan, did:ion allowed but not recommended. The proposal does not contradict; it is silent.

### 5. Agent transport — **reconcilable**

Proposal (§13, §14): MCP named for tool exposure; A2A not named; FP vocabulary adopted but "menyerahkan persistensi ke profil." Current docs: MCP + A2A + UCAN over JSON-RPC. The proposal can adopt A2A without revising any claim — it composes natively with MCP and FP.

### 6. Storage locality — **substantive (cost/locality drift)**

Proposal (§13, §22): Local SQLite + DuckDB on-device, Hub PostgreSQL + pgvector for aggregated semantic memory. **All data stays in Indonesia, hosted at Diskominfo provinsi or organisasi adat. No data through foreign cloud.** Current docs (`docs/research/decentralized-agent-memory.md` §3): **Hetzner CAX21** (German cloud) as default; Pi-only-primary explicitly rejected.

These are real-world inconsistent. Hetzner is not in Indonesia and the proposal's "no foreign cloud" is categorical. Most likely reconciliation: **CAX21 is dev-only**; production = Orange Pi 5 on-prem + Indonesia-local Hub (IDCloudHost or Diskominfo). That reconciliation is not currently written down and as written the memo will get quoted by integrators and silently break the residency commitment.

### 7. Hardware — **substantive**

Proposal (§19): **Orange Pi 5** (RK3588S, 8–16 GB RAM) is the Aksara node hardware, with Gemma 4 E4B running **on the Pi itself** for routine tasks. Current docs (`docs/research/decentralized-agent-memory.md` §3): "Don't promise on-device generation"; Pi 5 is "cache + ingest only" at the edge tier with kelurahan-class nodes forwarding Q&A up to a kabupaten hub running the LLM. Two different hardware specifications as primary. The right answer is probably "both" with explicit tiering (kelurahan-class runs Gemma small + forwards complex queries to a Pro/Hub), but neither doc currently writes that out.

### 8. Encryption-at-rest — **reconcilable**

Proposal (§21): AES-256-GCM at rest, TLS 1.3, mTLS between Hubs, HSM-managed rotation. Current docs: libsodium sealed boxes with Dewan-held threshold keys for ruang adat. AES-GCM and libsodium sealed boxes are compatible primitives at different altitudes; the ruang-adat sovereignty doc is internally consistent with §21.

### 9. Two-plane federation — **reconcilable, and the proposal is clearer**

Proposal §15 names the content/memory plane separation in plain Indonesian. The unified-federation memo implicitly assumes it but does not articulate it as cleanly. Lift the proposal's framing into the memo.

### 10. Hermes lock-in — drift in the *other* direction

Proposal §13: Hermes is **the** reasoning runtime, explicitly chosen, with model-tiering. Onboarding spec §12: still an open question ("agnostic, but with Hermes as the reference impl"). **Reconcilable**: close the open question in onboarding with the proposal's stronger commitment.

---

## Part 3 — Recommended reconciliation moves

The drift list above is not catastrophic, but item 1 (the Photon→ActivityPods rework) is **load-bearing for the NLnet grant** and needs an explicit user-level decision before docs converge.

### Decisions the user must make

1. **Photon→ActivityPods rework.** Proposal/NLnet commit; unified-federation memo rejects. Options: (a) honor the proposal/NLnet commitment and treat the memo as superseded for ETNOS-the-frontend (but keep its analysis valid for PieFed-the-backend); (b) revise v3.6 to soften "di-rework dari API Lemmy ke API ActivityPods" into "kompatibel dengan dan bermigrasi bertahap ke API ActivityPods" with a 2027+ timeline; (c) split grant deliverables so NLnet funds the *bridge work* between Lemmy-shape and ActivityPods-shape APIs, not a full rework. Option (c) is the most honest — the bridge is a real artifact the memo already anticipates (§7).

2. **HippoRAG 2 vs LightRAG.** Either v3.6 substitutes "LightRAG + Memori, with HippoRAG-2 design ideas borrowed," or the agent-memory memo's reasoning is challenged with a concrete on-device benchmark. The current state — proposal names a system the memo says will not run — is fixable in a single docs update and **should be fixed before both are read together**.

3. **Hardware/locality.** Resolve Hetzner-vs-Orange-Pi-5-vs-Diskominfo-on-prem explicitly. The proposal's "no foreign cloud" is a procurement commitment the memo's default contradicts. Simplest reconciliation: a one-page `docs/aksara/architecture.md` saying **CAX21 is dev-only; production Aksara is Orange Pi 5 on-prem at the institution, with a Diskominfo-provincial Hub on Indonesia-local infra (IDCloudHost or equivalent)**.

### Docs that need updates regardless

- **`docs/research/unified-federation-protocol.md`** needs a reconciliation paragraph naming v3.5 and stating whether/where it supersedes or is superseded by the memo.
- **`docs/research/decentralized-agent-memory.md`** needs (a) an explicit "Why not HippoRAG 2 in production" callout linked to the proposal's commitment and (b) the hardware/locality clarification.
- **`docs/aksara/onboarding.md`** should close the Hermes-lock-in open question (§12) per the proposal's stronger commitment.
- **A new `docs/aksara/architecture.md`** is overdue — both `onboarding.md` and `ruang-adat-sovereignty.md` reference it as forthcoming. The proposal's §22 architecture summary is a candidate skeleton.

### What is aspirational and does not constrain near-term build

Foundation-model licensing (§34), Hub-level federated learning (§36), Sentinel Alam (§3), and the academic paper trail (Appendix C) are all explicitly future-track in the proposal. Nothing in the alpha/beta build depends on them.

### NLnet grant compatibility

The memo's "PieFed for forum, ActivityPods deferred to 2027+" is **incompatible** with NLnet deliverables as written, which assume Photon rework against ActivityPods APIs is in-scope for the 12-month grant. Clean resolution paths: (i) negotiate NLnet scope down to bridge work + adapter layer (a working ActivityPods endpoint exposed by PieFed via a translation shim, not a full rework); (ii) accept the rework into the grant timeline, knowing it eats ~3–6 of the 12 months per the memo's own estimate; (iii) re-issue the proposal as v3.6 with the rework descoped and the grant scope rewritten accordingly. Path (i) is the least painful, preserves the memo's analysis, and produces a deliverable NLnet reviewers can verify. The user should choose deliberately rather than letting the two documents disagree in public.
