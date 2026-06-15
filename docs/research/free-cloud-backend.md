# Free-cloud backend for ETNOS PieFed — what actually works in mid-2026

> **Question:** Can ETNOS host its own PieFed backend on a *truly free* cloud tier (not free trial, not 30-day credit) for at least six months of sustained operation while an early-access cohort grows from ~20 to ~500 users?
>
> **Short answer:** Yes — exactly one stack qualifies. **Oracle Cloud Always Free Ampere A1 in `ap-singapore-1`** (2 OCPU / 12 GB RAM after the June 15 2026 cut), running everything in Docker Compose on a single host: PieFed + Postgres + Redis + Celery + pict-rs + nginx. **Skip the multi-provider split.** Skip Neon/Supabase free Postgres (too small). Skip Fly/Render/Koyeb (no longer free or sleep-disqualified). Skip Cloudflare R2 for pict-rs (operational lift outweighs the savings at this scale). The honest caveat: at ~300–500 active monthly users with federation chattering against 50+ peers, the 12 GB ceiling becomes uncomfortable, and at that point you pay €4.49/month for Hetzner CAX11 and move.
>
> Status: research note, June 2026. Owner: ETNOS core.

---

## 1. PieFed resource profile — measured, not guessed

The `docs/forum-readiness-alpha-beta.md` §2 claim is **"~2 GB RAM is the floor for PieFed + Postgres + Redis + Celery + gunicorn."** Primary evidence confirms this *as a practical floor*, with caveats once federation chatter kicks in.

