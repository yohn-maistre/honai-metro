# Oracle PieFed cutover runbook

Status: **DRAF, 2026-07-21**

This runbook covers the boundary between the Cloudflare Pages ETNOS client and
an owned PieFed backend on Oracle Cloud Infrastructure. It contains no secrets
and does not assume the final domains have been chosen.

The agent and memory architecture lives in
`11_agentic-infrastructure-plan.md`. This file is intentionally narrower: get
the forum online, make the frontend switch reversible, and preserve a clean
path to upstream PieFed updates.

## 1. Repository boundary

Use a separate **`etnos-infra`** repository for deployment state:

- OpenTofu or Terraform for the OCI network, VM, volume, DNS records, and
  security lists;
- Ansible or cloud-init for host hardening and package installation;
- a pinned upstream PieFed release or container revision;
- Compose or systemd definitions for PieFed, PostgreSQL, Redis, Celery,
  notifications, Caddy, monitoring, and backup jobs;
- config templates containing variable names only;
- migrations, smoke tests, restore instructions, and a small patch queue.

Do not copy the PieFed source tree into `honai-metro`. Do not create a permanent
fork before a source change is required. If a generic PieFed change becomes
necessary, keep the deployment repository pinned to a temporary fork revision,
make each patch an independent commit, and offer the generic change upstream.

This gives three separate histories:

1. `honai-metro`: replaceable web client;
2. `etnos-infra`: owned deployment and operations;
3. `pyfedi` fork, only while a real upstream patch is pending.

## 2. First beta topology

One ARM VM is sufficient for a low-traffic beta if its actual OCI allocation
meets PieFed's current minimums. Confirm the tenancy's live Always Free limits
in the OCI console before provisioning because free allocations can change.

```text
Internet
  -> DNS and TLS
  -> Caddy or Nginx on 443
     -> PieFed/Gunicorn on loopback
     -> notification stream on loopback
  -> PostgreSQL on a private socket or loopback
  -> Redis on a private socket or loopback
  -> Celery workers
  -> encrypted backup job to off-VM object storage
```

Only SSH, HTTP, and HTTPS should be reachable from the public internet. The
database, Redis, Gunicorn, and notification service must not be exposed through
the OCI security list or host firewall.

The current upstream installation guide says PieFed needs Python 3.10+, two CPU
cores, 4 GB RAM, and growing storage, with PostgreSQL and Redis for production.
It also requires Gunicorn, Celery, recurring maintenance jobs, and the
one-minute federation send queue. Treat those as minimum operational
components, not optional polish.

Sources:

- [PieFed installation](https://join.piefed.social/docs/installation/)
- [PieFed upstream INSTALL.md](https://codeberg.org/rimu/pyfedi/src/branch/main/INSTALL.md)
- [OCI Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

## 3. PieFed configuration required by Honai Metro

The Cloudflare Pages client sends requests directly from the browser to the
PieFed origin. It uses bearer JWTs, not cross-site session cookies. The backend
must provide:

```dotenv
SERVER_NAME=forum.example.org
HTTP_PROTOCOL=https
ENABLE_ALPHA_API='true'
CORS_ALLOW_ORIGIN=https://etnos.pages.dev
```

For the final custom frontend domain, replace the Pages origin with that domain.
During a short preview migration, either use a separate staging backend or
temporarily permit all origins and restore the exact production origin before
launch. Never leave a permissive transition undocumented.

The browser preflight must allow:

- methods used by `/api/alpha`, including `GET`, `POST`, `PUT`, and `DELETE`;
- request headers `Authorization` and `Content-Type`;
- the exact ETNOS frontend origin, or `*` while no credential cookies are used.

CORS is a backend responsibility. Cloudflare Pages response headers cannot
grant the frontend access to an Oracle response.

Before cutover, run:

```powershell
bun run check:backend -- forum.example.org https://etnos.pages.dev
```

The check verifies NodeInfo, `/api/alpha/site`, the GET CORS response, and an
authenticated-request preflight without sending credentials.

## 4. Cloudflare Pages switch

The deploy workflow now reads these GitHub repository variables, retaining the
current public backend when they are absent:

```text
PUBLIC_INSTANCE_URL=forum.example.org
PUBLIC_INSTANCE_TYPE=piefedalpha
PUBLIC_LOCK_TO_INSTANCE=true
```

`PUBLIC_INSTANCE_URL` is public configuration and must not contain a secret.
The workflow bakes it into the client bundle. After changing it:

1. run the backend smoke test from a network outside OCI;
2. trigger the Cloudflare Pages workflow;
3. wait for the workflow to finish successfully;
4. inspect the deployed bundle or browser network panel for the new hostname;
5. create a test account on the PieFed backend;
6. log in through ETNOS;
7. upload an image, create a post, comment, vote, follow, search, send a private
   message, and log out;
8. verify the same post from an independent ActivityPub instance.

The frontend signup flow remains a handoff to PieFed until registration is
implemented in the alpha adapter. Test that handoff explicitly.

## 5. Media, mail, and federation gates

The forum is not ready for public registration until all of these pass:

- stable HTTPS domain and valid certificate;
- transactional email for verification, password reset, and moderation;
- media upload and deletion, with off-VM storage or a measured disk budget;
- daily database backup plus media and secret/config backup;
- a restore rehearsal onto a fresh VM;
- Celery health and the federation send queue running every minute;
- inbound and outbound federation with at least two unrelated instances;
- moderation account, registration policy, reports path, and abuse contacts;
- monitoring for HTTP health, disk, memory, database, queue depth, certificate
  expiry, and backup age;
- rate limiting that does not break `/inbox`, `/api/alpha`, or ActivityPub
  delivery.

If Cloudflare proxies the PieFed domain, follow PieFed's current guidance: do
not let WAF or bot protection interfere with `/inbox` or API traffic, and test
federation after every security-rule change.

## 6. Cutover and rollback

Do not migrate existing `piefed.social` identities. They are remote identities
and remain valid through federation. Seed local ETNOS communities on the owned
instance, publish a visible migration notice, and let people create local
accounts deliberately.

Cutover is a frontend variable change. Rollback is the inverse:

```text
PUBLIC_INSTANCE_URL=piefed.social
```

Keep the Oracle instance online during a frontend rollback so its ActivityPub
actors and objects remain resolvable. Never reuse its domain for a different
database.

## 7. Upstream update discipline

For every PieFed update:

1. read the release notes and migration files;
2. snapshot the database and record the current image or commit digest;
3. rehearse the update against a restored staging copy;
4. run PieFed's config check and application tests;
5. run `check:backend` and the ETNOS browser smoke path;
6. test federation in both directions;
7. deploy production;
8. record the exact revision and migration result.

Weekly CI in `etnos-infra` should test the deployment and any patch queue
against the latest upstream release without automatically updating production.

## 8. Stop/go gate

Wave 1 is complete only when a fresh host can be restored from encrypted
backups, ETNOS can perform authenticated alpha-API actions through the browser,
and one local post federates out and back through an independent instance.
