# Aksara Master Proposal — v3.5 → v3.6 amendments

> Surgical amendments to the Master Proposal Edisi Publik v3.5 (Juni 2026), applied to bring the proposal text in line with the architecture decisions captured in `docs/research/unified-federation-protocol.md`, `docs/research/decentralized-agent-memory.md`, `docs/aksara/onboarding.md`, and the founder's clarifications recorded on 2026-06-08.
>
> **Purpose.** This file is the canonical changelog. Apply each diff to your `.docx` working copy and re-publish as v3.6. The original Indonesian voice and structure are preserved; only the technical specifics change.
>
> **Source of truth.** The before-lines below match the converted plaintext at `/tmp/aksara-master.md` (extracted from `def9f606-Aksara_Master_Proposal_v3_5.docx` on 2026-06-08).

---

## Summary of amendments

| # | Section | Type | Change |
|---|---|---|---|
| 1 | §6 / §15 — ETNOS lineage | Soften commitment | Photon-on-PieFed today, gradual ActivityPods migration with adapter shim (not full API rework in grant year) |
| 2 | §13 — Memory + retrieval | Substrate swap | HippoRAG 2 → **LightRAG**; OpenViking retained (clarify hierarchical MD store built into Hermes Agent) |
| 3 | §13 — Reasoning layer | Wording fix | "Hermes Agent (Nous Research, open-weights)" → "Hermes Agent (Nous Research, open-source runtime; distinct from the Hermes-3 model series)" |
| 4 | §13 — Compute berlapis | Wording fix | "via Hermes" → "via Hermes Agent" (disambiguation) |
| 5 | §19 — Aksara hardware spec | Locality + balance | Cloud LLM is the primary reasoning path with NIM-sandbox-hosted-in-Indonesia evaluation; local SLM is offline backstop + low-latency tasks + PII-safe path |
| 6 | §22 — Software stack | Substrate swap | Same as #2 + "Hermes" → "Hermes Agent" |
| 7 | §14 — Substrate commitments | Add adapter | Adapter layer bridging PieFed (content plane today) to ActivityPods (content + memory plane target) named as a deliverable |
| 8 | §11 / §31 — Validation flow | No change | Paket Kelurahan MVP unchanged |
| 9 | §19 / §22 — API keys + telemetry | Net-new stance | Platform manages all cloud-LLM keys + billing; users never touch credentials; only anonymous fleet telemetry collected |
| 10 | §13 / §19 — Gemma multimodal ASR | Stack simplification | Gemma 4 multimodal as native audio→text+intent; Whisper demoted to CPU fallback; TTS deferred to dedicated research doc |

---

## Amendment 1 — ETNOS lineage (§6 product framing, §15 ETNOS section)

**Source line 67 (§6 — Aksara as one product two reaches):**

Before:
> Kelima konfigurasi berbagi stack yang sama: Hermes Agent sebagai reasoning runtime, aksara-cli sebagai lapisan eksekusi deterministik, **HippoRAG 2 dan OpenViking sebagai memory**, Presidio-ID untuk PII handling, serta ActivityPods, NextGraph, dan Foundation Protocol vocabulary sebagai substrat federasi.

After:
> Kelima konfigurasi berbagi stack yang sama: Hermes Agent sebagai reasoning runtime, aksara-cli sebagai lapisan eksekusi deterministik, **LightRAG dan OpenViking sebagai memory** (LightRAG untuk graph-RAG retrieval lokal, OpenViking untuk hierarchical long-term store built-in pada Hermes Agent), Presidio-ID untuk PII handling, serta ActivityPods, NextGraph, dan Foundation Protocol vocabulary sebagai substrat federasi target.

**Source line 279 (§15 — ETNOS section, opening sentence):**

Before:
> ETNOS adalah heavy fork dari Photon (klien Svelte, AGPL-3.0), **di-rework dari API Lemmy ke API ActivityPods**, menjadi lapisan tempat manusia dan agen AI institusional bertemu. Setiap provinsi adalah instance ActivityPods tersendiri (ETNOS Papua, ETNOS Papua Tengah), dengan federasi antar-provinsi yang scoped ke instance ETNOS.

