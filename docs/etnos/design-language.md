# Visual source and implementation rules

## Sources
Read local Watch source rather than fetching a rendered page to infer CSS:
- src/views/IssuesView.astro: topics-opening is a concise title/action, no explanatory hero. following-mosaic uses an asymmetric grid and purposeful topic colors. Tiles use radial gradients, thin concentric rings and large balanced titles. Adapt geometry to the new soft-but-not-pill direction; do not copy every dimension blindly.
- src/styles/library-list.css: real covers outrank decoration; radial glow/rings/soft shading provide honest no-cover fallback. Type palettes distinguish book, research, report, document, website, data, media and archive. Do not add initials or fake book covers.
- src/components/ProgrammeBanner.astro and its imported polish styles: inspect the full cascade for lilac banner accents. Do not retain expired event text just to preserve its color.
- src/layouts/BaseLayout.astro, src/styles/global.css and imported polish files: inspect token ownership/cascade rather than layering endless overrides.

Issue tile source palette anchors (not an entire accessible theme):
- green base #263c32, glow #788b58;
- lilac base #383146, glow #8c788a;
- blue base #243c48, glow #497d84;
- copper base #493930, glow #a68065.
Use these as material/color references. Test text and controls against each surface in both modes; do not blindly invert them for light mode.

## Theme families
Watch dark/light: ink or clean near-white canvases with lilac identity, restrained watercolor-like accents and issue-specific materials.
Honai Evolved dark/light: HTML Honai Night for the dark reference; Paper Archive informs the light reference without sepia nostalgia. Common component sizing/spacing and semantic tokens across all combinations.

HTML Honai Evolved exact preset: grammar=honai, font=instrument, density=comfortable, palette=honai, surfaces=soft, radius=round, separation=regions, nav=hybrid, layout=three, motion=calm. This is a starting point, not the final spec: user subsequently requested less round corners, sidebar desktop, visible mobile navigation and adaptive rather than compulsory three columns.
HTML Honai Night anchors: canvas #080716, surface #111126, ink #f0e5cf, accent #e7d5aa, secondary #bd8a67. Comfortable body reference: 16px and line-height 1.58; post text 1.68. Test final typography, do not freeze all mockup numbers.

## Copy
Prefer 'Explore' or localized 'Jelajah' with the actual controls/content beneath. Reject repeated equivalents of 'Explore Papua / a place to explore Papua / from Papua for Papua / updated hourly'. Time labels belong to an actual content freshness fact, never a decorative credibility claim.
Use content-bearing descriptions for issues, articles and resources; this prohibition concerns redundant interface explanation, not removal of useful editorial substance. Preserve canonical summaries; overview excerpts remain presentation-only.

## Layout and material
Forum: compact page header/feed controls/composer/posts. No marketing hero.
Explore: concise heading/search; low panoramic map with expand control; News/Issues/Wiki/Library; section-specific content. Map persistence refers to state and orientation, not an enormous fixed height.
Right rails are optional and context-driven. Detailed stories/wiki need reading layouts, not forced social cards.
Use whitespace, grouping, surface regions and typography before borders. Modest radii, shadows for floating menus/dialogs, restrained highlights. Flourishes belong to thematic objects, not every paragraph or button.
Show Papua through sourced photographs, language and place/community specificity; avoid generic Indigenous ornaments.

## Component implementation
Use a token layer and a small styled primitive layer based on shadcn-svelte where it improves behavior. Feature components consume those primitives. Keep upstream forum business logic separate from ETNOS rendering where possible. Do not replace all primitives mechanically; evaluate editor, markdown safety, modal history, focus management and mobile interactions.
No forced new dependency family merely for fashion. Verify current shadcn-svelte compatibility with the selected Photon Svelte/Tailwind versions before installation.
