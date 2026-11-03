Design-specificity verdict: ETNOS has a coherent, restrained incumbent identity, but its composition still communicates a general social feed more strongly than a Papua-focused, place-aware public square. Instrument Sans, the Serat surface, quiet accents and readable editorial layouts belong together and should be preserved. The specific character appears most convincingly in place → community → conversation → wiki relationships, the West Papua Watch attribution and separate agent authority. On the mobile entry screen these relationships are mostly absent: a generic “Apa yang terjadi?” composer and familiar social icons dominate. Strengthen local context and human stewardship through the existing system; do not replace it with decorative cultural motifs or a new visual theme.

Assessment A only; recorded independently before any detector output. Target: /workspace/honai-strata/apps/strata/src/App.svelte. No product context/init rerun, no production writes, no UI edits. Local http://localhost:5175, actual Strata API intercepted into two independently seeded in-memory stores owned by this assessment. Fresh Playwright Chromium contexts. Parent-provided product brief was the audience authority; incumbent implementation was the visual authority. No PRODUCT.md was available. No detector was opened or run by A.

## Overall impression

The foundation is calmer and more deliberate than a typical community prototype. Reading a conversation or wiki is comfortable, and the explicit public/private and human-review distinctions already express the right values. The greatest opportunity is making those values visible at the moment a newcomer chooses a place, publishes something or judges a contribution. The present interface asks people to learn its information model before it explains why that model matters.

## Nielsen heuristics

| # | Heuristic | Score /4 | Evidence and limit |
|---|---|---:|---|
| 1 | Visibility of system status | 3 | Active nav, work state/revision, pending/accepted wiki, unread count and retry state are visible. Reader lacks clearly attributable review status. |
| 2 | Match with real world | 2 | Natural Indonesian task labels; “akun AT”, “Handle”, “PDS”, “MCP”, raw language code “id” assume knowledge. Login does not explain the route for an invited newcomer. |
| 3 | User control and freedom | 2 | Back, Escape and close patterns work in inspected dialogs; composer has discard safeguards in source. Wiki/proposal closing lacks equivalent dirty-state protection. |
| 4 | Consistency and standards | 3 | Cohesive typography, components, surfaces and labels. Mobile dock is icon-only while drawer is labeled; document authoring has weaker protection than posting. |
| 5 | Error prevention | 2 | Membership-scoped composer, public-only wiki selection, disabled empty submit and distinct agent permissions are good. Audience defaults and unprotected wiki dismissal remain material risks. |
| 6 | Recognition rather than recall | 2 | Place relations and labeled desktop navigation help. Mobile newcomers must learn unlabeled dock icons and find place/language through Jelajah; wiki compare requires remembering one full version while reading the other. |
| 7 | Flexibility and efficiency | 3 | Ctrl/⌘K search, global search, themes/accent choices, optional detail panels and desktop layout selection. High-volume editorial and agent administration were not exercised. |
| 8 | Aesthetic and minimalist design | 3 | Good reading width, spacing, clear heading hierarchy, restrained chrome and consistent texture. Generic desktop news rail appears even during settings/message setup; preferences expose many simultaneous presentation choices. |
| 9 | Error recognition and recovery | 2 | Injected service failure retained shell and supplied retry. App often renders API error text directly; broad field-level and interrupted-flow recovery was not tested. |
| 10 | Help and documentation | 1 | Local explanations cover encryption, drafts and agent limits. No general task-focused help route is visible; account/invitation/publication onboarding remains implicit. |
| **Total** | | **23/40** | **Acceptable: significant improvements needed. All ten apply to this interactive product.** |

Scores assess design and inspected interaction, not a security/accessibility certification. No numerical contrast score is inferred from visual inspection.

## What's working

1. **Reading feels intentional.** The feed has readable body type and clear author/community context. Wiki reader headings, contents and source block create a quieter editorial rhythm. Preserve Instrument Sans, Serat and existing accent customization. Evidence: home-390.png, thread-390.png, wiki-reader-390.png, explore-1440.png.
2. **The product has meaningful relationships rather than an undifferentiated feed.** Jayapura links conversations, organisations, wiki and public work. The news reader distinguishes reporting from community discussion. These are the strongest foundations for ETNOS's own character. Evidence: context-390.png, story-390.png, group-populated-390.png; FeaturePages.svelte:662, DiscoveryPage.svelte:133.
3. **Important boundaries are already expressed in product copy and choices.** Private rooms are labeled, the wiki promises human review, and the agent entry explains that protected cultural knowledge is outside public access. Agent registration offers public communities only in source. Evidence: private-community-390.png, create-wiki-390.png, agents-390.png; AgentConnections.svelte:124, App.svelte:1548. The protected room shown in member screenshots belongs to the synthetic signed-in owner; its presence there is not evidence of a privacy leak.