After:
> ETNOS adalah heavy fork dari Photon (klien Svelte, AGPL-3.0), saat ini berjalan di atas **API Lemmy/PieFed sebagai content plane operasional**, dengan jalur migrasi bertahap ke API ActivityPods seiring kematangan stack ActivityPods + NextGraph (target 2027). Sebuah **adapter layer** mengekspos endpoint ActivityPods-compatible di atas PieFed sebagai jembatan, memungkinkan node Aksara berbasis ActivityPods berinteroperasi tanpa menunggu UI rewrite penuh. Setiap provinsi adalah instance tersendiri (ETNOS Papua, ETNOS Papua Tengah), dengan federasi antar-provinsi yang scoped ke instance ETNOS.

**Rationale.** The full Lemmy→ActivityPods rework was estimated at 3–6 engineer-months in the unified-federation-protocol memo. The adapter approach delivers an ActivityPods-compatible endpoint as the deliverable artifact without rewriting the Svelte client against a different API. NLnet reviewers can still verify a working ActivityPods endpoint at grant close. Production ETNOS stays on PieFed through the grant year; deeper migration happens when ActivityPods + NextGraph encrypted Pods stabilize.

---

## Amendment 2 — Memory + retrieval (§13)

**Source line 233 (§10 — Civic Transaction reasoning vs execution):**

Before:
> Reasoning. Hermes Agent memahami intent, mengambil konteks dari memori lokal (**HippoRAG 2 dan OpenViking**), dan menentukan tool call yang tepat. Hermes tidak menghasilkan dokumen formal langsung.

After:
> Reasoning. Hermes Agent memahami intent, mengambil konteks dari memori lokal (**LightRAG dan OpenViking**), dan menentukan tool call yang tepat. Hermes Agent tidak menghasilkan dokumen formal langsung.

**Source line 263 (§13 — Memory dan retrieval):**

Before:
> Memory dan retrieval. **HippoRAG 2 untuk episodic memory, OpenViking sebagai long-term store.** Memori per-deployment terisolasi; agregasi hanya di Hub dengan anonymization.

After:
> Memory dan retrieval. **LightRAG sebagai graph-RAG retrieval engine** dengan SQLite + sqlite-vec sebagai store lokal pada node; **OpenViking sebagai hierarchical long-term knowledge base** (struktur folder L0/L1/L2 atas Markdown, built-in pada Hermes Agent). HippoRAG 2 dievaluasi sebagai sumber ide design (passage+phrase dual nodes, Personalized PageRank, LLM-filtered triples at ingest); tidak digunakan sebagai library produksi karena kebutuhan komputasi (paper memerlukan 4× H100 untuk index 10k dokumen). Memori per-deployment terisolasi; agregasi hanya di Hub dengan anonymization.

**Rationale.** LightRAG (~34k ⭐, May 2026 release with role-specific LLM configs) is the practical equivalent of HippoRAG 2's intent on hardware that fits an Orange Pi 5 budget. OpenViking is kept and clarified — the founder confirms it ships built-into Hermes Agent and is used in production today. The hierarchical-MD structure (L0 surface → L1 nested → L2 deeper, Obsidian-shaped) is the working store; LightRAG is the queryable graph layer over it.

---

## Amendment 3 — Reasoning layer wording (§13)

**Source line 259 (§13 — Reasoning layer):**

Before:
> Reasoning layer. **Hermes Agent (Nous Research, open-weights)** sebagai planner-executor. Tool-use matang, dapat diaudit, dan dapat di-host on-device pada konfigurasi yang lebih besar.

After:
> Reasoning layer. **Hermes Agent (Nous Research, open-source runtime — v0.9.0 April 2026; distinct from the Hermes-3 open-weights model series)** sebagai planner-executor. Tool-use matang, provider-agnostic via Hermes Agent abstraction (Anthropic Messages, Codex Responses, Bedrock, chat-completions APIs), dapat diaudit, dan dapat di-host on-device pada konfigurasi yang lebih besar.

**Rationale.** "Open-weights" misnames the artifact — it conflates Nous Research's Hermes-3 model series with their separate Hermes Agent runtime/harness project. The runtime is open-source (Apache 2.0); the models are open-weights. A reviewer who knows the ecosystem would spot the slip. Fixing this also lets us name the provider-abstraction strength of Hermes Agent, which justifies our cloud-primary / local-auxiliary balance below.

---

## Amendment 4 — Compute berlapis wording (§13)