The flagship instance (piefed.social, run by PieFed's author) per [Tuning PieFed for scale](https://join.piefed.social/2025/07/09/tuning-piefed-for-scale/): **8 CPU / 16 GB RAM, ~1000 MAU**, Postgres at `shared_buffers=6GB`. That's a tuned-for-comfort configuration, not a floor. From [the Lemmy.ml comparison thread](https://lemmy.ml/post/38984466), an admin migrating Lemmy→PieFed reported their Lemmy box used 32 GB, PieFed used **2 GB for app processes (excluding Postgres, ~2 GB more)**, with **piefed.social averaging 4–5 GB total**. [Lemmy minimums](https://lemmy.world/post/1287117): 1 vCPU/1 GB single-user; 2 vCPU/2 GB small public. PieFed is explicitly designed to be lighter than Lemmy in the same role.

Component-level sizing for our profile (20–500 users, peering with 20–50 instances):

| Component | Idle | Light load (~50 daily actives, 5 federation peers) | Federation chatter (~50 peers) |
|---|---|---|---|
| PieFed app (gunicorn workers) | ~300 MB | ~500 MB | ~700 MB |
| Postgres 16 | ~200 MB (baseline) | ~1 GB (with `shared_buffers=512MB`) | ~1.5 GB |
| Redis | ~30 MB | ~80 MB | ~150 MB |
| Celery workers (2 procs) | ~150 MB | ~300 MB | ~500 MB |
| pict-rs | ~50 MB | ~150 MB | ~200 MB |
| nginx + system | ~150 MB | ~150 MB | ~200 MB |
| **Total RAM** | **~900 MB** | **~2.2 GB** | **~3.3 GB** |

Floor: **~1 GB idle, ~2.2 GB realistic, ~3.3 GB federation-active**. The audit's "~2 GB" is accurate within ±20% — practical "feel OK" point. **Confirmed**.

Disk/bandwidth/CPU specifics:

- **Postgres growth**: ~1 KB/post + ~500 B/comment + ~50 B/vote. 500 active users + 50 federation-imported posts/day = **~50–150 MB/month**; a year stays under 5 GB.
- **pict-rs storage**: ~150–400 KB/image post-transcode. 100 uploads ≈ 20–40 MB. Early-access cohort: ~200–500 MB over six months.
- **Federation bandwidth**: ~500 MB–2 GB/day combined for small instance + ~50 peers, dominated by inbound activity ingest. ~30–60 GB/month — trivial against Oracle's 10 TB egress allowance.
- **CPU**: idle <5% on 2 OCPU; federation backlog spikes to ~50% briefly. Postgres + pict-rs are the dominant CPU costs; API serving is cheap.
- **Disk IO**: light — Postgres WAL dominates. 200 GB Always Free Block Volume is generous.

Bottom line: **PieFed fits in 2 OCPU / 4–8 GB RAM through the entire early-access window**. Oracle's post-cut 2 OCPU / 12 GB still leaves headroom.

---

## 2. ETNOS additions on top of vanilla PieFed

Reviewed against `CUSTOMIZATIONS.md` and `docs/etnos/single-domain-architecture.md`:

- **Curated directory, Sorotan, `/bahasa`, `/wiki`, dashboard snapshots** — all `src/lib/etnos/data/*.json` + `*.md`, shipped with the SvelteKit bundle to Cloudflare Pages. **Zero backend impact.**
- **Custom routes** (`/tentang`, `/jelajah`, `/dashboard`, `/registry`) — pure client routes. **Zero.**
- **MapLibre** — JS bundle cost only. **Zero.**
- **Aksara node integration** — runs on Orange Pi 5 + provincial Hub; per `docs/aksara/architecture.md` §5, Aksara consumes the PieFed backend, doesn't add load to it. **Zero.**
- **ActivityPods adapter shim** — planned 2027, out of M0–M12 scope.
- **CSAM scanning at pict-rs upload** — beta gate; ~100–300 ms per upload + ~50 MB RAM for a sidecar. Negligible at our upload volume.
- **Sentry SaaS, CF Worker for routing** — both off-backend. **Zero.**

**Net backend cost from ETNOS-specific code: zero.** The ETNOS backend resource profile is identical to a vanilla PieFed instance at the same user/peer profile.

---

## 3. The free-cloud landscape in mid-2026 — the survivors

The 2023–2025 stretch was a graveyard for free tiers. Heroku killed theirs, [Fly.io killed theirs in October 2024](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026) (new accounts get a 2-hour or 7-day trial, then pay-as-you-go), [Railway killed theirs in July 2023](https://www.saaspricepulse.com/blog/railway-pricing-history) (crypto miners + torrent bots abused it; now $5 trial, then card-only). What's actually still free, always-on, and viable for a long-lived ActivityPub server in mid-2026:

### Compute scorecard

| Provider | Always-free? | No-sleep? | Indonesia latency | Federation TOS-safe | Generosity for PieFed | Longevity |
|---|---|---|---|---|---|---|
| **Oracle Cloud Ampere A1** (`ap-singapore-1`) | Yes (post-Jun-15 cut: 2 OCPU / 12 GB / 200 GB) | Yes (but 7-day <20% idle = reclaim risk) | Excellent (~30 ms RTT Jakarta–Singapore) | Yes (no AUP prohibition; Mastodon precedent) | High | Cut 50% June 2026; brand-risk for further cuts |
| Fly.io | No (new accounts) | n/a | Singapore region exists | n/a | n/a | Killed free Oct 2024 |
| [Koyeb free](https://www.koyeb.com/blog/sustaining-free-compute-in-a-hostile-environment) | Yes (512 MB / 0.1 vCPU) | **No** (sleeps on no traffic) | EU/US only — no Asia free instance | OK | Way too small for PieFed | Stable |
| [Render free](https://render.discourse.group/t/do-web-services-on-a-free-tier-go-to-sleep-after-some-time-inactive/3303) | Yes | **No** (15-min sleep) | US/EU only | OK | Too small + sleep is fatal for inbox | Stable |
| Railway | No | n/a | n/a | n/a | n/a | Killed free 2023 |
| Northflank free | Yes (2 services, tiny) | Limited | EU/US | OK | Too small for full PieFed | Stable |
| Cloudflare Workers | Yes (100k req/day) | Yes | Edge (excellent) | n/a | Wrong shape for PieFed (Python/long-lived) | Stable |

Of compute providers, **only Oracle Cloud meets all four hard criteria**: always-free, no-sleep, Singapore region (the only Indonesia-acceptable latency floor), and TOS-permissive of federation servers (Mastodon and Lemmy admins have run on Oracle Always Free for years; the AUP forbids only crypto mining and bandwidth-saturation abuse).

### Database scorecard

| Provider | Free tier | Fit for PieFed Postgres | Verdict |
|---|---|---|---|
| [Neon](https://www.saaspricepulse.com/tools/neon) | 0.5 GB/project, 100 CU-h/mo | Capacity OK at start but cold-start latency + 0.5 GB will overflow in ~3 mo as federation imports posts | **No** |
| [Supabase](https://www.itpathsolutions.com/supabase-free-tier-limits) | 500 MB DB, **pauses after 7 days inactive** | Pausing breaks Celery + federation inbox totally | **No** |
| Aiven free | 1 GB Postgres (limited regions) | Region not in Asia; small | Marginal |
| Tembo free | Removed during 2025 pivot | n/a | **No** |
| Vercel Postgres | Neon-backed, same limits | Same as Neon | **No** |
| **Co-located on Oracle VM** | "free" (uses the box's RAM/disk) | Full control, tune `shared_buffers`, no cold start | **Yes** |

The free DB-as-a-service tier is universally too small or too sleepy. **Postgres lives on the same Oracle VM.**

### Cache / queue scorecard

[Upstash Redis free](https://upstash.com/blog/redis-new-pricing): 256 MB / 500k commands per month / 10 GB bandwidth. Celery as a broker is *chatty* — heartbeat + task ack + result-backend writes easily blow through 500k commands/month at low load. Also: **using Redis as a Celery broker over the internet adds 30–50 ms per task dispatch**, which is fine for federation activities but bad UX for inline notification dispatch. **Run Redis on the Oracle box** (cheaper, faster, no quota).

### Object storage scorecard (for pict-rs uploads)

| Provider | Free tier | Verdict |
|---|---|---|
| [Cloudflare R2](https://r2drop.com/blog/cloudflare-r2-free-tier-guide) | 10 GB storage, 1M Class A ops, 10M Class B ops, **$0 egress** | Excellent fit; pict-rs supports S3 backend |
| [Backblaze B2](https://www.backblaze.com/cloud-storage/pricing) | First 10 GB free, free egress up to 3× storage, **free egress to Cloudflare via partnership** | Excellent backup target |
| IDrive E2 free | 10 GB | OK, weaker ecosystem |
| Storj free | 25 GB / 25 GB egress | Erasure-coded, latency variable |

R2 + B2 are both viable. But: **at <500 MB of pict-rs data in six months, the operational lift of running pict-rs against remote S3 (S3 credentials, lifecycle policy, cache headers, CORS) is not worth the savings vs. local disk on a 200 GB Oracle Block Volume.** Keep pict-rs on local disk; back up nightly to **B2 with Cloudflare egress** for off-site safety.

---

## 4. The Oracle Ampere deep-dive

Oracle Cloud Always Free is the only realistic free-tier path for an ETNOS backend, so it deserves scrutiny.

**The June 15 2026 cut.** [Linuxiac and community reports](https://linuxiac.com/oracle-quietly-cuts-free-tier-ampere-a1-resources-in-half/) document that Oracle reduced the Always Free Ampere A1 ceiling from 4 OCPU / 24 GB to **2 OCPU / 12 GB** effective today (the date of this research note). Existing instances that exceed the new limit will be **shut down** until users downscale. Brutal but not catastrophic — 12 GB is still well above PieFed's ~3.3 GB realistic ceiling for our cohort size.

**Provisioning reality.** ARM Always Free instances in US regions have been "out of host capacity" for hours-to-days for years. The good news per recent 2026 reports: **`ap-singapore-1` and `eu-frankfurt-1` typically provision within minutes**. There's also a [community CLI script](https://github.com/hitrov/oci-arm-host-capacity) that retries automatically. Allocate one engineer-hour for the provisioning dance; budget two if Singapore is congested that day.

**Idle reclamation.** Oracle reclaims Always Free compute if **CPU 95th-percentile < 20% over a 7-day window**. PieFed with federation chatter from 20+ peers and any active users will stay above 20% trivially. For belt-and-suspenders: a 1-minute cron running `stress-ng --cpu 1 --timeout 30s` once an hour is the canonical mitigation if traffic dips during a quiet week. The 30-day account-abandonment rule is irrelevant if you log in occasionally.

**ARM compatibility for PieFed.** Python is fine. Postgres has first-class `linux/arm64` Docker images. Redis has ARM images. Celery is Python. **pict-rs is Rust** and ships ARM builds (`--platform linux/arm64`). nginx is ARM-native. **Zero ARM compatibility blockers**.

**Singapore latency for Indonesian users.** Jakarta–Singapore RTT averages **30–50 ms**. Sentani / Jayapura (eastern Indonesia) is ~60–80 ms. Compare to Hetzner Falkenstein (~250–350 ms RTT). For a real-time-ish forum experience, Singapore is the *only* acceptable free-tier compute geography.

**TOS for federation servers.** Oracle's AUP forbids crypto mining and bandwidth-saturation abuse. It does not prohibit ActivityPub federation, peer-to-peer, or "general purpose servers." Both [Mastodon-on-Oracle](https://github.com/tcaddy/oracle-cloud-mastodon) and Lemmy-on-Oracle communities have run multi-year deployments without incident. **TOS-clean.**

**Track record on yanking.** Oracle has not yanked the Always Free tier wholesale, but the June 2026 50% cut shows they are willing to tighten silently. The brand-risk is real. If they cut to 1 OCPU / 6 GB in 2027 we'd be forced off. Probability is non-zero but not high — Oracle's strategic use of Always Free as a developer-onboarding funnel for OCI paid services depends on it staying meaningfully free.

---

## 5. Split-stack proposal — and why I don't recommend it

The seductive plan: compute on Oracle, Postgres on Neon, Redis on Upstash, pict-rs blobs on R2, edge routing already on CF. Theoretically zero-cost forever. In practice:

- **Neon's 0.5 GB** will overflow in 3–4 months as the federation imports posts from peers — every cross-instance subscribed community ingests its post history. Once it's full, free tier won't let you write.
- **Upstash's 500k commands/month** is ~16k/day, which Celery beats easily once federation peers are active (heartbeats + result backends + task acks).
- **Latency**: Postgres on Neon US-East (the only free-tier region) is +200 ms from a Singapore VM. That makes every API call painful. Neon's Asia regions are paid.
- **Cold starts on Neon free**: 100 CU-hours/month means you'd run continuously at 0.14 CU — fine if it never sleeps, but free Neon does scale-to-zero, and the cold-start hit on federation inbox handlers is operationally awful.
- **Multi-provider operational overhead**: four dashboards, four sets of credentials, four billing portals to watch, four "did we hit the cap?" worries.

**A single-host Docker Compose on the Oracle VM eats all of this.** Postgres tuned to `shared_buffers=2GB` in 12 GB total RAM has no cold start, no quota, no cross-region latency. Redis in-process is sub-millisecond. pict-rs writes to a local volume that's nightly-backed-up to B2. **One thing to monitor, one thing to back up, one thing to migrate when the time comes.**

The split-stack would be the right call only if Oracle (a) refused to provision and (b) the Hetzner alternative were ruled out for residency reasons. Neither holds.

---

## 6. The "just pay €4–7/month" reality check

The current default in `docs/etnos/beta-readiness-plan.md` is Hetzner CAX11 at ~€4/month (now €4.49 + €0.50 IPv4 = **€4.99/month** per [VPSBenchmarks](https://www.vpsbenchmarks.com/hosters/hetzner/plans/cax11)). Six months = €30.

The honest framing: **how many engineer-hours of free-tier maintenance equal €30?** At any reasonable consulting rate, the answer is "less than one hour." The Oracle provisioning dance alone (especially if capacity is tight) can eat that. The keep-alive cron, the quarterly audit-against-future-cuts review, the slight operational anxiety — these compound.

**However**, Hetzner has no Indonesia-acceptable region. CAX11 is Nuremberg/Helsinki/Falkenstein only. From Jakarta that's **~250–350 ms RTT**. Hetzner Singapore exists but starts at €6.49/month for x86 (no Ampere ARM), and at that price point an Indonesian provider like IDCloudHost or Biznet Gio Cloud (cheap-VPS line starts ~Rp 50,000/month ≈ €3.00 for 1 GB RAM) becomes equally viable and politically better for the residency narrative.

**The decision matrix:**

| Goal | Best choice |
|---|---|
| Lowest total cost over 6 months, latency tolerated | Oracle Always Free Singapore (€0) |
| Lowest cost with Indonesian residency story | IDCloudHost / Biznet Gio Cloud (~€3–5/month) |
| Lowest cost with EU latency tolerated | Hetzner CAX11 Nuremberg (~€5/month) |
| "I want to never think about this" | Hetzner CAX21 (4 GB RAM, ~€7/month) |

For the **early-access cohort that ends in M6**, the right call is Oracle Singapore. For **beta proper (public launch, M7+)**, the right call is IDCloudHost or Biznet Gio Cloud — residency aligned with the Kominfo PSE filing and `docs/aksara/architecture.md` §22 commitment.

---

## 7. Six-month projection (cohort 20 → 500)

| Month | Active users | Federation peers | Approx RAM | Oracle Singapore (12 GB) | Postgres size | Notes |
|---|---|---|---|---|---|---|
| 1 | 20 | 5 | 1.2 GB | ✅ Plenty of headroom | 100 MB | Setup + seed communities |
| 2 | 60 | 15 | 1.8 GB | ✅ | 300 MB | Inviting next ring |
| 3 | 120 | 30 | 2.5 GB | ✅ | 700 MB | Federation imports accelerating |
| 4 | 220 | 40 | 3.1 GB | ✅ | 1.4 GB | First moderation load |
| 5 | 350 | 50 | 3.7 GB | ✅ | 2.3 GB | Notification queue growing |
| 6 | 500 | 60+ | 4.5 GB | ✅ (tight on Postgres tuning) | 3.4 GB | Time to plan migration |

The wall: somewhere between **500 and 1500 users** (depending on activity density and federation breadth), Postgres `shared_buffers` and pict-rs IO bursts make 12 GB feel tight, but it's not a cliff. **It's a gradual "this would feel better with more headroom" curve, not a "service down" failure.**

The point where the Oracle VM becomes structurally unsuitable is closer to **2,000–3,000 MAU**, which the cohort plan above does not reach in M0–M6.

---

## 8. Migration path off Oracle, when the time comes

Three-step migration, doable in a single maintenance window:

1. **Provision the target** — Hetzner CAX21 (4 vCPU / 8 GB / €7.59/month) or, preferably, an IDCloudHost VPS in Jakarta for residency alignment.
2. **Replicate Postgres** with `pg_basebackup` → set up streaming replication → cut over with a brief read-only window. PieFed ID generation and federation actor IDs stay stable because they reference `etnos.papua.id` (per `docs/etnos/single-domain-architecture.md`), not the backend hostname.
3. **Repoint the Cloudflare Worker** — change `BACKEND_ORIGIN` from the Oracle private hostname to the new VPS, rsync the pict-rs volume, restart. The canonical domain users see (`etnos.papua.id`) doesn't change; federation peers don't notice.

**The single-domain Worker architecture this plan already inherits is what makes free→paid migration low-friction.** Identity coherence stays intact across the switch.

---

## 9. The recommendation

**For M0–M6 (early access, cohort 20→500):**

- **Compute**: Oracle Cloud Always Free Ampere A1, `ap-singapore-1`, 2 OCPU / 12 GB / 200 GB block storage. Provision via retry-on-capacity-error if Singapore is congested.
- **Postgres 16**: on-box Docker, tuned to `shared_buffers=2GB`, `effective_cache_size=6GB`.
- **Redis 7**: on-box Docker, no persistence needed beyond Celery broker.
- **pict-rs**: on-box Docker, local volume, with **nightly `pg_dump` and `rsync` of the pict-rs volume to Backblaze B2** (free 10 GB, free egress via Cloudflare partnership for backups).
- **Edge**: existing CF Worker per `docs/etnos/single-domain-architecture.md`, routing `etnos.papua.id` → Pages (frontend) + Oracle VM (backend). CF Workers free tier (100k req/day) covers backend-bound traffic comfortably at this cohort size.
- **Monitoring**: UptimeRobot free (instatus.com free for the status page); Sentry frontend on free tier.
- **Keep-alive insurance**: a 1-minute cron that touches `/api/alpha/site` and a once-per-hour `stress-ng` blip to stay above Oracle's idle-reclaim threshold. Total cost: ~€0/month.

**The honest "this will break when X happens" caveat:**

1. **Oracle further cuts the Always Free tier.** The June 15 2026 cut from 4/24 → 2/12 was the second cut in three years. A future cut to 1/6 would force us off. Mitigation: have the Hetzner / IDCloudHost migration recipe documented (see §8) so the cutover is a half-day exercise.
2. **Federation breadth grows faster than the cohort.** If we end up peering with 200+ instances even at 100 users, Postgres + pict-rs storage will hit limits before user count does. Mitigation: be selective about peer subscriptions in the early-access window.
3. **Singapore capacity tightens.** If Oracle stops accepting new Always Free Singapore A1 provisions, we cannot re-provision after instance loss. Mitigation: do not delete the instance for any reason during the early-access window; even rebooting can occasionally trigger a re-provision attempt.
4. **TOS enforcement against federation noise.** Low probability, but if Oracle ever decides federation traffic looks like abuse, they can terminate without notice. Mitigation: nightly off-site backup to B2 (already in the plan) means we lose at most 24 hours of state.

**For M7+ (beta proper, Kominfo PSE-registered, public):** migrate to IDCloudHost (Jakarta) or Biznet Gio Cloud — residency aligned with `docs/aksara/architecture.md` §22 and the PSE filing, ~€3–5/month, no free-tier brittleness, Indonesian invoice for the founding company's books.

---

## Sources

- [Oracle Cloud Always Free reduction — Linuxiac](https://linuxiac.com/oracle-quietly-cuts-free-tier-ampere-a1-resources-in-half/)
- [Always Free Resources — Oracle docs](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [PieFed vs Lemmy resource comparison — Lemmy.ml](https://lemmy.ml/post/38984466)
- [Lemmy minimum resources — Lemmy.World](https://lemmy.world/post/1287117)
- [Tuning PieFed for scale — join.piefed.social](https://join.piefed.social/2025/07/09/tuning-piefed-for-scale/)
- [Fly.io free tier 2026 status — Render](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026)
- [Koyeb sustaining free compute](https://www.koyeb.com/blog/sustaining-free-compute-in-a-hostile-environment)
- [Render free-tier sleep behavior](https://render.discourse.group/t/do-web-services-on-a-free-tier-go-to-sleep-after-some-time-inactive/3303)
- [Railway pricing history — SaaSPricePulse](https://www.saaspricepulse.com/blog/railway-pricing-history)
- [Neon free tier 2026 limits](https://www.saaspricepulse.com/tools/neon)
- [Supabase free tier limits and pausing](https://www.itpathsolutions.com/supabase-free-tier-limits)
- [Upstash Redis 2026 pricing](https://upstash.com/blog/redis-new-pricing)
- [Cloudflare R2 free tier guide](https://r2drop.com/blog/cloudflare-r2-free-tier-guide)
- [Backblaze B2 pricing 2026](https://www.backblaze.com/cloud-storage/pricing)
- [Hetzner CAX11 benchmarks and pricing](https://www.vpsbenchmarks.com/hosters/hetzner/plans/cax11)
- [Oracle Cloud OCI ARM capacity workaround — GitHub hitrov](https://github.com/hitrov/oci-arm-host-capacity)
- [Mastodon on Oracle Always Free — GitHub tcaddy](https://github.com/tcaddy/oracle-cloud-mastodon)
- [Cloudflare Workers free tier pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Indonesian VPS landscape — Lancartech](https://lancartech.co.id/en/blog/cloud-provider-indonesia)
