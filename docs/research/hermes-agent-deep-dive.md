# Hermes Agent — a deep technical pass for Aksara

> An opinionated read of [Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research, MIT-licensed open-source agent runtime) as a candidate backbone for Aksara's planner-executor layer. The runtime is named throughout [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2, [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §12, and the v3.6 amendments at [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §3; this memo answers "is the named choice the right choice, and where do we own the line between upstream and downstream?"
>
> **Version posture.** As of the date of writing, Hermes Agent ships continuously — the project does weekly-cadence minor releases and the maintainers reject the question "what's the LTS." This memo avoids version pins on purpose; what we describe is the shape of the project, not a snapshot.

Status: **v0.1 — first deep-dive**. Owner: ETNOS core. Last revision: 2026-06-08.

---

## TL;DR

**Adopt Hermes Agent as Aksara's runtime backbone. Keep aksara-cli as the deterministic executor. Skin the surface heavily. Contribute three things upstream.** The runtime is a real, MIT-licensed, batteries-included Python agent harness — provider-agnostic, MCP-native, persistent by default, sandboxed by configuration, multi-profile by design. It is the right altitude for "PNS Digital" in [`docs/aksara/master-proposal-digest.md`](./../aksara/master-proposal-digest.md) because it gives us 80% of the wiring we'd otherwise build ourselves, leaves the bits that carry Indonesian civic weight (BSrE seal, e-meterai, audit emission, role personas, federation surface) firmly on our side of the line, and has an MIT license that composes cleanly with our AGPL-3.0-only ETNOS frontend.

The fit is good in the parts that matter (reasoning ⊥ execution, provider-agnostic routing, MCP tool surface, OpenViking out of the box). It is *not* a turnkey civic platform — there is real glue to write for `did:wba` identity binding, ActivityPub actor surface, Presidio-ID-gated provider routing, and the institutional persona model. The skinning surface is wide and well-defined, which is the single biggest reason to pick Hermes Agent over the alternatives below.

---

## 1. What Hermes Agent actually is

Hermes Agent is a self-improving, long-running agent process built by Nous Research. The codebase is Python (a single `run_agent.py` orchestrator with thousands of lines, plus a wide plugin tree), MIT-licensed, with a one-shot installer (`curl … | bash` on Linux/macOS/WSL2/Termux; PowerShell on Windows that bundles its own Python). The README's framing is deliberate: "the agent that grows with you." Operationally, that means a process you start once and leave running — it accumulates memory, skills, scheduled tasks, and gateway connections over time.

