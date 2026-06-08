# Computer-use and browser-use for Aksara's legacy government bridge

Status: research note, v0.1, 2026-06-08. Owner: Aksara core.
Scope: the "leg without API" of the Civic Transaction, as named in the Master Proposal v3.5 §13/§19 and `docs/aksara/architecture.md`.

---

## TL;DR

**Aksara adopts Skyvern as the production legacy-bridge runtime, self-hosted on the Hub (provincial server) and reached from the node over an authenticated mTLS tunnel. Skyvern drives a Patchright-based Chromium running inside a Firecracker microVM per session. Vision-language reasoning is delegated to the same provider abstraction Hermes Agent already uses — cloud-primary with an Indonesia-hosted target — so we never couple to one vendor's computer-use API.** browser-use is adopted as the development sandbox and as a lighter fallback for DOM-stable sites. An open-weights GUI-grounded VLM is evaluated for the offline backstop. We skip first-party closed Computer Use APIs as the orchestrator, all hosted agent-as-a-service products, and any captcha-solving SaaS. Each hosted path violates the data-residency commitment in `architecture.md` §7.

---

## 1. Landscape scorecard (mid-2026)

Seven hard constraints: (S)elf-hosted, (L)ocal-LLM-capable, (A)udit/replay, (I)solation primitive, (V)ision grounding for non-English UIs, (C)redential vault hook, (H)uman-in-the-loop gate. Five = excellent, one = blocker.

| Project | License | S | L | A | I | V | C | H | Net |
|---|---|---|---|---|---|---|---|---|---|
| **Skyvern** | AGPL-3.0 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | **Primary** |
| **browser-use** | MIT | 5 | 5 | 3 | 2 | 3 | 3 | 3 | Dev / fallback |
| **Stagehand v3** | MIT | 4 | 3 | 4 | 2 | 3 | 3 | 4 | Watch |
| **Open-weights GUI agent stack** (ByteDance lineage) | Apache-2.0 | 5 | 5 | 3 | 3 | 3 | 2 | 3 | Offline backstop |
| **Vision-only screen parser** (Microsoft Research lineage) | MIT | 5 | 5 | 2 | n/a | 5 | n/a | n/a | Library under |
| Open Interpreter | AGPL/MIT | 5 | 5 | 3 | 1 | 2 | 2 | 4 | Skip |
| First-party Computer Use tool (frontier cloud) | proprietary | 3 | 1 | 3 | n/a | 4 | 3 | 3 | Reasoning only |
| Hosted browsing agents (Operator-successor, Mariner-successor, Copilot Agent, Browser Use Cloud, Browserbase, Nova Act) | proprietary, hosted | 1 | 1 | 2–4 | 1–4 | 4 | 1 | 1–5 | Skip — residency |
| Patchright | MIT (Playwright fork) | 5 | n/a | 3 | n/a | n/a | n/a | n/a | Lower layer |

**Skyvern** (~21.6k stars, May 2026): AGPL-3.0, Docker Compose and K8s manifests, any OpenAI-compatible endpoint (so we point at our internal gateway), live browser stream for human intervention, native 2FA/TOTP and vault plumbing, explicitly markets government form completion. AGPL is fine here: Aksara is institution-operated, not hosted-as-a-service, so §13 is not triggered.

**browser-use** (~95k stars, v0.12.9 May 2026, MIT): best DX in the space, light on production hardening — Chrome memory pressure, no microVM isolation by default, weaker credential and audit surfaces.

**Stagehand v3** (MIT): rewrote on CDP Feb 2026, 44% faster; `act`/`extract`/`observe`/`agent` primitives plus self-healing replay cache are excellent. But the project's gravity is its commercial cloud — pure self-hosted is supported, not the happy path.

**Open-weights GUI-grounded VLMs** (ByteDance lineage, Apache-2.0): strongest open option for grounded UI understanding — 7B class fits a Hub GPU. Targets the offline-degraded path.

**Vision-only screen parsers** (Microsoft Research lineage, MIT): not agents — they convert screenshots to structured elements (icon detection + caption). Sit *under* whatever agent runs, especially when the driving VLM is a generalist not GUI-trained.

