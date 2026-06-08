# Computer-use and browser-use for Aksara's legacy government bridge

Status: research note, v0.1, 2026-06-08. Owner: Aksara core.
Scope: the "leg without API" of the Civic Transaction, as named in the Master Proposal v3.5 §13/§19 and `docs/aksara/architecture.md`.

---

## TL;DR

The opinionated recommendation. **Aksara adopts Skyvern as the production legacy-bridge runtime, self-hosted on the Hub (provincial server) and reached from the node over an authenticated mTLS tunnel. Skyvern drives a Patchright-based Chromium running inside a Firecracker microVM per session. The vision-language reasoning is delegated to the same provider abstraction that Hermes Agent already uses (cloud-primary, Indonesia-hosted NIM target), so we do not couple to one vendor's computer-use API.** We adopt browser-use as the development / debugging sandbox and as a lighter fallback when a site is well-behaved and DOM-stable. We evaluate UI-TARS-7B locally for the offline backstop. We skip Anthropic's first-party Computer Use *as the orchestration layer*, ChatGPT Agent, Project Mariner's successors, and all "agent-as-a-service" hosted browsers. Every hosted-agent path violates the data-residency commitment in `architecture.md` §7.

---

## 1. Landscape scorecard (mid-2026)

Rating against Aksara's seven hard constraints: (S)elf-hosted, (L)ocal-LLM-capable, (A)udit/replay, (I)solation primitive, (V)ision grounding for non-English UIs, (C)redential vault hook, (H)uman-in-the-loop gate. Five = excellent, one = blocker.

| Project | License | S | L | A | I | V | C | H | Net |
|---|---|---|---|---|---|---|---|---|---|
| **Skyvern** | AGPL-3.0 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | **Primary** |
| **browser-use** | MIT | 5 | 5 | 3 | 2 | 3 | 3 | 3 | Dev/debug |
| **Stagehand v3** | MIT | 4 | 3 | 4 | 2 | 3 | 3 | 4 | Watch |
| **UI-TARS-Desktop** | Apache-2.0 | 5 | 5 | 3 | 3 | 3 | 2 | 3 | Local backstop |
| **OmniParser v2** | MIT | 5 | 5 | 2 | n/a | 5 | n/a | n/a | Library |
| **Open Interpreter** | AGPL/MIT | 5 | 5 | 3 | 1 | 2 | 2 | 4 | Skip |
| Anthropic Computer Use (API tool) | proprietary | 3 | 1 | 3 | n/a | 4 | 3 | 3 | Reasoning only |
| ChatGPT Agent (ex-Operator) | proprietary, hosted | 1 | 1 | 2 | 1 | 4 | 1 | 2 | Skip |
| Project Mariner → Gemini Agent | proprietary, hosted | 1 | 1 | 1 | 1 | 4 | 1 | 1 | Dead (shutdown May 2026) |
| Microsoft Copilot in Edge | proprietary, hosted | 1 | 1 | 1 | 2 | 4 | 1 | 2 | Skip |
| Browser Use Cloud | proprietary, hosted | 1 | 1 | 4 | 4 | 3 | 4 | 4 | Skip |
| Browserbase / Stagehand Cloud | proprietary, hosted | 1 | 1 | 4 | 4 | 3 | 4 | 4 | Skip |
| Amazon Nova Act | proprietary, hosted | 1 | 1 | 3 | 4 | 3 | 3 | 5 | Skip |
| Patchright (raw) | MIT (Playwright fork) | 5 | n/a | 3 | n/a | n/a | n/a | n/a | Lower layer |

Notes on the leaders.

**Skyvern** (Skyvern-AI/skyvern, ~21.6k stars by May 2026) is AGPL-3.0, ships Docker Compose and Kubernetes manifests, supports Ollama and any OpenAI-compatible local endpoint, ships a livestream of the running browser for human intervention, has native 2FA / TOTP support, and is already used by paying customers for filling US government forms — exactly the workload shape. It is the only project in the field that explicitly markets government form completion as a target. AGPL is acceptable for our deployment posture: Aksara nodes are operated by the institution itself, not offered as a hosted service, so the network-use clause is not triggered.

**browser-use** (browser-use/browser-use, MIT, ~95k stars, v0.12.9 in May 2026) is the most-loved DX in the space and trivial to embed. It is also the lightest on production hardening (Chrome memory pressure, no microVM isolation, weaker credential vault story).

