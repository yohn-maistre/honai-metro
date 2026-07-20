# Aksara agentic infrastructure plan

Status: **DRAF, 2026-07-21**

This document supersedes the agent, memory, identity, and deployment portions
of `10_federation-wave-plan.md`. It is an implementation plan, not a claim that
the described system is already built. It must be reconciled into the canonical
Abstraksi proposal and decision ledger before any public architecture claim is
changed.

## 1. Decision in one page

There is no single mature protocol for an internet where humans, institutions,
tools, and autonomous agents can live together. The dependable shape is a
small composition of protocols with one Aksara policy boundary.

| Concern                          | Decision                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Public presence and conversation | ActivityPub through PieFed                                                                                  |
| Structured agent tasks           | A2A v1.0                                                                                                    |
| Tools, resources, and context    | MCP                                                                                                         |
| Capability description           | OASF v1, projected into A2A Agent Cards and human-readable profiles                                         |
| Human login                      | OIDC where available, with current PieFed tokens during the first deployment                                |
| Grants and delegation            | An internal grant contract built from stable OAuth/GNAP semantics; DAAP-compatible projection later         |
| Institutional attestation        | Signed HTTPS-hosted records first; W3C VC 2.0 for claims that genuinely have an issuer and verifier         |
| Coordination semantics           | Foundation Protocol vocabulary and event objects, without depending on its runtime                          |
| Durable memory                   | `aksara-mem`, separate from both ActivityPub and the reasoning runtime                                      |
| Deterministic action             | `aksara-cli` core, invoked by the agent harness and guarded by consent                                      |
| Discovery beyond one forum       | WebFinger and A2A well-known cards now; OASF directory adapter next; ANS alignment when its standard exists |

The narrow waist is **an Aksara envelope and receipt profile**, not a new
transport protocol. The same internal task, authority grant, memory reference,
approval, artifact, and receipt can be projected into ActivityPub, A2A, MCP,
the CLI, and future transports.

### The direct answers

1. **A2A is the right protocol for agent tasks.** It is not the whole agentic
   internet. It owns task lifecycle, messages, artifacts, streaming, discovery
   cards, and protocol extensions. It deliberately leaves identity policy,
   social life, durable memory, and real-world authority to other layers.
2. **Foundation Protocol is more foundational semantically.** Its graph of
   entities, sessions, activities, events, provenance, policy, and receipts is
   an excellent coordination model. Its reference implementation is still
   v0.1 with a very small history, so it is not an infrastructure dependency.
3. **DAAP captures the right authorization questions.** It is one individual
   IETF draft among many competing agent-authorization drafts. We align our
   grant fields with it while building on published OAuth/GNAP primitives.
4. **Memory stays outside the agent.** The harness receives a `MemoryPort`.
   `aksara-mem` owns durable records, provenance, access policy, promotion,
   revision, and forgetting. A compromised model must not rewrite institutional
   truth.
5. **`aksara-agent` should not be hard-wired to the Fediverse.** It is a
   runtime-neutral harness for accountable social and institutional agents.
   Its first and best-supported profile is `fediverse` because ETNOS is the
   first living network.
6. **Keep `aksara-cli`.** The repository and package name remain. The installed
   command should simply be `aksara`. Do not rename it to `aksara-ledger`:
   execution, validation, consent, integration, signing, and verification are
   broader than a ledger.

## 2. Product and package boundaries

One product surface can remain simple while the trust boundaries stay real.

| Name              | Job                                                                                    | Does not own                                                      |
| ----------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Aksara**        | Umbrella product and the `aksara` command                                              | A single fixed model runtime                                      |
| **aksara-cli**    | Deterministic core plus human and machine command surface                              | Open-ended reasoning                                              |
| **aksara-agent**  | Swappable reasoning harness, sessions, channels, task routing, policy requests         | Signing keys, formal document generation, canonical memory writes |
| **aksara-mem**    | File-first institutional memory, event log, projections, retrieval, promotion workflow | Public conversation or autonomous execution                       |
| **aksara-verify** | Independent verification of receipts, attestations, and signed outputs                 | Trust decisions on behalf of a community                          |
| **ETNOS**         | Human and agent public square on ActivityPub                                           | Private institutional memory                                      |

The CLI is the coherent front door:

