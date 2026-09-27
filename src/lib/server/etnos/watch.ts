/**
 * Narrow ETNOS -> West Papua Watch boundary.
 *
 * Watch remains the canonical evidence/news engine. ETNOS consumes only an
 * explicit public surface through the Cloudflare service binding. This file
 * intentionally refuses arbitrary paths, query parameters, methods and admin
 * state so the product frontend cannot become a generic Worker proxy.
 */

type WatchBinding = {
  fetch(input: Request): Promise<Response>
}

const GET_ROUTES: Record<string, readonly string[]> = {
  current: ['page', 'limit'],
  issues: [],
  places: ['q'],
  resources: ['q', 'type', 'topic', 'place', 'language', 'page', 'limit'],
  search: ['q'],
  'geo/status': [],
  'geo/fires': [],
}

const fail = (error: string, status: number) =>
  Response.json(
    { error },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  )

function publicGetTarget(path: string, params: URLSearchParams) {
  const dynamic =
    /^development\/\d+$/.test(path) || /^issue\/[a-z0-9-]+$/.test(path)
  if (!(path in GET_ROUTES) && !dynamic) return null

  const target = new URL(`https://watch.internal/${path}`)
  for (const key of GET_ROUTES[path] ?? []) {
    const value = params.get(key)
    if (value !== null && value.length <= 180) target.searchParams.set(key, value)
  }
  return target
}

export async function readWatch(
  binding: WatchBinding | undefined,
  path: string,
  params: URLSearchParams,
) {
  const target = publicGetTarget(path, params)
  if (!target) return fail('Not found', 404)
  if (!binding) return fail('Watch service is not configured', 503)

  try {
    const upstream = await binding.fetch(
      new Request(target, {
        method: 'GET',
        headers: { accept: 'application/json, application/geo+json' },
      }),
    )
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') ??
          'application/json; charset=utf-8',
        'cache-control': upstream.ok
          ? (upstream.headers.get('cache-control') ?? 'public, max-age=60')
          : 'no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch {
    return fail('Watch service is unavailable', 502)
  }
}

export async function askWatch(
  binding: WatchBinding | undefined,
  request: Request,
  pageUrl: URL,
) {
  if (!binding) return fail('Watch service is not configured', 503)

  const origin = request.headers.get('origin')
  if (origin && origin !== pageUrl.origin) return fail('Forbidden', 403)

  const length = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(length) && length > 12_000)
    return fail('Request too large', 413)

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return fail('Invalid JSON', 400)
  }

  const body = (raw ?? {}) as Record<string, unknown>
  const query = String(body.query ?? '').trim()
  if (query.length < 2 || query.length > 500)
    return fail('Question must be between 2 and 500 characters.', 400)

  const history = Array.isArray(body.history)
    ? body.history.slice(-6).map((item) => {
        const row = (item ?? {}) as Record<string, unknown>
        return {
          role: row.role === 'assistant' ? 'assistant' : 'user',
          content: String(row.content ?? '').slice(0, 1_500),
        }
      })
    : []

  const payload = {
    query,
    locale: body.locale === 'pmy' || body.locale === 'id' ? 'pmy' : 'en',
    history,
    pageTitle: String(body.pageTitle ?? '').slice(0, 180),
  }

  try {
    const upstream = await binding.fetch(
      new Request('https://watch.internal/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      }),
    )
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch {
    return fail('Watch answer service is unavailable', 502)
  }
}