**Stagehand v3** (browserbase/stagehand, MIT) rewrote on Chrome DevTools Protocol in Feb 2026, 44% faster than v2, and its `act`/`extract`/`observe`/`agent` primitives plus self-healing replay cache are genuinely good. But the project's centre of gravity is Browserbase Cloud — running it standalone is supported but not the happy path.

**UI-TARS-Desktop** (bytedance/UI-TARS-desktop, Apache-2.0) is the strongest *open-weights* vision-grounded GUI agent — UI-TARS-1.5 at 24.6% OSWorld at 50 steps with a 7B model that fits an Orange Pi 5 NPU budget. Important specifically for the offline-degraded path on the node itself.

**OmniParser v2** (microsoft/OmniParser, MIT) is not an agent, it is a screen-to-structured-elements parser (YOLO + Florence2). 39.5% on ScreenSpot Pro. Useful as a grounding library *under* whatever agent runs, especially when the LLM driver is a generalist that has not been GUI-trained.

Notes on the rejected.

**ChatGPT Agent** absorbed Operator on 31 August 2025; the agent runs on OpenAI's virtual computer, not ours. Strict no-go: the *credential* of a Lurah hitting Dukcapil would necessarily transit OpenAI infra. **Project Mariner** was shut down on 4 May 2026 and folded into Gemini Agent / Chrome auto-browse — also hosted-only. **Microsoft Copilot Agent Mode** in Edge for Business is enterprise-tenant gated and hosted in Microsoft 365. **Browser Use Cloud** and **Browserbase** are excellent products, completely incompatible with the data-residency commitment.

**Anthropic Computer Use** is interesting but not as the orchestration layer. The schema-less `computer` tool emits `screenshot`/`left_click`/`type`/`scroll` and expects the *caller* to execute the actions in a VM — that's just an inner loop. The Hermes Agent provider abstraction can route Skyvern's reasoning calls through this tool when the cloud provider is Anthropic, but Aksara should not write code that depends on it. The same path opens through any frontier vision-LLM Skyvern is pointed at.

---

## 2. The recommended stack

```
Hermes Agent (reasoning)
    │  tool call: legacy_bridge(target, task, vault_ref)
    ▼
aksara-cli (deterministic dispatcher, audit emitter)
    │  mTLS → Hub provincial server
    ▼
Skyvern controller (self-hosted, AGPL)
    │  pulls credentials from OpenBao via short-lived broker token
    │  spawns a session container
    ▼
Firecracker microVM (per session, ~125ms boot, <5 MiB overhead)
    └── Patchright Chromium (stealth-patched Playwright)
            └── target government portal
                    │
    LLM reasoning loop (vision + DOM) via Hermes provider abstraction:
       cloud-primary (NIM Indonesia / Anthropic Sonnet 4.6-class)
       offline fallback: UI-TARS-7B on Hub GPU (or node NPU for Aksara Go)
    │
    every step:  observe → reason → act → checkpoint signed by HSM
    │
    on uncertainty / captcha / form drift: PAUSE, surface to operator on node OLED
```

**Layer breakdown.**

- **Skyvern** is the orchestrator. It owns site fingerprinting, the action graph, the retry policy, the livestream surface, replay logs, 2FA / TOTP plumbing, and the vault integration. It calls into a pluggable VLM for reasoning. We do not write our own orchestrator.

- **Patchright** is the browser. Government portals are not actively hostile to us, but many run behind shared CDNs (Cloudflare, Akamai) whose bot-managed challenges are triggered by vanilla Playwright fingerprints. Patchright as a drop-in Playwright replacement is cheap insurance and ships under MIT.

- **Firecracker microVM** is the isolation primitive. Per session, per credential, per citizen. Docker/runc was once acceptable for agent workloads; by Feb 2026 the consensus is shared-kernel isolation is insufficient for browser agents holding institutional credentials. Firecracker's ~125 ms cold start is well under the 2-minute SLO for Dukcapil verification.

