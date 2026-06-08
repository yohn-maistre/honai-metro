# Aksara — architecture summary

> This document describes the **Aksara node + its relationship to ETNOS**, consolidated from the Master Proposal v3.5 (as amended in `proposal-v3.6-amendments.md`), the unified federation protocol decision, the decentralized agent memory plan, and the ruang adat sovereignty model. It exists because `docs/aksara/onboarding.md` §5 and `docs/aksara/ruang-adat-sovereignty.md` both reference it as forthcoming.

Status: **v0.1 — first canonical write-up**. Owner: ETNOS core. Last revision: 2026-06-08.

---

## TL;DR

**An Aksara node is a flagship hardware device (Orange Pi 5) running the Hermes Agent runtime, with the aksara-cli deterministic tooling layer for any output with legal weight, OpenViking + LightRAG as the memory layer, Presidio-ID at the cloud-LLM boundary for PII safety, and an ActivityPods-shaped DID identity that participates in ETNOS federation through a bridge layer over PieFed.** Reasoning is cloud-primary (Anthropic / NIM sandbox via Hermes Agent provider abstraction) with a local SLM (Gemma 4 E4B) as offline backstop. Each node is one institution's "PNS Digital" — a digital civil servant for that kelurahan, puskesmas, balai adat, BPP, or sekolah.

ETNOS is the substrate Aksara operates in: a federated public square where humans and Aksara nodes meet, currently running on PieFed (Lemmy-shaped API) and bridging to ActivityPods over a thin adapter layer until ActivityPods + NextGraph encrypted Pods stabilise (target 2027). The two are inseparable products with separable runtimes.

---

## 1. The hardware unit

**Aksara (in-place node).** The flagship form factor:

- **SBC**: Orange Pi 5 (RK3588S, NPU, 8–16 GB RAM)
- **Secure element**: ATECC608B or Zymkey (for HSM-rooted DID key, BSrE seal storage, provisioning-token vault)
- **Connectivity**: IoT SIM
- **Output**: OLED strip (animated-eye presence indicator), e-ink strip (deliberate status display: pending tasks, sync status, alerts)
- **Audio input**: **Gemma 4 E4B native multimodal** (audio waveform → transcript + intent in one inference pass) as the primary ASR path; Whisper retained as CPU-only fallback if the multimodal model is not loaded
- **Audio output (TTS, three tiers):**
  - **Primary**: VoxCPM2 (Apache 2.0) hosted on a single A10/L4 at IDCloudHost or NVIDIA NIM Indonesia sandbox; 110 ms streaming, Indonesian first-class, voice design + cloning. Accessed from the device via streaming WebSocket.
  - **On-device fallback**: Piper `id_ID-news_tts-medium` via sherpa-onnx with RKNN NPU delegation (RTF ~0.15, MIT, single news-register voice, real-time offline).
  - **Last-resort cloud**: Google Cloud TTS Chirp 3 HD Indonesian (~$30/M chars), Presidio-gated to non-PII only.
  - **Papuan Malay**: not handled by current models (June 2026); M9–M12 stretch is a Diskominfo Papua volunteer-corpus fine-tune of VoxCPM2, republished upstream.
- **Hardware license**: CERN-OHL-S — designs published for community manufacturing

**Aksara Go (field device).** For midwives, penyuluh, rangers:

- **SBC**: Orange Pi Zero 3
- **Connectivity**: BLE only (phone is the network)
- **No display**: paired with WhatsApp / ETNOS mobile app
- **Local model**: Gemma 4 E2B

**Pro and Hub** are scale configurations of the same stack, not separate products:

- **Pro**: mini-PC class, Qwen 3.6 35B-A10B locally, for kabupaten-class deployment
- **Hub**: provincial GPU rack, DeepSeek V4 Flash, federated learning over Aksara node corpora, future foundation model anchor

**Hub is post-grant scope.** The MVP (Paket Kelurahan, 5–7 kelurahan in Papua Tengah) deploys flagship Aksara nodes only; Hub remains a design artifact through M12.

