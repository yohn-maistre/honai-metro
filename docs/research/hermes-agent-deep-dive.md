# Hermes Agent — a deep technical pass for Aksara

> Opinionated read of [Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research, MIT-licensed) as Aksara's planner-executor backbone. Named in [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2, [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §12, and [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §3. This memo answers "is the named choice the right choice, and where do we own the upstream/downstream line?"
>
> **Version posture.** As of the date of writing, Hermes Agent ships continuously on a roughly weekly minor-release cadence. This memo avoids version pins on purpose — we describe the shape, not a snapshot.

Status: **v0.1 — first deep-dive**. Owner: ETNOS core. Last revision: 2026-06-08.

---

## TL;DR

**Adopt Hermes Agent as Aksara's runtime backbone. Keep aksara-cli as the deterministic executor. Skin heavily. Contribute three things upstream.** The runtime is a real, MIT-licensed, batteries-included Python agent harness — provider-agnostic, MCP-native, persistent by default, sandboxed by configuration, multi-profile by design. It gives us most of the wiring we'd otherwise build, leaves the parts that carry Indonesian civic weight (BSrE, e-meterai, audit emission, personas, federation surface) firmly on our side, and has an MIT license that composes cleanly with our AGPL-3.0 ETNOS frontend. Fit is good in the load-bearing parts (reasoning ⊥ execution, provider abstraction, MCP, OpenViking out of the box); the gaps are well-shaped glue (`did:wba`, ActivityPub actor, Presidio-routing, persona model). The skinning surface is wide and public — the single biggest reason to pick Hermes over the alternatives.

---

## 1. What Hermes Agent actually is

A long-running, self-improving agent process by Nous Research. Python (a `run_agent.py` orchestrator plus a wide plugin tree), MIT-licensed, one-shot installer (`curl … | bash` on Linux/macOS/WSL2/Termux; PowerShell on Windows bundling its own Python). Framing: "the agent that grows with you" — start it once, leave it running; it accumulates memory, skills, scheduled tasks, gateway connections.

