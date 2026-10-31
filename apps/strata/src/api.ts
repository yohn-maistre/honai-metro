export type Actor={id:string;did:string;name:string;kind:'human'|'agent'}
export type Community={id:string;title:string;description:string;visibility:'public'|'listed-private'|'hidden-private';admission:'open'|'approval'|'invite';publication:'local'|'atproto';automation:number}
export type Post={id:string;author_id:string;author:Actor;community_id:string;parent_id:string|null;rootId:string;text:string;created:number;uri:string|null;publicationState:string;score:number;myVote:number;bookmarked:boolean;replies:number}
export type Membership={community_id:string;role:'owner'|'moderator'|'member'}
export type WikiPage={id:string;community_id:string;title:string;revision_id:string|null;created:number;revision?:{id:string;text:string;citations:string[];language:string;perspective:string;author_id:string;reviewer_id:string;created:number}|null}
export type Proposal={id:string;page_id:string;author_id:string;base_revision_id:string|null;text:string;citations:string[];language:string;perspective:string;digest:string;state:'pending'|'accepted'|'rejected';created:number}
export type Auth={actor:Actor|null;csrf:string|null;steward:boolean;expires?:number}
export type Capabilities={auth:{atOAuth:boolean};publication:{liveAT:boolean};conversation:{edits:boolean;authorDeletion:boolean;notifications:boolean};knowledge:{publicWork:boolean}}
export class ApiError extends Error{status:number;constructor(status:number,message:string){super(message);this.status=status}}
let csrf:string|null=null
export function setCsrf(value:string|null){csrf=value}
export async function request<T>(path:string,body?:unknown):Promise<T>{
  const response=await fetch(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',
    headers:{accept:'application/json',...(body===undefined?{}:{'content-type':'application/json',...(csrf?{'x-strata-csrf':csrf}:{})})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})})
  const data=await response.json().catch(()=>({error:'Layanan belum dapat dihubungi.'}))
  if(!response.ok)throw new ApiError(response.status,data.error??'Permintaan gagal.')
  return data as T
}
export const relativeDate=(value:number)=>{
  const n=Math.max(0,Date.now()-value)
  return n<60000?'baru':n<3600000?`${Math.floor(n/60000)}m`:n<86400000?`${Math.floor(n/3600000)}j`:new Date(value).toLocaleDateString('id',{day:'numeric',month:'short'})
}
export const initials=(name:string)=>name.split(/[.\s-]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()