---

## 2. The runtime stack

> **Persona model.** Aksara's five personas (Staf Administrasi, Operator Sistem, Bendahara, Sekretaris, Arsiparis Digital) are implemented as **role-bound skill registries on a single Hermes Agent profile**, not five separate profiles. Hermes Agent profiles isolate memory + DID too aggressively for institutional shared state — five separate profiles would silo the Bendahara's notes away from the Sekretaris. One institutional profile with role-gated tool exposure (skill registry per persona, authorization by aksara-cli on UCAN capability + audit emission) preserves shared institutional memory while enforcing role-permission boundaries.
>
> **OpenViking in Hermes Agent.** Hermes Agent's `plugins/memory/openviking` subtree ships OpenViking as a first-class memory provider; selecting it is a single config flag, no external server. The composition with LightRAG (graph-RAG layer) happens at the retrieval-orchestration layer above both.
>
> **Hermes Agent license posture.** Hermes Agent is MIT — composes cleanly with ETNOS's AGPL-3.0 downstream. The upstream Warp integration discussion already walks this line; no licensing blocker.


```
┌────────────────────────────────────────────────────────────────┐
│ AKSARA NODE (Orange Pi 5 in a kelurahan office)                │
│                                                                │
│  Intent input ─→ ┌──────────────────────────────────────────┐  │
│  (WhatsApp,      │ Hermes Agent (Nous Research, open-source) │  │
│   voice, SMS,    │ — planner-executor                        │  │
│   radio,         │ — provider-agnostic                       │  │
│   ETNOS DM)      │ — calls tools, asks for clarifications    │  │
│                  └────┬─────────────────────────────────────┘  │
│                       │                                        │
│                       ↓                                        │
│       ┌───────────────────────────────────────┐                │
│       │ Reasoning routing                     │                │
│       │  ├─ PII detected (Presidio-ID)?       │                │
│       │  │   → Local SLM (Gemma 4 E4B)        │                │
│       │  ├─ Offline (no signal)?              │                │
│       │  │   → Local SLM (Gemma 4 E4B)        │                │
│       │  └─ Otherwise →                       │                │
│       │      Cloud LLM (Anthropic / NIM       │                │
│       │      Indonesia / via Hermes Agent     │                │
│       │      provider abstraction)            │                │
│       └─────────┬─────────────────────────────┘                │
│                 │                                              │
│                 ↓                                              │
│       ┌─────────────────────────────────────────┐              │
│       │ Memory                                  │              │
│       │  ├─ LightRAG (SQLite + sqlite-vec)      │              │
│       │  │   graph-RAG queryable over local     │              │
│       │  │   KG + embeddings                    │              │
│       │  └─ OpenViking (built into Hermes Agent)│              │
│       │      hierarchical Markdown store        │              │
│       │      L0/L1/L2 folder structure          │              │
│       └─────────┬───────────────────────────────┘              │
│                 │                                              │
│                 ↓                                              │
│       ┌─────────────────────────────────────────┐              │
│       │ aksara-cli (Go binary, deterministic)   │              │
│       │  any output with legal consequence      │              │
│       │  goes through here:                     │              │
│       │  ├─ template + validation               │              │
│       │  ├─ cryptographic primitives (BSrE,     │              │
│       │  │   e-meterai via Peruri)              │              │
│       │  └─ audit emission (Merkle log)         │              │
│       └─────────┬───────────────────────────────┘              │
│                 │                                              │
│                 ↓                                              │
│       ┌─────────────────────────────────────────┐              │
│       │ Identity + capabilities                 │              │
│       │  ├─ did:web (institutional)             │              │
│       │  ├─ did:wba (agent identity)            │              │
│       │  ├─ UCAN (capability tokens)            │              │
│       │  ├─ CARE-as-Code (consent semantics     │              │
│       │  │   on top of UCAN scopes)             │              │
│       │  └─ HSM-rooted via secure element       │              │
│       └─────────┬───────────────────────────────┘              │
│                 │                                              │
│                 ↓                                              │
│       ┌─────────────────────────────────────────┐              │
│       │ Federation surface                      │              │
│       │  ├─ ActivityPub actor (custom type      │              │
│       │  │   aksara:AksaraNode)                 │              │
│       │  ├─ MCP server (tool surface for other  │              │
│       │  │   agents, peer Aksara, ETNOS UI)     │              │
│       │  └─ A2A endpoint (peer-agent calls)     │              │
│       └─────────────────────────────────────────┘              │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. The reasoning balance — cloud primary, local auxiliary

This is the architectural choice that differs from the original v3.5 proposal wording. The clarification (founder, 2026-06-08):

- **Cloud LLM is the primary reasoning path.** Frontier model quality matters for understanding intent, planning multi-step tool calls, and producing natural responses in mixed-language contexts. The Aksara node uses cloud reasoning by default when online.
- **Local SLM (Gemma 4 E4B) is the offline-first backstop.** When the IoT SIM drops (which it will, often), the node degrades gracefully to local inference for routine tasks. The agent stays responsive.
- **Local SLM is also the PII-safe path.** When Presidio-ID detects sensitive content at the boundary, the reasoning routes locally rather than sending plaintext to the cloud. This keeps the data-residency commitment honest.
- **NVIDIA NIM sandbox is a planned evaluation target** for hosting cloud-class inference inside Indonesian infrastructure — preserving "no data through foreign cloud" (§22 of the proposal) without sacrificing reasoning quality.

The Hermes Agent's provider abstraction makes the routing pluggable. Swapping cloud providers (Anthropic ↔ NIM ↔ Bedrock ↔ OpenRouter) does not require architecture changes.

### 3a. Managed API keys — the operator never sees a credential

The end operator (Lurah, Bendahara, Bidan, Penyuluh) never deals with API keys. **PT Abstraksi Data & Kognitek manages all cloud LLM credentials as part of the Aksara service** — provisioning, rotation, fallback between providers, and billing. To the user it is "the device works"; behind the scenes a per-device, per-month subscription is what is selling.

Implementation:

- Each Aksara device boots with a **device-bound provisioning token** stored in the ATECC608B / Zymkey secure element. The token is what the device presents to PT Abstraksi's gateway to receive short-lived LLM API credentials, scoped per request.
- The cloud LLM gateway sits between the device and the underlying providers (OpenRouter, Anthropic direct, NIM Indonesia). Rotation, fallback (NIM → Anthropic → OpenRouter), and per-tenant rate-limit are gateway concerns, not device concerns.
- Diskominfo provincial admins receive **transparent usage reports** per kelurahan (tokens consumed, model routing breakdown, cost equivalent) on request — auditability is intact.
- If a Diskominfo wants to bring-its-own provider key (e.g., they have a contract with Anthropic), the gateway supports that override at the institution level. Default path is platform-managed.

### 3b. Telemetry sent back — anonymous fleet management only

The Aksara device sends telemetry back to PT Abstraksi for fleet management. The categorical commitment:

- **Sent:** uptime, error counts, model-routing health (which provider answered), token throughput, version of aksara-cli, version of Hermes Agent, OS health metrics.
- **NOT sent:** conversation content, intent transcripts, citizen names, surat content, audio recordings, document images, kabupaten-level transaction metadata.

The telemetry stream is documented per field, opt-out at the institution level (Diskominfo can disable for any device), and the schema lives at `docs/aksara/telemetry-schema.md` (forthcoming). PII or civic-transaction metadata in the telemetry pipeline would be a P0 incident.

---

## 4. The Civic Transaction primitive

The proposal's signature design idea (§10), preserved unchanged:

```
Intent  →  Plan  →  Consent  →  Execution  →  Signed record
(any    (Hermes  (CARE       (aksara-cli   (Pod + Merkle log)
 input  Agent +  checkpoint  deterministic
 mode)  memory)  M-of-N)     path)
