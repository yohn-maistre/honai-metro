# Decentralized Agent Memory for Aksara

A skeptical pass at running HippoRAG-class memory per Aksara node and federating queries through UCAN-gated retrieval, June 2026.

> **Premise.** Each Aksara node — kelurahan, puskesmas, balai adat, BPP, sekolah — needs a local memory it owns, plus a way to *traverse* a peer's memory under scoped permission. The user named HippoRAG 2 as the candidate substrate and asked whether we can run it per-node and federate. This memo answers that, picks a stack, and stages it.

---

## TL;DR

**Yes — but not with HippoRAG 2, and not as "decentralized RAG" in the chain sense.** Build a per-Aksara memory now as **SQLite + sqlite-vec + Ollama + LightRAG + OpenViking** (the latter as the hierarchical long-term store built into Hermes Agent, confirmed by the founder), federate queries over **A2A + UCAN-attached JSON-RPC**, no custom protocol or PIR. HippoRAG 2 in its OSU-NLP form needs four H100s to index 10k documents in 4 hours ([HippoRAG 2 paper, arXiv:2502.14802](https://arxiv.org/html/2502.14802v1)) and depends on NV-Embed-v2 and vLLM; that is not deployable on an Orange Pi 5 in Wamena. We keep HippoRAG's *idea* — passage + phrase nodes with personalized PageRank for multi-hop sense-making — and reimplement a 10%-of-the-paper version on top of LightRAG. **Now (alpha):** local-only per-Aksara retrieval. **6 months (beta):** A2A + UCAN federation between two pilot nodes, no PIR, no homomorphic anything. **24 months:** maybe ActivityPods quad-store integration if NextGraph ever ships; PIR stays research-only.

## Updates per founder clarification (2026-06-08)

- **OpenViking is in, not deferred.** The original memo defer-rated OpenViking. The founder confirms it is production-deployed and **built into the Hermes Agent runtime** as the hierarchical Markdown store (L0 surface / L1 nested / L2 deeper, Obsidian-shaped folder convention). It composes with LightRAG (graph-RAG layer) rather than replacing it. The Hermes Agent deep-dive (`docs/research/hermes-agent-deep-dive.md`) verified this: OpenViking ships in the `plugins/memory/openviking` subtree as a first-class memory provider plugin, single-select alongside the default SQLite+FTS5. Selecting it is a config flag, no external server. Source: founder note 2026-06-08, [OpenViking docs](https://docs.openviking.ai/en/faq/faq).
- **Cloud LLM is the primary reasoning path, local SLM is the offline-first / PII-safe backstop.** The original memo assumed local-Ollama-primary. The production stance is **cloud-primary** (Anthropic, NVIDIA NIM sandbox hosted-in-Indonesia under evaluation, others via Hermes Agent's provider abstraction), **local-Gemma-auxiliary** for offline degradation and for cases where Presidio-ID flags PII at the boundary. Sqlite-vec and LightRAG embeddings still run locally on the node; only LLM inference is cloud-primary.
- **Default device is Orange Pi 5, not Hetzner CAX21.** The original memo defaulted to CAX21 as the Aksara substrate. The Master Proposal v3.5 (and v3.6) commits to **Orange Pi 5 with HSM-rooted DID and BSrE seal storage**, deployed on-prem at the institution. **CAX21 references in this memo are dev-bench only**, not production. Production data residency stays in Indonesia per proposal §22.

These updates reconcile this memo with the Master Proposal as amended in `docs/aksara/proposal-v3.6-amendments.md` and the consolidated architecture in `docs/aksara/architecture.md`.

---

## 1. HippoRAG 2 — what it is, why we don't ship it as-is

[HippoRAG 2 (Gutiérrez et al., Feb 2025; arXiv:2502.14802)](https://arxiv.org/abs/2502.14802) — "From RAG to Memory: Non-Parametric Continual Learning for LLMs" — is a **dual-node KG** of passages and extracted phrases, traversed by **Personalized PageRank** seeded on query entities, with LLM-filtered triples. It claims +7 F1 over NV-Embed-v2 on associative benchmarks and lower tokens than GraphRAG ([paper HTML](https://arxiv.org/html/2502.14802v1)).

**What the code actually requires.** The OSU-NLP reference ([github.com/OSU-NLP-Group/HippoRAG](https://github.com/OSU-NLP-Group/HippoRAG)) pins `torch==2.5.1`, `vllm==0.6.6.post1`, NV-Embed-v2 (7.85B params, ~16 GB FP16) as embedder, Llama-3.3-70B for triple extraction. **Reported config: 4× H100 with tensor parallelism, ~4 hours to index 10k documents.** A kelurahan with five years of surat-domisili plus immunization logs is comfortably 100k–500k records. This is a wrong-substrate problem on a CAX21, not a 5× scaling problem. Swapping the 70B for Qwen 3B via Ollama (~2–5 tok/s on a Pi 5 per [Stratosphere Lab](https://www.stratosphereips.org/blog/2025/6/5/how-well-do-llms-perform-on-a-raspberry-pi-5)) still leaves the embedder dependency.

**What we keep from HippoRAG 2 — three ideas, not the code.** (1) Passage + phrase dual nodes: also embed entities (citizen DID, dusun, hutan adat) and connect them as graph nodes — that's what makes multi-hop kinship queries tractable. (2) Personalized PageRank seeded by query entities; networkx handles it on a Pi. (3) LLM-filtered triple extraction *at ingest, not at query* — pay the cloud-model cost once when a surat-domisili is filed, not on each Q&A.

**Verdict.** Research-grade, not deployable per-Aksara. **2/5 deployment, 5/5 architecture vocabulary.** The 90% alternative — **LightRAG** ([repo](https://github.com/LarFii/LightRAG-hku), EMNLP 2025; [paper](https://arxiv.org/html/2410.05779v1)) — has 34k+ stars, runs against external LLMs (no GPU required), supports Postgres/Neo4j/SQLite/Faiss backends, and shipped role-specific LLM configs in May 2026 (cheap extractor, smarter query model). Ship LightRAG.

## 2. Graph-RAG landscape — pick LightRAG, hold the rest

| System | Per-node deploy on CAX21 | License | Cost-to-index | 2026 maturity | Verdict |
|---|---|---|---|---|---|
| **HippoRAG 2** | No (4× H100 in paper) | Apache 2.0 | High | Research code | Borrow ideas |
| **LightRAG** | Yes (LLM remote, store local) | MIT | Low (~$0.10/1k docs w/ cheap model) | Prod, active | **Adopt** |
| **GraphRAG (MSR)** | Marginal | MIT | $50–200 / 500 pages ([Paperclipped 2026](https://www.paperclipped.de/en/blog/graph-rag-production/)) | Prod, slow | Skip |
| **LazyGraphRAG / Fast GraphRAG** | Yes | MIT | 50-6000× cheaper than GraphRAG | Prod, new | Watch |
| **KAG (Ant Group, OpenSPG)** | No (heavy JVM stack) | Apache 2.0 | Medium | Prod inside Alipay ([aibase.com](https://www.aibase.com/news/11733)) | Skip — wrong shape |
| **Memori (GibsonAI)** | Yes (SQL-native, no vector DB needed) | Apache 2.0 | Very low ([MarkTechPost](https://www.marktechpost.com/2025/09/08/gibsonai-releases-memori-an-open-source-sql-native-memory-engine-for-ai-agents/)) | Prod, young | **Adopt for conversation memory** |
| **Cognee** | Yes, self-hosted Docker | Apache 2.0 | Medium | Prod, GraphRAG-native ([cognee.ai](https://www.cognee.ai/)) | Pilot for adat KG |
| **RAGFlow** | Slim 2 GB / full 9 GB Docker ([Firecrawl 2026 list](https://www.firecrawl.dev/blog/best-open-source-rag-frameworks)) | Apache 2.0 | Medium | Prod, doc-centric | Skip — wrong shape |
| **OpenViking (ByteDance)** | Untested on ARM | Apache 2.0 | Unknown | New, 13k stars | Defer, ByteDance origin concerns |

**Mix that ships:** LightRAG for the document-rooted KG; Memori for conversation memory; Cognee revisited at 12 months only if LightRAG's adat KG modeling proves too lossy.

## 3. The local Aksara stack

One process tree per node: Hermes harness → MCP → local skill server → SQLite primary (records + audit log + capability cache) with sqlite-vec for embeddings and networkx for the small PageRank graph → Ollama for local generation → LightRAG orchestrator → libsodium sealed-box sidecar for sacred-tagged ciphertext → A2A endpoint with UCAN verifier in front.

- **Primary store: SQLite + sqlite-vec.** File-on-disk, no daemon. Per [sqlite-vec docs](https://www.sqlite.ai/sqlite-vector) and a Feb-2026 production case (6,500 agent queries in six weeks, no incident), production-ready on edge with NEON SIMD on ARM. LanceDB ([lancedb.com](https://www.lancedb.com/)) is a fine second pick if vector count crosses ~5M per Aksara (unlikely for a kelurahan in five years).
- **Graph layer: networkx, not an embedded graph DB yet.** Kùzu was **archived October 2025**; the active fork is **RyuGraph** ([github.com/predictable-labs/ryugraph](https://github.com/predictable-labs/ryugraph)) — too young to bet on. Oxigraph ([repo](https://github.com/oxigraph/oxigraph)) admits un-optimized SPARQL evaluation — fine as a quad-store sidecar, not as primary. networkx loaded from SQLite tables handles a 100k-entity kelurahan KG in <1 GB RAM; PageRank converges in seconds.
- **LLM runtime: Ollama, fallback llama.cpp** (10–20% faster per [itsfoss.com benchmarks](https://itsfoss.com/llms-for-raspberry-pi/)). Don't promise on-device generation: Qwen2.5:3B runs at 2–5 tok/s on a Pi 5, usable for batch extraction but painful for interactive Q&A. **A Tier-3 kabupaten hub runs the LLM** (CAX31 16 GB plus a Telkomsel-hosted vLLM for heavier work); kelurahan-class nodes call up.
- **Document store: SQLite blob for <1 MB; filesystem-with-hash for larger.** No S3 in alpha.
- **Retrieval orchestrator: LightRAG**, with phrase-node extraction paid once at ingest via a Tier-2 cloud model; query-time runs against local Ollama.

**Device tiers.** Edge = Pi 5 8 GB or laptop, cache + ingest only, forwards Q&A to its kabupaten hub, works offline-deferred. Aksara default = Hetzner CAX21 (4 vCPU ARM, 8 GB, 80 GB SSD; ~€7/mo). Hub = CAX31/CAX41 (8–16 GB), bigger Ollama, vLLM batch ingest, federated query aggregator. **Pi-only as primary substrate is a romantic story that costs reliability;** CAX21 is the default.

## 4. Federated retrieval — the hard part, plus what to ship

The user's four query shapes map to different protocol problems:

| Query | Routing | Permission | Privacy |
|---|---|---|---|
| Citizen X's immunization | A→B direct via X's DID Document `service` chain | UCAN scoped `subject=DID(X)`, `relation=read:immunization` | TLS + signed result |
| Dewan kinship vouch | A→{B,C,…} fan-out in Dewan peer set | UCAN issued by Dewan, M-of-N witness | TLS |
| Dinas Kesehatan public publication | A→Dinas | None — public lexicon | None |
| Cross-Aksara semantic search "hutan adat Asmat" | A→peer set, semantic match | UCAN per peer opted-in | Hard — public-only in v1 |

**Routing — no broadcast.** Two complementary patterns. (1) **Capability registry per ETNOS instance:** each Aksara publishes an A2A Agent Card listing lexicons, scopes, and a capability sentence; the ETNOS AppView builds a small HNSW index over those sentences. This is the *Federation of Agents* pattern with Versioned Capability Vectors ([arXiv:2509.20175](https://arxiv.org/abs/2509.20175)), and it composes natively with the A2A stack from `unified-federation-protocol.md`. (2) **DID-Document `service` entries for canonical routing:** a citizen's DID has a `service` of type `PrimaryPuskesmas`; for "X's immunization?" we resolve the DID and route directly. Use semantic routing only when canonical lookup is empty.

**Transport.** A2A v1.0 ([a2a-protocol.org spec](https://a2a-protocol.org/v0.2.6/specification/)) over JSON-RPC: one A2A Task per `query/retrieve`. UCAN rides in `Authorization: Bearer ucan:...`; receiver verifies the chain locally (no authority callback) and returns a typed `RetrievalResponse` with PDS record URIs as provenance.

**Permission gating.** UCAN attenuates across hops ([delegation spec](https://github.com/ucan-wg/delegation)): a Dewan grants a 30-day read to a researcher's agent; the agent attenuates further when calling subordinate Aksaras. Responder checks: caller DID = `aud`, chain validates to a known issuer, scope covers the request, expiry valid. Sacred-tagged content additionally requires a libsodium sealed-box decrypt against the Dewan threshold key.

**Privacy-preserving retrieval — not in v1.** PIR is improving fast — PIR-RAG's cluster-and-fetch ([arXiv:2509.21325](https://arxiv.org/html/2509.21325)) and information-theoretic semantic PIR ([Vithana et al.](https://arxiv.org/pdf/2003.13667)) — but bandwidth and CPU costs are still 10×–1000× a TLS GET at province scale. The right v1 answer to "do you have records about Y" is "you had to present a UCAN scoped to Y; we trust it; we answer." PIR returns when the threat model includes a curious peer correlating query patterns over time — post-2027.

**Result merging.** Aksara A reranks responses from peers B, C, D by: provenance weight (pemerintah > adat for civic facts, adat > pemerintah for cultural), cosine similarity, recency. **No fact in the synthesized answer without a citable peer DID + record URI.**

**Caching.** UCAN `expiry` is the cache TTL; entries indexed by `(query_hash, peer_did, ucan_cid)`. Revocation: a peer's `revoke` PDS record clears matching cache rows via the nightly subscriber from `unified-federation-protocol.md` §6.

## 5. Composition with the chosen federation substrate

`unified-federation-protocol.md` committed us to PieFed + atproto PDS + A2A + UCAN. The memory layer slots in cleanly:

- **The PDS *is* part of local memory.** Typed records under `id.papua.*` lexicons are the canonical, signed, hash-addressed source. The Aksara node's SQLite is a **derived index**, rebuildable from the PDS firehose. Structurally a per-Aksara AppView.
- **A2A is the retrieval transport.** `query/retrieve` is one Task type; `ingest/notify` (peer pushes a relevant record to A's index) is another.
- **ActivityPub `Search` is not a real thing in 2026.** No FEP for federated semantic search exists; FEP-6606 (collections addressing) is unrelated. We do not invent FEP-search; we use A2A.
- **ActivityPods quad-store: defer** until NextGraph's self-hostable broker actually ships (mid-late 2026 target per `sovereign-stack-architecture.md` §1; tracked monthly). Re-evaluate then whether to re-project SQLite into a SPARQL quad-store for cross-Aksara analytics.
- **NextGraph CRDTs as offline-first: defer.** Our 3T-area story is "ingest queue on the Pi 5, sync to CAX21 when bandwidth allows" — an SQLite WAL plus a sync daemon, not a CRDT engine.

## 6. Readiness scorecard

| Piece | Prod-ready 2026? | CPU-only Aksara? | Verdict |
|---|---|---|---|
| LightRAG, Memori, sqlite-vec, networkx, A2A v1.0, UCAN delegation, libsodium sealed-box | Yes | Yes | **Now** |
| Ollama 3B-class | Yes | Batch yes, interactive marginal | **Now** for batch |
| Capability-vector routing (FoA) | Yes | Yes | 2026 H2 |
| HippoRAG 2 as-shipped | No (GPU) | No | **Skip — borrow ideas** |
| GraphRAG MSR | Yes | No (cost) | **Skip** |
| KAG / OpenSPG | Yes (JVM) | No | **Skip** |
| Kùzu | Archived | n/a | **Skip** |
| RyuGraph, OpenViking, Cognee | New | Maybe | **2027 revisit** |
| Oxigraph | Beta | Yes | 2027 quad-store sidecar |
| PIR / FHE retrieval | Research | No | **Research-only** |
| ActivityPub Search FEP | Doesn't exist | n/a | **Skip** |

## 7. Phased plan

**Now → end of 2026 (alpha).** Local-only per-Aksara RAG, no federation. The pilot kelurahan from `unified-federation-protocol.md` §10 gets a CAX21 with SQLite + sqlite-vec + LightRAG bound to the kelurahan's PDS, ingesting every typed record. A Hermes skill `aksara.memory.search(query)` calls LightRAG locally. Demo: steward asks "show me last month's surat-domisili for warga turun-temurun Dani"; Hermes returns cited records from the local index alone.

**End-2026 → mid-2027 (beta).** Two Aksaras federate — pilot kelurahan + pilot puskesmas, both exposing an A2A endpoint. Kelurahan asks puskesmas about immunization for citizen X; UCAN issued by the kelurahan steward against the kelurahan DID, scoped `read:immunization` for `subject=DID(X)`, 7-day expiry. Puskesmas verifies, evaluates, returns with provenance. A2A Agent Cards published; routing still by hand-edited registry, not semantic.

**Mid-2027 → end-2028.** ETNOS AppView ingests Agent Cards and builds the HNSW capability-vector index per Federation-of-Agents. Cross-Aksara semantic search ships, public-by-default; sacred and sealed lexicons require pre-issued UCANs from the respective Dewan. Cognee / LightRAG-with-quad-projection re-evaluated for adat KG depth. ActivityPods + NextGraph re-evaluated *only if* the NextGraph broker actually self-hosts and Pod ACLs subsume our UCAN+sealed-box story. PIR stays research-only — possibly a grant-track paper, not production.

## 8. What we'd be inventing (be honest)

1. **`aksara.memory` MCP skill** wrapping LightRAG with our lexicon + UCAN gating — 3 weeks.
2. **A2A `RetrievalRequest`/`RetrievalResponse` Task type** with provenance refs and UCAN binding — 2 weeks.
3. **Capability Agent Card schema** (lexicon list, region scope, capability sentence for HNSW embedding) — 2 weeks.
4. **UCAN verifier in Python**. JS/TS libraries exist ([ucan-wg/ts-ucan](https://github.com/ucan-wg/ts-ucan)); Python parity is patchy. Either a small Python verifier or a Rust binding — 3 weeks.
5. **libsodium threshold-decrypt for sacred blobs** — 3 weeks (already committed in `unified-federation-protocol.md`).
6. **AppView capability-vector HNSW index** per the Federation-of-Agents pattern — 4 weeks.
7. **Peer-cache + revocation propagation** via PDS firehose subscriber — 2 weeks.

**Total greenfield for the beta milestone: ~16 engineer-weeks.** Two engineers, one quarter, on top of the existing roadmap.

## 9. Adversarial and governance

**Threat model.** Minimum: a *curious Aksara operator* who would read more than allowed if granted access. Medium-term: a *malicious Aksara* that lies in its responses. Out of scope for v1: state-level adversary compromising keys end-to-end.

**Defenses shipped.** No synthesized fact without provenance (peer DID + record URI) — lies become attributable. Per-peer trust weighting in the reranker; pemerintah-weighted for civic, adat-weighted for cultural. UCAN scoping mandatory: no "read everything" capability is issuable; default expiry 7 days. Both ends log requester DID, UCAN CID, scope, response hash, timestamp; logs append-only, Merkle-anchored daily per `sovereign-stack-architecture.md`.

**KG poisoning.** Recent research is unambiguous — five malicious passages can drive 90% attack success ([Securing RAG taxonomy, arXiv:2604.08304](https://arxiv.org/html/2604.08304v1); [GraphRAG under Fire, arXiv:2501.14050](https://arxiv.org/pdf/2501.14050)). Defenses, in order: (1) ingest only from signed PDS records of known Aksaras — no open-web scraping at v1; (2) sacred and civic-action lexicons require BSrE or Dewan threshold co-signatures at ingest, so triples are signed-in; (3) sparse-document attention at synthesis time to block cross-document collusion ([SDAG, arXiv:2602.04711](https://www.arxiv.org/pdf/2602.04711)); (4) monthly red-team injecting known-poisoned triples into a staging Aksara to validate the reranker downweights.

**Takedown propagation.** A CARE-labeled takedown is a new signed PDS event (`docs/aksara/onboarding.md` §10). Subscribers tombstone on receipt; peer caches clear via §4's revocation pattern. Federated answers older than the takedown remain in the log (tamper-evidence requires it) but cannot be re-served. The AppView rejects responses whose provenance refs are in the tombstone set.

**Audit.** Every cross-Aksara retrieval emits {UCAN chain, request hash, response hash, timestamp} into the daily Merkle anchor. A Dewan can reconstruct "did Aksara X really see Y?" from public anchors.

## 10. The "openviking" question

Best-guess identification, ranked:

1. **OpenViking** (ByteDance) — confirmed. Filesystem-paradigm context DB for AI agents, dense + sparse + hybrid embeddings, hierarchical retrieval, ~13k stars early 2026 ([docs.openviking.ai](https://docs.openviking.ai/en/faq/faq); [MarkTechPost coverage](https://www.marktechpost.com/2026/03/15/meet-openviking-an-open-source-context-database-that-brings-filesystem-based-memory-and-retrieval-to-ai-agent-systems-like-openclaw/); [Red Hat guide](https://developers.redhat.com/articles/2026/04/23/deploy-openviking-openshift-ai-improve-ai-agent-memory)). **3/5.** Interesting hierarchical model that maps cleanly to "Aksara → Dusun → Citizen" addressing. Concerns: ByteDance origin, untested on ARM, our stack is already sufficient. Defer to 2027.
2. OpenVINO (Intel inference toolkit) — irrelevant.
3. OpenCog AtomSpace — academic, not deployable.
4. Oxigraph — covered in §3.
5. "ourkb" — no matching project found; likely transcription noise.

**Recommendation:** OpenViking is the candidate, scored 3/5, deferred until LightRAG's limitations actually bite.

---

## Recommendation summary

- **Build now:** per-Aksara local memory on SQLite + sqlite-vec + LightRAG + Ollama 3B + networkx PageRank. The PDS is the canonical source; SQLite is a derived index. Memori as the conversation layer.
- **Build in 6 months:** A2A v1.0 + UCAN federation between two pilot Aksaras with hand-edited routing. Provenance and revocation propagation. libsodium threshold-decrypt for sacred blobs.
- **Build in 24 months:** capability-vector routing per Federation-of-Agents; ETNOS AppView indexes Agent Cards; cross-Aksara semantic search gated by lexicon-level UCAN policy. Re-evaluate ActivityPods+NextGraph and RyuGraph at this point.
- **Skip / research-only:** HippoRAG 2 as-shipped, GraphRAG MSR, KAG, custom PIR, custom ActivityPub Search FEP, embedded chain, OpenViking until LightRAG limitations actually bite.

The seamless human+agent UX we're after is the kelurahan steward saying "tolong cari surat domisili untuk Bapak Yairus dari Dusun Walesi tahun lalu" and Hermes answering in a sentence — locally first, citing PDS records that are signed and re-verifiable. Cross-Aksara queries feel the same: the steward asks about a citizen's immunization, the puskesmas Aksara returns one cited paragraph in under two seconds, and a UCAN says it was allowed to. No "decrypt your wallet to query the KG" demo energy.

---

## Sources

Retrieval & memory frameworks:

- [HippoRAG 2 paper (arXiv:2502.14802)](https://arxiv.org/abs/2502.14802) · [HippoRAG 2 HTML](https://arxiv.org/html/2502.14802v1) · [Original HippoRAG (NeurIPS 2024)](https://arxiv.org/abs/2405.14831) · [OSU-NLP-Group/HippoRAG repo](https://github.com/OSU-NLP-Group/HippoRAG)
- [LightRAG repo (LarFii/LightRAG-hku)](https://github.com/LarFii/LightRAG-hku) · [LightRAG paper (arXiv:2410.05779)](https://arxiv.org/html/2410.05779v1) · [LightRAG tutorial DEV](https://dev.to/therabbithole/lightrag-tutorial-a-practical-guide-to-knowledge-graph-based-rag-4oa0)
- [Microsoft GraphRAG repo](https://github.com/microsoft/graphrag) · [GraphRAG production cost analysis 2026 (Paperclipped)](https://www.paperclipped.de/en/blog/graph-rag-production/) · [GraphRAG buyers guide 2026 (Tongbing)](https://medium.com/@tongbing00/graphrag-in-2026-a-practical-buyers-guide-to-knowledge-graph-augmented-rag-43e5e72d522d)
- [KAG paper (arXiv:2409.13731)](https://arxiv.org/pdf/2409.13731) · [OpenSPG repo](https://github.com/OpenSPG/openspg) · [Ant launches KAG (aibase)](https://www.aibase.com/news/11733)
- [Memori repo (GibsonAI)](https://github.com/GibsonAI/Memori) · [Memori announcement (MarkTechPost)](https://www.marktechpost.com/2025/09/08/gibsonai-releases-memori-an-open-source-sql-native-memory-engine-for-ai-agents/) · [Memori homepage](https://memori.gibsonai.com/)
- [Cognee homepage](https://www.cognee.ai/) · [Cognee + Memgraph blog](https://memgraph.com/blog/from-rag-to-graphs-cognee-ai-memory) · [Firecrawl: 15 best OSS RAG frameworks 2026](https://www.firecrawl.dev/blog/best-open-source-rag-frameworks)
- [OpenViking docs](https://docs.openviking.ai/en/faq/faq) · [OpenViking on MarkTechPost](https://www.marktechpost.com/2026/03/15/meet-openviking-an-open-source-context-database-that-brings-filesystem-based-memory-and-retrieval-to-ai-agent-systems-like-openclaw/) · [Red Hat OpenViking deploy guide](https://developers.redhat.com/articles/2026/04/23/deploy-openviking-openshift-ai-improve-ai-agent-memory)

Local stores & runtimes:

- [sqlite-vec via SQLite-Vector](https://www.sqlite.ai/sqlite-vector) · [How sqlite-vec works (Stephen Collins)](https://medium.com/@stephenc211/how-sqlite-vec-works-for-storing-and-querying-vector-embeddings-165adeeeceea) · [Embedded vector DB shootout 2026 (Shaharia)](https://shaharia.com/blog/choosing-embeddable-vector-database-go-application/)
- [LanceDB homepage](https://www.lancedb.com/) · [LanceDB review April 2026](https://www.dailyneuraldigest.com/tools-reviews/2026-04-16-lancedb-review/) · [LanceDB pricing 2026](https://costbench.com/software/vector-databases/lancedb/)
- [Kùzu archival + RyuGraph fork (gdotv blog)](https://gdotv.com/blog/kuzu-legacy-embedded-graph-database-landscape/) · [RyuGraph repo](https://github.com/predictable-labs/ryugraph)
- [Oxigraph repo](https://github.com/oxigraph/oxigraph) · [Oxigraph architecture wiki](https://github.com/oxigraph/oxigraph/wiki/Architecture)
- [Ollama on Pi 5 (Stratosphere Lab)](https://www.stratosphereips.org/blog/2025/6/5/how-well-do-llms-perform-on-a-raspberry-pi-5) · [9 LLMs on Pi 5 (itsfoss)](https://itsfoss.com/llms-for-raspberry-pi/) · [Ollama Pi 5 setup guide 2026 (ToolHalla)](https://toolhalla.ai/blog/run-llms-raspberry-pi-setup-guide-2026)
- [Hetzner CAX11 benchmarks (VPSBenchmarks)](https://www.vpsbenchmarks.com/hosters/hetzner/plans/cax11) · [cax11 spec (Sparecores)](https://sparecores.com/server/hcloud/cax11)

Federation, capabilities, agent discovery:

- [A2A v1.0 spec (a2a-protocol.org)](https://a2a-protocol.org/v0.2.6/specification/) · [A2A interoperability 2026 (Zylos)](https://zylos.ai/research/2026-03-26-agent-interoperability-protocols-mcp-a2a-acp-convergence) · [A2A 150 orgs adoption (Linux Foundation)](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year)
- [UCAN spec](https://github.com/ucan-wg/spec) · [UCAN delegation](https://github.com/ucan-wg/delegation) · [UCAN guide (Fission)](https://fission.codes/blog/a-guide-to-ucans/) · [Storacha UCAN concepts](https://docs.storacha.network/concepts/ucan/)
- [Federation of Agents (arXiv:2509.20175)](https://arxiv.org/abs/2509.20175) · [FoA on EmergentMind](https://www.emergentmind.com/topics/federation-of-agents-foa) · [AgentHub registry (arXiv:2510.03495)](https://arxiv.org/pdf/2510.03495)
- [FEP repo (Codeberg)](https://codeberg.org/fediverse/fep) · [FEP-6606 collections addressing](https://codeberg.org/fediverse/fep/pulls/452)

Privacy-preserving retrieval & threats:

- [Semantic PIR (Vithana et al.)](https://arxiv.org/pdf/2003.13667) · [PIR-RAG (arXiv:2509.21325)](https://arxiv.org/html/2509.21325) · [PIR tutorial 2026 (eprint:2026/1135)](https://eprint.iacr.org/2026/1135)
- [Federated RAG for IoT edge (MDPI 2026)](https://www.mdpi.com/2079-9292/15/7/1409)
- [Securing RAG taxonomy (arXiv:2604.08304)](https://arxiv.org/html/2604.08304v1) · [GraphRAG under Fire (arXiv:2501.14050)](https://arxiv.org/pdf/2501.14050) · [Knowledge poisoning RAG (arXiv:2507.08862)](https://arxiv.org/html/2507.08862v1) · [SDAG sparse attention defense (arXiv:2602.04711)](https://www.arxiv.org/pdf/2602.04711)

Internal:

- [`docs/research/unified-federation-protocol.md`](./unified-federation-protocol.md) · [`docs/research/sovereign-stack-architecture.md`](./sovereign-stack-architecture.md) · [`docs/aksara/onboarding.md`](../aksara/onboarding.md) · [`ETNOS_ROADMAP.md`](../../ETNOS_ROADMAP.md)
