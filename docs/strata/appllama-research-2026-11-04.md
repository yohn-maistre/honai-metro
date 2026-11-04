# AppLlama setup and first design-reference pass

4 November 2026. This is a targeted public-reference review, not a full catalogue audit or a new ETNOS visual implementation.

## Installed and connected status

The official [Appllama skills](https://github.com/Appllama/appllama-skills) are installed in this repository at `.agents/skills/appllama-usage` and `.agents/skills/appllama-app-design-skill`. Source commit: `dd5caaec3d5d50ad7fc0324da238119c6b7c3707`. Both complete skill directories, MIT license and a source receipt are present. All 11 upstream skill/reference files were checked byte-for-byte against the pinned checkout. No upstream installer, hook or runtime dependency was executed or added.

The executor's Codex CLI has an enabled Streamable HTTP MCP entry named `appllama`, pointing to the official `https://mcp.appllama.io/mcp`. `codex mcp get appllama` verifies this configuration. This is a workspace CLI configuration, not a ChatGPT account-wide plugin installation or a connected tool in this conversation.

The Plugin Management catalogue search returned no AppLlama plugin. The official remote server advertised OAuth and the CLI successfully began authorization; it was cancelled before account consent. **MCP catalogue access is not authenticated.** The [official MCP page](https://appllama.io/mcp) requires an AppLlama Pro subscription and OAuth authorization. No subscription was purchased, no account created and no user token supplied. In an interactive client the remaining step is its AppLlama OAuth login (`codex mcp login appllama` for this CLI); a cloud executor's loopback callback must not be mistaken for a callback on the user's phone. Once genuinely connected, begin with the free `get_credits` tool before paid catalogue calls.

The app-design skill targets native Expo/React Native. ETNOS remains Svelte on the web. Its research, navigation and state-feedback principles are useful; its stack and native-only requirements do not imply a rewrite. The owner's Gabarito + Geist Serif, sky-blue accent, calm feed and retained profile cover take precedence over generic aesthetic defaults.

## What was actually inspected

Public pages were read with Firecrawl, then opened with Chromium/Playwright. Screenshots were visually inspected; the loader's replay and pause control were exercised. The public catalogue's “Unlock this screen” boundary was respected.

| Reference | Evidence and useful observation |
| --- | --- |
| [AppLlama screens](https://appllama.io/screens), Feeds & community filter | Public grid plus enlarged **Seeking Alpha — Trending Analysis Feed** and **corner: curate & share places — Friends Map Intro**. Seeking Alpha uses compact headline rows with restrained separators; corner puts personality in a deliberately dense people/place collage. These are individual screens, not verified complete app journeys. |
| Same public community grid, **YouTube — Home Feed Loading** | Loading placeholders preserve the final media/author/text layout, while navigation remains available. A useful partial-loading pattern; it does not justify adding a full-screen wait. |
| [Welcome-screen studies](https://github.com/Appllama/top-welcome-screens) | Both official showcase images, covering all ten reconstructed final states, and the README's API/motion notes. Artwork varies widely while primary/returning-account actions generally occupy stable, familiar positions. These are AppLlama reconstructions, not direct testing of those ten shipping apps. The animated native welcome flows were not run. |
| [Loading-button demo](https://loader-buttons.appllama.io/) | All 25 public examples in the gallery; replay and pause/play exercised, temporal screenshots inspected. **Sandpile Bloom** is a precomputed 13 × 13 sandpile automaton, close to the owner's cellular-automata idea. **Braille Flipwave** is another compact dot-based treatment. No device performance claim follows from this desktop browser visit. |
| [Flows](https://appllama.io/flows) and [UI elements](https://appllama.io/elements) | Inspected the public research navigation. Community, Profile, Explore, sheets, lists, tab bars and loading states offer a useful route into the catalogue once connected. Counts and revenue are catalogue metadata, not proof of usability. |

Public work index: https://appllama.io/public-works. The welcome/paywall/loader demo code is GPL-3.0, distinct from the MIT skills. No demo code, third-party branding or artwork was copied into ETNOS. Local research screenshots under `/tmp/etnos-appllama-*` are inspection evidence and are not redistributed in this repository.

## Recommendations for ETNOS

1. **Let people and places carry personality.** Keep a usable profile cover and let authored imagery lead on profiles and community pages. Corner's collage is an example of a strong editorial voice; its density would overwhelm an everyday discussion feed. Do not restore the home hero or banner initials the owner removed.
2. **Give news a consistent reading rhythm.** A lead story can carry imagery, followed by compact headline/source/time rows. Seeking Alpha demonstrates how a list remains legible with modest separators. Preserve meaningful ETNOS source/context links; avoid a separate “read and share” instruction block.
3. **Make waiting local and truthful.** Reserve image geometry, retain navigation during refresh, keep an action's label stable and expose its actual pending/success/error state. An attractive indefinite animation must not imply an agent is doing work when no request is running.
4. **Use one small signature interaction, later.** A lightweight, original pixel/sandpile treatment could appear only when the user deliberately pulls past the top or requests refresh. Stop it when the request finishes; respect reduced motion and avoid forcing an artificial minimum delay. The current feed remains unchanged. Any implementation needs keyboard/screen-reader equivalents, mobile input testing and measured cost on modest phones; there is no reason to add WebGL just to draw a few dots.
5. **Study signup as a journey.** After AppLlama authentication, compare complete signup and community-join paths from three relevant products, including cancellation, returning accounts and denied access. For ETNOS the primary continuation can remain “Lanjutkan dengan Bluesky”, with existing-account access and return-to-origin handling. Provider account creation, ETNOS enrollment, optional handle confirmation and protected-room admission are distinct steps.

## Where AppLlama helps next

It is useful for detailed component and flow research, especially navigation, profile structure and first-account experiences. Its mobile revenue-oriented selection is only one reference pool for a public forum. It does not settle ETNOS's community/topic/organisation model or protection of cultural data. Those remain governed by the [model and onboarding plan](model-and-onboarding-2026-11-04.md).

The previous UI changes are already [deployed and verified](topics-2026-11-04/README.md). This installation/research pass does not alter the deployed runtime. Provider-started new-account enrollment, pre-account invitations, the handle-claim registry and explicit topic assignment remain outstanding implementation, not features unlocked by installing this design tool.
