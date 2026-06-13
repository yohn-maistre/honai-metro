# Single-domain architecture — frontend + federation at one URL

> **The problem.** In Lemmy / PieFed / Mastodon-shaped federation, a user's identity is `@username@instance-domain`. The `instance-domain` is the backend — wherever the ActivityPub inbox/outbox lives. So if you sign up on a backend at `piefed.social`, your username is `@you@piefed.social`, regardless of which frontend you used. Most Lemmy/PieFed deployments solved this by having the backend own the "good" domain and frontends live at subdomains (e.g., `photon.lemmy.world` is the frontend; the backend is `lemmy.world` and that's where the identity lives).
>
> **The goal.** When ETNOS moves off `piefed.social` to its own backend, we want **one canonical domain** — say `etnos.papua.id` — that:
> - serves the SvelteKit frontend at `/`
> - is also the federation identity (so users register at `etnos.papua.id` and their handles are `@username@etnos.papua.id`)
> - federates with other Fediverse instances correctly

This document describes how to achieve that with **Cloudflare Pages + a single reverse-proxy Worker**.

Status: **architectural plan, not yet implemented.** Implementation triggers when we stand up our own backend (see `docs/etnos/beta-readiness-plan.md` — currently "backend track, deferred").

---

## Why this matters

Three reasons:

1. **Identity coherence.** A user who joins at `etnos.papua.id` expects their handle to read `@maria@etnos.papua.id`, not `@maria@some-backend.example`. The first feels native; the second feels rented.
2. **Federation discoverability.** Other Fediverse servers look up `https://etnos.papua.id/.well-known/webfinger?resource=acct:maria@etnos.papua.id` to resolve the user. That endpoint must answer with our backend's response, not 404.
3. **Brand and trust.** Civic platforms need a single trustworthy URL. "Visit ETNOS at `etnos.papua.id`" should be the only sentence anyone needs to remember.

---

## The architecture

```
                       etnos.papua.id (single canonical domain)
                                 │
                                 ▼
              ┌────────────────────────────────────────┐
              │ Cloudflare Worker (path-based router)  │
              │                                        │
              │  /api/*               ─→ backend       │
              │  /pictrs/*            ─→ backend       │
              │  /inbox               ─→ backend       │
              │  /outbox              ─→ backend       │
              │  /.well-known/*       ─→ backend       │
              │  /feeds/*             ─→ backend       │
              │  /nodeinfo            ─→ backend       │
              │  /static/* (backend)  ─→ backend       │
              │                                        │
              │  /                    ─→ CF Pages      │
              │  /c/*                 ─→ CF Pages      │
              │  /post/*              ─→ CF Pages      │
              │  /u/*                 ─→ CF Pages      │
              │  /everything-else     ─→ CF Pages      │
              └────────────────────────────────────────┘
                     │                          │
                     ▼                          ▼
              ┌──────────────┐         ┌──────────────────┐
              │ CF Pages     │         │ Backend VPS      │
              │ (SvelteKit   │         │ (PieFed + Pictrs │
              │  client)     │         │  + Postgres +    │
              │              │         │  Redis +         │
              │              │         │  Celery)         │
              └──────────────┘         └──────────────────┘
                                       e.g. backend.etnos.papua.id
                                       (private, never user-visible)
```

The Worker is the seam. Federation endpoints and the backend-served bits travel through it to a VPS. Everything else — the frontend's routes — goes to CF Pages.

**Users never see `backend.etnos.papua.id`.** It exists for DNS routing only and stays out of headers, links, and webfinger responses (the backend is configured with `hostname=etnos.papua.id`, so it generates IDs and outbound links pointing at the canonical domain).

---

## What the Worker actually does

A minimal CF Worker living at `etnos.papua.id/*`:

```typescript
// Pseudocode.
const BACKEND_PATH_PREFIXES = [
  '/api/',
  '/pictrs/',
  '/feeds/',
  '/static/',  // backend's static (community icons, etc.) — namespace collision risk; pick a non-overlapping prefix
  '/.well-known/webfinger',
  '/.well-known/nodeinfo',
  '/.well-known/host-meta',
  '/nodeinfo',
  '/inbox',
  '/outbox',
];

const BACKEND_PATH_EXACT = new Set([
  '/inbox',
  '/outbox',
]);

const BACKEND_ORIGIN = 'https://backend.etnos.papua.id';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const goesToBackend =
      BACKEND_PATH_EXACT.has(url.pathname) ||
      BACKEND_PATH_PREFIXES.some(p => url.pathname.startsWith(p)) ||
      url.pathname.match(/^\/u\/[^/]+\/(inbox|outbox)$/) ||
      url.pathname.match(/^\/c\/[^/]+\/(inbox|outbox)$/);

    if (goesToBackend) {
      const backendUrl = new URL(url.pathname + url.search, BACKEND_ORIGIN);
      return fetch(new Request(backendUrl, request));
    }

    // Fall through to Cloudflare Pages.
    return env.ASSETS.fetch(request);
  }
};
```

