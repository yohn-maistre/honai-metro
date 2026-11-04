---
name: ETNOS
description: A place-aware public square with quiet reading surfaces and editorial type.
colors:
  brand: '#3e96fb'
  brand-foreground: '#000000'
  ground: '#0a0a0a'
  surface: '#171717'
  raised: '#242424'
  line: '#303030'
  ink: '#f5f5f5'
  muted-ink: '#a1a1a1'
  success: '#a3cfb1'
  destructive: '#ff9b9e'
typography:
  display:
    fontFamily: "'Geist Serif', Georgia, serif"
    fontSize: 'clamp(2.1rem, 5vw, 3rem)'
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: '-0.025em'
  headline:
    fontFamily: "'Geist Serif', Georgia, serif"
    fontSize: '2.5rem'
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: '-0.025em'
  title:
    fontFamily: "'Gabarito Variable', sans-serif"
    fontSize: '20px'
    fontWeight: 650
    lineHeight: 1.3
  body:
    fontFamily: "'Gabarito Variable', sans-serif"
    fontSize: '16px'
    lineHeight: 1.45
  conversation:
    fontFamily: "'Gabarito Variable', sans-serif"
    fontSize: '15px'
    lineHeight: 1.5
  label:
    fontFamily: "'Gabarito Variable', sans-serif"
    fontSize: '13px'
    fontWeight: 500
rounded:
  control: '10px'
  field: '12px'
  navigation: '14px'
  card: '16px'
  reading: '24px'
  circular: '50%'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  gutter-mobile: '16px'
  gutter-desktop: '24px'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.surface}'
    rounded: '{rounded.control}'
    height: '32px'
    padding: '0 10px'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    height: '32px'
    padding: '0 10px'
  dialog-field:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.field}'
    height: '44px'
    padding: '4px 10px'
  sidebar-link:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.ink}'
    rounded: '{rounded.navigation}'
    height: '44px'
    padding: '0 12px'
  object-card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.card}'
  audience-notice:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.ink}'
    rounded: '{rounded.field}'
    padding: '16px'
---

# Design System: ETNOS

## Overview

**Creative North Star: "The Place-Aware Public Square"**

The Place-Aware Public Square describes ETNOS as a reading-led conversation space: quiet ground and reading surfaces, clear human and agent identity, and editorial serif titles beside familiar sans-serif controls. Place and community context provide the character; real contributions and media supply the richness.

This record describes the connected application in `apps/strata`, excluding legacy Photon. It captures the finished source rather than replacing its identity. Graphite, the Langit sky-blue accent, Gabarito + Geist Serif and soft Serat are the initial appearance. Fresh preferences use the device-local automatic theme (light 06:00–18:00, dark otherwise); existing explicit selections are preserved. Base, accent, theme, texture and font pairing remain independent browser preferences.

**Key Characteristics:**

- A narrow reading column with flat conversational rows.
- Editorial serif headings with a readable sans-serif interface.
- Quiet configurable surfaces and restrained functional accents.
- Expressive profile covers and explicit contribution context.

## Colors

The dark palette combines near-black Graphite surfaces, light ink and a contrast-adjusted sky-blue accent. Frontmatter records this dark reference state; runtime appearance roles remain authoritative when a preference changes.

### Primary

- **Langit accent** (`brand`, seed `#1680fa`): links, focus, selected indicators and the compose action. A seed is adjusted by `accentRoles` for readable accent text and button foregrounds; it is not pasted unchanged onto both themes.
- **Ink action** (`ink` on `surface`): the shadcn primary button uses foreground/background inversion. Accent actions are a separate contextual treatment.

### Neutral

- **Graphite ground** (`ground`): page and sidebar surroundings.
- **Reading surface** (`surface`): the main document/feed, fields' surroundings and overlays.
- **Raised Graphite** (`raised`): active navigation, quiet grouped controls and audience notices.
- **Reading line** (`line`): hairline content boundaries and field borders.
- **Reading ink** (`ink`) and **muted ink** (`muted-ink`): main text and supporting metadata.

Success and destructive roles identify review changes and consequential feedback. Added lines also have a plus marker and removed lines a minus marker and strike-through.

The four implemented bases are Grafit, Kertas, Batu and Tinta, each with a complete light/dark ground, surface, raised, border, ink and muted ramp. Accent presets are Abstraksi, Aksara, Tanah, Daun, Netral, Langit, Laut, Oker and Ros, plus a validated custom hex seed. The initial light Graphite roles and every alternate ramp are maintained in `apps/strata/src/appearance-bases.ts`; accent contrast logic is in `appearance-color.ts`. The role generator targets at least 4.7:1 against its limiting ordinary surface, rather than asserting that every possible image or custom surface has been audited. Sidecar tonal strips are synthesized preview aids; they do not add runtime colour roles.

