# Independent Assessment B: detector and technical browser evidence

Target: `/workspace/honai-strata/apps/strata/src/App.svelte`, scanned markup directory `apps/strata/src`. Slug provided by parent: `apps-strata-src-app-svelte`. Ignore list absent. This assessment did not read Assessment A or change product files. The incumbent dark surfaces, Instrument Sans, Serat texture, and user accent choices are treated as intentional product decisions.

## Technical scores

| Dimension | Score /4 | Evidence and limit |
|---|---:|---|
| Accessibility | 3 | Visible focus or focus rings, working skip link, named navigation, modal Escape handling, native labels, status/alert semantics. No verified unlabeled active control after checking the initial candidates. Full screen-reader/WCAG conformance was not established. |
| Performance | 3 | Dynamic imports for board, agent management, news reader, messaging, and document editor; video player withheld until requested. Existing production entry is still 704,408 bytes raw / 206,724 gzip; CSS 216,493 raw /36,982 gzip. This is an optimization opportunity, not evidence of a measured slow interaction. |
| Theming | 3 | Correct dark/light restoration, independent base/texture/accent preferences, contrast-adjusted accent roles. Sampled default, blue and extreme red accents in both themes. Did not exhaust all base/accent combinations or every content state. |
| Responsive | 3 | No document horizontal overflow in 45 route/width samples at390/768/1440. Existing mobile journey also passes320px. Local tab strip reveals the focused last tab without page movement. Post option targets remain28×28px rather than comfortable44px. Actual touch gestures remain unverified (see calibration). |
| Implementation integrity | 4 | Coherent forum/news/wiki/community/agent implementation, stateful real core fixture, no corroborated implementation-integrity failure from either CLI warning. |
| **Total** | **16/20, Good** | Two minor verified improvement areas below; no P0/P1 blocker established. |

These scores distinguish observed behavior from untested coverage. They are not a claim of WCAG AA certification or production performance measurement.

## Deterministic CLI result (reuse this result; do not rerun)

Executed bundled `.agents/skills/impeccable/scripts/impeccable detect --json apps/strata/src` against markup directory. Raw result: `/tmp/etnos-audit-b/detector.json`. Exactly **2 findings, both warning/category slop**:

| Rule ID | Rule name | Location | Exact snippet | Verified disposition |
|---|---|---|---|---|
| `side-tab` | Side-tab accent border | `/workspace/honai-strata/apps/strata/src/commons.css:1962` | `border-left: 2px solid var(--cx-success)` | Suppress as a generic style alarm. Selector `.cx-diff-added` expresses added/diff semantics, not a repeated card decoration. Search found no use in the target App markup; no rendered side-accent card issue was established. |
| `overused-font` | Overused font | `/workspace/honai-strata/apps/strata/src/styles/conversation.css:59` | `font-family: 'Instrument Sans` | Suppress. Full declaration is `'Instrument Sans Variable', sans-serif` on `.cx-brand,.cx-mobile-brand`. Instrument Sans is the product's established font. The detector description enumerates unrelated families and provides no functional evidence that this incumbent choice is a defect. |

No additional CLI findings. Exit code was not separately preserved because the shell wrapper consumed it; valid complete JSON with two findings confirms a successful scan. Do not describe the CLI as clean; describe both warnings as reviewed and suppressed.

## Browser method and overlay

No native browser tools were exposed in the available tool catalog. Used Playwright from `/opt/codex/cua_node/lib/node_modules/playwright` with headless `/usr/bin/chromium`; each assessment/journey used its own browser contexts. **These screenshots and overlays were not user-visible.** Do not say there is a [Human] tab in the user's browser.

