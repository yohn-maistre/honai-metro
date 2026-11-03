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

## Threads-style conversation pass

Installed the full [heydamir/unslop](https://github.com/heydamir/unslop) skill in `/workspace/.agents/skills/unslop`, pinned to `1d13095e4bef6ad6c74f1dd828d84c4ba309a4dc`. Created by Damir Sokolovsky (@heydamir), licensed CC BY 4.0; creator credit and source link are retained in this adaptation. Skill files/references/LICENSE are installed together. No external skill scripts or packages were executed for installation.

The owner explicitly authorized implementation using supplied Threads/Bluesky screenshots, so Unslop's “skip the wait only when the user already said to just do it” applies. Direction: a public square for people and institutions; conversational, warm, grounded; quiet ink and paper surfaces; richness in posted images and people; an avatar connector as the consistent thread detail. Existing Instrument Sans and customizable Abstraksi/Aksara colors remain. This task is a forum, so its 640–680px reading column takes precedence over the skill's generic dashboard-width example.

Audit: feed padding and line height inflated each row; reply cards lacked avatars, hierarchy and actions; the outline reply button looked like a form control; the shared creation modal imposed an oversized settings-form layout; reply links lost their specific target; cursor replies were not exposed in UI. Implementation follows spacing, palette, icon, copy/type, layout, details and purposeful motion passes. New controls use existing shadcn primitives and Lucide. No decorative animation, hero visual or synthetic deployed content was added.

Taste's app inspector reports no FAIL findings with the explicit palette allowances; the real empty fixture retains a desktop empty-space warning. Populated fixture screenshots cover thread, nested branch and composer on phone/desktop. Browser contracts exercise actual Strata API/SQLite, gallery upload/alt text/viewer, reply nesting/collapse/actions and the existing governance/MLS flows. Physical phone keyboard behavior is still an operational check.


## Impeccable review tooling, 4 November 2026

Installed the official [Impeccable](https://github.com/pbakaus/impeccable) skill 4.8.0 from upstream commit `9fadc41729c38fd47d7ae622b501558653f9d2e9` at `.agents/skills/impeccable`. Apache-2.0 license retained alongside the skill. Native engine 0.1.18 is downloaded/verified against the shipped checksums and ignored by Git; the source wrappers and references are retained. No hooks, Live Apply or product runtime dependency were enabled. The first review preserves the incumbent visual system and evaluates the existing application; no replacement design world is implied by installation.

## ETNOS font-pair and surface refinement

The connected app now defaults to **Gabarito + Instrument Serif**, the owner's requested first pairing following `https://abstraksi-world.pages.dev`. The other choices, in order, are **Geist + Geist Serif**, **Instrument Sans + Instrument Serif**, **Geist + Newsreader**, and **Source Sans 3 + Source Serif 4**. `apps/strata/src/font-pairs.ts` owns the list. The entry imports the default self-hosted Gabarito and Instrument Serif faces; optional families load by dynamic import when selected. All choices use `--font-sans` for body/controls and `--font-editorial` for editorial titles. They do not change account or community authority.

Pinned Fontsource packages in the app manifest/lockfile: `@fontsource-variable/gabarito@5.3.0`, `@fontsource-variable/geist@5.3.0`, `@fontsource-variable/instrument-sans@5.3.0`, `@fontsource-variable/newsreader@5.3.0`, `@fontsource-variable/source-sans-3@5.3.1`, `@fontsource-variable/source-serif-4@5.3.1`, and `@fontsource/instrument-serif@5.3.0`. Their bundled OFL notices are copied by `apps/strata/scripts/notices.mjs` into the generated third-party notices; package-provided font files are served locally by the build.

**Official Geist Serif:** the Regular WOFF2 is copied unmodified from the published npm package [`geist@1.9.0`](https://www.npmjs.com/package/geist/v/1.9.0), not synthesized from another serif and not loaded through a Next runtime. Upstream identity: [Vercel Geist](https://vercel.com/font). Local asset: `apps/strata/public/fonts/GeistSerif-Regular.woff2`; SHA-256: `d11c9077e61bda553e2eea121409c584504319e08f972d11e0a38ed4b14de398`. The OFL is retained at `apps/strata/licenses/geist-serif-OFL.txt`. `apps/strata/src/styles/geist-serif.css` declares the local Regular face with `font-display: swap`.

The current default Abstraksi accent seed is `#b8b2c1`; older palette observations above describe their review date, not a second current default. Dark Graphite is the initial base/theme. Kertas, Batu and Tinta plus independent accents remain available. Serat is still the default, now with a soft option using an 84% ground overlay over the 128px grain tile; full grain, plain and dither are retained. `PRODUCT.md`, `DESIGN.md` and `.impeccable/design.json` at the repository root formally record this connected ETNOS scope and exclude legacy Photon.