- **OpenBao** (the proposal's chosen vault, §325) holds the institution's credentials. Skyvern receives a *short-lived broker token* scoped to the target site and the session, never the underlying secret. This means the LLM driver — wherever it executes — never sees plaintext credentials in its tool I/O.

- **Hermes provider abstraction** for the vision-LLM. Skyvern can be pointed at any OpenAI-compatible endpoint, so we point it at our internal gateway. The gateway routes to NIM Indonesia primarily, to a frontier cloud model as Anthropic-class fallback, and to UI-TARS-7B on the Hub GPU when offline. The orchestrator does not know or care which.

- **UI-TARS-7B** is the offline backstop. When the IoT SIM drops mid-flow, the agent does not need to be human-grade — it needs to either complete a routine, fingerprinted form, or stop cleanly and queue. 7B fits an Orange Pi 5 NPU only at heavy quantisation; realistically UI-TARS lives on the Hub GPU, and the node-local fallback is "stop and queue."

- **aksara-cli** wraps the whole call as a deterministic tool — input is `(target, task spec, vault ref, approval policy)`, output is `(result, signed audit chain, replay handle)`. The Hermes Agent never *drives* the browser; it requests an outcome and Skyvern produces one.

---

## 3. Architecture sketch elaborated

The Civic Transaction split in `architecture.md` §4 is preserved exactly. Reasoning produces a plan; aksara-cli produces the formal output. The new piece is that one *step* in the plan can be "complete this on Dukcapil," which expands into the Skyvern session above.

Per step inside the session, three things happen.

1. **Observe.** Skyvern's structured screenshot + DOM extraction (in tight pages, ~10–15 token actions per Browser-Use's design lessons; in large pages, OmniParser-style element grounding) is sent to the VLM.

2. **Reason.** The VLM proposes the next action. If confidence is below a threshold *or* the action would submit a form, the session pauses and posts a structured approval prompt to the Hermes Agent, which in turn surfaces it on the node's e-ink strip and to the operator's WhatsApp. The operator either approves, edits, or denies.

3. **Act + checkpoint.** Action is executed against the browser. A signed checkpoint is emitted to the append-only event store (`architecture.md` §7) — hash of screenshot, hash of action JSON, HSM signature, prior-checkpoint pointer. The entire session is replayable.

The approval policy is part of the task spec. For surat-domisili the default is "approve once at submit" (low risk, single legal step). For SISKEUDES disbursements the default is "approve every form submission" (financial, multi-step). The Lurah / Bendahara configures these at onboarding.

---

## 4. Cost model — MVP scale (500 docs/month/unit)

Assumptions, conservative.

- Average Dukcapil verification: 8 LLM-driven steps.
- Each step: ~3500 input tokens (screenshot + DOM + small history) and ~150 output tokens.
- Cloud reasoning at Sonnet 4.6-class pricing — $3/M input, $15/M output.
- 30% of documents require the legacy bridge (the rest are pure aksara-cli with structured Dukcapil API where available).

Per legacy-bridge document: 8 × (3500 × $3/M + 150 × $15/M) = **~$0.10**.
500 docs/month × 30% = 150 bridged docs/month × $0.10 = **~$15/month/unit** in LLM spend on the bridge.

