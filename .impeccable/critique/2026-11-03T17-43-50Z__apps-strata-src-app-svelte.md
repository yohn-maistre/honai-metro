---
target: ETNOS application pages and screens
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/workspace/honai-strata/apps/strata/src/App.svelte"
target_fingerprint: "sha256:06697bffea37f1fbb07eee7cb1da602bcada8adfce24ca18d77e5222f62b0974"
target_path: /workspace/honai-strata/apps/strata/src/App.svelte
timestamp: 2026-11-03T17-43-50Z
slug: apps-strata-src-app-svelte
---
Method: dual-agent (A: `/root/impeccable_design` · B: `/root/impeccable_technical`)

The agent entrance is live. Aksara’s existing client connects without a core change; resident automation remains deferred. Impeccable is installed, and its first review is complete.

**Design verdict:** preserve Instrument Sans, Serat and the existing accents. The interface is coherent, but mobile Home communicates a familiar social feed more clearly than a Papua-focused public square. Place, community, news and knowledge relationships are its strongest distinguishing features; they need to become easier to discover.

**Design health: 23/40**

| Heuristic | Score /4 | Main finding |
|---|---:|---|
| System status | 3 | Useful states; editorial accountability needs visibility |
| Familiar language | 2 | AT/PDS and invitation eligibility need explanation |
| User control | 2 | Wiki drafts lack posting’s dismissal safeguards |
| Consistency | 3 | Cohesive visual system; uneven authoring protection |
| Error prevention | 2 | Audience consequences need stronger cues |
| Recognition | 2 | Mobile navigation and review comparison demand recall |
| Efficiency | 3 | Search shortcuts and focused branches work well |
| Minimalism | 3 | Calm reading; unrelated rails compete during setup |
| Error recovery | 2 | Retry exists; backend wording passes through |
| Help | 1 | No clear newcomer participation path |

Technical health is **15/20** after the additional editor reproduction: accessibility, performance, theming, responsiveness and implementation integrity each score 3/4. This is a bounded review, without measured production performance or full accessibility certification.

**What works:** comfortable reading hierarchy; meaningful place–community–knowledge relationships; explicit human review and public-only agent boundaries.

**Priorities**

1. **P1 — Protect wiki work.** Unsaved proposal text disappears after Escape and reopening. Editor teardown also raises a Svelte error in the production build. Add dismissal guards, recoverable account-scoped drafts and safe teardown. Suggested command: `impeccable harden`.
2. **P1 — Make publication scope unmistakable.** Place destination and audience above the editor. Separate “everyone can read” from “joining requires approval.” This is a design risk, not an observed access bypass. Suggested command: `impeccable clarify`.
3. **P1 — Make human review inspectable.** Show permitted contributor/reviewer attribution and review dates; distinguish free-text attribution from account identity. Highlight changes instead of asking mobile reviewers to remember two complete documents. Suggested commands: `clarify`, `layout`.
4. **P1 — Orient mobile newcomers.** Label navigation, organize the drawer and explain public reading, account providers and invitation eligibility at the relevant steps. Bring place/community relationships into discovery without adding a tutorial wall. Suggested command: `onboard`.
5. **P2 — Improve small controls and recovery.** Enlarge the 28px post-options hit area and translate common failures into consistent task-specific Indonesian while retaining retry. Suggested commands: `adapt`, `harden`.

The cognitive review found weaknesses in focus, choice grouping, decision load and working memory. Grouping, hierarchy, progressive disclosure and focused task flows are generally sound. The emotional high point is discovering how a place connects its people and knowledge; the valleys are account entry and consequential editorial decisions.

For a first-timer, the account model is unclear. For an interrupted phone user, wiki draft loss is costly. For a cultural custodian, publication scope and accountable review need to be obvious before contribution.

Smaller improvements include human-readable language names, a compact profile without a cover, consistent work-result formatting and less distracting setup sidebars.

The source detector produced two warnings: a semantic diff border at `apps/strata/src/commons.css:1962` (side-tab) and the established font at `apps/strata/src/styles/conversation.css:59` (overused-font). Both were reviewed and suppressed. Four headless overlay samples produced one minor line-wrap suggestion; no user-visible overlay was created.

Evidence includes **93 design captures** and **45 technical route/viewport samples**, plus theme, keyboard, error and production-build draft checks. Populated messaging/media/agent states, physical-device gestures, screen readers and several conflict flows remain unverified. The evidence archive at `docs/strata/impeccable-2026-11-04/` lists those gaps. No production posts or UI fixes were made during this critique.

Questions to consider: how can Home reveal its place-aware purpose through relationships rather than extra explanation? What editorial information does a custodian need before accepting an exact public revision? Which interruption states must be safe before inviting friends?
