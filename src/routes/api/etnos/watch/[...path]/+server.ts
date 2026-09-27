import { askWatch, readWatch } from '$lib/server/etnos/watch'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ platform, params, url }) =>
  readWatch(platform?.env.WATCH_ENGINE, String(params.path ?? ''), url.searchParams)

export const POST: RequestHandler = ({ platform, params, request, url }) => {
  if (params.path !== 'ask')
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: { allow: 'GET' } },
    )
  return askWatch(platform?.env.WATCH_ENGINE, request, url)
}
