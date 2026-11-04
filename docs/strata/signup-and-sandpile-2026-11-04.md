# Bluesky signup and pull-to-refresh sand

The owner selected **open signup through Bluesky**, and explicitly requested an accent-colored pixel pile that disintegrates downward. These are implemented in the connected Svelte client and Strata's OAuth boundary; deployment evidence is recorded below after release.

## Signup

`/login?mode=signup` opens “Bergabung dengan ETNOS”. The primary action begins the actual ETNOS OAuth endpoint at Bluesky, rather than opening a generic Bluesky homepage. A newcomer can create an account or use an existing account inside the provider's UI, then return with an ETNOS session. Passwords remain with the provider. The form reads `/auth/options`; open mode asks for neither a handle nor an invite code. Closed and invite-only policies have explicit UI states, and provider-unavailable checks can be retried.

Existing members retain handle-based login. Internal sign-in navigation preserves a bounded return destination in sealed server state; default new enrollment lands at `/communities?welcome=1`, with a dismissible welcome and the existing community directory. Signup does not select a community, infer cultural affiliation, grant membership or authorize an agent. A failed/cancelled flow tells the person to reuse an account already created at the provider, rather than create another.

The [engine contract](https://github.com/yohn-maistre/strata/blob/feat/connected-oauth/docs/signup-2026-11-04.md) documents open/invite/closed configuration, transaction boundaries, revocation, replay/rate checks and schema 19. Optional ETNOS-domain handles remain a separate claim workflow. The account is hosted by Bluesky; this does not deploy an ETNOS PDS.

## Pixel sand

`Sandpile.svelte` is an original falling-sand cellular automaton, not copied demo code. A 37 × 14 cell field starts as a small mound near the top. Grains move down or into free diagonals, with staggered release so the mound breaks apart instead of sliding as one block. Grains leave through the bottom; a still-pending request can seed another mound. The graphic occupies only 148 × 56 CSS pixels and uses the actual `--brand` preference, including custom accents and theme changes.

The pile is hidden during ordinary reading. A deliberate downward pull from the top reveals the still mound; releasing after the existing threshold starts refresh and the falling animation. A short pull or horizontal gesture does not refresh. The active graphic disappears when that request completes, including a failed request; no artificial progress or minimum wait is added. The existing parent reports request errors. Only the top pull region changes height; posts do not animate individually.

Motion uses a bounded SVG field with requestAnimationFrame and a 65 ms simulation step; there is no Canvas/WebGL library or new runtime dependency. Frames stop on cleanup and when motion is reduced. A change to reduced motion during a pending request restores a still pile while retaining the live status label. Hidden documents perform no simulation steps. Desktop keyboard users retain the refresh button; the gesture is an optional way to invoke the same action. Existing scheduled theme transitions are unchanged.

## Evidence

The loopback browser journey uses the actual BrowserAuth routes and official OAuth SDK, with provider-side identity creation simulated by an explicitly labeled provider page. It exercises no-handle signup, verified callback, a signed-in welcome, existing-account login, zero membership grants, widths 320/390/768/1440, horizontal-gesture rejection, the request-linked moving sand, live reduced-motion switching and keyboard refresh. Screenshots are synthetic. No live identity or public post is seeded.

The broader existing UI journeys and actual-workerd contract protect community/privacy, wiki, agents, encrypted messaging and prior navigation. Exact final results and production checks belong in the deployment receipt; a successful provider-start smoke test does not by itself prove real account creation, CAPTCHA or email recovery.

Source research and tooling: [native signup/handle research](model-and-onboarding-2026-11-04.md), [AppLlama reference study](appllama-research-2026-11-04.md). AppLlama inspired the scale of an optional pixel detail, not its implementation or ETNOS's identity policy.