## Priority issues

### [P1] Mobile newcomers receive a social feed before they understand the public square

**What:** The first viewport provides “Apa yang terjadi?” and a five-icon dock. Place/language, organisation and knowledge discovery sit behind Jelajah or the drawer. The opened drawer presents nine ungrouped primary destinations, plus workspace, compose, account and agent links. A newcomer also encounters “Gunakan akun AT yang kamu miliki” and an invitation-only note without a visible explanation of how to get invited or whether they can keep reading.

**Why:** The mobile audience must decode the controls and account model before discovering the distinctive reason to use ETNOS. A compass does not tell a first-timer that it leads to their place or language. There are also two types of “following”: following people and joining rooms, requiring explicit cues.

**Fix:** Keep the dock but label its destinations; give first visit a compact explanation of reading public reporting, finding one's place/community and joining safely. Group the drawer by reading/participating/personal tools. Explain account provider and invitation eligibility beside the login action, with a clear return to public reading.

**Evidence:** home-390.png, mobile-menu-390.png, login-390.png, guest-home-390.png. ShellContent.svelte:64 (nine nav items), :350–394 (mobile dock); lib/components/login-form.svelte:34, :48, :76, :84.

**Suggested command:** $impeccable onboard, then $impeccable clarify.

### [P1] Human review is implemented, but editorial accountability is hard to inspect

**What:** The accepted wiki reader shows language code and free-text perspective, not the named author/reviewer or a clear “reviewed by X on date Y.” Pending proposals show the same free-text perspective. “Bandingkan tulisan” shows two full documents; mobile stacks them without highlighted changes. A reviewer must retain the current version while reading the proposed one. Sources, language and attribution are initially collapsed in the authoring modal.

**Why:** For a product whose trust depends on human review and careful use of cultural knowledge, “revisi diterima” is weaker than knowing who took responsibility. Full-document comparison places a large memory burden on the custodian precisely where judgment matters most. This is not a claim that protected material was exposed; it is a review UX gap.

**Fix:** Display linked contributor and reviewer identity, review date and applicable authority beside the article status. Distinguish the contributor's attribution text from verified account identity. Summarize and highlight additions/removals, with a mobile change-by-change review mode. Keep source/permission prompts visible when proposing public knowledge. Preserve the explicit human acceptance step.

**Evidence:** wiki-reader-390.png, wiki-review-390.png, wiki-review-1440.png, wiki-proposal-390.png. WikiExperience.svelte:128–153, :225–241; App.svelte:1604–1624. Source has author_id and reviewer_id in revision type (api.ts), but reader does not present them. Compare shows both versions, so this is an improvement to an existing safeguard, not a missing comparison feature.

**Suggested command:** $impeccable clarify, $impeccable layout.

### [P1] Publication scope needs a stronger cue before writing and creating a room

**What:** A new community defaults to public. The audience selector combines visibility and membership admission in “Publik · bergabung dengan persetujuan.” A new post defaults to the first eligible membership unless opened from a room; the header gives the destination name and a small footer gives “Publik.” The protected/public distinction is available but peripheral to the writing task.

**Why:** Approval to join can be mistaken for approval to read. A cultural custodian needs to know whether a name, description and contribution will be visible publicly before composing it. Existing locks and private labels are useful; the change needed is making the consequence unmistakable where intent forms.

**Fix:** Put audience and destination together above the text field. Explain “semua orang dapat membaca; pengelola menyetujui anggota” separately from who may join. For community creation, make the public-versus-members choice explicit, with brief examples of name/description visibility. Reconfirm scope when switching from a protected room to a public one; do not add indiscriminate confirmation to every post.

**Evidence:** compose-390.png, create-community-390.png, private-community-390.png. App.svelte:455, :462, :1568–1582; PostComposer.svelte:240–250, :523–535. This is a source/visual design risk, not an observed authorization bypass or measured mispublication.

**Suggested command:** $impeccable clarify, $impeccable harden.

### [P1] Long wiki contributions can be dismissed with weaker protection than short posts

**What:** The posting modal checks dirty/busy state and offers a discard confirmation. The wiki/proposal modal permits up to50,000 characters but does not participate in that check; its text, sources and attribution are reset on the next open. The modal can be dismissed through standard Escape/outside/close behavior.