If we land on NIM Indonesia at half the per-token cost (the proposal's §22 stated goal), that drops to **~$7.5/month/unit**. Across the 7-kelurahan MVP: **<$100/month total**, well inside the per-unit operating envelope. This is small compared to the IoT SIM data plan.

Latency. The Anthropic computer-use beta adds ~1.2k tokens of tool overhead per call before screenshots. With current frontier-VLM TTFT of ~600 ms and per-step overhead of ~1.5 s including action execution, an 8-step Dukcapil flow lands at **~15 s wall time** when the network is healthy. Comfortably inside the 2-minute SLO; the citizen waits less time than they would queueing.

Reliability budget. Best open OSWorld scores in mid-2026: frontier closed models ~72–83% verified, open UI-TARS-72B 24.6%, UI-TARS-7B materially lower. OSWorld is harder than civic-form completion (multi-app desktop tasks vs. single-portal known-shape forms), so realistic first-try success on a known-shape Dukcapil form is **~90–95% with a frontier VLM, ~70% with UI-TARS-7B local fallback**. The bridge target is therefore: 90% completed without human touch, 10% routed to Lurah, of which all 10% completed within the same session.

---

## 5. Reliability and fallback posture

Failure is normal. The posture is *fail visibly, queue cleanly, never autonomously guess*.

- **First-encounter fingerprint.** On the first run against any portal, Skyvern records the action graph and a structural fingerprint (URL path, key DOM landmark hashes, screenshot perceptual hash). Subsequent runs diff against the fingerprint; if drift is detected, the session pauses and asks the operator to re-confirm the next action. Drift fingerprints are shared across nodes via the ETNOS metadata channel (`architecture.md` §367) so one Lurah's discovery serves all neighbours.

- **Captcha.** No machine solving. The session pauses, surfaces the screenshot to the operator's WhatsApp, the operator solves, the agent resumes. Net 15–45 s human round trip is acceptable. We do not contract with captcha-solving services — the Civic Transaction explicitly disallows third parties in the loop.

- **Uncertainty threshold.** If the VLM emits an action with low logit confidence, *or* the action is a form submit, *or* the action would commit a financial transaction, the agent pauses unconditionally. This is policy in aksara-cli, not in Skyvern, so we can tighten it independently of upstream.

- **Offline degradation.** When the cloud LLM is unreachable, the agent does *not* fall back silently to UI-TARS-7B for novel forms. It falls back only for forms whose fingerprint matches a previous successful run — i.e., replay with grounding adjustment. Novel forms during offline mode queue for the next online window.

- **Race conditions on shared regency-level Dukcapil credentials.** If two Aksaras in the same regency are operating under the same OPD credential, the Hub serialises sessions per credential — a simple advisory lock in OpenBao at token-broker time. This is one of the reasons the runtime lives on the Hub rather than purely on the node.

---

## 6. Risk surface

| Risk | Mitigation |
|---|---|
| Portal UI redraw silently breaks flow | Structural fingerprint + drift alert + per-step audit replay; shared across nodes via ETNOS |
| Credential exfiltration via prompt injection in portal content | Credentials live in vault; broker token only; output is structured-action JSON only; the VLM never sees the secret |
| Race on shared institution credential | Hub-side advisory lock per credential at token-broker time |
| Foreign cloud inference touches PII | Presidio-ID at the boundary (already in `architecture.md` §123); when PII is detected, the reasoning routes to the offline path or pauses |
| AGPL viral concern from Skyvern | Aksara is deployed by institutions, not offered as a hosted service; AGPL §13 is not triggered. We publish our integration code under AGPL-compatible licence |
| Captcha gating us out | Human-in-the-loop only; never automated captcha solving |
| User-agent string flagging | Patchright stealth + institutional User-Agent header policy negotiated with each Diskominfo at onboarding (this is the right way — we're not pretending) |
| Vendor lock to one VLM provider | Hermes provider abstraction; tested on at least two providers + UI-TARS local before MVP launch |
| Site requires e-KYC selfie | Out of scope for computer-use leg; routed to Privy / Verihubs path per proposal §327 |

---

## 7. Upstream contributions

Four targeted patches Aksara should aim to merge during the grant year.

1. **To Skyvern**: a configurable approval-policy hook + structured audit-emission interface, so per-step / per-submit / per-finalize approval can be set declaratively instead of through ad hoc code. Aksara needs this; other government deployers do too.

2. **To Skyvern**: a Bahasa Indonesia UI label dataset and evaluation slice — pairs of `(government portal screenshot, ground-truth element bounding boxes, Indonesian label, semantic intent)`. Drawn from our 5–7 kelurahan deployment, anonymised at source. This is the single highest-leverage contribution the project could make to the open ecosystem.

3. **To UI-TARS / OmniParser**: an Indonesian-language grounding fine-tune (Apache-2.0 weights), since neither project currently documents Bahasa Indonesia evaluation. Even a small LoRA on labelled Indonesian government forms would close a real capability gap.

4. **To Patchright**: stability fixes encountered on long-lived sessions against Indonesia's typical government CDN stack (Akamai, Cloudflare ID nodes). Likely small but real.

---

## 8. What we explicitly skip

- **Anthropic computer use as orchestrator.** The schema-less `computer` tool is good as an inner reasoning primitive; coupling our orchestration to it locks us to one vendor's beta API. Skyvern wraps the orchestration in a way we control.

- **ChatGPT Agent / former Operator / Mariner / Copilot Agent Mode / Browser Use Cloud / Browserbase / Nova Act.** All hosted. Each would route institutional credentials through foreign infrastructure; each violates the data-residency commitment in `architecture.md` §7.

- **Captcha-solving SaaS.** Banned by Civic Transaction posture.

- **Browser-use as the production runtime.** Excellent DX, fine for development sandbox; weaker production-hardening, weaker credential and audit story than Skyvern. We will absolutely use it during M0–M2 prototyping.

- **Open Interpreter on production nodes.** Local code execution agent without strong isolation; the unconfined-shell threat model is wrong for a device that signs civic documents.

- **OpenAI / Google / Anthropic computer-use as a service tier.** Same reason as the hosted skip list.

---

## 9. Adoption phasing

- **M0–M2** (prototype): browser-use + Patchright + Anthropic VLM. Single Dukcapil flow end-to-end on a developer laptop. Goal: prove the audit-emission contract.
- **M3–M5** (consolidation): swap orchestrator to Skyvern self-hosted, add OpenBao broker token, add Firecracker isolation on Hub.
- **M6–M8** (pilot deploy): two kelurahan in production, with full operator-approval UX on e-ink + WhatsApp. UI-TARS-7B on Hub GPU as offline fallback path tested but not relied on.
- **M9–M12** (scale): 5–7 kelurahan; upstream Indonesian grounding dataset; publish drift-alert protocol over ETNOS metadata channel.

The bridge is not the demo's centrepiece (`architecture.md` §441 — voice-in/surat-out is) but it is the credibility test. The day we can show a Lurah completing a Dukcapil verification, in 15 seconds, from a voice note, with full audit replay and human approval at submit — the proposal's core claim is real.

---

## Sources

- [Anthropic — Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6)
- [Anthropic — Computer use tool docs](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool)
- [Anthropic — original computer use launch](https://www.anthropic.com/news/3-5-models-and-computer-use)
- [OSWorld leaderboard](https://llm-stats.com/benchmarks/osworld)
- [OSWorld 2026 model averages — BenchLM](https://benchlm.ai/benchmarks/osWorld)
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/)
- [OpenAI — ChatGPT Agent](https://openai.com/index/introducing-chatgpt-agent/)
- [Operator → ChatGPT Agent transition tracker (Presenc)](https://presenc.ai/research/openai-operator-update-tracker-2026)
- [Google DeepMind — Project Mariner](https://deepmind.google/models/project-mariner/)
- [Project Mariner shutdown coverage (Android Headlines, May 2026)](https://www.androidheadlines.com/2026/05/google-shuts-down-project-mariner-ai-agent.html)
- [Microsoft Edge — May 2026 update](https://blogs.windows.com/msedgedev/2026/05/13/new-updates-to-edge-across-desktop-and-mobile/)
- [Microsoft Copilot Studio — computer use](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use)
- [browser-use GitHub](https://github.com/browser-use/browser-use)
- [browser-use docs — open source vs cloud](https://docs.browser-use.com/open-source/introduction)
- [Stagehand GitHub](https://github.com/browserbase/stagehand)
- [Stagehand v3 announcement (Browserbase)](https://www.browserbase.com/stagehand)
- [Skyvern GitHub](https://github.com/Skyvern-AI/skyvern)
- [Skyvern — government form automation](https://www.skyvern.com/government)
- [UI-TARS GitHub](https://github.com/bytedance/ui-tars)
- [UI-TARS-Desktop GitHub](https://github.com/bytedance/UI-TARS-desktop)
- [UI-TARS paper, arXiv 2501.12326](https://arxiv.org/pdf/2501.12326)
- [OmniParser — Microsoft Research](https://www.microsoft.com/en-us/research/articles/omniparser-for-pure-vision-based-gui-agent/)
- [OmniParser GitHub](https://github.com/microsoft/OmniParser)
- [Open Interpreter GitHub](https://github.com/openinterpreter/open-interpreter)
- [Patchright GitHub](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright)
- [AI agent sandboxing 2026 — Firecracker / gVisor (Northflank)](https://northflank.com/blog/how-to-sandbox-ai-agents)
- [Browser-Use vs Stagehand (Skyvern blog)](https://www.skyvern.com/blog/browser-use-vs-stagehand-which-is-better/)
- [Framework wars: browser-use, Stagehand, Skyvern (DEV)](https://dev.to/stevengonsalvez/browser-tools-for-ai-agents-part-2-the-framework-wars-browser-use-stagehand-skyvern-4gn)
- [State of Browser Use, May 2026](https://michaellivs.com/blog/state-of-browser-use-2026/)
- [Dukcapil portal](https://dukcapil.kemendagri.com/)