**Source line 261 (§13 — Compute berlapis):**

Before:
> Stack bersifat provider-agnostic via **Hermes**, sehingga model dapat di-swap tanpa rewrite arsitektur.

After:
> Stack bersifat provider-agnostic via **Hermes Agent**, sehingga model dapat di-swap tanpa rewrite arsitektur.

**Rationale.** Disambiguation only. "Hermes" alone is ambiguous after Amendment 3.

---

## Amendment 5 — Aksara hardware spec, cloud/local balance (§19)

**Source line 339 (§19 — Aksara node hardware):**

Before:
> Aksara (node di tempat). Orange Pi 5 (RK3588S, NPU, 8 sampai 16 GB RAM). **Menjalankan Gemma 4 E4B lokal untuk tugas rutin, LLM cloud untuk reasoning kompleks dan computer-use** (kunci API di vault, pemakaian token termeter dan terbagi antar perangkat). Strip OLED untuk mata teranimasi sebagai indikator kehadiran, strip e-ink untuk tampilan informasi deliberat (tugas tertunda, status sync, peringatan). Secure element (ATECC608B atau Zymkey). Konektivitas via IoT SIM. STT bawaan (Whisper atau Gemma multimodal); TTS ekspresif Bahasa Indonesia masih dievaluasi.

After:
> Aksara (node di tempat). Orange Pi 5 (RK3588S, NPU, 8 sampai 16 GB RAM). **LLM cloud sebagai jalur reasoning primer** (Anthropic, NVIDIA NIM sandbox hosted-in-Indonesia di evaluasi sebagai jalur kedaulatan data, provider lain via Hermes Agent provider abstraction), dengan **SLM lokal (Gemma 4 E4B atau setara) sebagai backstop offline-first**, sumber latency-rendah untuk tugas rutin, dan jalur PII-safe ketika Presidio-ID mendeteksi konten sensitif di boundary. Kunci API di vault HSM-backed (ATECC608B atau Zymkey), pemakaian token termeter dan terbagi antar perangkat. Strip OLED untuk mata teranimasi sebagai indikator kehadiran, strip e-ink untuk tampilan informasi deliberat (tugas tertunda, status sync, peringatan). Konektivitas via IoT SIM. STT bawaan (Whisper atau Gemma multimodal); TTS ekspresif Bahasa Indonesia masih dievaluasi.

**Rationale.** The original wording reads as "Gemma local is primary, cloud handles edge cases." The founder's clarification on 2026-06-08 was the inverse: cloud LLM is the primary reasoning path, local SLM is the offline backstop. This better matches the actual deployment reality (Orange Pi 5 cannot run a frontier model; reasoning quality matters; cloud is reachable when IoT SIM is online which is most of the time). The NVIDIA NIM sandbox evaluation is named explicitly because it preserves the "data residency in Indonesia" commitment (§22) by hosting the LLM inside national infrastructure. Presidio-ID stays at the boundary so PII never leaves the device for cloud inference.

**Note.** This amendment surfaces a real change in operational stance. Worth explicit founder review before publishing v3.6.

---

## Amendment 6 — Software stack (§22)

**Source line 381 (§22 — Software stack summary):**

Before:
> Software stack. OS Debian-based ringan, runtime inferensi (llama.cpp untuk tier Gemma, vLLM untuk tier Pro ke atas), **Hermes sebagai planner, aksara-cli sebagai eksekutor, Presidio-ID untuk PII, HippoRAG 2 dan OpenViking untuk memory**, dashboard admin lokal.

After:
> Software stack. OS Debian-based ringan, runtime inferensi lokal (llama.cpp untuk tier Gemma, vLLM untuk tier Pro ke atas) untuk SLM backstop, cloud LLM via Hermes Agent provider abstraction sebagai jalur primer. **Hermes Agent sebagai planner-executor**, **aksara-cli sebagai lapisan eksekusi deterministik**, Presidio-ID untuk PII handling di boundary, **LightRAG (graph-RAG dengan SQLite + sqlite-vec) dan OpenViking (hierarchical long-term store) untuk memory**, dashboard admin lokal.

**Rationale.** Consolidates Amendments 2–5 into the §22 architecture summary, which is the line most likely to be quoted in talks and adapter integrations.

---

## Amendment 7 — Add the adapter layer as a substrate commitment (§14)