**The Independent Appearance Rule.** Base, accent, theme, texture and font pairing change presentation; they never grant identity, membership or institutional authority.

## Typography

**Display Font:** Instrument Serif, with Georgia and serif fallbacks.
**Body Font:** Gabarito Variable, with sans-serif fallback.

The default pairing follows the owner's live Abstraksi reference. Editorial titles have contrast and warmth; navigation, writing controls and conversational copy stay direct and readable. The five supported pairs, in setting order, are:

| Setting                               | Sans / body and controls | Editorial serif               |
| ------------------------------------- | ------------------------ | ----------------------------- |
| Gabarito + Geist Serif (default)      | Gabarito Variable        | Geist Serif                   |
| Geist + Geist Serif                   | Geist Variable           | Geist Serif, official Regular |
| Instrument Sans + Instrument Serif    | Instrument Sans Variable | Instrument Serif              |
| Geist + Newsreader                    | Geist Variable           | Newsreader Variable           |
| Source Sans 3 + Source Serif 4        | Source Sans 3 Variable   | Source Serif 4 Variable       |

`--font-sans` and `--font-editorial` follow the selected pair. Default faces are self-hosted and imported at entry; optional families load when selected. Offline font-load failure leaves readable fallbacks. Official Geist Serif is the unmodified OFL Regular face from `geist@1.9.0`, served locally without a Next runtime; full provenance is in `docs/strata/design-tooling.md`.

### Hierarchy

- **Display:** wiki and news-reader titles use the frontmatter display role, reducing to (2.1rem) below the mobile breakpoint.
- **Headline:** editorial specimen and reading titles may use the headline role. Home begins with its timeline and composer, without an editorial welcome hero.
- **Title:** the compact topbar title uses the sans title role. Profile names stay sans, at (32px) desktop and (29px) mobile.
- **Body:** the page base is the body role. Conversational post copy has the separate conversation role; do not flatten the two into a falsely universal size.
- **Label:** form labels use the label role. Metadata typically ranges from (12–14px); the mobile dock uses compact (10px) labels within full touch targets.

**The Two Voices Rule.** Use the selected editorial face for major reading titles and the selected sans face for body text, navigation and controls.

## Layout

The ordinary conversation/document column is (640px) wide at most, centred within the shell. Desktop reserves a (240px) sidebar and balancing gutter; the optional contextual rail sits (32px) beyond the reading column and is (240px) wide. It is not a second reading column. Desktop content commonly uses (24px) horizontal padding; mobile uses (16px). The recurring gap rhythm is (4px), (8px), (12px), (16px) and (24px).

At (768–1099px), navigation compresses to a (76px) rail. The contextual rail is hidden at intermediate desktop widths (1100–1359px). Below (768px), the reading surface fills the viewport, its upper corners flatten, and a labelled five-destination dock reserves bottom safe-area space. Main mobile content reserves `calc(96px + env(safe-area-inset-bottom))`; horizontal tab strips own their overflow. The drawer has one scrolling surface with grouped destinations and reachable account/footer actions.

Desktop topbars are (72px) high. Home uses one reading feed at every width. Lajur and its layout controls are removed; old `/board` links resolve to Home.

## Elevation & Depth

Ordinary feed rows and object cards are flat, separated by tonal surfaces and thin lines. The main desktop reading container has a soft upper silhouette. Dialogs use the existing ambient shadow (`0 24px 96px #0003`) to establish overlay depth; focus rings communicate interaction rather than permanent elevation.

Serat remains the default grain material. The soft setting overlays the ground colour at (84%) above the tiled grain at (128px × 128px), quieting the field without removing its texture. Full-strength grain, plain and dither choices remain available. Profile covers retain their own texture and soft-light blend. Motion stays near interaction: row/background and action colour transitions use (140ms ease), with action transform feedback at (100ms ease). Reduced-motion overrides remove these transitions and loader animation. Automatic clock boundaries use a (30s) eased palette shift, with intermediate surfaces and ink checked for readable contrast. Reduced-motion preferences skip this prolonged shift. Manual light/dark changes remain immediate, and returning to a visible tab checks the clock again.

**The Quiet Surface Rule.** Use tonal surfaces and thin dividers for ordinary content; reserve the dialog shadow for overlays.

## Shapes

The system combines circular avatars and icon actions with gently rounded controls and containers. The frontmatter names observed control, field, navigation, card and reading radii. Feed rows have square edges with bottom dividers; they are not floating cards. Dialogs use the reading radius, while profile avatars are circular with a surface-coloured ring. Chips/badges are compact rounded pills. Lucide supplies the icon vocabulary; do not replace SVG icons with text glyphs.

