# Hermes Agent — a deep technical pass for Aksara

> An opinionated read of [Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research, MIT-licensed open-source agent runtime) as Aksara's planner-executor backbone. The runtime is named in [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2, [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §12, and the v3.6 amendments at [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §3. This memo answers "is the named choice the right choice, and where do we own the line between upstream and downstream?"
>
> **Version posture.** As of the date of writing, Hermes Agent ships continuously on a roughly weekly minor-release cadence. This memo avoids version pins on purpose — we describe the shape of the project, not a snapshot.

Status: **v0.1 — first deep-dive**. Owner: ETNOS core. Last revision: 2026-06-08.

---

## TL;DR

**Adopt Hermes Agent as Aksara's runtime backbone. Keep aksara-cli as the deterministic executor. Skin heavily. Contribute three things upstream.** The runtime is a real, MIT-licensed, batteries-included Python agent harness — provider-agnostic, MCP-native, persistent by default, sandboxed by configuration, multi-profile by design. It gives us most of the wiring we'd otherwise build, leaves the parts that carry Indonesian civic weight (BSrE, e-meterai, audit emission, role personas, federation surface) firmly on our side of the line, and has an MIT license that composes cleanly with our AGPL-3.0-only ETNOS frontend. The fit is good in the load-bearing parts (reasoning ⊥ execution, provider abstraction, MCP, OpenViking out of the box); the gaps are well-shaped glue (`did:wba`, ActivityPub actor, Presidio-routing, persona model). The skinning surface is wide and public, which is the single biggest reason to pick Hermes Agent over the alternatives.

---

## 1. What Hermes Agent actually is

A long-running, self-improving agent process by Nous Research. Python (a `run_agent.py` orchestrator plus a wide plugin tree), MIT-licensed, one-shot installer (`curl … | bash` on Linux/macOS/WSL2/Termux; PowerShell on Windows bundling its own Python). Framing: "the agent that grows with you" — start it once, leave it running; it accumulates memory, skills, scheduled tasks, gateway connections.