```text
aksara agent init --profile fediverse
aksara agent serve
aksara forum listen
aksara memory search
aksara memory propose
aksara memory promote
aksara execute
aksara approve
aksara receipt verify
```

Internally, `aksara-cli` should expose a library API first. CLI, MCP, REST, and
A2A adapters call the same core. This preserves the existing proposal's rule
that one deterministic engine owns legally meaningful execution.

### Positioning of aksara-agent

The useful public framing is:

> Build capability-bearing agents that can participate in federated social and
> institutional networks, with explicit authority, durable memory boundaries,
> human approvals, and verifiable receipts.

That is more specific than a generic agent SDK and more durable than a
PyFedi-only bot framework. Official profiles can be shipped as extras:

```text
aksara-agent[fediverse]
aksara-agent[a2a]
aksara-agent[matrix]
aksara-agent[plakat]
```

The first release supports `fediverse` and local CLI operation. Other profiles
remain target rancangan until their adapters pass the same conformance suite.

## 3. One declaration, many projections

An agent author writes one `aksara.agent.yaml`. It declares only stable facts:

- identity and institutional owner;
- capabilities and input/output media types;
- tools and deterministic actions;
- channel adapters;
- memory scopes;
- approval and policy requirements;
- rate and cost limits;
- runtime compatibility, without embedding credentials;
- software version and attestation references.

The compiler validates that manifest against an OASF-aligned schema and emits:

1. an OASF record for directory publication;
2. an A2A Agent Card;
3. an ActivityPub `Service` actor extension;
4. MCP server and tool metadata;
5. a human-readable capability page;
6. an ANS-compatible record when that specification stabilizes.

OASF is the base capability vocabulary. Aksara adds a small extension module
for civic jurisdiction, institutional ownership, machine trust tier, CARE
policy references, approval classes, and receipt endpoints. Human users never
receive machine trust tiers.

## 4. The Aksara envelope

The internal envelope is the compatibility seam. It is not advertised as a new
internet protocol in v0.x.

```text
Envelope
  id                 globally unique event or task id
  entity             actor and institutional owner references
  intent             requested outcome in plain and structured form
  authority          grant id, purpose, audience, expiry, limits, parent grant
  task               state, context id, capability, inputs
  approvals          required, requested, granted, rejected
  memory_refs        immutable references, never copied private memory blobs
  artifacts          produced files or structured results
  policy_results     rule id, decision, reason code
  receipts           execution, delivery, and verification receipts
  provenance         source events, software versions, model disclosure
  time               observed, valid, recorded, executed
  signatures         detached or embedded proofs
```

Mappings:

- A2A carries the task, messages, artifacts, and state. An Aksara extension URI
  carries authority, approval, receipt, and memory-reference metadata.
- ActivityPub carries public speech and notifications. It may carry a receipt
  reference or public artifact, never private institutional memory.
- MCP exposes tools and memory resources to a permitted host.
- `aksara-cli` receives the validated execution subset.
- `aksara-mem` records events and approved memory mutations.
- Foundation Protocol names the entities, sessions, activities, events,
  provenance, policy checkpoints, and settlements represented by the envelope.

## 5. Protocol radar

### Adopt in the first implementation

| Protocol or model                 | Use                                                                   |
| --------------------------------- | --------------------------------------------------------------------- |
| ActivityPub and ActivityStreams   | Social actors, posts, replies, follows, communities, federation       |
| A2A v1.0                          | Task lifecycle, streaming, artifacts, signed Agent Cards, extensions  |
| MCP                               | Tools, resources, memory reads, deterministic action calls            |
| OASF v1                           | Canonical capability manifest and directory record                    |
| HTTPS, WebFinger, well-known URIs | Addressing and discovery on domains we control                        |
| OAuth 2.0/OIDC, RAR concepts      | Human login and structured authorization requests where supported     |
| JCS, JWS, HTTP Message Signatures | Canonicalization and proof of control                                 |
| W3C VC 2.0                        | Institutional claims and attestations with a real issuer and verifier |
| Markdown, JSONL, SQLite           | Human-readable truth, append-only events, rebuildable index           |

### Align without taking a runtime dependency

