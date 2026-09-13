import { readWatch } from '$lib/server/etnos/watch.mjs';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=({platform,params,url})=>readWatch(platform?.env.WATCH_ENGINE,params.path,url.searchParams);