**Rejected.** The hosted Operator-successor (folded into a general agent product Aug 2025) runs on the vendor's virtual computer; the Lurah's Dukcapil credential would necessarily transit foreign infra. The Google research browser-agent was shut down 4 May 2026 and folded into hosted Chrome auto-browse. Microsoft Edge-for-Business Agent Mode is enterprise-tenant gated. Browser Use Cloud and Browserbase are good products, incompatible with residency. The frontier first-party Computer Use *tool* is fine as an inner reasoning primitive, but coupling our orchestration to one vendor's beta is the wrong shape — Skyvern wraps it and our provider abstraction routes around it.

---

## 2. The recommended stack

```
Hermes Agent (reasoning)
    │  tool call: legacy_bridge(target, task, vault_ref, approval_policy)
    ▼
aksara-cli (deterministic dispatcher, audit emitter)
    │  mTLS → Hub provincial server
    ▼
Skyvern controller (self-hosted, AGPL)
    │  receives short-lived broker token from OpenBao
    ▼
Firecracker microVM (per session, ~125ms boot, <5 MiB overhead)
    └── Patchright Chromium (stealth-patched Playwright)
            └── target government portal
                    │
    LLM reasoning loop (vision + DOM) via Hermes provider abstraction:
       primary: cloud frontier VLM (Indonesia-hosted target)
       offline: open-weights GUI VLM on Hub GPU
    │
    every step:  observe → reason → act → HSM-signed checkpoint
    │
    on uncertainty / captcha / drift: PAUSE → operator approval via WhatsApp + e-ink
```

**Skyvern is the orchestrator.** Site fingerprinting, action graph, retry policy, livestream, replay logs, 2FA / TOTP, vault integration. We do not write our own.

**Patchright is the browser.** Government portals are not hostile to us, but many sit behind shared CDNs (Cloudflare, Akamai) whose bot challenges trigger on vanilla Playwright fingerprints. Drop-in MIT replacement, cheap insurance.

**Firecracker is the isolation primitive.** Per session, per credential, per citizen. By Feb 2026, consensus is that shared-kernel container isolation is insufficient for agents holding institutional credentials. ~125 ms cold start is well inside the SLO.

**OpenBao holds credentials** (proposal §325). Skyvern gets a short-lived broker token scoped to target + session — never the underlying secret. The VLM never sees plaintext.

**Hermes provider abstraction for the VLM.** Skyvern points at our internal gateway. Routes to Indonesia-hosted target primarily, frontier cloud as fallback, open-weights GUI VLM on Hub GPU offline. The orchestrator is unaware which provider answered.

**aksara-cli wraps the call as a deterministic tool.** Input `(target, task spec, vault ref, approval policy)`, output `(result, signed audit chain, replay handle)`. Reasoning never *drives* the browser; it requests an outcome and Skyvern produces one. The Civic Transaction split (`architecture.md` §4) is preserved exactly.

---

## 3. Per-step contract

Per step inside a Skyvern session: **observe** (screenshot + DOM; on dense pages a parser pass narrows the region first) → **reason** (VLM proposes next action; if confidence is below threshold *or* the action submits a form *or* commits a financial transaction, the session pauses unconditionally and surfaces an approval prompt on e-ink + WhatsApp) → **act + checkpoint** (action executes, a signed checkpoint is appended to the event store per `architecture.md` §367: screenshot hash, action-JSON hash, HSM signature, prior-checkpoint pointer; the whole session is replayable).

Approval policy is part of the task spec. Surat-domisili defaults to "approve once at submit." SISKEUDES disbursement defaults to "approve every submission." Lurah / Bendahara configures at onboarding.

---

## 4. Cost model — MVP scale (500 docs/month/unit)

Conservative assumptions.

- Average Dukcapil verification: 8 LLM-driven steps.
- Each step: ~3500 input tokens (screenshot + DOM + history), ~150 output tokens.
- Cloud reasoning at $3/M input, $15/M output (typical mid-2026 frontier pricing).
- 30% of documents need the legacy bridge; the rest go through aksara-cli with structured APIs where they exist.

Per legacy-bridge document: 8 × (3500 × $3/M + 150 × $15/M) ≈ **$0.10**.
500 × 30% = 150 bridged docs/month × $0.10 = **~$15/month/unit** in LLM spend on the bridge. On the Indonesia-hosted target at half cost, **~$7.50/month/unit**. Across the 7-kelurahan MVP: under $100/month total, well inside the per-unit operating envelope and small compared to the IoT SIM plan.

