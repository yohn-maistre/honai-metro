import {error} from '@sveltejs/kit';
export async function load({fetch,params}){const r=await fetch('/api/etnos/watch/issue/'+encodeURIComponent(params.id));if(!r.ok)error(r.status,'Bahan belum tersedia.');return {record:await r.json(),kind:'issues'}}