```

**Reasoning and execution are explicitly separated.** Generic agentic AI merges them — the LLM produces both plan and output. For documents with legal consequence (surat domisili, SKTM, e-meterai-bearing letters), that is structurally unsafe: LLM hallucination can produce nearly-correct formal letters that are materially wrong.

Aksara's split:

- **Hermes Agent reasons** about intent, context, tool selection.
- **aksara-cli executes** the formal output through validated templates, cryptographic primitives, and audit emission.

The LLM never directly produces a BSrE-sealed letter. It calls a tool that produces it deterministically.

**Enforcement mechanism (Hermes Agent's tool registration ⊥ exposure split).** Hermes Agent separates tool *registration* (the catalog of available capabilities) from tool *exposure* (which capabilities a given session can call). Aksara's aksara-cli tools are registered globally but exposed to the reasoning loop only under role + UCAN policy. A `pre_inference` hook plus the exposure filter is how the reasoning⊥execution rule is enforced at runtime, not just at documentation level.

### 4a. Computer-use leg — sites without APIs

Many Indonesian government systems (Dukcapil for citizen lookup, SISKEUDES for desa finance, SIPD for province budgets, OSS for licenses) expose partial or no public APIs. Aksara bridges into them via a **computer-use leg** — a sandboxed browser session driven by a vision-LLM that fills institutional forms on behalf of the Lurah / Bendahara with their credentials and per-step approval.

The stack (`docs/research/computer-use-for-aksara.md`):

- **Skyvern** (AGPL-3.0) — orchestrator, self-hosted on the **Hub provincial server** (or Aksara Pro on configurations without a Hub). Real production users on US government forms.
- **Patchright** — anti-detection Playwright browser layer.
- **Firecracker microVMs** — per-session sandbox isolation (2026 consensus that container isolation is insufficient for browser-driving agents holding credentials).
- **OpenBao** — credential broker. The driver-VLM never sees plaintext credentials; it gets short-lived broker tokens per session.
- **Vision-LLM** — routed through Hermes Agent's provider abstraction, not locked to any vendor's beta API.

The leg is invoked as a tool call from the Hermes Agent loop: `aksara-cli computer_use(target, task, credentials_ref)`. Every action (click, type, navigate) is hashed and emitted to the Merkle audit log. Per-step approval is configurable: "approve every form submission" for high-risk flows, "approve once at finalize" for routine ones. Captchas pause and ask the human — no captcha-solving SaaS.

**Cost:** ~$7.50/month/unit at MVP scale (500 docs/month). **Latency:** ~15s per Dukcapil-class flow. **Locality:** runs on Hub / Pro, never on the Aksara Pi 5 directly (insufficient resources for parallel browser + driver inference).

**Upstream contribution opportunity:** no open project today documents Bahasa Indonesia UI-grounding evaluation. A ground-truth dataset + benchmark on Dukcapil / SISKEUDES / SIPD / OSS / SATUSEHAT screens is a clean publishable artifact, paired naturally with the CARE-as-Code framing.

---

## 5. Aksara ↔ ETNOS — how they interoperate

From the proposal §14: **"aksara-cli is the hand (tooling, bridging, signing, sensor, memory, provenance); ETNOS is the town square (forum, cultural preservation, open data, MCP registry, community communication)."**

ETNOS launches first (months 1–2 of grant year), as pure software on a VPS, with seeded forum content. aksara-cli is published (months 2–3). The first Aksara hardware node deploys *into already-active ETNOS* (months 3–4). The town square exists before the institutions move in.

**The federation surfaces:**

- **Content plane (today)**: PieFed-backed, Lemmy-shaped API, Photon-based UI. Each province is its own PieFed instance, federating to peers per the standard ActivityPub instance-choice model.
- **Memory plane (target)**: ActivityPods-shaped per-actor Pods backed by NextGraph CRDT sync (when stable, target 2027). Each Aksara node holds its institutional memory in its own Pod, federated separately from content reach.
- **Bridge layer (M2 grant-year deliverable)**: a small server process that exposes a subset of ActivityPods-compatible endpoints (actors, inbox/outbox, basic Pod containers) over PieFed's existing storage, enabling Aksara nodes built against the ActivityPods API to interoperate with the production PieFed-backed ETNOS today. Released upstream as a community contribution.

**Two-plane federation in plain terms.** A community sets **what it shares** (the public-square reach) and **what other institutions' agents can read from its memory** (the memory-plane reach) as two independent decisions. Both are CARE-gated. A balai adat can be socially federated with neighboring provinces (open content plane) while keeping its memory unfederated (closed memory plane). Collapsing the two planes is the data-bleed risk this design removes.

---

## 6. Identity, consent, capabilities — the trust stack

| Concern | Primitive | Wire format |
|---|---|---|
| Institutional identity | `did:web` rooted at the institution's domain (`kelurahan-sentani-barat.papua.id`) | DID Document with verificationMethod, service endpoints |
| Agent identity | `did:wba` (Web-Based Agent DID), structurally `did:web` for agents | Same as above |
| Device root of trust | ATECC608B/Zymkey HSM | Key stored in secure element, attestation on boot |
| Capability tokens | UCAN | Bearer tokens with scope, expiry, provenance chain |
| Consent semantics | CARE-as-Code | Asserted via UCAN scope vocabulary; evaluated against ACL when present in Pods |
| Tamper-evidence | Daily Merkle anchor → OpenTimestamps → Bitcoin | Hash anchor only; content stays local |
| Sacred content (ruang adat) | libsodium sealed-box + Dewan-held threshold keys | Sealed records keyed to Dewan public key |
| Civic-action seal | BSrE per unit, provisioned via Diskominfo as RA | X.509 certificate, applied to surat outputs |

**`did:web` over `did:plc` for civic actors.** Rationale: DNS-anchored identity that the institution already controls; no third-party PLC directory dependency; BSrE certificate attaches via DID Document `service` entry. `did:plc` remains an option only if atproto-native discovery becomes a community ask.

---

## 7. Data residency and storage locality

**Production rule (proposal §22):** "Seluruh data tetap di Indonesia, di-host di Diskominfo provinsi atau organisasi adat. Tidak ada data yang melewati cloud asing."

What this means in deployment:

- **Aksara node storage**: SQLite + sqlite-vec + OpenViking MD store, all local to the Pi.
- **Cloud LLM inference**: routed to providers that meet residency commitment. Anthropic is OK for non-PII (workload-transit only, no persistence). NVIDIA NIM sandbox hosted in Indonesia is the eventual primary. Provider choice is per-call, gated by Presidio-ID.
- **ETNOS forum hosting (alpha/beta)**: dev iteration may use foreign cloud (Cloudflare Pages, Hetzner for backend exploration) — explicitly **not production**. Production = Indonesia-hosted (IDCloudHost, Diskominfo VPS, or equivalent).
- **Hub (post-grant)**: provincial GPU rack physically located at Diskominfo or community partner.

The `docs/research/decentralized-agent-memory.md` references to Hetzner CAX21 are dev-bench specifics, not production specs. The production substrate is on-prem Orange Pi 5 + Indonesia-hosted Hub.

---

## 8. The MVP — Paket Kelurahan

**Scope** (proposal §28):

- 5–7 pilot kelurahan in Papua Tengah
- 7 civic tools:
  - Surat Domisili
  - SKTM (Surat Keterangan Tidak Mampu)
  - Surat Pengantar Nikah
  - Izin Keramaian
  - Surat Keterangan Ahli Waris
  - Surat Keterangan Kelahiran
  - Surat Keterangan Kematian

**Stack flow per surat:**

```
WhatsApp/voice/scan intake
  → Presidio-ID for PII at boundary
  → Gemma 4 E4B OCR for paper docs
  → Hermes Agent reasoning (cloud primary, local fallback)
  → aksara-cli generates draft
  → Peruri e-meterai + BSrE seal
  → Kepala Desa approval via WhatsApp
  → WhatsApp delivery + thermal print + audit log