**Latency.** The frontier first-party computer-use beta adds ~1.2k tokens of tool overhead per call before screenshots. With current frontier VLM TTFT around 600 ms and per-step wall time around 1.5 s including action execution, an 8-step Dukcapil flow lands at **~15 s** on healthy network — well inside the 2-minute SLO.

**Reliability budget.** Best open OSWorld scores in mid-2026 sit at 72–83% verified (frontier closed) and ~25% at 50 steps for the strongest open 72B-class GUI model. OSWorld is harder than civic-form completion (multi-app desktop tasks vs. single-portal known-shape forms). Realistic first-try success on a known-shape Dukcapil form is **~90–95% with a frontier VLM, ~70% with the open offline fallback**. Target: 90% completed without human touch, 10% routed to Lurah and completed within the same session.

---

## 5. Reliability and fallback posture

Fail visibly, queue cleanly, never autonomously guess.

- **First-encounter fingerprint.** Skyvern records the action graph plus a structural fingerprint (URL path, DOM landmark hashes, screenshot perceptual hash). Subsequent runs diff against it; on drift, pause and ask the operator. Drift fingerprints are shared across nodes via the ETNOS metadata channel — one Lurah's discovery serves all neighbours.
- **Captcha.** No machine solving. Pause, surface to WhatsApp, operator solves, agent resumes. 15–45 s round trip is acceptable. No third-party solver service — Civic Transaction posture forbids it.
- **Offline degradation.** When cloud reasoning is unreachable, the agent does *not* silently fall back to the local VLM for novel forms. It falls back only when the fingerprint matches a known-good run — replay with grounding adjustment. Novel forms queue for the next online window.
- **Shared-credential races.** When two Aksaras in the same regency operate under the same OPD credential, the Hub serialises sessions per credential via an advisory lock at broker time. One reason the runtime lives on the Hub, not the node.
- **PII at boundary.** Presidio-ID (`architecture.md` §123) inspects observations before they leave the node; on PII detection, route to offline path or pause.

---

## 6. Risk surface

| Risk | Mitigation |
|---|---|
| Portal UI redraw silently breaks flow | Structural fingerprint + drift alert + per-step replay; shared across nodes via ETNOS |
| Prompt injection via portal content exfiltrates a credential | Credentials live in vault; broker tokens only; VLM I/O is structured-action JSON; the secret is never in the model context |
| Race on shared institution credential | Hub-side advisory lock per credential at broker time |
| Foreign cloud touches PII | Presidio-ID at boundary, route to offline path or pause |
| AGPL viral concern from orchestrator | Institution-operated, not a hosted service — §13 not triggered; our integration code published under AGPL-compatible licence |
| Captcha gates us out | Human-in-the-loop only; never automated captcha solving |
| User-agent string flagged | Patchright stealth plus institutional User-Agent header negotiated with each Diskominfo at onboarding (the honest path — we are not pretending) |
| Vendor lock to one VLM | Hermes provider abstraction; at least two providers + the open offline backstop tested before MVP launch |
| Site requires e-KYC selfie | Out of scope here; routed to Privy / Verihubs per proposal §327 |

---

## 7. Upstream contributions

Four targeted patches for the grant year.

1. **To Skyvern**: configurable approval-policy hook + structured audit-emission interface, so per-step / per-submit / per-finalize approval is declarative. Other government deployers need this too.
2. **To Skyvern**: a Bahasa Indonesia UI-label dataset and evaluation slice — `(portal screenshot, ground-truth element bbox, Indonesian label, semantic intent)` drawn from the deployment, anonymised at source. Highest-leverage contribution we can make.
3. **To the open GUI-VLM stack and the vision-only parser**: an Indonesian-language grounding fine-tune (Apache-2.0 weights). A small LoRA on labelled Indonesian forms would close a real gap; neither project documents Bahasa Indonesia evaluation today.
4. **To Patchright**: stability fixes for long-lived sessions against Indonesia's typical government CDN stack.

---

## 8. What we explicitly skip

