# Decentralized Agent Memory for Aksara

A skeptical pass at running HippoRAG-class memory per Aksara node and federating queries through UCAN-gated retrieval, June 2026.

> **Premise.** Each Aksara node — kelurahan, puskesmas, balai adat, BPP, sekolah — needs a local memory it owns, plus a way to *traverse* a peer's memory under scoped permission. The user named HippoRAG 2 as the candidate substrate and asked whether we can run it per-node and federate. This memo answers that, picks a stack, and stages it.

---

## TL;DR

**Yes — but not with HippoRAG 2, and not as "decentralized RAG" in the chain sense.** Build a per-Aksara memory now as **sqlite + sqlite-vec + LanceDB-optional + Ollama + a thin graph layer on top of Postgres** (no embedded graph DB yet), and federate queries over **A2A + UCAN-attached JSON-RPC**, not a custom protocol or PIR. HippoRAG 2 in its OSU-NLP form needs four H100s to index 10k documents in 4 hours ([HippoRAG 2 paper, arXiv:2502.14802](https://arxiv.org/html/2502.14802v1)) and depends on NV-Embed-v2 and vLLM; that is not deployable on a Hetzner CAX21 in Wamena. We keep HippoRAG's *idea* — passage + phrase nodes with personalized PageRank for multi-hop sense-making — and reimplement a 10%-of-the-paper version on top of LightRAG or Memori. **Now (alpha):** local-only per-Aksara retrieval. **6 months (beta):** A2A + UCAN federation between two pilot nodes, no PIR, no homomorphic anything. **24 months:** maybe ActivityPods quad-store integration if NextGraph ever ships; PIR stays research-only. The mystery word **"openviking"** is almost certainly **OpenViking** ([docs.openviking.ai](https://docs.openviking.ai/en/faq/faq); [MarkTechPost, March 2026](https://www.marktechpost.com/2026/03/15/meet-openviking-an-open-source-context-database-that-brings-filesystem-based-memory-and-retrieval-to-ai-agent-systems-like-openclaw/)) — ByteDance's filesystem-paradigm context DB. It's interesting, score 3/5, but ByteDance-origin and not battle-tested on ARM in 2026; defer.

---

## 1. HippoRAG 2 — what it actually is, and why we don't run it as-shipped

[HippoRAG 2 (Gutiérrez et al., Feb 2025; arXiv:2502.14802)](https://arxiv.org/abs/2502.14802) is "From RAG to Memory: Non-Parametric Continual Learning for LLMs". The core mechanic is a **dual-node knowledge graph** of passages and extracted phrases, traversed with **Personalized PageRank** seeded by a query's entity matches, then re-ranked by an LLM that filters triples. It claims +7 F1 over NV-Embed-v2 on associative (multi-hop) benchmarks and reduced token use vs GraphRAG ([HippoRAG 2 HTML](https://arxiv.org/html/2502.14802v1)).

**What the code actually requires.** The OSU-NLP-Group reference ([github.com/OSU-NLP-Group/HippoRAG](https://github.com/OSU-NLP-Group/HippoRAG)) is a research artifact: `torch==2.5.1`, `vllm==0.6.6.post1`, `nvidia/NV-Embed-v2` as the embedder, optional GritLM/Contriever, Llama-3.3-70B-Instruct for triple extraction and filtering. The paper's reported configuration: **4× H100 with tensor parallelism, ~4 hours to index 10k documents.** A kelurahan with five years of surat-domisili plus puskesmas immunization logs is comfortably 100k–500k records. Indexing on a CAX21 (4 vCPU ARM, 8 GB RAM) is not a 5× scaling problem; it is a wrong-substrate problem. Even swapping the 70B for a quantized 3B Qwen via Ollama (sweet spot on Pi 5: ~2-5 tok/s per [Stratosphere Lab](https://www.stratosphereips.org/blog/2025/6/5/how-well-do-llms-perform-on-a-raspberry-pi-5)) leaves the embedder dependency: NV-Embed-v2 is 7.85B parameters and ~16 GB FP16.

**What we keep from HippoRAG 2.** Three ideas, not the code:

1. **Passage + phrase dual nodes.** Don't embed only chunks; also embed extracted entities (citizen DID, dusun, dinas, hutan adat name) and connect them as graph nodes. This is what makes multi-hop "Has anyone in our Dewan recorded a kinship vouching for this person?" tractable without an LLM crawling the whole memory.
2. **Personalized PageRank seeded by query entities.** Cheap to compute on a small graph; `networkx` does it on a Pi.
3. **LLM-filtered triple extraction at ingest, not at query.** Pay the LLM cost once when a surat-domisili is filed, not every time someone asks about it. Use a Tier-2 cloud model (Anthropic, OpenAI, or a Telkomsel-hosted vLLM endpoint per OTSUS sovereignty rules) at ingest; query-time can be local.

**Verdict on HippoRAG 2.** Research-grade in 2026, not deployable as-shipped per-Aksara. **Score 2/5 for deployment, 5/5 as architecture vocabulary.** A peer 90%-functional alternative — **LightRAG** ([github.com/HKUDS/LightRAG](https://github.com/LarFii/LightRAG-hku), EMNLP 2025; [LightRAG paper](https://arxiv.org/html/2410.05779v1)) — has 34k+ stars, runs against external LLMs (no GPU required), supports Postgres/Neo4j/SQLite/Faiss backends, and shipped role-specific LLM configs in May 2026 (cheap extractor, smarter query model). LightRAG is what we actually ship.

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

**The mix that ships.** LightRAG for the document-rooted KG (surat-domisili, ceremony logs, immunization records). Memori for conversation memory (the steward asked Hermes X yesterday; remember it). Cognee revisited at the 12-month mark only if LightRAG's adat KG ceremony modeling proves too lossy.

## 3. The local Aksara stack

Each Aksara node has the same skeleton; institution class only changes the lexicons and the BSrE sidecar.

```
┌────────────────────── Aksara node (one process tree) ──────────────────────┐
│                                                                            │
│  Hermes harness ──── MCP ──── local skill server                           │
│       │                          │                                         │
│       ▼                          ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ SQLite primary (records, audit log, capability cache)           │     │
│  │   ├── sqlite-vec extension (passage + phrase embeddings)        │     │
│  │   └── networkx-on-disk for the small PageRank graph             │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│       │                                                                    │
│       ▼                                                                    │
│  Ollama (Qwen2.5 3B, gemma3:4b, or a remote Telkomsel vLLM endpoint)      │
│       │                                                                    │
│       ▼                                                                    │
│  LightRAG orchestrator (custom Python: ingest pipeline + retrieval)       │
│       │                                                                    │
│       ▼                                                                    │
│  libsodium sealed-box sidecar (sacred-tagged ciphertext + Dewan threshold) │
│       │                                                                    │
│       ▼                                                                    │
│  A2A endpoint (JSON-RPC over HTTPS) + UCAN verifier                       │
└────────────────────────────────────────────────────────────────────────────┘
```

**Component picks, with rationale.**

- **Primary store: SQLite.** Boring, file-on-disk, no daemon, no migration story. Per [sqlite-vec docs](https://www.sqlite.ai/sqlite-vector) and a Feb-2026 production case (6,500 agent queries in six weeks, no incident), sqlite-vec is production-ready on edge. Use SIMD for ARM (NEON).
- **Vector store: sqlite-vec, not LanceDB at v1.** LanceDB ([lancedb.com](https://www.lancedb.com/)) graduated SDKs to 1.0 in early 2026 and is great, but it is a second moving part. sqlite-vec keeps everything in one file. Switch to LanceDB only if vector count crosses ~5M per Aksara (very unlikely for a kelurahan in five years).
- **Graph layer: do NOT pick an embedded graph DB yet.** Kùzu, the obvious pick, was **archived in October 2025**; the active fork is **RyuGraph** ([github.com/predictable-labs/ryugraph](https://github.com/predictable-labs/ryugraph)) and we are not betting an Aksara node on a one-month-old fork. Oxigraph ([github.com/oxigraph/oxigraph](https://github.com/oxigraph/oxigraph)) is in "heavy development" with un-optimized SPARQL evaluation per its own README — fine for a quad-store sidecar, not as the primary. **Use `networkx` (in-memory Python) loaded from SQLite tables.** A kelurahan KG of 100k entities × 10 relations is ~1 GB in memory at most. PageRank converges in seconds.
- **LLM runtime: Ollama, with llama.cpp as fallback.** Ollama is the easier ops story; llama.cpp is 10–20% faster ([itsfoss.com benchmarks](https://itsfoss.com/llms-for-raspberry-pi/)) and worth swapping if perf bites. **Don't promise on-device generation.** Qwen2.5:3B and Gemma3:4b run at 2–5 tok/s on a Pi 5 8 GB; usable for batch extraction but painful for interactive Q&A. The realistic story: **a Tier-3 hub Aksara at the kabupaten level runs the LLM** (CAX31 with 16 GB and a Telkomsel-hosted vLLM behind it for heavier work), and kelurahan-class nodes call up.
- **Document store: SQLite blob for <1 MB attachments; filesystem with hash addressing for larger.** No S3 dependency in alpha.
- **Retrieval orchestrator: LightRAG.** With our own ingest tweaks: phrase node extraction uses a Tier-2 cloud model paid once per document; query-time uses the local Ollama.

**Device profile.** The honest answer:

| Tier | Hardware | Role |
|---|---|---|
| **Edge** | Pi 5 8 GB or local laptop | Cache + ingest only. Forwards Q&A to its kabupaten hub. Works offline-deferred. |
| **Aksara (default)** | Hetzner CAX21 (4 vCPU ARM, 8 GB, 80 GB SSD; ~€7/mo) | Primary deployment: SQLite + sqlite-vec + Ollama (3B model) + A2A endpoint |
| **Hub** | CAX31 / CAX41 (8-16 GB) | Bigger Ollama, vLLM for heavier batch ingest, federated query aggregator for child kelurahans |

A Pi 5 only as primary substrate is a romantic story that costs us reliability. **Recommend CAX21 as the default Aksara device.** Pi 5 with SSD is the *offline-edge* node, syncing nightly to a kabupaten hub.

## 4. Federated retrieval — the hard part, plus what to actually ship

The user lists four query shapes. Each is a different protocol problem.

| Query | Routing | Permission | Privacy |
|---|---|---|---|
| Citizen X's immunization | A→B direct (Aksara A knows X's home puskesmas via the DID Document `service` chain) | UCAN scoped to `subject=DID(X)`, `relation=read:immunization` | Standard TLS + signed result; no PIR needed |
| Dewan kinship vouch | A→{B,C,…} fan-out within a Dewan-scoped peer set | UCAN issued by Dewan, scoped to `dewan=...`, M-of-N witness | Standard TLS |
| Public Dinas Kesehatan publication | A→Dinas (public) | None — public lexicon record | None |
| Cross-Aksara semantic search for "hutan adat Asmat" | A→peer set, semantic match | UCAN per peer that opted into the search index | Hard. Punt to public-only in v1 |

**Routing — what works in 2026.** We do **not** broadcast. Two complementary patterns:

1. **Capability registry per ETNOS instance.** Each Aksara publishes an *A2A Agent Card* listing its lexicons, scopes, and a sentence-level capability description. The ETNOS AppView indexes these into a small HNSW vector index. Aksara A asks the AppView "who serves immunization for citizens born in Mimika?" and gets a ranked list of peer DIDs. This is the *Federation of Agents* pattern ([arXiv:2509.20175](https://arxiv.org/abs/2509.20175)) with Versioned Capability Vectors over A2A Agent Cards — a perfect fit because it composes natively with the A2A spec we already adopted in `unified-federation-protocol.md`.
2. **DID Document service entries for canonical routing.** A citizen's DID has a `service` entry of type `PrimaryPuskesmas` pointing at the puskesmas DID. For "what is X's immunization?", we resolve X's DID and route to the named puskesmas — no semantic search needed. Use semantic only when the directed-graph answer is empty.

**Transport — A2A v1.0 over JSON-RPC, UCAN in headers.** A2A reached v1.0 in 2026 under the Linux Foundation ([a2a-protocol.org spec](https://a2a-protocol.org/v0.2.6/specification/)) with stable Agent Cards, Tasks, and JSON-RPC bindings. Our retrieval request is *one A2A Task* with a typed `query/retrieve` payload. The UCAN rides in an `Authorization: Bearer ucan:...` header; the receiving Aksara verifies the chain locally (no callback to an authority), evaluates over its memory, and returns a typed `RetrievalResponse` with provenance refs (PDS record URIs from `unified-federation-protocol.md` §8).

**Permission gating.** UCAN attenuates across hops, which lets a Dewan grant a 30-day read scope to a researcher's agent and the researcher's agent further attenuate it when calling subordinate Aksaras ([UCAN delegation spec](https://github.com/ucan-wg/delegation)). The Aksara responder runs four checks: caller DID matches `aud`, UCAN chain validates to a known issuer, scope covers the request, expiry not passed. If the requested content is sacred-tagged, an additional libsodium sealed-box decrypt step against the Dewan threshold key gates the read.

**Privacy-preserving retrieval — not in v1.** PIR is real and improving fast. PIR-RAG ([arXiv:2509.21325](https://arxiv.org/html/2509.21325)) shows a cluster-and-fetch architecture using lattice-based PIR and coarse semantic clustering; semantic PIR has a clean information-theoretic formulation ([Wang et al.](https://arxiv.org/pdf/2003.13667)). Bandwidth and CPU cost are still 10×–1000× a TLS GET for the same answer at province scale. **For Papua in 2026, the right answer to "do you have records about Y" is "the caller had to present a UCAN scoped to Y to ask; we trust the UCAN; we answer."** PIR returns to the table when we have an adversary model that says "another Aksara is curious enough to inspect query patterns over time," which is post-2027 territory.

**Result merging.** Aksara A receives `RetrievalResponse` from peers B, C, D — each with passages, attribution (peer DID), the lexicon record URI, a confidence score, and a UCAN-proof-of-authority. A reranks: (1) provenance weight (Aksara-class tier first — pemerintah > adat for civic facts, adat > pemerintah for cultural facts), (2) cosine similarity to the original query, (3) recency. Citation is mandatory: every fact in the synthesized answer carries the source Aksara's DID + record URI. **No fact without a citable peer URI.**

**Caching.** A UCAN's `expiry` claim is the cache TTL. Aksara A may cache peer answers in a `peer_cache` table indexed by `(query_hash, peer_did, ucan_cid)`. Revocation: when the peer publishes a `revoke` record in its PDS, A's nightly subscriber clears matching cache rows. This is the same revocation pattern as `unified-federation-protocol.md` §6.

## 5. Composition with the chosen federation substrate

`unified-federation-protocol.md` committed us to PieFed (forum) + atproto PDS (per-actor memory) + A2A + UCAN. The decentralized-memory layer slots in cleanly:

- **The PDS *is* part of the local memory.** Typed records under `id.papua.*` lexicons are the canonical, signed, hash-addressed primary content. The Aksara node's SQLite is a **derived index** of its own PDS — re-buildable from the firehose of its PDS at any time. This is structurally analogous to a Bluesky AppView except it is per-Aksara.
- **A2A is the retrieval transport.** Federated `query/retrieve` is one Task type. Federated `ingest/notify` (peer pushes a relevant record to A's index) is another.
- **ActivityPub `Search` is NOT a real thing in 2026.** There is no FEP for federated semantic search; FEP-6606 (collections addressing) is the closest in spirit and is unrelated. We do **not** invent FEP-search; we use A2A.
- **ActivityPods quad-store: defer.** When NextGraph self-hostable broker actually ships (still mid-late 2026 target per `sovereign-stack-architecture.md` §1; tracked monthly), we re-evaluate whether an Aksara's SQLite-derived KG should be re-projected into a SPARQL-queryable quad-store for cross-Aksara analytics. Not in v1.
- **NextGraph CRDTs as offline-first: also defer.** Our offline-first story for kelurahan in 3T areas is "ingest queue on the Pi 5, sync to CAX21 when bandwidth allows." That is an SQLite WAL plus a sync daemon, not a CRDT engine.

## 6. Readiness scorecard

| Piece | Prod-ready 2026? | CPU-only Aksara? | Maintenance | Pilot now / 2027 / skip |
|---|---|---|---|---|
| LightRAG | Yes | Yes (remote LLM) | Low | **Now** |
| Memori | Yes | Yes (SQL-native) | Low | **Now** |
| sqlite-vec | Yes | Yes (NEON SIMD) | Low | **Now** |
| Ollama 3B-class | Yes | Marginal interactive, fine batch | Low | **Now** for batch ingest |
| networkx PageRank | Yes | Yes | Low | **Now** |
| A2A v1.0 | Yes | Yes (JSON-RPC) | Low | **Now** |
| UCAN delegation | Yes (spec stable, libs maturing) | Yes | Medium | **Now** |
| libsodium sealed-box | Yes | Yes | Low | **Now** |
| Capability-vector routing | Yes (FoA pattern) | Yes | Medium | 2026 H2 |
| HippoRAG 2 as-shipped | No (GPU) | No | High | **Skip** |
| GraphRAG MSR | Yes | No (cost) | Medium | **Skip** |
| KAG / OpenSPG | Yes (JVM) | No | High | **Skip** |
| Kùzu | Archived | n/a | n/a | **Skip** |
| RyuGraph | New | Maybe | Unknown | **2027** revisit |
| Oxigraph | Beta | Yes | Medium | 2027 quad-store sidecar |
| OpenViking | Yes (Docker) | Untested ARM | Medium | **2027** if useful |
| Cognee | Yes (Docker) | Yes | Medium | 2027 KG-heavy revisit |
| PIR / FHE retrieval | Research | No | Very high | **Research-only** |
| ActivityPub Search FEP | Doesn't exist | n/a | n/a | **Skip** |

## 7. Phased plan

**Now → end of 2026 (alpha).** Local-only per-Aksara RAG. No federation. The pilot kelurahan from `unified-federation-protocol.md` §10 gets a CAX21 running:
1. PieFed already federates content.
2. New: a SQLite + sqlite-vec + LightRAG memory bound to the kelurahan's PDS, ingesting every typed record into the index.
3. A Hermes skill `aksara.memory.search(query)` calls LightRAG locally.
4. The "demo" is: a steward says "show me last month's surat-domisili for warga turun-temurun Dani"; Hermes answers with cited records from the local index alone. No peer queries.

**End-2026 → mid-2027 (beta).** Two Aksara nodes federate. Pilot kelurahan + pilot puskesmas. Both expose an A2A endpoint. Kelurahan asks puskesmas about immunization for a citizen X; UCAN issued by the kelurahan's steward against the kelurahan's own DID, scoped to `read:immunization` for `subject=DID(X)`, valid 7 days. Puskesmas verifies, evaluates over its memory, returns results with provenance. This is the smallest defensible federated-memory demo we can claim. A2A Agent Cards are published, but no semantic capability-vector routing yet — routing is by hand-edited registry.

**Mid-2027 → end-2028.** Multi-Aksara federation:
- ETNOS AppView ingests Agent Cards and builds the HNSW capability-vector index per Federation-of-Agents.
- Cross-Aksara semantic search ships, gated by a coarse public-only label by default; sacred and sealed lexicons require pre-issued UCANs from the respective Dewan or institution.
- Cognee or LightRAG-with-quad-projection re-evaluated for adat KG modeling that's richer than triple extraction.
- ActivityPods + NextGraph re-evaluated *only if* the NextGraph broker actually self-hosts and Pod ACLs in NextGraph clearly subsume our UCAN+sealed-box story.
- PIR remains research-only. We may publish a short prototype paper for a research grant track, not ship to production.

## 8. What we'd be inventing (be honest)

1. **`aksara.memory` MCP skill.** No off-the-shelf MCP skill that wraps LightRAG with our lexicon + UCAN gating. Three engineer-weeks.
2. **A2A retrieval Task type.** A2A v1.0 is generic; the typed `RetrievalRequest`/`RetrievalResponse` payload with provenance refs and UCAN binding is ours to define. Two weeks.
3. **Capability Agent Card schema.** A2A Agent Cards exist; the *content* — lexicon list, region scope, capability sentence for HNSW embedding — is ours. Two weeks.
4. **UCAN verifier integrated with Hermes.** Libraries exist for JS and TS ([ucan-wg/ts-ucan](https://github.com/ucan-wg/ts-ucan)) and a few for Rust; **Python parity is patchy**. Either write a small Python verifier or use the Rust binding. Three weeks.
5. **libsodium threshold-decrypt for sacred blobs.** `unified-federation-protocol.md` already commits to this; remind the team it is three engineer-weeks of work, not three days.
6. **AppView capability-vector index.** Federation-of-Agents pattern in our AppView, indexing Aksara Agent Cards by their capability sentence with HNSW. Four weeks.
7. **Peer-cache + revocation propagation.** Cache table, nightly PDS firehose subscriber to clear revoked entries. Two weeks.

**Total greenfield effort for the federated v1 (beta milestone):** ~16 engineer-weeks. Plausible for two engineers in one quarter on top of the existing roadmap.

## 9. Adversarial and governance

**Threat model.** Minimum: a *curious Aksara operator* — the steward of a peer node who, given access, would read more than they're supposed to. Realistic medium-term: a *malicious Aksara* — a node that lies in its responses to defame an individual or community. Out-of-scope for v1: *state-level adversary* compromising a node's keys end-to-end.

**Defenses we ship.**

- **No fact without provenance.** Every synthesized answer cites peer DID + record URI. Lies become attributable.
- **Per-peer trust weighting.** The reranker downweights answers from a peer with prior dispute records. Adat answers weighted higher in adat domain, pemerintah higher in civic.
- **UCAN scoping minimizes exposure.** No "read everything" capability is issuable; the issuer must specify subject + relation + expiry. The default expiry is 7 days.
- **All retrievals are logged.** Both ends log: requester DID, UCAN CID, scope, response hash, timestamp. Logs are append-only and Merkle-anchored daily per `sovereign-stack-architecture.md`. A peer claiming "you never asked us that" can be refuted by the log.

**KG poisoning.** Recent research is unambiguous: five malicious passages can drive 90% attack success on RAG KGs ([Securing RAG taxonomy, arXiv:2604.08304](https://arxiv.org/html/2604.08304v1); [GraphRAG under Fire, arXiv:2501.14050](https://arxiv.org/pdf/2501.14050)). Our defenses in priority order: **(1)** ingest only from signed PDS records of known Aksaras — no scraping the open web at v1; **(2)** sacred and civic-action lexicons require BSrE or Dewan threshold-co-signatures at ingest, so triples are signed-in; **(3)** sparse-attention pattern (SDAG) for the synthesizer call to prevent cross-document collusion at query time; **(4)** monthly red-team script that injects known-poisoned triples into a staging Aksara and validates the reranker downweights them.

**Takedown propagation.** A CARE-labeled takedown is a new signed event in the issuing Aksara's PDS (per `docs/aksara/onboarding.md` §10). Subscribers tombstone the original record on receipt. Peer caches expire via the revocation pattern in §4. **Federated answers older than the takedown remain in the log** — tamper-evidence requires it — but cannot be re-served. New synthesis queries must not surface tombstoned content; the AppView rejects responses whose provenance refs are in the tombstone set.

**Audit story.** Every cross-Aksara retrieval generates a triple of artifacts: the UCAN chain, the request hash, the response hash. These three plus timestamps go into the daily Merkle anchor. A Dewan can audit "did Aksara X really see Y?" by reconstructing the chain from public anchors.

## 10. The "openviking" question

Best-guess identification of the user's mangled term, ranked:

1. **OpenViking** (ByteDance) — confirmed. "Filesystem-paradigm context DB for AI agents." Dense + sparse + hybrid embeddings, hierarchical retrieval, ~13k stars in early 2026 ([MarkTechPost coverage](https://www.marktechpost.com/2026/03/15/meet-openviking-an-open-source-context-database-that-brings-filesystem-based-memory-and-retrieval-to-ai-agent-systems-like-openclaw/); [docs.openviking.ai](https://docs.openviking.ai/en/faq/faq); [Red Hat deployment guide](https://developers.redhat.com/articles/2026/04/23/deploy-openviking-openshift-ai-improve-ai-agent-memory)). **Score 3/5.** Interesting hierarchical model that maps well to "Aksara → Dusun → Citizen" addressing. **Concern:** ByteDance origin, untested on ARM, and we already have a sufficient stack. Defer to 2027.
2. **OpenVINO** (Intel) — irrelevant. Inference toolkit, not memory.
3. **OpenCog AtomSpace** — academic, not deployable per-node in 2026.
4. **Oxigraph** — covered in §3.
5. **ourkb** — no project with this name found; likely transcription artifact.

**Recommendation on the term:** treat OpenViking as the candidate, score 3/5, defer until LightRAG's limitations actually bite (probably 2027).

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