**Why:** An interrupted mobile editor can lose substantial human work and source attribution. Protecting a short social post more carefully than a reviewed knowledge contribution is the wrong trust balance.

**Fix:** Apply dirty/busy guards to wiki and proposal forms, preserve a local recoverable draft tied to page/base revision, and show “saved on this device” status. Preserve text after recoverable errors; surface version-conflict resolution before resubmission.

**Evidence:** wiki-proposal-390.png, create-wiki-390.png. App.svelte:123–131 restricts guard to compose; :455–460 resets fields; :1361–1371 restricts Escape/outside interception to compose; :1593–1624 shows the long-form editor. Source-confirmed gap; a populated dirty Escape loss was not separately reproduced in this pass.

**Suggested command:** $impeccable harden.

## Cognitive load checklist

| Check | Result | Evidence |
|---|---|---|
| Single focus | Mixed / fail globally | Individual article and composer have clear focus; persistent desktop news/community rail competes during settings/message setup. |
| Chunking (≤4 per group) | Fail | Nine primary drawer links; nine visible accent presets; search has six category filters. |
| Grouping | Pass | Delineated article/source sections, review cards, directory modes and appearance groups. |
| Visual hierarchy | Pass | Headings, main reader, primary action and secondary metadata generally have clear roles. |
| One thing at a time | Pass, with review caveat | Composer extras and policy/details disclose progressively; mobile comparison still asks the reader to retain two versions. |
| Minimal choices (≤4 at decision points) | Fail | Mobile dock5, drawer9, community tabs5, explore facets5, search filters6, appearance accents9. These are counts, not proof that every group must be reduced to4. |
| Working memory | Fail | Long stacked current/proposed wiki versions; “id” and AT/PDS terminology require learned meaning. |
| Progressive disclosure | Pass | Agent registration, contribution policy, history, source fields and extra composer tools are collapsed. Source/attribution disclosure is too aggressive for the editorial task. |

Four failures = high cognitive load by the reference rubric across the product. This does not mean every screen is crowded: empty states and the wiki reader are notably calm.

## Emotional journey

- **Entry:** Familiar, quiet and readable; muted emotional identity gives little immediate indication of Papua, local stewardship or how to belong. The news and place content do most of that work when discovered.
- **Exploration peak:** Seeing Jayapura connect conversations, organisations and wiki makes the product feel like a shared civic place. This is the strongest opportunity to elevate.
- **Participation valley:** The account/invitation terminology interrupts momentum. Public/private stakes then become the user's responsibility through small labels.
- **Contribution peak:** A wiki proposal explicitly says humans review it before publication. This supports trust and should remain prominent.
- **Review valley:** Attribution without verified identities and whole-document comparison make “Terima revisi” feel more consequential than the evidence presentation supports.
- **End:** Empty saved/work/media states usually explain what belongs there and offer a next route. Message setup correctly explains local key loss and experimental limits, but is an abrupt demand for a16-character phrase and acknowledgment before any conversational value. A missing message recovery key ends with concrete recovery instructions, which is helpful. The generic service error offers retry; its copy was intentionally injected by the fixture, so real-world wording is not established by that capture.

## Persona red flags

**Jordan, first-timer:** Home provides no brief explanation of what ETNOS connects. Icon-only mobile navigation requires discovery by tapping. Login expects understanding of an AT handle and invitation eligibility; “Lihat penyedia AT” leads outside without explaining whether account creation provides admission. Main route reviewed: public home → mobile menu/Jelajah → login. No real OAuth redirect was performed.

**Casey, distracted mobile user:** Bottom dock and the full-screen posting composer are good. Five dock icons lack text. Wiki reading/review becomes a long scroll; source/attribution fields are collapsed, and the source-confirmed missing draft protection makes interruption expensive. Community tabs extend beyond the initial horizontal view; the tab-scroll mechanism exists and first five labels are not all simultaneously visible. No slow-network/keyboard-open/OS interruption simulation was done.

**Project-specific cultural custodian (from parent-supplied brief):** Public audience defaults and mixed “who reads/who joins” wording deserve a deliberate decision. Human reviewer identity is not clearly visible in the accepted wiki. Raw language code “id” and free-text attribution do not tell a reader whose language knowledge and authority the text represents. Positive boundary: agents are explicitly told protected cultural knowledge stays closed; protected spaces were not offered in registration source. No real community/Indigenous data was used and no endorsement is implied by synthetic place-language text.

## Screen-by-screen coverage and observations