- **First-party closed Computer Use tools as orchestrators.** Inner primitive yes, orchestrator no.
- **All hosted browsing agents** (Operator-successor, Mariner-successor, Copilot Agent Mode, Browser Use Cloud, Browserbase, Nova Act). Each routes institutional credentials through foreign infrastructure.
- **Captcha-solving SaaS.** Banned by Civic Transaction posture.
- **browser-use as the production runtime.** Great for prototyping, weaker production-hardening and audit story than Skyvern.
- **Open Interpreter on production nodes.** Local code-execution agent without strong isolation; the unconfined-shell threat model is wrong for a device that signs civic documents.

---

## 9. Adoption phasing

- **M0–M2** (prototype): browser-use + Patchright + a frontier cloud VLM. Single Dukcapil flow end-to-end on a developer laptop. Goal: prove the audit-emission contract.
- **M3–M5** (consolidation): swap orchestrator to Skyvern self-hosted; add OpenBao broker token; add Firecracker isolation on Hub.
- **M6–M8** (pilot): two kelurahan in production with full operator-approval UX on e-ink + WhatsApp. Open offline VLM on Hub GPU tested but not relied on.
- **M9–M12** (scale): 5–7 kelurahan; upstream the Indonesian grounding dataset; publish drift-alert protocol over ETNOS metadata channel.

The bridge is not the demo's centrepiece (`architecture.md` §441 — voice-in/surat-out is) but it is the credibility test. The day we can show a Lurah completing a Dukcapil verification in 15 seconds from a voice note, with full audit replay and human approval at submit — the proposal's core claim is real.

---

## Sources

Orchestrators: [Skyvern repo](https://github.com/Skyvern-AI/skyvern), [Skyvern — government forms](https://www.skyvern.com/government), [browser-use repo](https://github.com/browser-use/browser-use), [browser-use OSS vs cloud](https://docs.browser-use.com/open-source/introduction), [Stagehand repo](https://github.com/browserbase/stagehand), [Stagehand v3 announcement](https://www.browserbase.com/stagehand). Open GUI VLMs and parsers: [open GUI-VLM lineage](https://github.com/bytedance/ui-tars), [desktop runtime](https://github.com/bytedance/UI-TARS-desktop), [GUI-VLM paper arXiv 2501.12326](https://arxiv.org/pdf/2501.12326), [screen parser research](https://www.microsoft.com/en-us/research/articles/omniparser-for-pure-vision-based-gui-agent/), [screen parser repo](https://github.com/microsoft/OmniParser). Hosted incumbents and discontinuations: [frontier first-party computer-use tool docs](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool), [original launch Oct 2024](https://www.anthropic.com/news/3-5-models-and-computer-use), [recent model card with OSWorld](https://www.anthropic.com/news/claude-sonnet-4-6), [Computer-Using Agent research](https://openai.com/index/computer-using-agent/), [Operator successor product](https://openai.com/index/introducing-chatgpt-agent/), [Operator transition tracker](https://presenc.ai/research/openai-operator-update-tracker-2026), [Google research browser agent](https://deepmind.google/models/project-mariner/), [shutdown coverage May 2026](https://www.androidheadlines.com/2026/05/google-shuts-down-project-mariner-ai-agent.html), [Edge update May 2026](https://blogs.windows.com/msedgedev/2026/05/13/new-updates-to-edge-across-desktop-and-mobile/), [Copilot Studio computer use](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use). Lower layers and benchmarks: [Patchright repo](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright), [Firecracker / gVisor sandboxing 2026](https://northflank.com/blog/how-to-sandbox-ai-agents), [OSWorld leaderboard](https://llm-stats.com/benchmarks/osworld), [OSWorld 2026 averages](https://benchlm.ai/benchmarks/osWorld), [Open Interpreter](https://github.com/openinterpreter/open-interpreter), [Browser-use vs Stagehand](https://www.skyvern.com/blog/browser-use-vs-stagehand-which-is-better/), [framework wars analysis](https://dev.to/stevengonsalvez/browser-tools-for-ai-agents-part-2-the-framework-wars-browser-use-stagehand-skyvern-4gn), [State of Browser Use May 2026](https://michaellivs.com/blog/state-of-browser-use-2026/), [Dukcapil portal](https://dukcapil.kemendagri.com/).