| Project                    | What we take                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------- |
| Foundation Protocol        | Entity, session, activity, event, policy, provenance, receipt vocabulary                |
| GNAP                       | Negotiated grants, client-instance keys, token management, continuation                 |
| DAAP                       | Human-to-agent grant fields, cascade revocation, delegation lineage, audit expectations |
| Roomy and Leaf             | Event sourcing and deliberate promotion from conversation into maintained documents     |
| ActivityPods and NextGraph | Future storage adapters for encrypted, local-first and user-controlled data             |

### Watch and build adapters only when justified

| Project                       | Trigger for adoption                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| Agent Name Service            | A published specification, running resolver ecosystem, and stable security model                  |
| AGNTCY Directory and SLIM     | Need for cross-network discovery or low-latency private agent transport beyond A2A over HTTPS     |
| ANP and DID:WBA               | Interoperability demand from deployed decentralized agents                                        |
| NANDA                         | Useful registry federation or sandbox conformance tests with independent operators                |
| AMP and Portable Agent Memory | Stable schemas, multiple independent implementations, and a clean mapping to Aksara policy labels |

### Do not make core dependencies

- Foundation Protocol's v0.1 Python runtime;
- a global proprietary agent registry;
- a mandatory DID method in v0.x;
- UCAN or any one experimental capability-token family;
- AT Protocol as a second required social backend;
- vector embeddings as the source of truth;
- ActivityPub as a memory database;
- automatic promotion of every conversation into institutional memory;
- a new Aksara transport protocol.

## 6. Identity, authority, and delegation

### Identity

Version 0 uses identifiers operators can understand and recover:

- an HTTPS origin controlled by the operator;
- an ActivityPub actor URI;
- an A2A Agent Card on the same origin;
- a per-agent-instance signing key;
- an explicit link to the institution actor that operates it.

This can later project into DID, ANS, AGNTCY, or NANDA records. A DID is an
optional alias until it solves a concrete interoperability problem. Domain
control alone is not proof that a capability claim is true, so institutional
claims are separately signed and evaluated by verifier policy.

### Authority grant

Every action-bearing grant has:

- principal and acting agent;
- institutional owner;
- permitted capability and tool;
- resource and audience;
- purpose binding;
- time window and revocation endpoint;
- cost, rate, and quantity bounds;
- whether delegation is allowed and its maximum depth;
- parent grant and full actor chain;
- required approval class;
- proof-of-possession key binding.

The first implementation can issue short-lived, sender-constrained tokens from
our own authority service. The `GrantPort` hides the token format. This lets us
start with practical OAuth-compatible infrastructure and later add GNAP, DAAP,
or AAuth profiles without changing agent code.

### Receipts

An agent's own narration is never sufficient evidence. Every consequential
step emits a receipt from the component that performed or observed it:

- the authority service signs grant and revocation receipts;
- `aksara-cli` signs validation and execution receipts;
- the destination adapter signs delivery acknowledgements when possible;
- `aksara-mem` signs promotion, supersession, and access events;
- `aksara-verify` checks the chain independently.

## 7. Memory is a governed institution, not a model feature

`aksara-agent` can remember a conversation in working context. It cannot write
canonical institutional memory directly.

### Memory layers

| Layer            | Contents                                                        | Lifetime                              | Writer                            |
| ---------------- | --------------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| Working context  | Current task messages and scratch state                         | Session                               | Agent runtime                     |
| Event journal    | Observed posts, actions, receipts, and source snapshots         | Append-only subject to privacy policy | Ingestion adapters                |
| Candidate memory | Extracted claims, proposed decisions, possible procedures       | Until reviewed or expired             | Agent may propose                 |
| Canonical memory | Approved facts, decisions, procedures, relationships, deadlines | Bi-temporal and supersedable          | `aksara-mem` through consent gate |
| Read models      | Summaries, timelines, search indexes, dashboards                | Rebuildable                           | Deterministic projector           |
| Public knowledge | Approved wiki pages, explainers, community documents            | Versioned publication                 | Human editorial workflow          |

### Promotion, not ingestion

The Roomy idea that a message can grow into a document is valuable, with one
Aksara correction: the transition is an explicit governed event.

```text
conversation or source
  -> observed event
  -> candidate claim or document
  -> provenance and policy checks
  -> named human or council approval when required
  -> canonical record
  -> deterministic projections
  -> later supersession, correction, or policy-bound forgetting
```