All filenames below are relative to /tmp/etnos-audit-a/. D=1440×900, M=390×900, T=768×900. Actual route IDs are in evidence.json and extra-evidence.json. Screenshot full-page capture sometimes places the fixed mobile dock over the middle of the exported image; that alone is not evidence content cannot be reached by scrolling.

| Screen / route | Browser coverage | Design observation | Evidence |
|---|---|---|---|
| Home / | D+M signed in, D+M guest; repeat M | Calm readable feed; first-time purpose and place scope implicit. | home-{390,1440}.png, guest-home-*.png |
| Explore /explore | D+M+T | Strongest expression of news→voices→knowledge→place model; long mobile discovery page. | explore-*.png |
| Community directory /communities | D+M; creation modal M | Clear room/org/joined grouping; names and descriptions carry identity. Audience/admission creation copy needs distinction. | communities-*.png, create-community-390.png |
| Public community /communities/:id | D+M+T; Wiki/Media/Suara/About M; manage M | Clear membership/public marker. Five horizontal tabs; media empty state is informative. Moderator modal inspected with empty request/report queues. | community-*.png, community-{wiki,media,suara,tentang}-390.png, community-management-390.png |
| Protected community /communities/:id | D+M as synthetic owner | “Khusus anggota” and invitation-only status explicit. No real private data. | private-community-*.png |
| Unavailable community | D+M guest | Discloses no reason for missing/access distinction, provides directory exit. | unavailable-community-*.png |
| Wiki atlas /wiki | D+M empty and populated | Quiet empty invitation and useful place facet; populated item says revision accepted. | wiki-*.png, wiki-populated-*.png |
| Wiki reader /wiki/:id | D+M accepted revision | Good reading hierarchy, contents/history/source affordances. Verified editorial accountability missing. | wiki-reader-*.png |
| Wiki review | D+M pending peer proposal plus accepted prior proposal | Current/proposed comparison present, vertically demanding on mobile; no highlighted changes/linked account identity. | wiki-review-*.png |
| Wiki proposal / creation | D+M proposal; creation M | Capable editor; source/language/attribution collapsed; draft reassurance clear, dismiss protection source gap. | wiki-proposal-*.png, create-wiki-390.png |
| Voices /voices | D+M populated poll | Question and state tabs clear; helpful bridge from a poll to action. Large-scale/tied/closed poll states untested. | voices-*.png |
| News index /news | D+M,3 synthetic headlines | Editorial hierarchy works without images. Category strip has many visible options; authentic image/source density not established. | news-*.png |
| News reader /news/42 | D+M synthetic article/source | Strong headline, summary/source and discuss transition. Source attribution helps separate reporting and discussion. | story-*.png |
| Organisation directory /groups | D+M | Shared directory modes are consistent; “Temukan ruangmu” is less precise when viewing organisations. | groups-*.png |
| Organisation /groups/:id | D+M empty and sponsor-enabled populated room/work | Owner actions clear but administrative concepts introduced all at once; space/work tabs useful. | group-*.png, group-populated-*.png |
| Public work index /work | D+M empty and populated; D+M guest empty | Useful organisation exit when empty; status and sponsor clear when populated. | work-*.png, work-populated-*.png, guest-work-*.png |
| Public work /work/:id | D+M active work with pending result; result modal D+M | State/revision and sponsor visible; review queue clear. Result text renders plain markdown markers in inspected fixture. | work-detail-*.png, work-result-modal-*.png |
| Context index /contexts | D+M | Simple and comprehensible; “konteks” is system language compared with stronger “Tempat & bahasa” elsewhere. | contexts-*.png |
| Context /contexts/jayapura | D+M | Relationship navigation gives place real meaning; empty relation sections add length before conversations. | context-*.png |
| Profile /people/:id | D+M own populated profile | Clear biography/location and posting/reply/media tabs; large blank cover region without image. Edit dialog not exercised. | profile-*.png |
| Conversation /square/:id | D+M populated nested replies | Nested structure and reply context readable; compact icon action rows need learned semantics. | thread-*.png |
| Messages /messages | D+M setup; D+M guest | Honest key-loss/experimental disclosure, but steep setup before seeing value. Activated/incoming/accepted conversations untested by A. | messages-*.png, guest-messages-*.png |
| Activity /notifications | D+M populated reply notification | Sparse, clear, filter/read controls available. Other notification types and volume untested. | activity-*.png |
| Saved /saved | D+M empty | Explains access-sensitive saved content and offers a community route. Populated saved list untested. | saved-*.png |
| Preferences /preferences | D+M+T | Existing visual choices clear and preserve agency; nine accent choices plus four bases and texture choice dominate before message recovery/account tools. | preferences-*.png |
| Agents /agents | D+M empty management; register M; D+M guest | Clear public/private boundary and separate permissions in copy. Technical connection endpoint appropriate for operator but too prominent for general reader. Registered/mandated/suspended entry details not captured by A. | agents-*.png, register-agent-390.png, guest-agents-*.png |
| Search /find?q=Jayapura | D+M results; search dialog M | Grouped results helpful; six filter categories form a broad decision point. | find-*.png, search-dialog-390.png |
| Login /login | D+M guest | Form is visually simple; account model/invitation help insufficient. No provider redirect or login failure submitted. | login-*.png |
| Message recovery /recover-messages | D+M no local key | Direct next-step instructions and standalone focus; transfer/import/export failure/success untested. | recovery-*.png |
| Spaces lab /labs/spaces | D+M static alpha results | Candid security limitations and experimental framing; long protocol details suit specialist users, entry is currently inside general preferences. | spaces-*.png |
| Global composer | M empty | Full-screen focus and bottom posting action good; audience/destination separation deserves stronger cue. | compose-390.png |
| Mobile navigation drawer | M open | Large labeled targets; nine equal-priority choices. | mobile-menu-390.png |
| Service failure | M injected503 on communities load | Retry in preserved shell. Copy was supplied by fixture, not verified as production response. | service-error-390.png |