The Worker is small. The hard work is in the path list — choosing exactly which paths the backend owns vs the frontend. That list is fixed once when we deploy and rarely changes.

Cloudflare Pages calls this pattern an [Advanced mode Pages Function](https://developers.cloudflare.com/pages/functions/advanced-mode/) — write a `functions/_middleware.ts` (or a top-level `_worker.js`) and it intercepts every request before the static asset handler runs.

---

## Backend configuration (when the time comes)

PieFed must be configured so its outbound generated IDs and federation responses use `etnos.papua.id`, not `backend.etnos.papua.id`:

```ini
# PieFed env (illustrative — confirm against current docs)
SERVER_NAME=etnos.papua.id
DOMAIN=etnos.papua.id
PUBLIC_URL=https://etnos.papua.id
# Internal hostname stays private:
# backend.etnos.papua.id is only ever reached through the CF Worker
```

This makes the backend "believe" its public face is `etnos.papua.id`. Federation responses, webfinger answers, ActivityPub object IDs all use the canonical domain.

Pictrs (image uploads) gets the same treatment — its outbound URLs should be `https://etnos.papua.id/pictrs/...`, never `https://backend.etnos.papua.id/pictrs/...`.

---

## The frontend SvelteKit config

When we cut over to our own backend, two `.env` updates land:

```sh
# Before — what we have today:
PUBLIC_INSTANCE_URL=piefed.social

# After — our own backend behind the Worker:
PUBLIC_INSTANCE_URL=etnos.papua.id
```

The frontend continues to make API calls to `etnos.papua.id/api/v3/*` (or `etnos.papua.id/api/alpha/*` for PieFed) — the Worker routes them to the backend. Same domain everywhere. Same-origin cookies (no CORS dance). One TLS cert.

---

## What this is NOT

- **Not a Cloudflare Tunnel.** Tunnels are fine for getting traffic to a private backend but don't solve the path-routing seam. The Worker is the seam.
- **Not a service worker.** The Cloudflare Worker runs on the edge, in front of everything. The browser's service worker is separate (handles offline / push).
- **Not Cloudflare Load Balancing.** LB rounds-robins between backends; we want path-based routing to two distinct backends (Pages + VPS), which is a Worker job.
- **Not free at unlimited scale.** CF Workers free tier is 100k requests/day. Each route through the Worker counts. Most requests will be static assets that fall through to Pages and barely cost; backend-bound requests count fully. At 100 active users with normal browsing, expect to stay well under quota; at 10k active users, expect to need the $5/month Workers Paid plan.

---

## Cost (when we have our own backend)

| Component | Provider | Monthly cost |
|---|---|---|
| Frontend hosting | CF Pages (free tier) | $0 |
| Edge routing Worker | CF Workers (free tier, 100k req/day) | $0 (paid tier $5 if needed) |
| Backend VPS | Hetzner CAX11 or IDCloudHost | €4–7 |
| Storage (media + DB) | bundled with VPS | $0 |
| Domain | DNS registrar | $10–20/year |
| **Total** | | **~$5–10/month** |

Compare to the "rented identity" alternative (stay on `piefed.social` forever): $0 but you don't own your users.

---

## Migration plan

Three-step cutover from `piefed.social` to single-domain self-hosted:

1. **Stand up the backend.** Provision a VPS, install PieFed + Pictrs + Postgres + Redis. Verify it works on its own subdomain (`backend.etnos.papua.id`).
2. **Deploy the Worker + DNS cutover.** Point `etnos.papua.id` at CF (CF Pages + Worker route). The Worker routes federation paths to the backend, everything else to Pages.
3. **Migrate users.** Two clean paths:
   - **(a) Soft restart.** Tell early-access users we're moving; new accounts at `etnos.papua.id`. The piefed.social accounts continue to exist on piefed.social, federated as remote users.
   - **(b) ActivityPub move.** Newer Fediverse software supports user "Move" activities (Mastodon does this; PieFed support varies). Each user issues a move from `@user@piefed.social` to `@user@etnos.papua.id`, followers follow them. More polished but requires both backends to support it.

Path (a) is simpler and we get away with it because early access is small (you DM-invited people). Path (b) becomes the standard once we're public.

---

## When to do this

**Not yet.** The current plan is:

- **Now**: `piefed.social` backend, CF Pages frontend at `etnos.pages.dev` or eventual custom domain. User handles are `@user@piefed.social`. This is OK for early access because the cohort is small and personally invited.
- **Beta+**: stand up own backend on a VPS. Implement the single-domain Worker. Users register at `etnos.papua.id` and own their identity.
- **Federation maturity**: as PieFed implements ActivityPub Move properly, we open path (b) for any user who wants to migrate their handle.

The architecture above is the reference for "Beta+ backend setup." When the time comes, it's a 1–2 day implementation, not a research project.
