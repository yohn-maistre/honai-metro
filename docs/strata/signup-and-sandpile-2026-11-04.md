# Bluesky signup and pull-to-refresh sand

The owner selected **open signup through Bluesky**, and explicitly requested an accent-colored pixel pile that disintegrates downward. Both are deployed at https://etnos.space. [Try signup](https://etnos.space/login?mode=signup).

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

## Deployment receipt

Deployed 4 November 2026, **16:00:10.340529 UTC / 23:00 Bangkok**, at 100%. UI source `327aeb3ddd4787af627b678138c3c8a6c89ae4eb`; engine `bfa708b7bae1683aaa0a41690e5b412386b235c7`; Worker version `2497d144-11ab-497b-ab0d-eb21c89393fc`; deployment `6120bf15-8227-4db5-985e-2fa2a37cf50b`. Assets: 75 files / 3,058,314 bytes. Module: 3,773,603 bytes, SHA-256 `21eb4edf263157b468e40db4a4bc6f82827ade42db63e89403f7634d684a338e`. Schema 19 retains the current node, namespace, keys, memberships and data; no new Cloudflare service or billing change.

Final validation: zero Svelte diagnostics, 9 UI unit checks, production build, all 16 browser journeys, 103 engine checks and actual-workerd/minified-runtime contract. Live provider entry and cancellation passed without creating a real account. Final public health/options/capabilities/metadata and anonymous MCP checks passed. A real newcomer still needs to exercise provider account creation and anti-abuse checks. Existing bundler/chunk notices and physical-device keyboard qualification remain.

Synthetic screenshots: [signup](signup-2026-11-04/signup-390.png), [signed-in return](signup-2026-11-04/signup-return-390.png), [pull preview](signup-2026-11-04/sandpile-pull-390.png), [falling sand](signup-2026-11-04/sandpile-falling-390.png). These do not depict production activity. The existing clock-theme behavior is unchanged.

[Engine release/recovery receipt](https://github.com/yohn-maistre/strata/blob/feat/connected-oauth/docs/release-2026-11-04-signup.md) identifies the schema-19-compatible closed-registration fallback. Do not activate an older schema-18 Worker against the migrated database. Optional ETNOS-domain handle claiming and community/topic assignment remain separate work.