The runtime is **distinct from the Hermes-3 open-weights language model series** also from Nous Research. The agent is a harness; the models are a separate artifact and license. [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §3 already corrects this slip — treat the distinction as load-bearing in reviewer-facing docs.

### 1.1 Harness architecture — the nine pieces

The clearest external write-up is [Arize's "How Hermes implements an open-source agent harness"](https://arize.com/blog/how-hermes-implements-open-source-agent-harness-architecture/), which identifies a nine-piece model Hermes implements end-to-end:

1. **Provider adapters** normalize protocols (Anthropic Messages, OpenAI chat-completions, Responses API for reasoning models, Bedrock Converse) behind `ProviderTransport` classes. OpenAI-compatible providers are a config edit; native protocols are a new adapter file plus `api_mode` dispatch.
2. **Tool registration distinct from tool exposure.** Tools self-register at import time into a central registry (≈70 tools, ≈28 toolsets); the model sees a filtered, prefixed slice. MCP servers register with `mcp_{server}_{tool}` prefixes; per-server filtering is first-class.
3. **Session model as durable infrastructure.** SQLite (`~/.hermes/state.db`) with FTS5 + WAL, per-platform isolation, source tags, gateway routing metadata, parent/child lineage pointers.
4. **Compression as lineage, not amnesia.** When context approaches threshold, an auxiliary model summarizes a middle window; head (system + first three turns) and a token-budget-protected tail remain raw. The summary is *updated* on later compressions, not regenerated. Current session row closes, child session opens seeded by the summary, `parent_session_id` records the chain. This is the audit-trail property Aksara needs — you can walk back the lineage of any decision.
5. **Prompt caching** via Anthropic prefix-cache breakpoints (system + last three non-system messages), configurable TTL.
6. **Skill system** — procedural memory as durable files in the profile, compatible with `agentskills.io`, with optional autonomous skill creation. Skills wrap tools; tools wrap external CLIs/APIs.
7. **Hook system** — plugins intercept the loop at well-defined points (turn start/end, tool call, compression).
8. **Gateway** — multi-platform router (Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI) feeding a unified session router with user auth and DM-pairing.
9. **Cron + subagents** — built-in scheduler in-process, plus spawnable subagents.

All nine are public extension points. We don't fork to add what Aksara needs — we write hooks, plugins, skills.

### 1.2 Persistent memory — default and plugins

Default: **SQLite + FTS5** plus two Markdown files, `MEMORY.md` (agent's notes) and `USER.md` (operator profile). Always on, no config, offline. On top: **one** external memory provider at a time (single-select enforced). Providers ship as plugins: Honcho, Mem0, OpenViking, Holographic, Hindsight, RetainDB, ByteRover, Supermemory, Memori. New providers no longer land in core.

Three matter for Aksara: **Holographic** (SQLite-only, zero deps, runs on the Pi) as the offline backstop; **OpenViking** (Volcengine/ByteDance, hierarchical filesystem-paradigm DB, L0/L1/L2 tiered loading, `viking://` URIs) as the substrate the founder named in [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2; **Hindsight** (Postgres-backed KG) as fallback if LightRAG adat KG modeling proves lossy.

Critically, the default SQLite+FTS5 always runs **alongside** the active external provider. That gives us OpenViking-as-hierarchical-store + SQLite-as-derived-index for free — the exact shape [`decentralized-agent-memory.md`](./decentralized-agent-memory.md) §3 specifies. LightRAG plugs in cleaner as an MCP server than as a custom memory provider.

### 1.3 MCP — client and server

Hermes speaks MCP natively. As a **client** it discovers configured servers at startup in parallel, registers tools under a prefix, supports per-server filtering, handles `notifications/tools/list_changed` for live updates without reload, wraps both local-stdio and remote-HTTP servers. As a **server** it exposes its own sessions and skill catalog to peer clients.

Biggest unlock for Aksara. The peer-Aksara, peer-agent, and ETNOS-UI surfaces from [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2 all consume an MCP endpoint — Hermes gives us that endpoint without writing it. The aksara-cli Go binary already exposes an MCP server per proposal §13; Hermes consumes it as a peer client and surfaces its tools to the model alongside the 70-odd built-ins.

### 1.4 Sandboxing and command approval

Seven **terminal backends** isolate command execution: `local`, `docker`, `ssh`, `singularity`, `modal`, `daytona`, Vercel Sandbox. Container backends *replace* the dangerous-command approval prompt — the container is the boundary. For non-containerized environments, a hardcoded blocklist refuses catastrophic commands; everything above threshold pops a fail-closed approval prompt. On pemerintah Aksara nodes we default to `local` (single-tenant, Docker overhead on the Pi is real) and route civic-action work through aksara-cli's typed-tool boundary, not the shell.

### 1.5 Profiles — multi-tenant per process

A **profile** is a fully independent agent instance — own `config.yaml`, `.env`, `SOUL.md`, memory store, sessions, skills, cron jobs, gateway state. Profile A cannot read profile B's memory. Catch: profiles do not isolate the filesystem on `local` — real multi-tenancy needs a containerized backend per profile.

For Aksara: **one node = one Hermes process = one profile**. The proposal §11 personas on one node are role-bound skill registries inside the *same* profile, sharing institutional memory and identity. [`docs/aksara/architecture.md`](./../aksara/architecture.md) §10 closes with that.

### 1.6 What it is not

Not a coding agent in the Aider/Continue sense, though heavily used for coding (the 40+ built-ins span web search, image gen, file I/O, scheduling, calendar, browser automation). Not Hermes-3 (distinct project, distinct license). Not LangGraph / CrewAI / AutoGen / smolagents / LlamaIndex Agents — those are *libraries* you write a workflow against; Hermes is a *runtime* you talk to. Closest analog: Goose (Block) or a hypothetical OSS Claude Code daemon. Not Aider (git-aware coding pair) or Continue (IDE-embedded) — Hermes is server-side first. Not Pi (Armin Ronacher's single-file minimal substrate) — Hermes is the opposite, batteries-included with gateway, scheduler, plugin tree. [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §12's "Pi not blocked but not first-class" framing stands.

---

## 2. Production deployment

**Self-host.** Supported shapes: (a) `curl … | bash` + systemd; (b) official Docker image with mounted `~/.hermes`; (c) `docker compose` with Hermes + sandbox + memory containers; (d) Kubernetes (Red Hat published an OpenShift AI + vLLM guide). For the Orange Pi 5, (a) on hardened Debian is the default — Docker overhead on the Pi is real, the device is single-tenant. We trade the container boundary for headroom and lean on aksara-cli plus the runtime's command blocklist.

**Footprint.** Idle with cloud LLM: **2 GB RAM / 1 vCPU**. Production-comfortable: **2 vCPU / 4–8 GB**. Local inference adds whatever the model needs (Gemma 4 E4B via llama.cpp baseline). SQLite state + OpenViking server fit in **<20 GB disk** at kelurahan scale. The Pi at 8–16 GB sits comfortably above the floor.

**Persistence.** SQLite (`state.db`, FTS5 + WAL). Memory plugins bring their own backings — OpenViking ships its own server, Hindsight uses Postgres. No Postgres / Redis / S3 in the default path. File-on-disk, no daemon, restorable from snapshots.

**Observability.** Every tool call is observable via callbacks. Sessions queryable from SQLite directly. Compression lineage walkable from `parent_session_id`. Web dashboard surfaces sessions / config / live monitoring; MCP-server mode exposes agent state to peer clients; Kanban view manages fleets. None is an Indonesia-regulatory audit substrate — for that we wire Merkle anchor emission per [`docs/aksara/architecture.md`](./../aksara/architecture.md) §1 — but they debug a deployed kelurahan fine.

**License.** Hermes is **MIT**, ETNOS is **AGPL-3.0-only** (Photon fork). MIT into AGPL is the boring, safe direction. No obligation to relicense aksara-cli or our Hermes plugins. Upstream contributions go out under MIT; Aksara-owned plugins ship under Apache 2.0 or MIT.

**Unit.** One Hermes process per Aksara node — kelurahan, puskesmas, balai adat — as a long-lived systemd service. Profiles inside the process are role personas, not separate nodes. Matches "one DID per node" per [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §3.

---

## 3. Aksara-specific fit

**`did:wba` binding.** The runtime has no native DID concept — profiles and API keys. We bind a Hermes process to an `aksara:AksaraNode` ActivityPub actor via a small plugin: load the HSM-stored Ed25519 keypair on startup, sign outbound ActivityPub messages via a hook, expose the DID Document at the institutional `.go.id` endpoint. Hermes's identity stays "an instance of the runtime"; the plugin brings the DID. Ours to own.

**aksara-cli as tool registry.** Two paths. (a) aksara-cli already exposes an MCP server per proposal §13; Hermes's MCP client discovers and registers it at startup under `mcp_aksara_*`. No runtime changes. (b) For hard guarantees (BSrE sealing, audit emission), a thin Hermes plugin shells to aksara-cli in JSON-mode and treats the response as authoritative. (a) general, (b) deterministic boundary.

**Reasoning ⊥ execution.** Enforceable by structure. Civic-action-generating tools must be aksara-cli tools, never LLM-direct. The tool exposure layer (separate from registration) filters so the model only sees the deterministic surface for civic actions. A hook rejects LLM-direct output claiming to be a sealed letter (defense in depth). Lives inside existing extension points.

**OpenViking + LightRAG.** OpenViking is the active external memory provider. LightRAG ships as an MCP server exposing `lightrag.query_graph(query)`. OpenViking is the canonical Markdown surface (L0/L1/L2 folders per [`decentralized-agent-memory.md`](./decentralized-agent-memory.md)); LightRAG is the graph-RAG query layer over a derived SQLite index. The "default SQLite+FTS5 runs alongside the external provider" property is exactly what we need.

**Cloud-primary / local-auxiliary routing.** The provider abstraction supports the swap natively (`hermes model`) but **does not** ship policy-based routing. We write a pre-call hook: Presidio-ID, then route to cloud (Anthropic / NVIDIA NIM sandbox) or to local llama.cpp / Ollama with Gemma 4 E4B. Cache aggressively on the hot path; offline detection is the same hook with a connectivity probe.

**Audio input.** Voice Mode via Whisper (faster-whisper, multiple sizes). End-to-end Gemma-multimodal audio is *not* wired through the runtime — community write-ups bypass the loop via vLLM. For Aksara, WhatsApp voice-notes go through Whisper (strong on Bahasa Indonesia, decent on Papuan with larger models). Native multimodal audio is one of our upstream contributions if pilot data shows Whisper degradation on Bahasa Mee / Dani / Asmat.

**Personas — skill registries, not profiles.** Profiles isolate too much for the proposal §11 personas — Bendahara and Sekretaris share institutional memory and DID. Right shape: **one profile, persona-specific system-prompt overrides swapped per request by intent classification, with role-bound skill registries**. "Active persona" state set by a router skill at intake. [`docs/aksara/architecture.md`](./../aksara/architecture.md) §10 closes: one Agent per node, role-bound skill registries per persona.

---

## 4. Skinning surface

Hermes Agent ships **three first-class UIs**: CLI, web dashboard (React + Tailwind + shadcn, six built-in themes, skinnable via `data-skin` + CSS variables), desktop app (macOS/Windows/Linux). Community web UIs exist (Hermes WebUI, Hermes Workspace, Open WebUI integration). Plugins add dashboard tabs, backend API routes, themes — *without forking the repo*. For Aksara: **replace wholesale** — default dashboard swapped for the Papua-civic UI from [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md), as a plugin tab; **skin via public theming** — operator CLI gets the Aksara colorway, OLED-eye integration, Bahasa Indonesia messaging, via CSS variables and prompt overrides; **write in parallel** — WhatsApp / SMS / voice / radio intake live as Aksara intake plugins feeding the same session router; **upstream untouched** — harness loop, provider transports, MCP, sandbox backends, compression, session lineage, prompt caching.

---

## 5. Community and governance

Maintained primarily by Nous Research's core team. Per-cycle velocity in the hundreds of merged PRs, 300+ community contributors. New memory providers and integrations now live outside core as plugins — Aksara plugins sit in the same tier as everyone else's, no fork required.

Governance is light. RFC labels on GitHub for higher-level design (Kanban, multi-profile gateway, sandbox tightening). Strict `CONTRIBUTING.md` (skill standards, dependency pinning post-supply-chain compromise, priority order: bug fixes > cross-platform > security > performance > skills > tools > docs). No foundation, no LTS promise, no quarterly community calls. As of the date of writing, no v1.0 announced.

Production use is broad but mostly individual / SMB. Red Hat published an OpenShift AI deploy guide; commercial wrappers (Hermes Workspace, hermify.io) exist. No flagship "Hermes Agent runs the government of X" deployment yet — Aksara would be early to that posture, which is a feature, not a bug, for the NLnet narrative.

Velocity is the real risk. Mitigations: pin a known-good release in the Pi image, update deliberately; keep the plugin tree self-contained; be ready to soft-fork temporarily if a breaking change lands mid-pilot. None unusual for a fast-moving runtime.

---

## 6. What Aksara takes / replaces / contributes upstream

**Takes (unmodified):** harness loop + `run_agent.py` orchestrator; provider transport layer; MCP client + server (aksara-cli and LightRAG plug in as peer MCP servers; ETNOS UI consumes Hermes as MCP server); default SQLite + FTS5 session DB and compression/lineage primitives (civic traceability rides on `parent_session_id`); skill, hook, cron, subagent, plugin-discovery systems; Voice Mode (Whisper); profiles as per-node isolation; OpenViking as active hierarchical memory, Holographic as offline backstop; sandbox abstraction (default `local` on the Pi with blocklist + approval-with-timeout).

**Replaces / writes downstream (Aksara plugins):** the web dashboard, replaced with the ETNOS-skinned Papua-civic UI from [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md); the intake gateway — WhatsApp, SMS, voice, radio, ETNOS DM as Aksara intake plugins; provider routing — pre-call hook running Presidio-ID, selecting cloud-LLM vs local-SLM with offline detection; `did:wba` binding — startup plugin that loads HSM keys and signs outbound ActivityPub messages; the persona model — "active persona" state, intent router, role-bound skill registries; the BSrE / e-meterai sealing path — strict aksara-cli boundary, hook rejecting LLM-direct outputs claiming to be sealed artifacts; Merkle audit anchor emission — hook on session compression and every civic-action tool call, batched into the daily anchor per [`docs/aksara/architecture.md`](./../aksara/architecture.md) §1.

**Contributes upstream (MIT, into `NousResearch/hermes-agent`):**

1. **Policy-based provider routing as a first-class hook.** Today the provider switch is operator-driven (`hermes model`). We contribute a `pre_inference` hook — given prompt and conversation state, return a `(provider, model)` tuple. Aksara's Presidio-ID router sits on top; other operators get the same primitive for cost / latency / jurisdiction routing.
2. **Native audio input through the agent loop, with Gemma-multimodal as reference provider.** Community write-ups already proved end-to-end audio through vLLM; making it first-class helps everyone deploying SLM-multimodal on edge. Aksara cares because of low-literacy operators in [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md) §10.
3. **The ActivityPods adapter shim, packaged as a Hermes Agent plugin.** The ETNOS-on-PieFed → ActivityPods bridge ([`proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §7) includes an MCP server exposing actor / inbox / outbox / basic-Pod-container endpoints. Listed in the Hermes plugin index so other MCP-aware fediverse agents pick it up.

These three are real artifacts useful beyond Aksara, credit the upstream loudly, and land Aksara in the contributor tier — which matches the NLnet narrative.

---

## 7. Related documents

[`docs/aksara/architecture.md`](./../aksara/architecture.md) · [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) · [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) · [`docs/research/decentralized-agent-memory.md`](./decentralized-agent-memory.md) · [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md) · [`docs/aksara/master-proposal-digest.md`](./../aksara/master-proposal-digest.md)