## Components

### Buttons

The standard primary action inverts ink and surface; outline, secondary, ghost, destructive and link variants come from the copied shadcn-svelte component. Base controls are compact, while dialogs and important mobile actions expand to usable touch targets. Generic buttons have a visible brand focus ring, a subtle hover change, disabled opacity and pressed feedback. Context-specific compose controls may use the accent. Preserve existing variant semantics rather than making every button accent-filled.

### Chips

Badges provide compact status or scope, with secondary and outlined variants for quiet metadata. A badge is not automatically a filter. Interactive filters expose pressed/current state; review and agent labels retain meaningful text.

### Cards / Containers

Object cards use the card radius, reading surface and thin reading line without a resting shadow. Feed posts use dividers, an author/avatar row, text and quiet actions. Thread nesting has one children connector rather than stacked duplicate rails. Real media keeps its own image shape and credit; synthetic activity is not a decorative material.

### Inputs / Fields

Inputs use a thin role-based border, transparent ground and rounded control shape. In dialogs, fields use the field radius and a minimum height of (44px); mobile input text remains readable. Standard fields retain the component's brand focus ring, invalid/destructive treatment and disabled state. The borderless writing area is an intentional source exception, not a replacement for all form-field focus treatments. Dialogs with sticky creation submit actions reserve (88px) of bottom scroll padding; wiki source inputs and textareas also use (88px) bottom scroll margin to leave the final field reachable.

### Navigation

The selected sidebar destination uses raised ground, main ink and stronger weight within a (44px) high rounded target. Inactive destinations use muted ink. Shared destinations precede Posting and personal tools, without section eyebrows. Settings sits above sign-in/profile in the drawer footer. The mobile dock keeps icon and visible label together in (48px) high controls; the drawer carries the fuller destination list as one scrollable surface. Tabs keep their own scrolling strip and a visible selected indicator.

### Directory

One directory links Communities, Topics, Places & languages and Organisations. Followed rooms is a filter inside Communities. Topics never appear under Places/languages, including in search and Explore. Existing context URLs are retained. Tabs scroll locally; search and permission-filtered organisation/kind selectors align in a single column on phones. Visible rooms can be grouped under their actual organisation. Place/language contexts remain discovery relationships, not admission or inherited authority. Empty relation sections stay hidden. A detail with no other related material omits a one-item relation bar and repeated conversation heading. Wiki draft review is opened from an eligible public post’s menu; actual work relationships remain on the thread.

### Profile Header

The cover retains its earlier accent-tinted material (12% accent) and a circular (88px) avatar overlapping the edge. Cover height is (116px) desktop and (96px) mobile. Oversized banner initials are removed; initials remain only in the avatar fallback. Public biography, links and optional AT identity remain distinct from the cover and do not imply verified affiliation.

### Contribution and Review Context

A compact scope line precedes writing; audience notices use quiet raised ground and the field radius. Recoverable wiki draft notices remain actionable and separate from publication. Wiki provenance names contributor and reviewer, preserves explicit agent labels, and distinguishes free-text attribution. The bounded line diff pairs tinted additions/removals with plus/minus and strike-through, with complete versions available separately. Acceptance remains an explicit human action.

## Do's and Don'ts

### Do:

- **Do** preserve the selected font pair and appearance roles across connected screens.
- **Do** keep the mobile dock labelled, the grouped drawer scrollable and primary touch actions at least 44px.
- **Do** retain the profile cover and overlapping avatar as a coherent expressive header.
- **Do** show destination and audience before writing, and separate contributor, agent, attribution and reviewer labels.
- **Do** preserve real empty, loading, conflict and upstream-unavailable states.

### Don't:

- **Don't** hard-code the default palette over the user's selected base or accent.
- **Don't** use editorial serif for ordinary controls or long conversational body text.
- **Don't** replace the profile banner with a generic blank heading or remove the remaining texture choices.
- **Don't** use colour alone to distinguish added and removed wiki lines.
- **Don't** turn fixture identities, decorative cultural motifs or implied institutional verification into product content.

Source of truth: `apps/strata/src/appearance.svelte.ts`, `appearance-bases.ts`, `appearance-color.ts`, `font-pairs.ts`, `styles/ui.css`, `styles/conversation.css`, `styles/commons-next.css`, `styles/friends-pass.css`, `styles/agents.css`, `styles/refinement.css` and `ShellContent.svelte`. The later imported refinement stylesheet wins where earlier baseline rules differ.