```

**Success metrics** (§30):

- Document turnaround: <5 min surat domisili, <10 min SKTM
- Volume: 500 docs/month/unit by month 6
- NIK OCR accuracy >98%
- First-attempt e-meterai/BSrE success >95%
- SPBE provincial uplift ≥0.3 points
- Citizen CSI ≥80
- Unit retention >85% at 12 months

**Timeline:**

- M0–M2: software prototype + Peruri/Hermes Agent sandbox
- M3–M5: 10-unit Orange Pi 5 batch assembly + OS hardening
- M6–M8: deploy 1–2 kelurahan with daily field observation
- M9–M12: scale to 5–7 kelurahan + measurement framework

---

## 9. What an Aksara node is NOT

To avoid scope confusion:

- **Not a chatbot.** Aksara is institutional — its outputs carry legal weight when sealed.
- **Not a replacement for SATUSEHAT, SIMLUHTAN, DAPODIK, etc.** It is a co-pilot/bridge/memory layer on top.
- **Not a foundation model.** Foundation-model licensing is explicit beyond-grant scope. Aksara uses external models via Hermes Agent provider abstraction.
- **Not a chain runtime.** No validators, no consensus, no token. Tamper-evidence comes from OpenTimestamps anchoring.
- **Not vendor-locked.** Hermes Agent's provider abstraction means swapping inference providers does not require architecture changes.
- **Not a Bluesky / AT Protocol app.** atproto was considered and explicitly not adopted; ActivityPods + PieFed is the federation stack.

---

## 10. Open questions

- **Adapter-layer scope.** How much of ActivityPods' API does the bridge expose? Minimum viable subset (actors + inbox/outbox + basic Pod containers) is documented; deeper subsets (WAC, ACP, Pod-to-Pod permissions) are scoped per Aksara-node use case.
- **Hermes Agent persona definition.** The proposal §11 names five personas (Staf Administrasi, Operator Sistem, Bendahara, Sekretaris, Arsiparis Digital). How are these implemented — separate Hermes Agent profiles? One Agent with role-bound skill registries? Pilot will clarify.
- **NIM sandbox readiness.** When does NVIDIA NIM Indonesia-hosted infrastructure become viable as a primary cloud provider for Aksara? Tracking but not blocking.
- **Federated learning across Aksara nodes.** Beyond grant, but architecture must not preclude.

---

## 11. Related documents

- [`docs/etnos/goal-ux.md`](../etnos/goal-ux.md) — the seamless human+agent UX, the product north star
- [`docs/aksara/onboarding.md`](./onboarding.md) — institutional onboarding ceremony for Aksara nodes
- [`docs/aksara/ruang-adat-sovereignty.md`](./ruang-adat-sovereignty.md) — indigenous-sovereignty model for ruang adat
- [`docs/aksara/master-proposal-digest.md`](./master-proposal-digest.md) — digest of Master Proposal v3.5 with drift analysis
- [`docs/aksara/proposal-v3.6-amendments.md`](./proposal-v3.6-amendments.md) — surgical edits applied to v3.5 → v3.6
- [`docs/research/unified-federation-protocol.md`](../research/unified-federation-protocol.md) — federation substrate decision
- [`docs/research/decentralized-agent-memory.md`](../research/decentralized-agent-memory.md) — per-node memory architecture
- [`docs/research/atproto-upstream-contributions.md`](../research/atproto-upstream-contributions.md) — atproto contributions plan (independent track)
- [`docs/forum-readiness-alpha-beta.md`](../forum-readiness-alpha-beta.md) — ETNOS forum-side punch list