The runtime is **distinct from the Hermes-3 open-weights language model series** also published by Nous Research. The agent runtime is a harness; it calls models. The models are a separate artifact and license. The v3.6 amendments at [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §3 already correct this slip in the master proposal — we should treat the distinction as load-bearing in any reviewer-facing doc.

### 1.1 Harness architecture — the nine pieces

The most precise external write-up of the architecture is [Arize's "How Hermes implements an open-source agent harness"](https://arize.com/blog/how-hermes-implements-open-source-agent-harness-architecture/). It identifies a "nine-piece" harness model that Hermes implements end-to-end:

1. **Provider adapters** that normalize protocol differences (Anthropic Messages, OpenAI chat-completions, the Responses API for reasoning models, Bedrock Converse) behind a small set of `ProviderTransport` classes. Adding a new OpenAI-compatible provider is a config edit; adding a native protocol is a new adapter file (`agent/<provider>_adapter.py`) plus `api_mode` dispatch in `run_agent.py`.
2. **Tool registration distinct from tool exposure.** Tools self-register at import time into a central registry (~70 tools across ~28 toolsets). What the model *sees* is a filtered, prefixed slice — not the whole registry. MCP servers register with `mcp_{server}_{tool}` prefixes; per-server filtering is first-class.
3. **Session model as durable infrastructure.** Sessions live in a SQLite state DB (`~/.hermes/state.db` by default) with FTS5 full-text search and WAL journaling, and per-platform isolation. Sessions carry source tags, gateway routing metadata, and parent/child lineage pointers.
4. **Compression as lineage, not amnesia.** When context approaches the threshold, an auxiliary model summarizes a middle window; the protected head (system prompt + first three turns) and a token-budget-protected tail remain raw. The compressor stores the previous summary and *updates* it on later compressions — accumulating rather than degrading. The current session row closes, a child session is opened seeded by the summary, and `parent_session_id` records the chain. This is the "audit trail" property that matters for Aksara: you can walk back the lineage of any agent decision.
5. **Prompt caching** via Anthropic's prefix-cache breakpoints (`system_and_3` layout — system prompt + last three non-system messages), with configurable TTL. This drops input token costs on multi-turn flows substantially without changing the conversation shape.
6. **Skill system** (the "self-improving" piece): procedural memory captured as durable files in the profile, compatible with the open `agentskills.io` standard, plus optional autonomous skill creation. Skills wrap tools; tools wrap external CLIs/APIs.
7. **Hook system** that lets plugins intercept the agent loop at well-defined points (turn start/end, tool call, compression).
8. **Gateway** — a long-running multi-platform message router (Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI) feeding a unified session router with user authorization and DM-pairing.
9. **Cron + subagents** — built-in scheduler ticking inside the same process, plus spawnable subagents for parallel workstreams.

The Aksara-relevant takeaway is that all nine pieces are public extension points. We do not need to fork the runtime to add the bits Aksara cares about. We do need to write hooks, plugins, and skills.

### 1.2 Persistent memory — the default and the plugins

The default memory layer is **SQLite + FTS5** plus two small Markdown files: `MEMORY.md` (the agent's notes about your environment) and `USER.md` (the operator's profile). Always on, no configuration, fully offline. On top of that, **one** external memory provider can be active at a time (the runtime enforces single-select to avoid context drift). External providers ship as plugins: Honcho, Mem0, OpenViking, Holographic, Hindsight, RetainDB, ByteRover, Supermemory, Memori. After a policy change the runtime now refuses new memory providers into the core repo and routes them through the plugin tree.

**Three are interesting for Aksara**:

- **Holographic** — SQLite-only, FTS5 plus Holographic Reduced Representations for algebraic queries. Zero dependencies, fully offline, runs on the Pi. Useful as a degraded path.
- **OpenViking** — the [hierarchical filesystem-paradigm context DB from Volcengine/ByteDance](https://github.com/volcengine/OpenViking). Self-hosted server, L0/L1/L2 tiered loading, `viking://` URI addressing, auto-extracts memories into profile/preferences/entities/events/cases/patterns. This is the substrate the founder named in [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2 and reaffirmed in [`docs/research/decentralized-agent-memory.md`](./decentralized-agent-memory.md) §"Updates per founder clarification."
- **Hindsight** — Postgres-backed knowledge graph with entity resolution, supports local mode. Worth holding in reserve if LightRAG's adat KG modeling proves lossy.

**Critically: the runtime allows multiple memory layers to compose, not just one.** The default SQLite+FTS5 always runs alongside whatever external provider is active. That gives us OpenViking-as-hierarchical-store + SQLite-as-derived-index for free, which is the exact shape [`decentralized-agent-memory.md`](./decentralized-agent-memory.md) §3 specifies. LightRAG plugs in as either a custom memory provider or — cleaner — as an MCP server exposing graph-RAG retrieval to the agent loop.

### 1.3 MCP — both client and server

Hermes Agent speaks MCP natively. As a **client** it discovers configured MCP servers at startup (in parallel, via `asyncio.gather`), registers each server's tools under a prefix, supports per-server filtering, handles `notifications/tools/list_changed` for live tool updates without reload, and wraps both local-stdio and remote-HTTP servers in the same config. As a **server** (more recently) it exposes its own sessions and skill catalog to peer clients.

This is the single biggest unlock for Aksara. The peer-Aksara, peer-agent, and ETNOS-UI surfaces from [`docs/aksara/architecture.md`](./../aksara/architecture.md) §2 ("Federation surface") all consume an MCP endpoint. Hermes Agent gives us that endpoint without writing it. The aksara-cli Go binary already exposes an MCP server per the master proposal §13; Hermes Agent will consume it as a peer MCP client and surface its tools to the model with all 70-odd built-ins.

### 1.4 Sandboxing and command approval

Six (now seven, counting Vercel Sandbox) **terminal backends** isolate command execution: `local`, `docker`, `ssh`, `singularity`, `modal`, `daytona`. Container backends *replace* the dangerous-command approval prompt because the container is the boundary. For non-containerized environments, a hardcoded blocklist refuses catastrophic commands regardless of settings; everything else above a threshold pops a fail-closed approval prompt with a timeout.

This is genuinely useful — Aksara's deterministic-execution split is partly enforceable here. For pemerintah Aksara nodes that run on a hardened OS image, we'd default to Docker isolation around any `terminal` call and route civic-action work through aksara-cli (which has no `terminal` semantics at all — it's a typed-tool boundary).

### 1.5 Profiles — multi-tenant per process

A **profile** is "a fully independent agent instance with its own `config.yaml`, `.env`, `SOUL.md`, memory store, session history, skills, cron jobs, and gateway state." Profile A cannot read profile B's memory, sessions, or cron jobs. The runtime ships first-class profile management (`hermes profile`, `HERMES_HOME` env var).

The catch: profiles do **not** isolate the filesystem on the default `local` backend — every profile runs as the same OS user. For multi-tenancy where tenants must not read each other's files, the maintainers explicitly recommend containerized backends (Docker/SSH/Modal/Daytona/Singularity) per profile. There is an open RFC ([issue #9514](https://github.com/NousResearch/hermes-agent/issues/9514)) discussing single-daemon multi-agent with stronger per-topic workspace isolation; the design discussion ([#23735](https://github.com/NousResearch/hermes-agent/issues/23735)) explores multi-profile-in-one-gateway. Hermes Agent's current answer is "one profile per agent, one Docker container per profile if you need real isolation."

For Aksara's institutional-actor model in [`docs/aksara/onboarding.md`](./../aksara/onboarding.md), one Aksara node = one Hermes Agent process = one profile is the right shape. Five personas (Staf Administrasi, Operator Sistem, Bendahara, Sekretaris, Arsiparis Digital) on one node are role-bound skill registries inside the *same* profile — not five processes — because they share the institution's memory and identity. [`docs/aksara/architecture.md`](./../aksara/architecture.md) §10 "Open questions" can close with that answer.

### 1.6 What it is not

- **Not a coding agent** in the Aider / Continue sense (though it ships a strong `terminal` tool and is heavily used for coding). The 40+ built-in tools span web search, image generation, file I/O, scheduling, calendar, browser automation, and many integration adapters.
- **Not Hermes-3.** Distinct project, distinct license artifact. See §1 above.
- **Not LangGraph / CrewAI / AutoGen** — those are *libraries* you write a workflow against. Hermes Agent is a *runtime* you talk to. The closest analog is Goose (Block) or a hypothetical OSS Claude Code daemon.
- **Not smolagents.** That's a minimal-loop library; Hermes Agent is a full harness with gateway, scheduler, multi-profile, plugins.
- **Not LlamaIndex Agents.** LlamaIndex is RAG-centric; Hermes Agent treats memory/RAG as a plugin slot.
- **Not Aider.** Aider is git-aware coding pair-programmer; Hermes Agent is general.
- **Not Continue.** Continue is IDE-embedded; Hermes Agent is server-side first.
- **Not Pi (Armin Ronacher's).** Pi is a small Python-native single-file harness in the spirit of "minimal substrate"; Hermes Agent is the opposite — a batteries-included, opinionated harness with a gateway, scheduler, and plugin tree. The Aksara onboarding spec ([`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §12) names Pi as a "not blocked but not first-class" alternative — that framing stands.

---

## 2. Production deployment

### 2.1 Self-host story

The supported deployment shape, in increasing isolation: (a) `curl … | bash` on the host, run as a systemd service; (b) the official Docker image with a mounted `~/.hermes` volume; (c) `docker compose` with a Hermes container plus a sandbox container plus memory-provider container (OpenViking ships its own server); (d) Kubernetes (a Red Hat write-up exists for OpenShift AI + vLLM serving for local-inference scenarios).

For Aksara's Orange Pi 5 target ([`docs/aksara/architecture.md`](./../aksara/architecture.md) §1), shape (a) with a hardened Debian image is the right default — Docker overhead on the Pi is real and the device is single-tenant anyway. We trade off the container security boundary for resource headroom and lean on aksara-cli + the runtime's command blocklist instead.

### 2.2 Resource requirements

At idle, with cloud-LLM inference (Aksara's primary path per [`docs/aksara/architecture.md`](./../aksara/architecture.md) §3), the runtime fits comfortably in **2 GB RAM and 1 vCPU**. Production-comfortable is **2 vCPU + 4–8 GB**. With browser automation enabled, **2 vCPU + 4 GB** minimum. Local-inference adds whatever the model needs (Gemma 4 E4B via llama.cpp is the relevant baseline). The SQLite state DB and OpenViking server together fit in **<20 GB of disk** for any kelurahan-scale corpus.

The Orange Pi 5 with 8–16 GB RAM is comfortably above the minimum for Hermes Agent + LightRAG + OpenViking server + the local Gemma 4 E4B SLM backstop. We are not living in the danger zone here.

### 2.3 Persistence backing

Default: **SQLite** (`state.db` with FTS5 + WAL). Memory plugins add their own backings — OpenViking is a self-hosted server with its own store, Hindsight uses Postgres. The runtime itself does not require Postgres or Redis. No S3 in the default path. This is exactly the shape Aksara wants — file-on-disk, no daemon, restorable from snapshots.

### 2.4 Observability

Every tool invocation goes through observable callbacks. Sessions are queryable from the SQLite DB directly (FTS5 search). The compression lineage is walkable from `parent_session_id`. There is a web dashboard (React + Tailwind + shadcn) that exposes sessions, config, and live monitoring; an MCP-server mode that exposes the agent's own state to peer clients (Claude Desktop, Cursor); and the Kanban "multi-agent board" view for fleet management. None of these is an audit substrate at the Indonesia-regulatory sense — for that we still need to wire the Merkle-anchor emission from [`docs/aksara/architecture.md`](./../aksara/architecture.md) §1, but they are good enough to debug a deployed kelurahan.

### 2.5 License — MIT, downstream-AGPL safe

Hermes Agent is **MIT-licensed**. ETNOS is **AGPL-3.0-only** (Photon fork). MIT into AGPL is the boring, safe direction — AGPL is a one-way valve; MIT components compose into an AGPL whole without polluting upstream. The Warp integration discussion explicitly walks this line and concludes the boundary is maintainable. We carry no obligation to relicense aksara-cli or our Hermes Agent plugins as AGPL; we *do* carry the AGPL obligation on the ETNOS frontend, which is independent.

For Aksara's plugin-tree contributions back to Hermes Agent upstream, we publish them under MIT to match the upstream license. For Aksara-owned plugins we keep private (BSrE-sealing, e-meterai integration), we publish under whatever fits the institutional contract — likely Apache 2.0 or MIT, not AGPL.

### 2.6 Deployment unit

The right unit is **one Hermes Agent process per Aksara node** (per kelurahan, per puskesmas, per balai adat), running as a long-lived systemd service on the Orange Pi 5. Profiles inside that process are not separate Aksara nodes — they are role personas serving the same institution. This matches the onboarding ceremony's "one DID per node" rule ([`docs/aksara/onboarding.md`](./../aksara/onboarding.md) §3).

---

## 3. Aksara-specific fit

**`did:wba` binding.** The runtime has no native `did:web`/`did:wba` concept — it has profiles and API keys. We bind a Hermes Agent process to an `aksara:AksaraNode` ActivityPub actor via a small Aksara plugin: the plugin loads the HSM-stored Ed25519 keypair on startup, signs every outbound ActivityPub message via a hook, and exposes the DID Document at the institutional `.go.id` (or community-domain) endpoint. Hermes Agent's identity remains "an instance of the runtime"; Aksara's plugin layer brings the DID. This is clean separation and we own it.

**aksara-cli as a tool registry.** Two clean integration paths. (a) aksara-cli already exposes an MCP server per proposal §13; Hermes Agent's MCP client discovers it at startup and registers the tools under `mcp_aksara_*`. No code in the runtime changes. (b) For tools where we want hard guarantees (BSrE sealing, audit emission), we write a small Hermes Agent plugin that shells out to aksara-cli with JSON-mode and treats the response as authoritative. Both work; we prefer (a) for general operations and (b) for the deterministic-execution boundary.

**Reasoning ⊥ execution.** Enforceable by convention plus structure. Tools registered into Hermes Agent's registry that *generate* civic-action artifacts must all be aksara-cli tools (not LLM-direct). The runtime's tool exposure layer (separate from registration) makes this easy: we filter so the model only sees the deterministic tool surface for civic actions. The hook system lets us reject any LLM-direct output that claims to be a sealed letter (defense in depth). This split lives entirely inside the runtime's existing extension points.

**OpenViking + LightRAG composition.** OpenViking is the active external memory provider. LightRAG ships as an MCP server exposing `lightrag.query_graph(query)` — the runtime registers it as a tool. The OpenViking hierarchical store is the canonical Markdown surface (L0/L1/L2 folders, the Obsidian-shaped convention from [`decentralized-agent-memory.md`](./decentralized-agent-memory.md) §"Updates"); LightRAG is the graph-RAG query layer over a derived SQLite index. The runtime's "default SQLite+FTS5 always runs alongside external provider" property is exactly the shape we want.

**Cloud-primary / local-auxiliary routing.** Hermes Agent's provider abstraction supports the swap natively (`hermes model` switches with no code changes), but it does **not** ship policy-based routing — there is no built-in "if Presidio-ID flags PII, switch provider" hook. We write a small plugin: a pre-call hook that runs the candidate prompt through Presidio-ID, and either routes to the cloud provider (Anthropic / NVIDIA NIM sandbox) or to the local llama.cpp / Ollama endpoint with Gemma 4 E4B. The Presidio-ID call is on the hot path; we cache aggressively. Offline detection is the same hook with a connectivity probe.

**Audio input.** Hermes Agent has Voice Mode via Whisper (faster-whisper local, multiple model sizes). Audio-end-to-end with Gemma-multimodal is *not* currently wired through the runtime — community write-ups show passing audio through vLLM's endpoint directly, bypassing the agent loop. For Aksara, the WhatsApp voice-note path goes through Whisper (which is fine — Whisper is excellent on Bahasa Indonesia and reasonably good on Papuan languages with the larger models), and the Gemma-multimodal-audio path is something we'd contribute upstream if pilot data shows Whisper degradation on Bahasa Mee / Bahasa Dani / Bahasa Asmat.

**Role personas as profiles vs skill registries.** Profiles isolate too much for the proposal §11 personas — Bendahara and Sekretaris share the same institutional memory and DID. The right shape is **one profile, multiple SOUL.md-style persona files swapped per request based on intent classification, with role-bound skill registries**. The runtime's skill system filters skills by configuration; we add a small "active persona" state to the profile, set by a router skill at intake. [`docs/aksara/architecture.md`](./../aksara/architecture.md) §10 "Open questions" closes with: one Agent per node, role-bound skill registries per persona.

---

## 4. Skinning surface — what Aksara owns vs. what stays upstream

Hermes Agent ships **three first-class UIs**: a CLI, a web dashboard (React + Tailwind + shadcn, six built-in themes + skinnable via `data-skin` + CSS variables), and a desktop app (Tauri-shaped, macOS/Windows/Linux). Multiple community web UIs exist (Hermes WebUI, Hermes Workspace, Open WebUI integration). Plugins can add dashboard tabs, backend API routes, and theme variants — *without forking the repo*.

For Aksara that's exactly the right shape. The skinning model is wide open:

- **What Aksara replaces.** The default web dashboard is a developer-shaped surface — Aksara replaces it with a Papua-civic-shaped UI (Bahasa Indonesia first, audio-first interaction, inbox/notification primitives from [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md), the institutional crest visual vocabulary from §8 of that doc, the grant-button affordance from §5). We do this as a Hermes Agent plugin that registers a dashboard tab, not as a runtime fork.
- **What Aksara skins via the public CSS theming surface.** The CLI, when an operator uses it directly, gets the muted Aksara colorway, the OLED-strip eye-indicator integration, and the deliberate Bahasa Indonesia messaging. This is purely CSS variables and prompt overrides.
- **What Aksara replaces wholesale.** The WhatsApp / SMS / voice intake paths are not skinning — they are a different operator surface. We do not replace the runtime's gateway; we write our own intake plugins that feed the same session router.
- **What stays upstream untouched.** The harness loop, provider transports, MCP client/server, sandbox backends, compression engine, session lineage, prompt caching. We must not fork these.

---

## 5. Community and governance

Hermes Agent is maintained primarily by Nous Research's core team, with documented commit velocity around hundreds of merged PRs per release cycle, 300+ community contributors, and the bulk of new memory providers / integrations now living outside the core repo as plugins (a deliberate policy choice that *helps us* — our Aksara plugins sit in the same tier as everyone else's, no fork required).

Governance is light. There is an RFC label on GitHub issues for higher-level design questions (Kanban, multi-profile gateway, sandbox tightening), a `CONTRIBUTING.md` that's strict about skill authoring and dependency pinning post-supply-chain-compromise, and a clear contribution-priority order (bug fixes > cross-platform > security > performance > skills > tools > docs). There is no formal foundation, no public roadmap promise of an LTS, no quarterly community calls. As of the date of writing the project is in fast-iteration mode and has not announced v1.0.

Notable production use is broad but mostly individual / SMB. Red Hat published an OpenShift AI deploy guide; multiple commercial wrappers (Hermes Workspace, hermify.io, several SaaS shims) exist. We have not found a flagship "Hermes Agent runs the government of X" deployment — Aksara would be early to that posture, which is a feature, not a bug, for our NLnet narrative.

The governance shape is the one real risk. We mitigate by (a) pinning to a known-good release in the Orange Pi image and updating deliberately, (b) keeping our plugin tree self-contained, (c) being prepared to maintain a soft-fork temporarily if a breaking upstream change lands mid-pilot. None of that is unusual for a fast-moving runtime.

---

## 6. What Aksara takes / what Aksara replaces / what Aksara contributes upstream

**Aksara takes (use unmodified):**

- The harness loop, `run_agent.py` orchestrator, provider transport layer.
- MCP client + server. aksara-cli plugs in as a peer MCP server; LightRAG plugs in as a peer MCP server; ETNOS UI consumes the Hermes Agent MCP server.
- The default SQLite + FTS5 session DB and the compression/lineage primitives. Civic-action traceability rides on `parent_session_id`.
- The skill system, the hook system, the cron scheduler, the subagent spawner.
- The plugin discovery model (`~/.hermes/plugins/`, `.hermes/plugins/`, pip entry points).
- Voice Mode (Whisper) for WhatsApp/voice intake.
- Profiles as the per-node isolation primitive (one Aksara node = one process = one profile).
- OpenViking as the active hierarchical memory provider; Holographic as the offline degradation path.
- The sandbox backend abstraction (we default to `local` on the Pi, with the runtime's command blocklist and approval-with-timeout).

**Aksara replaces / writes downstream (Aksara plugins, kept private or sectoral-contract-shaped):**

- The web dashboard — replaced with the ETNOS-skinned, Bahasa Indonesia, institutional-crest UI specified in [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md).
- The intake gateway — WhatsApp, SMS, voice, radio, ETNOS DM live as Aksara intake plugins, not vanilla Hermes Agent gateway adapters.
- The provider routing policy — a pre-call hook that runs Presidio-ID and selects cloud-LLM vs local-SLM per request, with offline detection.
- The `did:wba` binding — a startup plugin loads HSM keys, signs outbound ActivityPub messages, exposes the DID Document.
- The persona model — a small "active persona" state on the profile, with intent-classification routing and role-bound skill registries (one process, multiple personas).
- The BSrE / e-meterai sealing path — strict aksara-cli tool boundary, with a hook rejecting any LLM-direct output claiming to be a sealed artifact.
- The Merkle audit anchor emission — a hook on session compression and on every civic-action tool call, batched into the daily anchor per [`docs/aksara/architecture.md`](./../aksara/architecture.md) §1.

**Aksara contributes upstream (MIT, into `NousResearch/hermes-agent`):**

1. **Policy-based provider routing as a first-class hook point.** Today the provider switch is operator-driven (`hermes model`). We contribute a `pre_inference` hook with a clean contract — given the prompt and conversation state, return a `(provider, model)` tuple. Aksara's Presidio-ID router sits on top; other operators get the same primitive for cost-routing, latency-routing, jurisdiction-routing.
2. **Native audio-input through the agent loop, with Gemma-multimodal as a reference provider.** The community already showed it works end-to-end through vLLM; making it a first-class capability inside the runtime helps everyone deploying SLM-multimodal on edge devices. Aksara cares because of low-literacy operators in [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md) §10.
3. **The ActivityPods adapter shim's MCP wrapper.** The bridge layer we ship for ETNOS-on-PieFed-to-ActivityPods (proposal §14 amendment) includes an MCP server exposing actor/inbox/outbox/basic-Pod-container endpoints. Released as a standalone plugin per [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) §7, but we also list it in the Hermes Agent plugin index so other operators of MCP-aware fediverse agents pick it up.

These three are real artifacts, useful beyond Aksara, and credit the upstream loudly. They land Aksara in the Hermes Agent contributor tier rather than the "user of someone else's tool" tier — which matches the NLnet narrative we want to tell.

---

## 7. Related documents

- [`docs/aksara/architecture.md`](./../aksara/architecture.md) — consolidated Aksara architecture (Hermes Agent named here, §2)
- [`docs/aksara/onboarding.md`](./../aksara/onboarding.md) — institutional-actor onboarding ceremony (§12 closes the Hermes lock-in question)
- [`docs/aksara/proposal-v3.6-amendments.md`](./../aksara/proposal-v3.6-amendments.md) — amendments §3 and §6 surface the Hermes Agent / Hermes-3 distinction
- [`docs/research/decentralized-agent-memory.md`](./decentralized-agent-memory.md) — LightRAG + OpenViking memory composition
- [`docs/etnos/goal-ux.md`](./../etnos/goal-ux.md) — the seamless UX that the skinning surface must serve
- [`docs/aksara/master-proposal-digest.md`](./../aksara/master-proposal-digest.md) — Aksara product framing (PNS Digital, Civic Transaction primitive, Paket Kelurahan MVP)
