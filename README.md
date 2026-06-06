# ETNOS — Honai Metro

ETNOS is a federated public-square + wiki + civic-data platform for Papua, Indonesia. This repository is the web client.

The provincial focus is **Papua Tengah**. Other Papuan provinces (Papua, Papua Selatan, Papua Pegunungan, Papua Barat, Papua Barat Daya) are intended federation peers, each running their own ETNOS instance.

## Relationship to Photon

ETNOS is a **heavy fork** of [xyphyn/photon](https://github.com/xyphyn/photon) — the Svelte web client for Lemmy and PieFed. Photon's README is preserved at [`.github/README.md`](./.github/README.md).

We owe Photon a real debt: the upstream client is the reason ETNOS exists as a working app in months, not years. We intend to **stay in sync with upstream for one more cycle** while we're still on the Lemmy-shaped API surface (the path PieFed's `piefedalpha` adapter takes), to absorb upstream bugfixes and the maturing PieFed adapter. Beyond that point, ETNOS diverges — heavily customized discovery (`/explore`), an `/agen` page with our own MCP/skill registry and an Aksara stronghold, a Papua-scoped map, a per-province directory, civic dashboards, an `/wiki` integration, and a different default IA tailored to Papua use.

The data-layer plan is to keep PieFed as the content/forum backend (Lemmy-shaped API is a known quantity, federation works, the upstream PieFed roadmap delivers private communities, quote posts, and pronouns that the project needs anyway), and to layer an [ActivityPods](https://activitypods.org)–compatible Pod surface alongside it specifically for the Aksara agent-memory plane, once the [NextGraph](https://nextgraph.org) CRDT swap inside ActivityPods stabilises. See [`docs/research/activitypods-backend-port.md`](./docs/research/activitypods-backend-port.md).

## What's different from upstream Photon

- **Default locale**: Indonesian (`id`), with English (`en`) and Melayu Papua (`pmy`) as full peers.
- **`/explore`** is consolidated: a Papua map, hand-curated Sorotan highlights, and the upstream Communities/Feeds/Topics tabs all live on one page. `/jelajah` redirects here.
- **`/agen`**: a new ETNOS-original page. Hosts the agent gallery, the open MCP registry (formerly at `/registry`, which now redirects here), and the Aksara institutional-node directory.
- **`/wiki`**, **`/bahasa`**, **`/dashboard`**, **`/tentang`** are ETNOS-original.
- **`PUBLIC_LOCK_TO_INSTANCE=true`** by default — single-instance deployment posture (per province).
- **Civic-data integrations**: BPS Papua, OTSUS tracker, public dashboards.
- **MCP registry data** (`src/lib/etnos/data/registry.json`) — verified-tool catalog backed by KYC / malware-scan / TKDN policy.
- **PWA + PMY/ID/EN i18n** — see `src/lib/app/i18n/`.
- **Agent surfaces**: [`static/llms.txt`](./static/llms.txt) and [`static/ai.txt`](./static/ai.txt) declare ingest/training policy; an MCP endpoint that exposes read-only public content is on the roadmap.

## Backend

ETNOS targets a [PieFed](https://join-piefed.org/) instance via Photon's `piefedalpha` API adapter. The default points at `piefed.social`; production deployments should run their own PieFed and federate. See `.env.example`.

Lemmy backends still work as a fallback (`PUBLIC_INSTANCE_TYPE=lemmyv3`).

## Develop

```sh
bun install
bun run dev
```

Tests and type checks:

```sh
bun run check
bun run test
```

For configuration variables, see [`.env.example`](./.env.example) and the upstream Photon README at [`.github/README.md`](./.github/README.md).

## License

AGPL-3.0, matching upstream Photon. Indigenous knowledge content carried on ETNOS instances follows the [Local Contexts](https://localcontexts.org/) framework and the CARE Principles.