## Exact coverage limits

93 screenshot captures total:70 in primary pass +23 supplemental;70 rows in evidence.json and23 in extra-evidence.json. No pageerror events in either store/context pass. No horizontal page overflow in captures. Images in synthetic news intentionally404'd to inspect text hierarchy; media-rich news/feed, video/player/photo viewer and authentic production content were not qualified. The text-only fixture is not evidence of a production missing-image defect.

Not inspected as complete workflows: actual OAuth/provider/invitation, failed login; board split/three-column modes; sent post/poll/event/media upload/edit/delete/report dialogs; populated saved list; follow/unfollow/profile edit; join requests and moderator actions with nonempty queues; organisation create/member management/sponsor request dialogs; creating/changing/completing/withdrawing work; work rejection/conflict; wiki pending-only unpublished page, contribution policy edit, accepting/rejecting in the browser and concurrent revision conflict; populated agent keys/mandates/suspension/editorial operations; activated encrypted message conversations, safety-code, key-loss, vault import/export/recovery success; large content volumes; browser zoom/screen reader/keyboard-only traversal; mobile soft keyboard,320px widths, slow connection and offline/resume. Source was read for several of these protections but that does not replace visual workflow coverage. Routes /board and deep /messages/:id were not opened. Live etnos.space was not opened by A; only parent-owned loopback server was used. Complete the missing critical flows before claiming “every screen tested.”

## Minor observations

- Raw “id” language codes should be human-readable language names; retain the code in a detail view.
- The context relationship link order begins with conversations, while page body begins with organisations/wiki/work; align anchor order with reading order (FeaturePages.svelte:669–698).
- “##” in public work result is shown literally by a paragraph renderer in the fixture; either render supported markdown consistently or label result input as plain text (FeaturePages.svelte:627).
- Preferences and setup screens inherit the public news rail on desktop. Hiding or reducing it during focused account/key operations would improve attention without changing visual identity.
- Profile's empty cover occupies substantial space; a compact no-cover variant would increase useful first-viewport content.
- Existing font, texture and selectable accents are strengths. None of this critique justifies replacing them.

## Targeted choices for next work

1. **First-time/mobile path:** clarify entry purpose, label mobile navigation, group drawer, explain account eligibility; validate public news → place → community → participation with a first-timer.
2. **Cultural/publication safety path:** strengthen audience selection, separate read access from admission, and add visible human provenance and focused review comparisons.
3. **Contribution reliability path:** protect and restore wiki/proposal drafts, then cover interrupted/error/conflict states before visual refinement.
4. **Coverage completion path:** inspect populated messaging, operator/agent, media, membership/moderation and permission-limited screens before extending a redesign across them.

## Assessment A execution notes

Both Chromium instances closed and each in-memory store closed. The Vite server was already owned by the parent and was not started or stopped by A. Temporary fixture scripts and screenshots retained under /tmp/etnos-audit-a because they are requested evidence. No source changes, product UI edits, real community records, production writes or detector access. Assessment A is complete and ready for parent synthesis. Questions skipped by A: parent owns final user-facing targeted question after synthesizing the isolated assessments.