Nothing becomes institutional truth merely because an agent repeated it,
summarized it, embedded it, or received many likes. Every canonical record
carries source, valid time, record time, policy class, purpose, status, and the
promotion receipt. Corrections preserve history. Privacy erasure produces an
auditable tombstone without retaining prohibited content.

### Storage shape

The current D20 decision remains sound:

- Markdown and attachments are portable truth;
- JSONL is the append-only event journal;
- one SQLite sidecar provides FTS, relationships, and rebuildable projections;
- optional embeddings are an index over authorized material;
- encrypted blobs hold restricted attachments;
- storage adapters may later target ActivityPods or NextGraph.

MCP is the first read interface. Write operations are commands such as
`propose`, `promote`, `supersede`, and `forget`, each routed through
`aksara-cli` policy and approval gates.

## 8. The Grok-like forum experience, with civic boundaries

An Aksara agent can feel native to ETNOS without pretending to be human:

- it is an ActivityPub `Service` actor with visible institutional ownership;
- people can mention it in a thread;
- it replies in place and cites public sources or permitted memory references;
- long work becomes an A2A task whose status can be followed from the thread;
- consequential actions open a clear approval surface;
- the final reply links artifacts and a human-readable receipt;
- authorized users can promote an answer into a community document;
- capability, jurisdiction, model/runtime disclosure, and trust tier are visible;
- administrators can pause it, narrow its communities, or revoke grants.

First-release constraints:

- no unsolicited direct messages;
- no autonomous voting or consensus simulation;
- no posting outside designated communities;
- no legal or administrative output outside `aksara-cli`;
- no private-memory quotation into a public thread;
- strict rate, cost, and context limits;
- an honest refusal when authority or evidence is missing.

## 9. Upstream-friendly PieFed and Photon strategy

The first useful agent requires no PieFed fork. It uses a normal account,
existing API calls, and a sidecar service on our own instance. Backend changes
arrive only when they unlock generic federation value.

Order of work:

1. **External adapter first.** Listen and post through supported PieFed APIs.
2. **Generic extension points upstream.** Propose hooks for Service actors,
   actor metadata, OAuth/OIDC, and ActivityStreams extension preservation.
3. **Aksara package second.** Keep civic policy, tiers, and receipts outside
   PieFed core.
4. **Small patch queue only when necessary.** Store patches as independent,
   documented commits and test them against the pinned upstream revision.
5. **Weekly upstream compatibility CI.** Build and run federation contract tests
   against the latest upstream branch without automatically deploying it.

Photon remains a replaceable client. A thin ETNOS API adapter exposes stable
UI concepts such as agent profile, task status, approval request, receipt, and
memory-promotion action. The UI never imports a runtime-specific SDK.

## 10. Oracle Cloud deployment shape

The current OCI documentation for Always Free tenancies states a total ceiling
of 2 Ampere A1 OCPUs and 12 GB RAM across A1 instances. That is enough for the
forum and an initial low-traffic agent sidecar, but it is a beta host without an
SLA.

Target first topology on one ARM VM:

```text
Caddy or equivalent TLS edge
  forum service, pinned upstream PieFed image or revision
  PostgreSQL
  queue/cache services required by the pinned PieFed deployment
  aksara-agent sidecar
  aksara authority and receipt service
  aksara-mem service and local vault
  metrics, logs, backup jobs
```

Operational rules:

- no model training and no large local model on the forum VM;
- all containers have explicit CPU and memory limits;
- database, vault, and secrets have separate backup and restore tests;
- encrypted off-VM backups are mandatory before public beta;
- infrastructure is reproducible from versioned Terraform or OpenTofu plus
  Ansible or cloud-init;
- secrets remain outside Git;
- staging and production use separate domains and keys;
- federation is initially allowlisted while moderation and abuse controls are
  exercised;
- a paid migration path is documented before real institutions depend on it.

## 11. Implementation waves

Each wave ends with a demo, tests, and a stop/go gate. Later waves may be
resequenced as protocols mature.

### Wave 0: architecture freeze and conformance fixtures

Deliver:

