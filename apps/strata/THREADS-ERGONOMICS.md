# ETNOS conversation ergonomics — 1 November 2026

The owner selected the supplied Threads desktop/mobile screenshots as the target and authorized implementation and preview deployment. This pass preserves Strata's community, Wiki, work, moderation, media and messaging features while changing presentation and navigation.

## Direction

ETNOS is a public forum with community-controlled spaces and reviewed shared knowledge. Its character is calm, sociable and exact. The visual world is a conversation: names, words, replies and shared media, surrounded by neutral chrome. Media and authored content provide richness; the ETNOS wordmark, small customizable accent and visible community scope retain identity. No decorative hero, invented activity, broken controls or fake federation affordances were added.

Taste v2's `true-black-flat` app direction was selected for community reading, with an explicit brand/type exception: a system reading face for Threads-like metrics and the existing Instrument Sans wordmark. [Unslop by Damir Sokolovsky (@heydamir)](https://github.com/heydamir/unslop), CC BY 4.0, informed spacing and progressive disclosure. The owner's accent preferences override generic palette prohibitions. The 640px reading column is intentional for long conversations, rather than a dashboard-width layout.

## Captured audit and implementation

The local built application was exercised against an isolated real Strata SQLite/API fixture. Test names/content are synthetic; none was written to the hosted community. Before and after screens cover 390/768/1440px feed, thread, composer, login and settings; final review also checks light mode. This is viewport/browser evidence, not physical Android/iOS keyboard or assistive-technology certification.

1. **Feed:** the prior desktop screen repeated Beranda, a wide breadcrumb/search bar and two full-width tabs above the first post, with promotional and access copy in the right rail. The new header owns the real latest/member-community switch; the centered rounded reading surface starts with a lightweight composer. Related communities and Wiki remain in a quieter rail. The mobile switch remains available, with accessible labels on compact navigation.
2. **Thread:** the prior opening body was 17px desktop/16px phone while ordinary posts were 15px; action boxes and expanded indentation added visual weight. The shared 15px reading scale, restrained rails, smaller metadata and rounded action hit areas align opening posts/replies. Human author/moderator controls and collapse/load/sort behavior remain. The compact reply field expands tools on focus.
3. **Composer:** the previous H-shaped extended-content control was difficult to discover, and a narrow footer could wrap the Post button to the left. Media/link/poll tools now sit with the writing, the audience and submit action have a separate footer, and a centered header/cancel affordance follows the reference. Mobile remains exactly full viewport; written drafts require confirmation before being discarded. Drafts are not silently stored in plaintext localStorage. Server-side uploaded orphan drafts retain the existing bounded lifetime, rather than claiming immediate secure erasure.
4. **Other surfaces:** shared form/card/dialog tokens use quiet hairlines, 12–24px radii, consistent field heights and neutral primary controls. Tablet navigation uses a compact labelled-accessible icon rail; mobile retains the full navigation sheet. Custom accents, theme changes, profile links, institutional work, Wiki review and encrypted-DM state remain functional. The generated layout inset uses a neutral wrapper so the app has one main landmark.

The screenshot pass caught and corrected a duplicated thread title and narrow composer footer wrapping. An empty-fixture Taste inspection reported **0 FAIL / 2 WARN**: the empty forum's tall reading frame/blank area is expected when no posts exist. The source lint's real overlay shadows and existing brand typography are reviewed exceptions; the reference's brief overlay backdrop treatment is kept only for floating dialogs, `box-shadow:none` also triggers its heuristic. No fake posts were added to make an empty audit look busy.

## Threads comparison and remaining features

Official sources were checked as feature evidence, not as screenshots of the current app or proof of exact pixel dimensions:

- [Meta: personalized feeds, topics, reply/quote controls and reply approvals](https://about.fb.com/news/2025/03/new-threads-features-more-personalized-experience-you-control/).
- [Meta: multiple drafts, scheduling and creator tools](https://about.fb.com/news/2024/08/new-threads-features-for-creators-and-businesses/).

| Pattern | ETNOS decision / current scope |
| --- | --- |
| Compact author/text/media/action rhythm | Adopted; forum up/down votes retained rather than relabelled as likes |
| One feed selector | Latest and admitted-community filter; no fictional personalized/following algorithm |
| Fast composer and nested conversation | Implemented with real local APIs, image tools and explicit audience |
| Draft protection | Confirm discard now; encrypted/persistent multi-draft library remains future work |
| Custom feeds, follows and subscriptions | Remain backend/product work; no inert UI added |
| Reposts, quote controls, mentions | Remain missing; quoting private material needs explicit scope/consent handling |
| Per-post reply approvals / audience controls | Community membership and moderator lock exist; granular approvals require a new policy/state workflow |
| Scheduling | Deferred until service auth, durable jobs, permission checks at execution and cancellation are qualified |
| Profile topics/links, richer profile media | Future lifecycle and visibility work; private affiliations are never inferred from memberships |
| Creator demographic/engagement dashboards | Not adopted as a default; community data collection and analytics require their own agreed purpose |
| Ephemeral/disappearing content | No disappearing-data promise; conflicts with copies, custody and retention policy require explicit product design |

## Release boundary

This UI pass does not change database schema, origin, auth bindings, AT schema ownership or federation settings. Official Spaces remains the separate alpha lab. Launch next week still requires the existing admission/recovery, moderation staffing, backup/restore and bounded media/traffic gates; visual polish is not operational qualification.

Validation also covers draft keep/discard through Cancel, Escape and close, the mobile timeline selector, sidebar recovery after its keyboard shortcut, and a single main landmark.
