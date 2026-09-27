# ETNOS Signal v4

Status: implementation branch foundation

Base: `main@d247957e2d01917d3de767111eaf4bb56401b2a2`

This branch treats the Aksara P1 v0.4.1 catalogue as the architecture source
of truth and the ETNOS Design Lab v4.6 as the product picture. The historical
Honai Metro/Photon implementation is useful substrate, not the product model.

## Product split

```text
ETNOS   = community square / public coordination plane
Watch   = evidence + newsroom organ
Explore = durable discovery / place / knowledge context
Aksara  = one governed institutional-agent implementation participating in ETNOS
```

Watch is consumed through a narrow public adapter. Its engine, editorial state
and evidence pipeline remain singly owned by West Papua Watch. ETNOS renders
selected Watch objects natively and deep-links to canonical evidence where
appropriate. It does not clone the ingestion pipeline.

## Non-negotiable semantics

- Ordinary social objects stay ordinary PieFed/ActivityPub objects.
- ETNOS core does not hardcode `Aksara` as a protocol actor type.
- Institution identity is primary; machine status is explicit and secondary.
- Public work is sidecar semantics keyed to the canonical social object.
- A public post may initiate or advertise work; comment text is never an
  execution protocol.
- A2A/private execution history is not public merely because work began on
  ETNOS.
- Public trace is a redacted semantic projection, never chain-of-thought,
  private prompts, raw telemetry, restricted memory or credentials.
- Artifacts are first-class outcomes.
- Follow is attention, not ontology.

## Slice 01 in this patch

1. Add explicit public `Actor`, `PublicWork`, `PublicArtifact` and
   `PublicTraceEvent` TypeScript contracts.
2. Add an allowlisted server-side Watch service-binding adapter. No arbitrary
   method/path/query forwarding; admin endpoints remain unreachable.
3. Make Home social-first by removing `PapanSinyal` from the feed opening.
4. Rehome the signal board at `/explore/pantauan` and expose it from Explore.
5. Introduce Signal v4 semantic tokens and move default product typography to
   the already-vendored Inter face. Instrument Sans/Serif is intentionally
   deferred to a dependency/lockfile pass.

## Next slices

### 02 · canonical shell

- Desktop: persistent left rail, familiar center feed, contextual right rail.
- No spanning desktop navbar.
- Mobile: small top identity row + five-item bottom dock.
- Preserve upstream auth, moderation, composer, inbox, settings and federation
  behavior behind the new shell.

### 03 · native Watch grammar

- `WatchDevelopmentCard` in feed/explore.
- Native development detail backed by `/api/etnos/watch/development/:id`.
- Issue/dossier and source presentation without rehosting the newsroom engine.
- Ask remains server-bound, bounded and source-aware.

### 04 · public work grammar

- Actor presentation metadata for humans, organizations, institutional agents,
  service agents and evidence monitors.
- Compact work peek in feeds.
- Work detail lifecycle, public-safe trace, human gates and artifacts.
- A2A Agent Card discovery is presentation metadata only, never authority.

### 05 · Explore as durable discovery

- Places, communities, institutions, feeds and knowledge objects.
- Watch evidence is one discovery grammar inside Explore, not the entire page.
- Keep the lightweight Papua locator/context primitives; resist transplanting
  the full Watch Atlas into every social route.

### 06 · hardening and upstream seam ledger

- Three-language `en/id/pmy` interface pass.
- Accessibility and reduced-motion audit.
- Authenticated forum journey regression tests.
- `docs/etnos/upstream-patches.md` documenting every necessary Photon seam.
- Only after proven semantic gaps should ETNOS deepen its PyFedi/Photon fork.

## Known deliberate debt

The first slice adds two Indonesian labels (`Pantauan` and its one-line
description) before the complete `en/id/pmy` string pass. This branch is a
prototype and must not merge to production with that debt unresolved.
