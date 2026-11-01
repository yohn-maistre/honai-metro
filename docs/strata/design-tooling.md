# Design tooling

Taste is installed in this cloud workspace at /workspace/.agents/skills/design-taste-frontend. Source: Leonxlnx/taste-skill v2.1.5, commit 12af471f627f866411b4bd785b19646d3672784c, MIT. The complete skill, references, pattern library, scripts and licence were installed together; no API keys or npm packages are needed by its inspector. This is a workspace installation, not a claim that a ChatGPT plugin was installed for every session.

Use the app-screen workflow in its references/app-screens.md. ETNOS is a working community application, not a marketing landing page. The library includes seven app styles and screen patterns as well as its marketing-page compositions; the app patterns are the relevant starting point here. Selected sheet: true-black-flat, seed 10312026, with Instrument Sans retained. Warm neutral/black surfaces, restrained meaningful colour and compact typed context links give this product its identity. The default lime is not a requirement when it conflicts with the product's world.

Current-run baseline inspector captured the live anonymous feed at 1440, 768 and 390px. Findings: missing h1 on the feed, metadata under 11px, a decorative gradient, and deliberate first-run empty space. Accepted screenshots were visually inspected. Treat the empty deployment honestly; do not manufacture conversations or counts to satisfy a visual heuristic. Populated-state testing uses isolated fixtures and never seeds public storage.

The owner selected **shadcn-svelte throughout**, with Lucide as the single icon set. Official CLI 1.7.2 installed Nova copied-source components into the standalone Svelte/Vite app; Bits UI 2.20.2 supplies the primitives, and Tailwind 4.3.3 supplies their shared styling. The generated registry's newer presence-based state selectors were adapted to the pinned Bits UI's actual `data-state`/`data-orientation` contract. Sidebar's boolean active attribute was corrected so inactive links are not all highlighted. MIT source attribution is retained in apps/strata/licenses and a generated third-party notices artifact.

| Area | Selected baseline |
| --- | --- |
| AT login | login-01 Card/Field/Input/Button, adapted to handle + provider OAuth; no fake password/social login |
| Desktop/mobile shell | Sidebar/Inset and Sheet, Breadcrumb, Avatar and DropdownMenu |
| Feed and object surfaces | Flat Card rows for discussion; Card tiles for communities, contexts and organizations |
| Forms | Input, Textarea, Label/Field, Checkbox; NativeSelect preserves familiar mobile pickers |
| Navigation within a screen | Tabs with connected panels for community/group sections; pressed Button groups for feed/activity filters and theme controls |
| Editors and review | Dialog, Button/Badge, readable document and review Cards |
| Private messages | Inbox Card rows, local unlock/setup fields, Dialog comparison code, DropdownMenu actions and AlertDialog for block/close |
| Feedback | Native accessible status/alert regions, real loading/error/empty states and restrained component transitions |

Cult UI's React components are references rather than an extra runtime. Useful motion stays near interaction state: short dialog/sheet/menu transitions and button feedback, with reduced-motion overrides. There are no entrance gates, animated feed backgrounds or invented activity counters.

Palette evidence: aksara-core/apps/platform/src/workspace/appearance.ts at 2017d5b defines lilac #aa8bd5, clay #b7775c, sage #7b9287 and neutral #8b8b95. The live abstraksi-world.pages.dev computed palette uses accent #c5b0e2, warm paper #e6dfd3, surface #202022 and ink #f0ede7. The older abstraksi docs-site terracotta is not confused with that live visual reference. Honai defaults to the live Abstraksi accent, supplies the Aksara family presets and accepts a validated #RRGGBB custom accent. The shared role generator adjusts accent text to at least 4.7:1 against the limiting ordinary surface and chooses a readable button foreground; it does not blindly paste a seed hex onto both themes. Preferences are per browser and grant no institution/group authority.

Taste's generic violet prohibition is deliberately overridden by the owner's explicit Abstraksi/Aksara palette request. First-run empty space is retained honestly; no fake posts or people are deployed to improve an audit score. Browser screenshots must be inspected after running the app inspector; automated findings are evidence, not an approval.
Skill reference: https://github.com/Leonxlnx/taste-skill/tree/v2.1.5/skills/taste-skill
Libraries: https://www.cult-ui.com · https://www.shadcn-svelte.com/docs · https://bits-ui.com/docs/introduction

All installation, builds, screenshots and audits run in the cloud. The owner's phone has no build/install requirement. Tool output alone is not visual approval or a security audit; inspect screenshots and test real interaction/accessibility states.