Mutable injection preflight succeeded: set title to `[Human] Assessment B injection preflight`, appended a script element, and confirmed `window.__auditMutable === true`. Local helper started in background on8400 (PID12957); stop method was bundled `live-server stop --keep-inject`. Injected `http://localhost:8400/detect.js` on four representative pages: home, wiki, agents, board. Runtime detector console results in that order: zero, one, zero, zero. Wiki screenshot visibly labels its one finding **STRAGGLER** on the short right-rail sentence “Komunitas, tempat dan pengetahuan bersama.” (`App.svelte:1269` neighborhood). This is a line-wrap/copy polish suggestion, not an accessibility or task blocker. The local default was1440px for overlay samples. Screenshots `/tmp/etnos-audit-b/overlay-{home,wiki,agents,board}.png`; exact console text and preflight result in `browser.json`. The engine did not expose its detailed rule object in captured console text; do not invent further metadata.

Cleanup succeeded: bundled stop printed `Stopped live server on port 8400.` with `--keep-inject`. No source HTML injection, liveApply, or production injection occurred. All owned browser processes/contexts and in-memory stores closed. Shared Vite5175 intentionally left for root to stop after both assessments. Temporary runnable fixture scripts were removed after data capture; report, JSON, logs, and screenshots retained as review evidence.

## Verified improvement areas

### [P2] Post options are a small touch target

Location: `styles/conversation.css:399–404` sets `.cx-post-more` width/height/min-height28px; `PostCard.svelte:222` is the labeled `Opsi posting` trigger. Confirmed in narrow screenshots and source. This meets24px WCAG2.2 AA target minimum but is below the44px comfort recommendation, making the post editing/moderation menu less forgiving on phones. Increase its effective hit area to44px while retaining the18px icon and current visual position. Suggested command: `$impeccable adapt`.

Do not count the16px messaging consent checkbox as a failure: the `<label for="dm-consent">` provides a larger equivalent activation area, and its CSS also extends hit bounds. Small author/timestamp text links are inline-link candidates; their raw rectangle sizes alone do not demonstrate an AA violation.

### [P2] Route failure copy renders backend error text verbatim

Location: `api.ts:168–170` passes `data.error` into `ApiError`; `App.svelte:418–420` assigns `e.message` directly and `App.svelte:665–675` renders it in an alert with `Coba lagi`. Forced503 `/v1/communities` fixture visibly displayed “Synthetic unavailable response” unchanged, with retry. Evidence: `/tmp/etnos-audit-b/error-390.png` and `browser.json.states`. The alert and retry are positive, but user-facing language can vary with backend wording and lacks consistent task context. Map common service/network/authorization failures to clear Indonesian task-oriented messages, preserve diagnostic detail separately, keep retry. Suggested command: `$impeccable harden` or `$impeccable clarify`.

This is a verified mapping behavior using a synthetic failure, not a claim that production currently emits this particular synthetic wording.

### Lower-priority observations, not release blockers

- Wiki runtime `STRAGGLER` suggestion described above is P3 at most; do not prioritize it above core interaction work.
- Existing production build main JS is about202KiB gzip. Audit eager shared imports, particularly globally imported vault/editor helpers, if production metrics show an entry-cost problem. No LCP/INP benchmark was performed; avoid claiming this byte size alone makes the app slow.
- News hero `<img>` (`NewsPage.svelte:143`) has empty alt and no reserved intrinsic dimensions. It may be intentionally decorative with a caption, so this is **not a verified missing-alt violation**. Layout stability with an actual loaded hero image was not exercised.

## Coverage and positive evidence

Core fixtures import the repository's actual `Strata`, `Groups`, `api`, and Activity modules through `tests/browser/environment.mjs`, with `STRATA_REPO=/workspace/strata`. All authenticated calls were intercepted to in-memory API handlers; auth, news metadata and intentional failure responses were synthetic. **Zero production writes.** Only production read was a fresh guest GET/navigation of `https://etnos.space/`, title `Beranda · ETNOS`, screenshot `production-readonly-1440.png`. Never reused a production session.