The runtime is **distinct from the Hermes-3 open-weights language model series** also from Nous Research. The agent is a harness; the models are a separate artifact and license. [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §3 already corrects this slip — treat the distinction as load-bearing in reviewer-facing docs.

### 1.1 Harness architecture — the nine pieces

The clearest external write-up is [Arize's "How Hermes implements an open-source agent harness"](https://arize.com/blog/how-hermes-implements-open-source-agent-harness-architecture/). It identifies a nine-piece harness model that Hermes implements end-to-end:

1. **Provider adapters** normalize protocol differences (Anthropic Messages, OpenAI chat-completions, the Responses API for reasoning models, Bedrock Converse) behind `ProviderTransport` classes. Adding an OpenAI-compatible provider is a config edit; native protocols are a new adapter file plus `api_mode` dispatch.
2. **Tool registration is distinct from tool exposure.** Tools self-register at import time into a central registry (≈70 tools across ≈28 toolsets). What the model sees is a filtered, prefixed slice. MCP servers register with `mcp_{server}_{tool}` prefixes; per-server filtering is first-class.
3. **Session model as durable infrastructure.** Sessions live in SQLite (`~/.hermes/state.db`) with FTS5 + WAL, per-platform isolation, source tags, gateway routing metadata, and parent/child lineage pointers.
4. **Compression as lineage, not amnesia.** When context approaches threshold, an auxiliary model summarizes a middle window; head (system + first three turns) and a token-budget-protected tail remain raw. The compressor stores the previous summary and *updates* it on later compressions — accumulating, not degrading. The current session row closes, a child session opens seeded by the summary, `parent_session_id` records the chain. This is the audit-trail property Aksara needs: you can walk back the lineage of any decision.
5. **Prompt caching** via Anthropic prefix-cache breakpoints (system + last three non-system messages), configurable TTL. Drops input cost substantially on multi-turn flows.
6. **Skill system** — procedural memory as durable files in the profile, compatible with the open `agentskills.io` standard, with optional autonomous skill creation. Skills wrap tools; tools wrap external CLIs/APIs.
7. **Hook system** — plugins intercept the loop at well-defined points (turn start/end, tool call, compression).
8. **Gateway** — multi-platform router (Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI) feeding a unified session router with user auth and DM-pairing.
9. **Cron + subagents** — built-in scheduler inside the same process, plus spawnable subagents for parallel workstreams.

All nine are public extension points. We do not fork the runtime to add the bits Aksara cares about — we write hooks, plugins, and skills.

### 1.2 Persistent memory — default and plugins

Default: **SQLite + FTS5** plus two small Markdown files, `MEMORY.md` (agent's notes) and `USER.md` (operator profile). Always on, no config, fully offline. On top: **one** external memory provider can be active at a time (the runtime enforces single-select to avoid context drift). External providers ship as plugins: Honcho, Mem0, OpenViking, Holographic, Hindsight, RetainDB, ByteRover, Supermemory, Memori. New memory providers no longer land in core — they live in the plugin tree.

Three are interesting for Aksara: **Holographic** (SQLite-only, FTS5 + algebraic queries, zero dependencies, runs on the Pi) as the offline degraded path; **OpenViking** (Volcengine/ByteDance, hierarchical filesystem-paradigm context DB, L0/L1/L2 tiered loading, `viking://` URIs, auto-extracts profile/preferences/entities/events/cases/patterns) as the substrate the founder named in [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2; **Hindsight** (Postgres-backed KG) as a fallback if LightRAG's adat KG modeling proves lossy.

Critically, the default SQLite+FTS5 always runs **alongside** the active external provider. That gives us OpenViking-as-hierarchical-store + SQLite-as-derived-index for free — the exact shape [`docs/research/decentralized-agent-memory.md`](./decentralized-agent-memory.md) §3 specifies. LightRAG plugs in cleaner as an MCP server exposing graph-RAG retrieval than as a custom memory provider.

### 1.3 MCP — client and server

Hermes Agent speaks MCP natively. As a **client** it discovers configured servers at startup in parallel, registers tools under a prefix, supports per-server filtering, handles `notifications/tools/list_changed` for live updates without reload, wraps both local-stdio and remote-HTTP servers. As a **server** it exposes its own sessions and skill catalog to peer clients.

This is the biggest unlock for Aksara. The peer-Aksara, peer-agent, and ETNOS-UI surfaces from [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2 all consume an MCP endpoint — Hermes Agent gives us that endpoint without writing it. The aksara-cli Go binary already exposes an MCP server per proposal §13; Hermes Agent consumes it as a peer client and surfaces its tools to the model alongside the 70-odd built-ins.

### 1.4 Sandboxing and command approval

Seven **terminal backends** isolate command execution: `local`, `docker`, `ssh`, `singularity`, `modal`, `daytona`, Vercel Sandbox. Container backends *replace* the dangerous-command approval prompt — the container is the boundary. For non-containerized environments, a hardcoded blocklist refuses catastrophic commands regardless of settings; everything above a threshold pops a fail-closed approval prompt with timeout.

On pemerintah Aksara nodes (hardened OS image, single-tenant) we default to `local` — Docker overhead on the Pi is real — and route civic-action work through aksara-cli, which has no `terminal` semantics. It's a typed-tool boundary, not a shell boundary.

### 1.5 Profiles — multi-tenant per process

A **profile** is a fully independent agent instance with its own `config.yaml`, `.env`, `SOUL.md`, memory store, sessions, skills, cron jobs, gateway state. Profile A cannot read profile B's memory. First-class management via `hermes profile` and `HERMES_HOME`. Catch: profiles do **not** isolate the filesystem on `local` — every profile runs as the same OS user. Real multi-tenancy needs a containerized backend per profile.

For Aksara's institutional-actor model in [`docs/aksara/onboarding.md`](./../aksara/onboarding.md), the right shape is **one Aksara node = one Hermes Agent process = one profile**. The five proposal §11 personas (Staf Administrasi, Operator Sistem, Bendahara, Sekretaris, Arsiparis Digital) on one node are role-bound skill registries inside the *same* profile — not five processes — because they share institutional memory and identity. [`docs/aksara/architecture.md`](./../aksara/architecture.md) §10 closes with that answer.

### 1.6 What it is not

- **Not a coding agent** in the Aider/Continue sense, though heavily used for coding. The 40+ built-ins span web search, image gen, file I/O, scheduling, calendar, browser automation.
- **Not Hermes-3.** Distinct project, distinct license artifact.
- **Not LangGraph / CrewAI / AutoGen / smolagents / LlamaIndex Agents** — those are libraries you write a workflow against. Hermes Agent is a runtime you talk to. Closest analog: Goose (Block) or a hypothetical OSS Claude Code daemon.
- **Not Aider / Continue** — Aider is git-aware coding pair; Continue is IDE-embedded. Hermes Agent is server-side first.
- **Not Pi (Armin Ronacher's).** Pi is a single-file minimal substrate; Hermes Agent is the opposite — opinionated, batteries-included, gateway + scheduler + plugin tree. [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §12's "not blocked but not first-class" framing for Pi stands.

---

## 2. Production deployment

**Self-host.** Supported shapes, increasing isolation: (a) `curl … | bash` on the host, run as a systemd service; (b) official Docker image with mounted `~/.hermes` volume; (c) `docker compose` with Hermes + sandbox + memory-provider containers; (d) Kubernetes (Red Hat published an OpenShift AI + vLLM deploy guide). For Aksara's Orange Pi 5, shape (a) on hardened Debian is the right default — Docker overhead on the Pi is real, the device is single-tenant. We trade the container security boundary for resource headroom and lean on aksara-cli plus the runtime's command blocklist.

**Footprint.** Idle with cloud-LLM inference: **2 GB RAM / 1 vCPU**. Production-comfortable: **2 vCPU / 4–8 GB**. With browser automation: **2 vCPU / 4 GB** minimum. Local-inference adds whatever the model needs (Gemma 4 E4B via llama.cpp baseline). SQLite state plus OpenViking server fit in **<20 GB disk** for kelurahan-scale corpora. The Orange Pi 5 at 8–16 GB is comfortably above the floor.

**Persistence.** SQLite (`state.db` with FTS5 + WAL). Memory plugins bring their own backings — OpenViking ships its own server, Hindsight uses Postgres. The runtime does not require Postgres or Redis. No S3 in the default path. File-on-disk, no daemon, restorable from snapshots — exactly the shape Aksara wants.

**Observability.** Every tool invocation goes through observable callbacks. Sessions are queryable from SQLite directly. Compression lineage is walkable from `parent_session_id`. The web dashboard (React + Tailwind + shadcn) exposes sessions, config, live monitoring; MCP-server mode exposes the agent's state to peer clients; the Kanban view manages fleets. None is an audit substrate at Indonesia-regulatory weight — for that we wire the Merkle anchor emission per [`docs/aksara/architecture.md`](./../aksara/architecture.md) §1 — but they are enough to debug a deployed kelurahan.

**License — MIT, downstream-AGPL safe.** Hermes Agent is **MIT**. ETNOS is **AGPL-3.0-only** (Photon fork). MIT into AGPL is the boring, safe direction — AGPL is a one-way valve, MIT composes into an AGPL whole without polluting upstream. We carry no obligation to relicense aksara-cli or our Hermes plugins. Upstream contributions go out under MIT; Aksara-owned plugins (BSrE-sealing, e-meterai) ship under Apache 2.0 or MIT — not AGPL.

**Deployment unit.** One Hermes Agent process per Aksara node — per kelurahan, per puskesmas, per balai adat — as a long-lived systemd service on the Pi. Profiles inside the process are not separate Aksara nodes; they are role personas serving the same institution. Matches the "one DID per node" rule ([`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §3).

---

## 3. Aksara-specific fit

**`did:wba` binding.** The runtime has no native DID concept — it has profiles and API keys. We bind a Hermes Agent process to an `aksara:AksaraNode` ActivityPub actor via a small Aksara plugin: load the HSM-stored Ed25519 keypair on startup, sign every outbound ActivityPub message via a hook, expose the DID Document at the institutional `.go.id` (or community-domain) endpoint. Hermes Agent's identity stays "an instance of the runtime"; the plugin brings the DID. Clean separation, ours to own.

**aksara-cli as tool registry.** Two paths. (a) aksara-cli already exposes an MCP server per proposal §13; Hermes Agent's MCP client discovers it at startup and registers tools under `mcp_aksara_*`. No runtime code changes. (b) For tools where we want hard guarantees (BSrE sealing, audit emission), a thin Hermes plugin shells to aksara-cli in JSON-mode and treats the response as authoritative. (a) for general operations, (b) for the deterministic-execution boundary.

**Reasoning ⊥ execution.** Enforceable by structure. Tools that *generate* civic-action artifacts must be aksara-cli tools, never LLM-direct. The runtime's tool exposure layer (separate from registration) filters so the model only sees the deterministic tool surface for civic actions. A hook rejects any LLM-direct output claiming to be a sealed letter (defense in depth). The split lives inside existing extension points — no fork needed.

**OpenViking + LightRAG composition.** OpenViking is the active external memory provider. LightRAG ships as an MCP server exposing `lightrag.query_graph(query)` — the runtime registers it as a tool. OpenViking is the canonical Markdown surface (L0/L1/L2 folders, Obsidian-shaped per [`decentralized-agent-memory.md`](./decentralized-agent-memory.md)); LightRAG is the graph-RAG query layer over a derived SQLite index. The "default SQLite+FTS5 always runs alongside the external provider" property is exactly what we need.

**Cloud-primary / local-auxiliary routing.** The provider abstraction supports the swap natively (`hermes model`) but **does not** ship policy-based routing — no built-in "if Presidio-ID flags PII, switch provider" hook. We write a pre-call hook: run the prompt through Presidio-ID, route to cloud (Anthropic / NVIDIA NIM sandbox) or to local llama.cpp / Ollama with Gemma 4 E4B. Presidio-ID is on the hot path; we cache aggressively. Offline detection is the same hook with a connectivity probe.

**Audio input.** Voice Mode via Whisper (faster-whisper, multiple sizes). Audio-end-to-end through Gemma-multimodal is *not* wired through the runtime — community write-ups pass audio through vLLM directly, bypassing the loop. For Aksara, WhatsApp voice-notes go through Whisper (strong on Bahasa Indonesia, decent on Papuan with larger models). Native Gemma-multimodal-audio is something we contribute upstream if pilot data shows Whisper degradation on Bahasa Mee / Dani / Asmat.

**Personas as profiles vs skill registries.** Profiles isolate too much for the proposal §11 personas — Bendahara and Sekretaris share institutional memory and DID. Right shape: **one profile, persona-specific system-prompt overrides swapped per request by intent classification, with role-bound skill registries**. The skill system filters by configuration; we add an "active persona" state set by a router skill at intake. [`docs/aksara/architecture.md`](./../aksara/architecture.md) §10 closes: one Agent per node, role-bound skill registries per persona.

---

## 4. Skinning surface

Hermes Agent ships **three first-class UIs**: CLI, web dashboard (React + Tailwind + shadcn, six built-in themes + skinnable via `data-skin` + CSS variables), and a desktop app (macOS/Windows/Linux). Multiple community web UIs exist (Hermes WebUI, Hermes Workspace, Open WebUI integration). Plugins add dashboard tabs, backend API routes, theme variants — *without forking the repo*. For Aksara:

- **Replace wholesale.** The default dashboard is developer-shaped. Aksara replaces it with the Papua-civic UI from [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md) — Bahasa Indonesia first, audio-first, the inbox/grant-button primitives from §4–5, institutional crest vocabulary from §8. Plugin that registers a dashboard tab, not a runtime fork.
- **Skin via public theming.** The CLI, used directly by operators, gets the muted Aksara colorway, OLED-strip eye-indicator integration, deliberate Bahasa Indonesia messaging. Pure CSS variables and prompt overrides.
- **Write in parallel.** WhatsApp / SMS / voice / radio intake are not skinning — they are different operator surfaces. We do not replace the runtime gateway; we add intake plugins feeding the same session router.
- **Upstream, untouched.** Harness loop, provider transports, MCP client/server, sandbox backends, compression engine, session lineage, prompt caching. We must not fork these.

---

## 5. Community and governance

Hermes Agent is maintained primarily by Nous Research's core team, with documented per-cycle velocity in the hundreds of merged PRs and 300+ community contributors. The bulk of new memory providers / integrations now lives outside core as plugins — a deliberate policy choice that *helps us*: our Aksara plugins sit in the same tier as everyone else's, no fork required.

Governance is light. RFC labels on GitHub for higher-level design (Kanban, multi-profile gateway, sandbox tightening). A strict `CONTRIBUTING.md` (skill authoring standards, dependency pinning post-supply-chain compromise, contribution-priority order: bug fixes > cross-platform > security > performance > skills > tools > docs). No foundation, no LTS promise, no quarterly community calls. As of the date of writing, no v1.0 announced.

Notable production use is broad but mostly individual / SMB. Red Hat published an OpenShift AI deploy guide; commercial wrappers (Hermes Workspace, hermify.io) exist. We have not found a flagship "Hermes Agent runs the government of X" deployment — Aksara would be early to that posture, which is a feature, not a bug, for our NLnet narrative.

The governance shape is the one real risk. We mitigate by: (a) pinning to a known-good release in the Orange Pi image and updating deliberately; (b) keeping our plugin tree self-contained; (c) being prepared to maintain a soft-fork temporarily if a breaking change lands mid-pilot. None unusual for a fast-moving runtime.

---

## 6. What Aksara takes / replaces / contributes upstream

**Aksara takes (use unmodified):**

- Harness loop, `run_agent.py` orchestrator, provider transport layer.
- MCP client + server. aksara-cli plugs in as a peer MCP server; LightRAG plugs in as a peer MCP server; ETNOS UI consumes the Hermes Agent MCP server.
- Default SQLite + FTS5 session DB and the compression/lineage primitives. Civic-action traceability rides on `parent_session_id`.
- Skill system, hook system, cron scheduler, subagent spawner, plugin discovery (`~/.hermes/plugins/`, `.hermes/plugins/`, pip entry points).
- Voice Mode (Whisper) for WhatsApp / voice intake.
- Profiles as the per-node isolation primitive (one Aksara node = one process = one profile).
- OpenViking as the active hierarchical memory provider; Holographic as the offline degradation path.
- Sandbox backend abstraction (we default to `local` on the Pi, with the runtime's command blocklist and approval-with-timeout).

**Aksara replaces / writes downstream (Aksara plugins, private or sectoral-contract-shaped):**

- The web dashboard — replaced with the ETNOS-skinned, Bahasa Indonesia, institutional-crest UI from [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md).
- The intake gateway — WhatsApp, SMS, voice, radio, ETNOS DM live as Aksara intake plugins.
- The provider routing policy — a pre-call hook running Presidio-ID, selecting cloud-LLM vs local-SLM per request, with offline detection.
- The `did:wba` binding — a startup plugin loads HSM keys, signs outbound ActivityPub messages, exposes the DID Document.
- The persona model — an "active persona" state on the profile, intent-classification routing, role-bound skill registries (one process, multiple personas).
- The BSrE / e-meterai sealing path — strict aksara-cli tool boundary, with a hook rejecting any LLM-direct output claiming to be a sealed artifact.
- Merkle audit anchor emission — a hook on session compression and on every civic-action tool call, batched into the daily anchor per [`docs/aksara/architecture.md`](./../aksara/architecture.md) §1.

**Aksara contributes upstream (MIT, into `NousResearch/hermes-agent`):**

1. **Policy-based provider routing as a first-class hook point.** Today the provider switch is operator-driven (`hermes model`). We contribute a `pre_inference` hook with a clean contract — given prompt and conversation state, return a `(provider, model)` tuple. Aksara's Presidio-ID router sits on top; other operators get the same primitive for cost-routing, latency-routing, jurisdiction-routing.
2. **Native audio-input through the agent loop, with Gemma-multimodal as a reference provider.** The community already showed it works end-to-end through vLLM; making it first-class inside the runtime helps everyone deploying SLM-multimodal on edge. Aksara cares because of low-literacy operators in [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md) §10.
3. **The ActivityPods adapter shim, packaged as a Hermes Agent plugin.** The bridge layer we ship for ETNOS-on-PieFed-to-ActivityPods (proposal §14 amendment) includes an MCP server exposing actor/inbox/outbox/basic-Pod-container endpoints. Released as a standalone artifact per [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §7; we list it in the Hermes Agent plugin index so other MCP-aware fediverse agents pick it up.

These three are real artifacts, useful beyond Aksara, and credit the upstream loudly. They land Aksara in the Hermes Agent contributor tier rather than the "user of someone else's tool" tier — which matches the NLnet narrative we want to tell.

---

## 7. Related documents

- [`docs/aksara/architecture.md`](./../aksara/architecture.md) — consolidated Aksara architecture (Hermes Agent named, §2)
- [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) — institutional onboarding ceremony (§12 closes the Hermes lock-in question)
- [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) — amendments §3 and §6 surface the Hermes Agent / Hermes-3 distinction
- [`docs/research/decentralized-agent-memory.md`](./decentralized-agent-memory.md) — LightRAG + OpenViking memory composition
- [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md) — the seamless UX the skinning surface must serve
- [`docs/aksara/master-proposal-digest.md`](./../aksara/master-proposal-digest.md) — Aksara product framing (PNS Digital, Civic Transaction primitive, Paket Kelurahan MVP)
