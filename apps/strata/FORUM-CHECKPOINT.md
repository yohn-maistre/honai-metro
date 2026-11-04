# Connected forum content checkpoint

Local rich post controls now cover title/link/Markdown, 20k long writing, content warnings, existing image galleries, click-to-load video embeds, single-choice polls and aggregate event RSVP. The composer reveals optional controls from one small menu; basic posting remains text-first. Author edit/delete and moderator hide/restore/lock/pin use the engine's current permissions, revision checks and restricted moderation history. AT/release lifecycle posts do not get unsafe local-only remote edits.

Primary actions are neutral, with a subdued customizable accent. Self-loading routes own their loader, retaining encrypted DM state across conversation navigation. Public context URL/language fields are collapsed and the URL defaults from the name. Community pins appear separately without changing chronological cursors.

`/labs/spaces` shows the actual isolated official alpha test report, not a live hosted PDS. The trial identified a still-readable old credential immediately after member removal. Ordinary private communities continue checking local membership on every request; no private content was migrated.

Engine scope, capacity observations, future corpus/Wiki workflow and remaining Photon/PieFed gaps: [Strata checkpoint](https://github.com/yohn-maistre/strata/blob/feat/connected-oauth/docs/forum-rich-content-checkpoint.md).

Validation: Svelte check, ESLint, crypto/contrast/thread unit checks, four loopback-only browser contracts (forum, governance, real MLS messaging and rich content). Rich content checks include sanitized hostile Markdown, no automatic video request, poll/RSVP, revision edit, locked composer, overflow at 320–1440 px and actual composer creation of a titled Markdown poll. No synthetic content is seeded into the live preview.
