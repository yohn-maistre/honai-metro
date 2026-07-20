#!/usr/bin/env node

const instance = process.argv[2] || process.env.PUBLIC_INSTANCE_URL
const frontendOrigin = process.argv[3] || 'https://etnos.pages.dev'

if (!instance) {
  console.error(
    'Usage: bun run check:backend -- <instance-host> [frontend-origin]',
  )
  process.exit(2)
}

const base = /^https?:\/\//i.test(instance)
  ? new URL(instance)
  : new URL(`https://${instance}`)

if (base.pathname !== '/' || base.search || base.hash) {
  console.error('The instance must be an origin or hostname without a path.')
  process.exit(2)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function permits(header, expected) {
  if (!header) return false
  const values = header
    .toLowerCase()
    .split(',')
    .map((value) => value.trim())
  return values.includes('*') || values.includes(expected.toLowerCase())
}

async function json(response, label) {
  const body = await response.text()
  assert(response.ok, `${label} returned HTTP ${response.status}: ${body}`)
  try {
    return JSON.parse(body)
  } catch {
    throw new Error(`${label} did not return JSON.`)
  }
}

async function main() {
  const nodeInfoResponse = await fetch(new URL('/nodeinfo/2.1', base), {
    headers: { accept: 'application/json' },
  })
  const nodeInfo = await json(nodeInfoResponse, 'NodeInfo')
  assert(
    nodeInfo?.software?.name?.toLowerCase() === 'piefed',
    `NodeInfo reports ${nodeInfo?.software?.name || 'unknown'}, not PieFed.`,
  )

  const siteResponse = await fetch(new URL('/api/alpha/site', base), {
    headers: { accept: 'application/json', origin: frontendOrigin },
  })
  await json(siteResponse, 'PieFed alpha site API')
  const siteAllowOrigin = siteResponse.headers.get(
    'access-control-allow-origin',
  )
  assert(
    siteAllowOrigin === '*' || siteAllowOrigin === frontendOrigin,
    `Site API does not allow ${frontendOrigin}; got Access-Control-Allow-Origin: ${siteAllowOrigin || '(missing)'}.`,
  )

  const preflight = await fetch(new URL('/api/alpha/user/login', base), {
    method: 'OPTIONS',
    headers: {
      origin: frontendOrigin,
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'authorization, content-type',
    },
  })
  assert(preflight.ok, `CORS preflight returned HTTP ${preflight.status}.`)
  const allowOrigin = preflight.headers.get('access-control-allow-origin')
  const allowMethods = preflight.headers.get('access-control-allow-methods')
  const allowHeaders = preflight.headers.get('access-control-allow-headers')
  assert(
    allowOrigin === '*' || allowOrigin === frontendOrigin,
    `Preflight does not allow ${frontendOrigin}; got Access-Control-Allow-Origin: ${allowOrigin || '(missing)'}.`,
  )
  assert(permits(allowMethods, 'POST'), 'Preflight does not allow POST.')
  assert(
    permits(allowHeaders, 'authorization'),
    'Preflight does not allow the Authorization header.',
  )
  assert(
    permits(allowHeaders, 'content-type'),
    'Preflight does not allow the Content-Type header.',
  )

  console.log(
    JSON.stringify(
      {
        ok: true,
        instance: base.origin,
        software: nodeInfo.software,
        frontend_origin: frontendOrigin,
        checks: ['nodeinfo', 'alpha_api', 'cors_get', 'cors_preflight'],
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(`Backend check failed: ${error.message}`)
  process.exit(1)
})
