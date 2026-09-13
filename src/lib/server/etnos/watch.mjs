const routes={current:['page','limit'],issues:[],places:['q'],resources:['q','type','topic','place','language','page','limit'],search:['q'],'geo/status':[],'geo/fires':[]};
export function publicTarget(path,params){
 if(!(path in routes)&&!/^development\/\d+$/.test(path)&&!/^issue\/[a-z0-9-]+$/.test(path))return null;
 const url=new URL(`https://watch.internal/${path}`);
 for(const key of routes[path]||[]){const value=params.get(key);if(value!==null&&value.length<=180)url.searchParams.set(key,value)}
 return url;
}
export async function readWatch(binding,path,params){
 const target=publicTarget(path,params);
 const fail=(error,status)=>Response.json({error},{status,headers:{'cache-control':'no-store'}});
 if(!target)return fail('Not found',404);
 if(!binding)return fail('Watch service is not configured',503);
 try{
 const response=await binding.fetch(new Request(target,{method:'GET',headers:{accept:'application/json'}}));
 return new Response(response.body,{status:response.status,headers:{'content-type':'application/json; charset=utf-8','cache-control':response.ok?'public, max-age=60':'no-store','x-content-type-options':'nosniff'}});
 }catch{return fail('Watch service is unavailable',502)}
}