-45 local route/viewport samples: home, explore, news42, wiki list, community directory/detail, profile, group detail, board, agents, saved, notifications, messages, fallback settings route, thread detail at390/768/1440. Note `/settings` resolves fallback content, not preferences; the follow-up explicitly exercised the true `/preferences` route in both themes.
- Long content:400-character unbroken post and profile strings plus long community/news titles wrapped without document overflow at tested widths. `home-390.png` proves the long post wraps; profile data were also sampled.
- Theme evidence: `/preferences` dark/light × default `#b8b2c1`, blue `#1680fa`, extreme `#ff0000`. Computed text-contrast probe found only disabled “Pulihkan kunci” below4.5; disabled UI is exempt, so **no active contrast violation is established by this probe**. Probe did not fully composite ancestor opacity/texture, so it is limited evidence, not a full contrast audit. See `extra.json` and `preferences-{dark,light}-*.png`.
- Keyboard: initial12 Tab positions include visible skip link and navigation rings; compose dialog opens with focus inside, Escape closes the clean dialog. Existing dialogs journey passes edit/discard protection with preserved text, custom select, desktop context menu, delete confirmation, dialog bounds390/768/1440. Log `dialogs-journey.log` confirms zero errors and fixture-only edits.
- Tabs: community strip has457.97px content in a390px layout. Focusing last `Tentang` tab moves only `.section-tab-scroll` to68px; active tab ends at377.97px, pageY remains0. Evidence `verify.json.tabs` and `tabs-focus-last-390.png`.
- Board: wheel/page scrolling moves pageY to900; fixed mobile navigation remains bottom at y780–844. Existing mobile journey passes phone page scrolling, one drawer scroller, compose/account reachability at320, one back control, profile widths320/390/768/1440, Serat default/texture override, and deferred video player loading. `mobile-journey.log` confirms zero errors.
- Reduced-motion emulation matched and reported zero running animations; source uses no-animation/no-transition rules while preserving controls and visible state. No task-blocking animation was observed.
- Empty states: wiki has explanation and “Tulis halaman”; explore offers upstream WPW recovery and contextual next action. Guest reads render community content without local write authorization.
- Main45-route browser run and follow-ups produced **zero pageerrors**. No assertion failure in existing mobile or dialog journeys.

## False positives and test gaps

Initial unlabeled-button candidates on agents/thread disappeared after loaded-state recheck; do not report them as defects (the initial selector captured transient content). Messaging consent checkbox is properly associated with its native label, despite icon-only raw button markup. Instrument Sans and semantic diff accent warnings are suppressed as above. Ordinary small inline links and disabled control contrast are not AA failures.

Touch: Chromium CDP `Input.synthesizeScrollGesture` returned success but moved neither board (both +/-500) **nor a plain4000px native scroll calibration page**. Calibration result `touch-calibrate.json` has scrollY0. Thus the gesture tool was not reliable in this environment; do not report board touch scrolling as broken. Physical-device swipes, interrupted pull-refresh, and horizontal touch tab scrolling remain unverified. Source pull-refresh explicitly resets on touchcancel and releases upward/horizontal movement, which is encouraging but not a substitute for device exercise.

A CSS `body.zoom=2` simulation at390 produced640px document width due320px minimum layout; this is not equivalent to browser text resizing and is not reported as a WCAG violation. Browser zoom/text-only scaling, screen-reader announcements, exhaustive accent/base contrast, all network edge cases, populated wiki proposal/diff governance, protected-space permission matrix, cross-browser Safari/Firefox, real slow-network performance, and physical-device gestures remain gaps. Root/A may independently cover some of them.

## Suggested action order

1. `$impeccable harden`: consistent route error mapping while preserving retry and unsaved work.
2. `$impeccable adapt`: enlarge post option hit area; verify on a physical touch device.
3. `$impeccable polish`: optional runtime straggler/copy polish after the interaction changes.

Assessment B is complete. No recommendation is an applied change.
