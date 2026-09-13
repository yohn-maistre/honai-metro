// Isolated preview only. Never updates an existing project's configuration.
const account=process.env.CLOUDFLARE_ACCOUNT_ID, token=process.env.CLOUDFLARE_API_TOKEN;
if(!account||!token)throw Error('Cloudflare credentials missing');
const name='etnos-native-lab',base=`https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects`;
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
let r=await fetch(`${base}/${name}`,{headers});
if(r.status===404){
 r=await fetch(base,{method:'POST',headers,body:JSON.stringify({name,production_branch:'reserved-production',build_config:{build_command:'',destination_dir:'.svelte-kit/cloudflare',root_dir:''}})});
 if(!r.ok)throw Error(`Preview creation failed (${r.status}): ${JSON.stringify((await r.json()).errors)}`);
 r=await fetch(`${base}/${name}`,{headers});
}
if(!r.ok)throw Error(`Preview lookup failed (${r.status})`);
const d=await r.json();
if(!d.success||d.result.name!==name||d.result.production_branch!=='reserved-production')throw Error('Unexpected preview target; refusing deployment');
console.log(`Verified isolated Pages project: ${d.result.name}`);
