# Cloudflare Pages deploy — operator notes

This repo deploys to Cloudflare Pages via GitHub Actions (`.github/workflows/deploy-cf-pages.yml`).

## First-time setup (~5 minutes, one-time)

### 1. Create a Cloudflare API token

[dash.cloudflare.com](https://dash.cloudflare.com/) → **My Profile** → **API Tokens** → **Create Token** → **Custom token**.

Permissions:

| Section | Permission |
|---|---|
| Account → Cloudflare Pages | Edit |
| Account → Account Settings | Read |
| User → User Details | Read |

Account Resources: **Include → your account**.
Save the token string — you'll see it once.

### 2. Find your Cloudflare account ID

It's in the top-right of the Cloudflare dashboard, or under **Workers & Pages → Overview → Account ID** (right sidebar).

### 3. Add both as repo secrets

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | (the token from step 1) |
| `CLOUDFLARE_ACCOUNT_ID` | (the ID from step 2) |

That's the whole setup. No `wrangler login` needed locally, no manual project creation.

## What happens on push

- **`main` push** → production deploy to `https://etnos.pages.dev/`
- **Any other branch push** → preview deploy to `https://<branch-slug>.etnos.pages.dev/`
- **Manual trigger** → Actions tab → "Deploy ETNOS to Cloudflare Pages" → Run workflow

First run also creates the CF Pages project — the workflow's `pages project create` step is idempotent (it `continue-on-error`s if the project already exists).

## Editing production env vars

The `PUBLIC_*` env vars are inlined into the client JS bundle at build time, so they live in the workflow file itself (`env:` block on the build step). They are public-by-design — not secrets — so it's safe and convenient to edit them in plain YAML.

To change a value: edit `.github/workflows/deploy-cf-pages.yml`, commit, push to main, deploy runs.

The currently-set values:

| Var | Value |
|---|---|
| `PUBLIC_INSTANCE_URL` | `piefed.social` |
| `PUBLIC_INSTANCE_TYPE` | `piefedalpha` |
| `PUBLIC_LOCK_TO_INSTANCE` | `true` |
| `PUBLIC_LANGUAGE` | `id` |
| `PUBLIC_SSR_ENABLED` | `false` |

## Manual / local deploy (alternative)

If you ever want to push from your laptop instead of through Actions:

```bash
wrangler login                                # browser auth, one time
CF_PAGES=1 bun run build
wrangler pages deploy .svelte-kit/cloudflare \
  --project-name=etnos \
  --branch=main
```

Same result.

## Custom domain (when you pick one)

CF dashboard → Pages → `etnos` project → **Custom domains → Set up a custom domain**. Add the domain, Cloudflare provisions TLS, done. No workflow changes needed.

See `docs/etnos/single-domain-architecture.md` for the reverse-proxy setup that lets one domain serve both the frontend AND the federation backend — needed when we move off `piefed.social`.

## Troubleshooting

- **Build OOM** → CF Pages Settings → Build → Build image **v2**.
- **`Project not found` on first deploy** → the `pages project create` step failed silently. Run it once manually: `wrangler pages project create etnos --production-branch=main`.
- **Env vars missing from bundle** → confirm they're in the workflow's `env:` block on the build step, not somewhere else.
- **Worker request quota** → 100k/day on free tier. With `PUBLIC_SSR_ENABLED=false`, you're serving static + client hydration; only the SvelteKit Worker for SSR routes counts. Should be safe.
