# Federation wave plan (DRAF, 2026-07-12)

> Historical plan. The agent, memory, identity, and deployment sections are
> superseded by `11_agentic-infrastructure-plan.md` (2026-07-21). The map and
> place sections remain useful product context.

Internal spec, English per house rules. This is the roadmap agreed in
principle on 2026-07-12 for the work that follows the broadsheet pass:
the interactive map upgrade, place as first-class federated data, the
multi-island Jelajah, and the first honest steps of the agentic layer.
Nothing here is built yet; every section is a target rancangan.

## 1. Peta Kabar v2: MapLibre with basemap dresses

Goal: detak-detik-grade interactivity on the home map. Pan/zoom clamped
to the Tanah Papua bbox (maxBounds), basemap tabs like detak's plate
switcher (ATLAS / SATELIT / CUACA / MALAM), the existing six data layers
re-expressed as MapLibre sources/layers, kab click-to-dossier kept
(native feature hit-testing replaces the raster lookup).

Facts that make this cheap(er):

- maplibre-gl + svelte-maplibre-gl are ALREADY in package.json
  (imported nowhere today, tree-shaken; bundle cost arrives only when
  imported, and only on the route that imports it: keep it lazy).
- detak-detik's PetaKabar.svelte is the reference implementation:
  basemap styles, icon rasterization (iconData/ensureIcons), fitBounds
  discipline, cooperativeGestures for scroll safety.
- Our layers.ts fetchers and the dossier data model carry over
  unchanged; only the rendering swaps.

Open questions before building:

- Tile source and cost: detak uses public vector/raster styles; pick
  sources that are keyless or self-hosted (PMTiles on Cloudflare R2 is
  the sovereign option and fits the Aksara posture). Satellite tiles
  are never keyless-free at scale; decide provider or drop SATELIT.
- The dot plate stays as the instant-paint placeholder until the map
  library loads (detak does exactly this with kb-engrave).
- Mobile data budget: tiles on kampung connections are real money;
  the dot plate must remain the default on save-data / slow
  connections (navigator.connection heuristics).

## 2. Place as first-class federated data

Goal: every community carries kota/kabupaten + koordinat, federated
over ActivityPub, so any client (ours, detak, other islands' forums)
can place a community on a map without a side-channel registry.

Mechanism: ActivityStreams already defines a `location` property
(as:Object -> as:Place with name, latitude, longitude) valid on Group
actors. PieFed patch sketch:

- DB: add nullable place_name, place_lat, place_lon to community.
- Serializer: emit `location: {type: "Place", name, latitude,
longitude}` on the Group actor JSON-LD.
- Ingest: parse the same property from remote Groups when present.
- UI: one optional field on community create/settings.
  Lemmy/Mastodon ignore unknown properties gracefully; this degrades to
  exactly today's behavior everywhere else. Upstream this to PieFed as a
  PR (Rimu has been receptive to civic-flavored features); if upstream
  stalls, carry it as an instance patch.

Until the ETNOS server exists, the honest interim stays what we have:
`region` fields in the client-side directory registry, clearly contoh.

## 3. Peta Nusantara: the multi-island Jelajah

Goal: Jelajah's plate becomes the whole archipelago; islands are
clickable; each island shows its deployed forum instance(s) and
community counts. ETNOS is the Papua node; other islands render as
honest empty states ("belum ada simpul") until real deployments exist.
This is the template story made visible: the map IS the pitch that
other islands can inherit the stack.

Build notes:

- detak's atlas-dots covers all Indonesia (COLS=188 ROWS=72,
  province-indexed, per-feature coverage passes: port the same fix we
  made in atlas.ts). Vendor detak's idn-prov geojson.
- Data model: a small `instances.json` registry (island/prov ->
  {instance url, name, status: langsung|segera}), one entry today
  (ETNOS). When place-as-first-class (section 2) lands, counts come
  from federation instead of the registry.
- Wiki locator plates can reuse the Indonesia grid zoomed out, with
  the entry's koordinat sealed and Papua's extent subtly emphasized.

## 4. The agentic layer over ActivityPub

Position (owner-agreed): ActivityPub is the nervous system, not the
memory. Agents are AP `Service` actors; their outputs are ordinary
posts/comments plus a machine-verifiable extension; collective memory
lives in Memori Aksara (aksara-mem), which subscribes to the AP
firehose rather than being stored in it.

Sketch:

- Actor: type Service, one per agent instance, owned by an institution
  actor (attributedTo). Human-readable profile links the institution's
  /org page.
- Attestation: JSON-LD extension context (e.g. `aksara:attestation`)
  carrying the aksara-cli signature chain reference + T-tier claim.
  Instances that know the vocabulary verify against the registry;
  everyone else sees a normal post from a bot-flagged account.
- Enforcement is instance-side (PieFed moderation + our capability
  gates), matching spec etnos/04: T0 cannot act, T1 posts only in its
  institution's space, T2+ for cross-node civil transactions.
- Rate/scope: agent actors post to designated communities only;
  never DMs; never musrenbang consensus surfaces.

What we do NOT do: run agent actors on piefed.social. A bot actor on a
borrowed backend violates our own published T0 rule (no attestation
chain exists yet) and burns goodwill with the piefed.social admins.

First experiment (gates on the own-server decision, LEDGER item):

1. Spin a throwaway PieFed instance (upstream docker-compose) on a VPS
   or laptop.
2. Land the `location` patch there (section 2) and verify it federates
   to a second test instance.
3. Create one Service actor, post via the API with the attestation
   extension stubbed, verify render + federation + our client's
   handling (CapabilityCard reads the tier claim).
4. Write up findings against spec etnos/04; only then decide what goes
   upstream vs stays instance-local.

## 5. Smaller carried items

- Notification bell: a navbar popover fed by the existing inbox
  endpoints (unread count + latest 10, mark-read inline), replacing
  nothing; Kotak Masuk stays the full surface. Facebook-style
  affordance for the non-technical audience.
- Full dark-theme pass (Honai Malam) still banked.
- maplibre dependency decision resolves itself in section 1: it stays.
