// Synthetic, loopback-only browser contract. Never provisions a deployed node.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
if (!process.env.STRATA_REPO)
  throw Error(
    'Set STRATA_REPO to a local engine checkout for cloud browser checks.',
  )
export const origin = process.env.STRATA_UI_URL ?? 'http://localhost:5175'
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw Error('Browser fixtures require a loopback UI URL.')
const require = createRequire(import.meta.url)
export const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ?? 'playwright',
)
const load = (name) =>
  import(pathToFileURL(resolve(process.env.STRATA_REPO, 'src', name)).href)
export const { Strata } = await load('store.ts')
export const { api } = await load('api.ts')
export const { Groups } = await load('groups.ts')
export const { Wiki } = await load('wiki.ts')
export const { Activity } = await load('activity.ts')
export const artifactDir = resolve(
  process.env.STRATA_BROWSER_ARTIFACTS ?? '/tmp/strata-browser-evidence',
)
mkdirSync(artifactDir, { recursive: true })
