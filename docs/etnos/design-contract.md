---
name: etnos-platform-design
description: Use when designing or consolidating ETNOS.
version: 0.1.0
author: Yose Marthin Giyay, Hermes Agent
---
# ETNOS platform design and consolidation

ETNOS is one complete forum-first platform with news, issues, wiki, library, geography and sourced AI integrated inside it. This is not a landing page linking Photon and Watch. Preserve working behavior and evidence, not outdated presentation. Use this skill for ETNOS design, architecture, migration and review; not for unrelated websites.

## Prerequisites
- Read the current user scope before making changes. Separate discussion, local branch creation, pushing, preview deployment and production cutover authorization.
- Discover local honai-metro and westpapua-watch repositories; inspect Git state before edits. Never replace their main branches while experimenting.
- Read the supplied ETNOS Design Lab v3 HTML, especially actual preset definitions, and local Astro styles. Read source rather than relying on stale web extraction or old readiness docs.
- Load design-language.md for visual decisions, platform-integration.md for API/engine/upstream work, and agent-services.md for Services, authenticated agents and collective memory.

## Product contract
- Deliver a native full forum: feed, accounts, communities, post/thread pages, composer, replies, votes, saves, search, inbox and supported moderation. Preserve these journeys inside ETNOS rather than linking to the old forum.
- Integrate news/story/source detail, issue dossiers, wiki articles, library filters/detail and Ask inside ETNOS. No public Watch product switch is required. Watch may remain an internal engine name.
- The destination is one platform, eventually permitting the old westpapua.watch domain to retire into redirects. Keeping that site running during migration is rollback protection, NOT the intended product architecture.
- Do not call a read-only feed or dated snapshot a full migration. Do not manufacture posts, counts, wiki facts, coordinates or availability.

## Design contract
- Modern Swiss-like order, comfortable spacing and restrained softness, with Papua expressed through real content, language, imagery and considered color. Avoid generic SaaS imitation and invented cultural motifs.
- Use shadcn-svelte/Bits UI primitives where appropriate. Do not merely reskin old Honai components or import React/Base UI into Svelte to preserve Watch controls. Preserve behavior separately from presentation.
- Internal theme families: Watch and Honai Evolved, each with light and dark modes. Mode and palette are independent; changing either must preserve hierarchy and semantic status colors.
- Watch production Astro is the visual reference for restrained copy, lilac accents, colored issue mosaics and textured library fallbacks. The HTML is the layout/preset exploration reference, NOT the preferred issue tile implementation.
- Show, do not tell: concise page titles; no automatic eyebrow/subtitle/mission slogan stack. An optional short subtitle must add information the content cannot show. No giant onboarding hero above the daily forum feed.
- Desktop uses a persistent left sidebar, flexible content, and optional contextual right rail. Do not duplicate primary navigation in a top product bar. Mobile uses visible Forum/Explore/Communities/Inbox navigation; drawers hold secondary controls. Gestures are optional conveniences.
- Explore has a compact persistent map context above News/Issues/Wiki/Library sections. Map can expand or contract on scroll; it must not bury reading content. Preserve camera/selection and map instance across section changes. Pan alone must not silently filter the list.

## Procedure
1. Inventory actual forum capabilities and Watch API contracts; record implemented, tested, unsupported and missing separately.
2. Compare clean Photon upstream with the existing fork before choosing a migration base. Preserve original branch/history and isolate experiments in another branch/worktree.
3. Define tokens, layout, component boundaries and route ownership before broad UI edits. Establish both theme families and modes on representative real content.
4. Preserve forum interactions while replacing the shell and primitives. Audit accessibility, settings, translations and authentication after changes.
5. Integrate existing Watch services natively through server-side allowlisted adapters. Port framework-neutral domain/map code deliberately; rewrite Astro markup as Svelte views. Do not scrape westpapua.watch as the permanent backend.
6. Verify each complete journey: list to detail to sources or reply, not just the overview page. Preserve canonical summaries, citations and identifiers.
7. Build/test on CI for constrained hosts. Exercise browser desktop/mobile, actual API readback and failure states; inspect screenshots personally before making aesthetic claims.
8. Deploy only to authorized preview targets. Production cutover and old-domain retirement require verified parity and a separately scoped migration.

## Pitfalls
- Heavy backend dependencies do not require choosing their frontend framework as the product shell.
- A separate folder reduces conflicts but does not make a deep redesign automatically upstream-compatible. Maintain an explicit seam/patch ledger.
- Honai's old docs contain outdated visual rules and readiness claims. This agreed redesign supersedes old pill/radius/font/mandatory-header rules where they conflict; retain data integrity and provenance requirements.
- Full forum support cannot be inferred from a generated schema or visible button. PieFed versions and adapters differ.
- Service bindings are not intrinsically read-only. Restrict method/path/query and isolate administrative access.
- Browser screenshots at mobile dimensions are not physical Galaxy A12 GPU/touch verification.
- Keep users informed at meaningful milestones; do not repeatedly promise perfection. Parent owns design review even if implementation is delegated.

## Verification
- Primary journeys stay inside ETNOS; no landing-page substitution or arbitrary external forum feed presented as Papua community activity.
- Both theme families and both modes render with readable contrast, long headings, actual images, honest fallback/error states and keyboard focus.
- Map and lists work together; provenance distinguishes area context from exact incident coordinates.
- API capability matrix includes runtime proof or explicit blockers; auth/write tests use authorized accounts, never unsolicited public test posts.
- Main branches and production infrastructure remain unchanged until authorized; preview deployment, runtime health, migration completeness and aesthetic review are reported separately.
