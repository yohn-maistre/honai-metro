## verdict

1. Resolved — Agent contributor identity: `WikiExperience.svelte:142`, `:173` and `:256` now append “Agen” from the supplied `author.kind` in published provenance, history and proposal attribution. `/tmp/etnos-refinement/refine-wiki-agent-390.png` visibly distinguishes the agent contributor from the named human reviewer and shows the same agent label in history. `tests/browser/refinement.mjs:401` onward asserts proposal, accepted reader and history labels; the final refinement receipt passes with `errors: []`.
2. Resolved — Truthful conflict recovery: `api.ts:199` now gives generic version-conflict recovery text without promising draft preservation. Wiki-specific recovery status remains tied to its actual saved-draft state.
3. Resolved — Persistence: root `PRODUCT.md` now records the public-square product, participation and protected-cultural-data boundaries, recoverable contribution behavior, explicit human review and authorized appearance changes. Root `DESIGN.md` records the five font pairs, soft/full/plain texture choices, labelled navigation and retained compact monogram cover. `.impeccable/design.json` exists and parses as JSON.
4. Verified supplemental evidence — `/tmp/etnos-refinement/refine-wiki-draft-bottom-390.png` shows the entire final attribution field, explanatory text and submit action with clear separation. `tests/browser/refinement.mjs:263` onward checks the field bottom stays above the submit action. No field occlusion remains in this supplied state.

## remaining

Clear. No regression observed in the reviewed fix evidence. Ship covers the scored fixes, not the whole surface.

disposition: ship