**Source line 271 (§14 — Substrate commitments rationale):** unchanged. Add a new paragraph after line 281:

Insert between current line 281 and 283:

> **Bridge layer ETNOS → ActivityPods (M2 dari grant year).** Karena substrat ActivityPods + NextGraph (terutama encrypted Pods di atas NextGraph) masih dalam tahap pre-stabilization pada awal grant period, sebuah adapter layer ditulis di atas PieFed yang mengekspos subset endpoint ActivityPods-compatible — actors, inbox/outbox, basic Pod containers — sebagai jembatan operasional. Adapter ini menjadi jalur integrasi node Aksara terhadap ETNOS pada tahap pilot, dan menjadi basis migrasi penuh ketika ActivityPods + NextGraph siap produksi (target 2027). Adapter di-release sebagai komponen terpisah ke komunitas ActivityPods sebagai kontribusi upstream.

**Rationale.** This is the explicit operationalization of the "soften the rework" decision. It also gives the NLnet grant a concrete deliverable artifact (the adapter shim) that is intrinsically valuable to the upstream ActivityPods ecosystem even after our own ETNOS migrates fully.

---

## Amendment 8 — No change to MVP scope (§28–§31)

The Paket Kelurahan validation flow (5–7 kelurahan, 7 surat types, M0–M12 timeline) is unchanged. Hardware batch, deployment sequencing, success metrics, and demo selection all remain valid. The amendments above affect substrate and runtime wording, not the pilot scope.

---

## Amendment 9 — Managed API keys + telemetry posture (§19, §22)

**Source line 339 (§19 — Aksara hardware spec), append to the API-key sentence:**

Before (already amended by Amendment 5):
> Kunci API di vault HSM-backed (ATECC608B atau Zymkey), pemakaian token termeter dan terbagi antar perangkat.

After:
> Kunci API di vault HSM-backed (ATECC608B atau Zymkey), pemakaian token termeter dan terbagi antar perangkat. **Operator akhir (Lurah, Bendahara, Bidan, Penyuluh) tidak pernah berinteraksi dengan kunci API — penyediaan, rotasi, dan billing dikelola oleh PT Abstraksi Data & Kognitek sebagai bagian dari layanan**, baik provider-nya OpenRouter, Anthropic langsung, atau NVIDIA NIM hosted-in-Indonesia. Data telemetri yang dikirim balik ke platform terbatas pada fleet management anonim (uptime, error counts, model-routing health, token throughput per device); tidak ada konten percakapan, tidak ada PII, tidak ada metadata transaksi sipil.

**Insert into §22 (Software stack) as a new line after data residency commitment:**

Insert between current line 369 and 371:

> **Pengelolaan kunci API dan langganan model.** Semua kredensial cloud LLM (OpenRouter, Anthropic, NIM) dikelola oleh PT Abstraksi Data & Kognitek dan didistribusikan ke unit Aksara sebagai bagian dari subscription. Operator tidak menangani billing model. Audit kuota per institusi tetap transparent — Diskominfo dapat meminta laporan token usage per kelurahan kapan pun — tetapi rotasi kunci, fallback provider, dan negosiasi rate dijamin oleh platform.

**Rationale.** The original §19 mentioned "kunci API di vault" without specifying who manages them. The founder's clarification on 2026-06-08 makes the responsibility explicit: end users (institutions, civil servants) do not deal with API keys or model billing. PT Abstraksi handles provisioning, rotation, fallback, and billing as part of the Aksara service. Telemetry sent back is anonymous fleet-management data — no conversation content, no PII, no civic-transaction metadata. This is both a UX commitment (users never see "your OpenAI key expired") and a trust commitment (we explicitly limit what we collect for operations).

This amendment is **net-new operational stance** that was not articulated in v3.5. Worth highlighting in the v3.6 cover note.

---

## Amendment 10 — Gemma 4 multimodal as native ASR + reasoning (§13, §19)

**Source line 339 (§19 — Aksara hardware spec), STT line:**

Before:
> STT bawaan (Whisper atau Gemma multimodal); TTS ekspresif Bahasa Indonesia masih dievaluasi.

