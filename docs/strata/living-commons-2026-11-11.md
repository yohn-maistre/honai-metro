# Living commons implementation direction

The owner's full foundation and 72-feature acceptance ledger are maintained in the sibling Strata checkout at `docs/foundation/README.md`, branch `plan/living-commons-2026-11-11`, based on engine `3a6ed61`. The source document has been read in full; the implementation plan retains all 30 sections, 38 original decisions and both appendices. This is a planning checkpoint, not a deployed UI change.

The canonical connected UI remains this repository's `apps/strata` at `f489846`. It is an independently buildable Svelte/Vite application. Legacy Photon/Honai SvelteKit components remain useful moderation/media behavior donors; do not reintroduce their backend transport or JWT authentication.

The proposed next distribution step is to package this connected app into Strata `apps/web`, preserving AGPL, copied-source attribution, bundled MIT notices and same-origin OAuth/CSRF behavior. Perform a build/deployment parity check first and establish one canonical source; do not create two drifting implementations. This relocation has not happened yet.

UI implementation follows real domain contracts: compact readable sidebar; existing five-anchor shell; user-selected Gabarito/Geist Serif and accent; gradual automatic themes; separate context/feed/identity controls; typed cards; desktop contextual detail panels and mobile sheets/back continuity; all loading/empty/error/denied states. No large Home hero, banner initials or Lajur. Protected titles/counts/media and agent eligibility are server-filtered, never hidden by CSS alone.

Update the Strata feature ledger with code/check/release evidence as these slices ship. The complete strategy is kept local and reviewable; this pointer does not publish the uploaded document or claim completed resident/news/cultural features.
