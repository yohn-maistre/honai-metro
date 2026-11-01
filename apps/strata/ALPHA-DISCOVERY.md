# ETNOS alpha discovery pass

1 November 2026 · Owner selected public reading and invited posting for approximately twenty friends.

## Implemented

- Header/Ctrl/Cmd K search uses the installed Bits UI Command primitive with existing shadcn-style Dialog/Button controls. Keyboard selection, Escape/focus return, result categories and full `/find?q=` URLs work against the engine's actual `/v1/search`. No additional command dependency or mock news source was installed.
- People/name/DID, posts (including replies), communities, public contexts, eligible groups and accepted Wiki text share one permission-filtered search. Blank search shows real results. Current visible followed people receive priority among identity suggestions. This is bounded literal search; full search pagination and Unicode folding/ranking remain work. Content-warning posts do not expose their body in search previews.
- Profiles fetch their actor and author-filtered paginated posts directly, independent of the first home-feed page. Follow/unfollow and a real following feed are local to ETNOS. Public follower graphs and AT follow mirroring were not added. Profile edit/avatar/bio/links remain future work.
- Explore uses actual context tiles, available communities, discoverable people and Wiki links, including a modest honest state when no contexts exist. Old Honai sample content was not copied into the deployment.
- Appearance: four complete surface ramps (Graphite/Paper/Stone/Ink), nine accent presets plus custom accents, and optional static Grain/Dither tiles. Plain is the default. Settings persist locally and never store identity/membership preferences. User-requested optional texture/tinted bases are deliberate exceptions to generic Taste/Unslop palette/texture bans.
- DM picker explains self-exclusion. Server-side DID/name matching and prior-peer discovery preserve two-way blocking and private-only stranger exclusion. Newcomers still need messaging setup and an eligible visible conversation or existing DM relationship.
- Composer focus no longer draws an underline across the writing area on mobile. Long identity/audience rows wrap within their column.

## Design and evidence

Continuing Taste v2 `true-black-flat`, seed 10312026, and the established Threads reference, not choosing a new landing-page template. Product: a community conversation and reviewed-knowledge forum. Character: sociable, calm, exact. World: authored words, community places and shared media. Richness belongs in real posts/context tiles and optional personal appearance, not invented trends. ETNOS's wordmark and independent small accent remain the signature.

[Unslop by Damir Sokolovsky (@heydamir)](https://github.com/heydamir/unslop), CC BY 4.0, informed the 4px spacing scale, compact rows, consistent neutral controls and type hierarchy. The user explicitly requested base palettes and optional texture; these override its generic texture restriction. No animated shader or rendering loop is used. Static procedural tiles are local application assets.

The built-browser discovery journey uses an isolated SQLite API and checks own-handle search, hidden-only stranger exclusion, a profile absent from 30 home posts, keyboard selection, following feed, Escape/focus return and appearance persistence. Screenshots cover 390/768/1440px. The first screenshot pass caught double-translated mobile search; explicit dialog viewport bounds assertions were added. Overflow alone did not catch it. Existing forum, governance, MLS messaging and rich-post browser journeys remain required.

Full operational scope, capacity/prices, domain continuity, WPW and Aksara plans live in Strata's `docs/alpha-20.md` and `docs/client-deployment-contract.md`. No hosted PDS signup, AT broadcast, news connector or model-backed resident agent is implied by this UI pass.

## Follow-up: navigation, dialogs and account hosting

The owner requested stronger compact navigation and Bluesky-like accent placement, fuller Explore tiles and custom app controls. Sidebar rows now use stronger 16px labels, a 40px desktop/44px mobile pitch, a restrained active icon/surface and the chosen accent on the Post action. A ninth accent preset, Langit, is available.

Explore restores a wide-plus-two-tile composition using actual eligible public image/event posts when available, plus working community, Wiki and context destinations. Plain text tiles are the fallback when the alpha has no contributed photographs. No old mock news, concert attendance or invented corpus counts were seeded.

All currently used native application selection menus were replaced with one shared shadcn Select/Bits UI component: composer audience, poll duration, reply order, community visibility and the group/space/context/work/member-role forms. Empty choices, dynamic eligible options, labels, disabled state and typeahead remain supported. The ordinary OS file picker/share sheet and text editing menu are intentional platform interactions. A right-click on a non-interactive post area opens the existing custom post-action menu; selecting text/links does not lose the normal browser behavior.

The post editor now puts Cancel/title/Save in one header, shows author/community context, prioritizes the writing, and progressively exposes title/link/warning fields. Dirty edits require a discard decision on Escape, outside click or Cancel. Other dialogs share compact headings, grouped fields, custom selectors, bounded scrolling and consistent submit/close controls. Mobile post composition keeps its exact full-screen behavior rather than inheriting generic dialog height/padding.

Six browser journeys now cover the existing product plus custom selection, post right-click, edit keep/discard/save and edit/delete viewport bounds at 390/768/1440px. Menu/dialog screenshots wait for opening animations to settle; a mid-transition screenshot is not treated as a finished surface. The work remains viewport testing, not certification of every physical phone keyboard or assistive technology.

The owner selected full AT accounts as the direction rather than local-only accounts. PDS hosting/signup options are documented in Strata Decision 004; this UI change does not add a fake account-creation form before a PDS target is available. DNS zone activation and PDS/account lifecycle are separate requirements.