After:
> **STT bawaan via Gemma 4 multimodal (E4B di flagship Aksara, E2B di Aksara Go) — audio input langsung diproses menjadi text+intent dalam satu jalur inferensi**, menghilangkan dependensi Whisper sebagai komponen ASR terpisah. Whisper tetap tersedia sebagai fallback CPU-only ketika NPU Gemma tidak tersedia. **TTS ekspresif Bahasa Indonesia** — kandidat sedang dievaluasi (VoxCPM2 dan model SOTA lain dirinci di `docs/research/indonesian-tts.md`); target output streaming dengan minimal dua persona suara (formal dan ramah), mendukung intonasi Papuan Malay jika model memungkinkan.

**Insert into §13 (Reasoning + Memory) as a new sub-paragraph after the model-tiering block:**

Insert between current line 261 and 263:

> **Multimodal input.** Pada konfigurasi Aksara (Gemma 4 E4B) dan Aksara Go (E2B), input audio dari operator atau warga (suara WhatsApp, panggilan radio, perekaman lapangan) masuk langsung ke model multimodal — Gemma 4 menerima waveform audio dan menghasilkan teks transkrip + parsing intent secara native, tanpa memerlukan pipeline ASR terpisah. Ini memangkas latency dan menyederhanakan stack: dua dependensi (Whisper + Gemma text) menjadi satu (Gemma multimodal). Whisper tetap di repository sebagai fallback CPU untuk kasus model multimodal tidak loaded.

**Rationale.** The original wording lists Whisper as a separate ASR component. Gemma 4 E2B and E4B (release as of mid-2026) accept audio input natively and produce text output in one inference pass — this is a clean architectural simplification. The TTS line is also updated to point at the dedicated research doc rather than leave it as an open question.

---

## Cross-reference: NLnet application v0.5

The NLnet application v0.5 (`/root/.claude/uploads/.../120e0b07-NLnet_Application_v0_5.md`) contains the same "rework Photon from Lemmy's API to ActivityPods' API" phrasing in its Project description and Milestone M3. Apply the equivalent softening there:

NLnet §"What we will build" / "2. ETNOS":
- Replace "reworked from Lemmy's API to ActivityPods' API" with "bridged from Lemmy's API to ActivityPods' API via an adapter layer, with full migration when the ActivityPods + NextGraph encrypted-Pod stack stabilises."

NLnet milestone M3:
- Replace "Heavy Photon fork reworked to ActivityPods" with "ActivityPods adapter layer over the existing PieFed-backed Photon fork, exposing actors, inbox/outbox, and basic Pod containers as the integration surface for Aksara nodes."

This keeps the NLnet European-extension framing (we still extend ActivityPods upstream) while honestly scoping the grant year's deliverable.

---

## What this changelog does NOT change

- Aksara hardware: Orange Pi 5 + ATECC608B/Zymkey + CERN-OHL-S — unchanged.
- LLM tiering: DeepSeek V4 Flash (Hub) → Qwen 3.6 35B-A10B (Pro) → Gemma 4 E4B (Aksara) → Gemma 4 E2B (Aksara Go) — unchanged.
- Civic Transaction primitive: reasoning ⊥ execution separation — unchanged.
- aksara-cli as the deterministic Go binary — unchanged.
- CARE-as-Code consent layer extending Solid WAC + ACP — unchanged (UCAN is the deployment-level wire format; CARE is the semantics).
- DIDs as identity primitive (proposal silent on method; our docs specify did:web/wba — defer naming the method until v3.7 if reviewers ask).
- Foundation Protocol as coordination vocabulary (not runtime) — unchanged.
- Paket Kelurahan MVP, success metrics, M0–M12 timeline — unchanged.
- Hub-level federated learning, Sentinel Alam, foundation-model licensing, academic paper trail — unchanged (all explicitly beyond-grant).
- Data residency commitment ("no data through foreign cloud") — unchanged. NIM sandbox evaluation in Amendment 5 is consistent with this because it targets Indonesia-hosted NIM.

---

*Apply these eight amendments to your .docx working copy. Re-publish as v3.6 (Edisi Publik, Juni 2026 rev. 1). Optional: bump the version number to v3.6 and add a one-line revision-history note at the top noting "Penyesuaian terminologi Hermes Agent, substitusi LightRAG untuk HippoRAG 2, klarifikasi keseimbangan cloud-primary/local-auxiliary, penambahan bridge layer eksplisit ETNOS-ActivityPods."*