- ADRs for package boundaries and protocol ownership;
- `aksara.agent.yaml` v0.1 schema aligned with OASF;
- Aksara envelope, grant, receipt, and memory-reference JSON Schemas;
- three golden fixtures: human question, public research answer, and
  consent-gated institutional action;
- projection tests for A2A Agent Card, OASF record, ActivityPub profile, and
  human capability page;
- threat model covering prompt injection, confused deputy, memory poisoning,
  replay, impersonation, delegation expansion, and private-to-public leakage.

Gate: every component can explain what it owns and reject fields outside its
authority.

### Wave 1: self-hosted ETNOS beta on Oracle Cloud

Deliver:

- reproducible OCI network and VM provisioning;
- pinned upstream PieFed deployment;
- ETNOS frontend pointed at the owned backend;
- TLS, mail, object storage, monitoring, encrypted backup, restore rehearsal;
- federation smoke test with two independent public instances;
- administrator runbook and incident rollback.

Gate: restore a fresh server from backup and federate a post in both directions.

### Wave 2: the `aksara` command and deterministic core

Deliver:

- installable `aksara-cli` package exposing the `aksara` binary;
- typed core library and adapter interfaces;
- manifest validation and projection commands;
- consent request, approval, execution, receipt, and verification flow using a
  harmless example tool;
- MCP surface over the same deterministic core.

Gate: the model cannot invoke the example action without a valid grant and
approval, and an independent verifier reproduces the receipt result.

### Wave 3: aksara-agent local and Fediverse profiles

Deliver:

- runtime-neutral agent loop with model adapter interface;
- PyFedi channel adapter for mentions, replies, edits, and rate limits;
- MCP tool client and `aksara-cli` execution client;
- visible Service-actor-like profile metadata on our instance;
- conversation-to-A2A-task bridge;
- public source citations and refusal behavior.

Gate: a person mentions the agent in ETNOS, receives a cited answer, and can
inspect the capability and provenance record without knowing developer tools.

### Wave 4: native ETNOS agent experience

Deliver:

- agent profile and capability card;
- task progress inside threads;
- approval inbox and expiry countdown;
- receipt viewer;
- pause, scope, and revoke controls;
- notification bell integration;
- moderation queues and per-community agent policy.

Gate: a non-technical tester can understand what the agent can do, what it did,
who authorized it, and how to stop it.

### Wave 5: Memori Aksara L0 and L1

Deliver:

- Markdown vault, JSONL events, SQLite index, deterministic projections;
- MCP read resources with purpose and scope checks;
- candidate, promote, supersede, retract, and forget commands;
- source snapshots and bitemporal records;
- thread-to-document promotion flow inspired by Roomy;
- poisoning and private-leak tests.

Gate: an agent proposes a memory from a thread, a human approves it, a second
agent retrieves the approved record with provenance, and a later correction
supersedes it without erasing history.

### Wave 6: A2A and delegated authority

Deliver:

- A2A v1 server and client adapters;
- Aksara A2A extension for grants, approvals, memory references, and receipts;
- short-lived proof-of-possession grants;
- revocation and single-level delegated task execution;
- GNAP/OAuth compatibility tests and a DAAP mapping document;
- cross-agent audit trace.

Gate: agent A delegates a bounded subtask to agent B, B cannot exceed the grant,
and revocation prevents the next action while preserving the trace.

### Wave 7: multi-instance institutional agents

Deliver:

- real ActivityPub `Service` actor support where upstream permits;
- institutional ownership attestations;
- federation of public outputs and receipt references;
- OASF directory publication and discovery;
- two-instance agent-to-agent and agent-to-human scenarios;
- upstream PRs for generic PieFed extension points.

Gate: a remote human can discover an agent, verify its operator and
capabilities, invoke a permitted task, and receive a verifiable artifact.

### Wave 8: sovereign and intermittent operation

Deliver:

- Plakat and local-node profile;
- queued ActivityPub and A2A delivery;
- conflict-safe memory proposals while offline;
- signed synchronization receipts;
- bandwidth-aware context and artifact transfer;
- optional NextGraph or ActivityPods storage adapter evaluated behind the
  existing `MemoryPort`.

Gate: the node completes permitted local work while disconnected and reconciles
without silent loss or authority expansion.

### Wave 9: open ecosystem and long-horizon coordination

Deliver as evidence and adoption justify it:

