# ETNOS navigation and appearance follow-up

This pass supersedes earlier optional-Lajur, Home-welcome and profile-monogram decisions. It changes the connected app in `apps/strata`; the Strata data/authority model and Aksara Core are unchanged.

## Implemented

- One Home feed. Deleted Lajur components, lazy routes, controls and styles; old `/board` URLs resolve to `/` and old layout preferences are cleared.
- Removed Home's editorial intro and extra context row. Kept timeline controls, composer and real content.
- Restored the earlier 116px desktop/96px phone profile cover; removed only oversized banner initials.
- Shared destinations, Posting, personal tools, then Settings above profile/sign-in. No section eyebrows. Phone topbar includes theme control.
- One directory for communities, organisations, places/languages and followed rooms. Real organisation links group visible rooms; local tab scrolling and stacked selectors support narrow screens. Search labels match this vocabulary. Creating while signed out leads to login; dismissing directory creation returns to the directory.
- Photo errors remove the failed image and its credit, retaining padded headline/summary/date content. Applied to Explore tiles and the news index.
- Compact phone link previews; one composer close action and a header Posting button that uses native form validation. Polls, media, audience confirmation and draft-discard protection remain.
- Fresh appearance: sky blue `#1680fa`, Graphite, soft Serat and existing font choice. Device-local clock selects light from 06:00 to 18:00; no geolocation. Explicit saved theme/accent choices migrate unchanged. At an automatic boundary, colours ease over 30 seconds. Intermediate ink/action contrast is guarded rather than fading text into its background. Reduced motion skips the prolonged transition; background-tab resume checks the current clock.

## Relationships, not inherited access

A place/language context is a discovery lens. A group/organisation is an accountable collective. A community is a room with its own audience and admission. The UI combines discovery; it does not collapse these into one database entity.

The existing group API returns permission-filtered rooms and contexts. A public room can belong to a private organisation without exposing that organisation to anonymous readers. A public organisation can contain private rooms without granting visitors their admission. The directory never reconstructs a hidden parent from a public child, and organisation membership is not a government credential.

Geographic containment, administrative remit and customary/ethnic relationships can overlap. A future hierarchy should use typed, attributed relationships rather than imply that a district owns a tribe or institution. No new parent hierarchy, ethnicity inference, automatic context assignment, cross-room indexing or private-agent access was added.

## Source-backed product lessons

- [Open Social Groups proposal](https://tangled.org/opensocial.group/proposal/raw/main/proposal.md?download=1): group identity, roles and modality-specific Spaces are distinct. A Space's access records can permit public reads; being called a Space does not inherently make it private. A members index is discovery, not a complete entitlement list.
- [Open Social Groups vision](https://atproto.com/blog/open-social-groups-vision), 28 October 2026: shared group identity/access across apps. [Spaces alpha](https://atproto.com/blog/atproto-spaces-alpha) remains experimental, and access control is not end-to-end encryption. This pass does not enable prototype Spaces as production cultural-data storage.
- [Frontpage](https://frontpage.fyi): title/domain/conversation metadata can carry a compact discovery experience without another hero.
- [Leaflet](https://leaflet.pub): keep authors' expressive publication identity distinct from everyday reading/navigation tools.
- [Discourse](https://www.discourse.org/features): contextual expansion, a personal sidebar and link previews support conversation continuity.
- [Blacksky service documentation](https://docs.blacksky.community/readme/list-of-our-services): community governance and moderation defaults are substantive product choices, beyond an appearance theme.

These are product/documentation references, not a global popularity ranking or a visual audit of every app. Exa supplied breadth; primary sources informed the model. Roomy's page returned no crawlable content, so no claim depends on it. Solar art and noticeboard experiments remain deferred.

## Verification and deployment

Production-build checks and deployment receipt are recorded after validation below. Synthetic identities and protected-room fixtures stay in loopback SQLite; no sample posts are published.

Validated: `npm run check` (0 errors/warnings), 9 UI unit checks, production build and all 14 browser journeys. The new navigation contract covers 24 route/width combinations at 320/390/768/1440px, scheduled-theme boundary and intermediate colours, manual/legacy preference preservation, reduced motion, hidden parent/private-room filtering, photo failures, and composer controls at 390×500. The final mobile-header ordering and retired-selector cleanup were followed by a fresh build/check/unit run and repeated mobile/navigation journeys.

The build retains upstream crypto bundler annotation/externalisation notices and the existing large entry/editor chunk warning. Browser checks exercise real MLS encryption successfully; these warnings are not represented as newly fixed. Desktop and emulated-phone screenshots were inspected; physical-device keyboard rendering remains a tester check.

Synthetic visual evidence: [directory](navigation-2026-11-04/navigation-directory-390.png), [places](navigation-2026-11-04/navigation-places-390.png), [photo fallback](navigation-2026-11-04/navigation-news-fallback-390.png), [drawer](navigation-2026-11-04/navigation-drawer-390.png), [short-height composer](navigation-2026-11-04/navigation-composer-keyboard-390.png). Screenshots contain only isolated synthetic fixtures.