- public SDK, templates, conformance suite, and test network;
- ANS, AGNTCY, ANP, NANDA, or other discovery adapters;
- Foundation Protocol compatibility profile and upstream contributions;
- interoperable memory export if AMP or another memory standard reaches broad
  independent adoption;
- community-governed extension registry;
- Indonesian and Papuan institutional agent templates;
- third-party certified implementations under the Aksara trademark policy.

Gate: an independently built agent passes conformance without importing our
runtime and can interoperate while preserving its own model and storage choices.

## 12. Fast iteration discipline

The long horizon remains visible, while releases stay small:

- one vertical slice before a broad framework;
- one real human, one agent, one community, one harmless tool first;
- golden protocol fixtures committed before adapters;
- model runtimes remain swappable and version-pinned;
- every new protocol enters through a port and conformance test;
- every wave has an uninstall or rollback path;
- public claims describe only shipped behavior;
- quarterly protocol review decides whether watched projects crossed their
  adoption triggers.

The first public open-source milestone is not “the internet of agents.” It is:

> A person mentions an accountable agent in a federated forum, receives a
> sourced answer, explicitly authorizes a bounded action, and can independently
> verify the result and its memory consequences.

## 13. Risks and stop conditions

Stop or narrow a wave if:

- keeping current with PieFed requires a permanent invasive fork;
- agent authorization cannot be explained in one human-readable approval card;
- a model can directly mutate canonical memory or access signing keys;
- private data can enter public ActivityPub output without a deterministic
  policy violation;
- the Oracle host cannot restore reliably or sustain moderation workloads;
- a protocol adapter introduces more state than the capability it adds;
- agent activity degrades human discussion or creates synthetic consensus;
- an upstream protocol changes faster than our compatibility tests can absorb.

## 14. Immediate implementation order

1. Ratify the naming and package boundary in the Abstraksi decision ledger.
2. Build Wave 0 schemas and golden fixtures in the future `aksara-cli` or Aksara
   core repository, not inside the Photon frontend.
3. Provision the OCI staging host and deploy unmodified pinned PieFed.
4. Point a staging ETNOS client at it and test ordinary human federation.
5. Implement one read-only research agent through the external PyFedi adapter.
6. Add one harmless consent-gated deterministic tool.
7. Add memory proposal and human promotion only after receipts work.
8. Add A2A only after the local task model is stable enough to map cleanly.

This ordering puts the forum online quickly, proves the human experience, and
keeps future protocol choices open.

## 15. Primary references reviewed

- [A2A Protocol v1.0 specification](https://a2a-protocol.org/latest/specification/)
- [Foundation Protocol paper](https://arxiv.org/abs/2605.23218)
- [Foundation Protocol reference implementation](https://github.com/FoundationAgents/foundation-protocol)
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [ActivityPub W3C Recommendation](https://www.w3.org/TR/activitypub/)
- [ActivityPub authentication and authorization primer](https://www.w3.org/wiki/ActivityPub/Primer/Authentication_Authorization)
- [OASF and AGNTCY documentation](https://docs.agntcy.org/)
- [Agent Name Service announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-intent-to-launch-agent-name-service-to-establish-trusted-identity-infrastructure-for-ai-agents)
- [GNAP, RFC 9635](https://www.rfc-editor.org/rfc/rfc9635.html)
- [OAuth 2.0 Rich Authorization Requests, RFC 9396](https://www.rfc-editor.org/rfc/rfc9396.html)
- [OAuth 2.0 Token Exchange, RFC 8693](https://www.rfc-editor.org/rfc/rfc8693.html)
- [DAAP individual Internet-Draft](https://www.ietf.org/archive/id/draft-mishra-oauth-agent-grants-00.html)
- [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model/)
- [Roomy and Leaf event-sourcing architecture](https://blog.muni.town/leaf-0-3-the-server-behind-roomy/)
- [Roomy group-data design note](https://meri.leaflet.pub/3magaccpexs2x)
- [Agent Memory Protocol draft](https://agentmemoryprotocol.io/)
- [NextGraph local-first documentation](https://docs.nextgraph.org/en/local-first/)
- [OCI Free Tier documentation](https://docs.oracle.com/iaas/Content/FreeTier/freetier.htm)
