<script lang="ts">
 import {ShoppingBag} from '@lucide/svelte'
 import {Button} from '$lib/components/ui/button/index.js'
 import {request,type Auth,type Post,type Community,type Membership} from './api'
 import PostCard from './PostCard.svelte'
 import ContentSkeleton from './ContentSkeleton.svelte'
 let {auth,communities=[],memberships=[],communityId='',authorId='',compact=false,onCreate}:{auth:Auth;communities?:Community[];memberships?:Membership[];communityId?:string;authorId?:string;compact?:boolean;onCreate?:()=>void}=$props()
 let items=$state<Post[]>([]),pending=$state(true),error=$state(''),kind=$state(''),closed=$state(false)
 $effect(()=>{const actor=auth.actor?.id,c=communityId,a=authorId,k=kind,showClosed=closed||!!authorId,controller=new AbortController();pending=true;error='';const query=new URLSearchParams();if(c)query.set('community',c);if(a)query.set('author',a);if(k)query.set('kind',k);if(showClosed)query.set('closed','true');request<{items:Post[]}>('/v1/offerings?'+query,undefined,controller.signal).then(result=>{if(!controller.signal.aborted&&auth.actor?.id===actor)items=result.items}).catch(e=>{if(!controller.signal.aborted)error=e instanceof Error?e.message:'Penawaran belum dapat dimuat.'}).finally(()=>{if(!controller.signal.aborted)pending=false});return()=>controller.abort()})
</script>
<section class="offering-catalog" class:compact aria-label="Penawaran dan kebutuhan">
 <header><div><ShoppingBag size={20}/><h2>{authorId?'Penawaran publik':'Penawaran & kebutuhan'}</h2></div>{#if onCreate&&auth.actor&&(!communityId||memberships.some(m=>m.community_id===communityId))}<Button variant="outline" onclick={onCreate}>Buat penawaran</Button>{/if}{#if !compact}<p>Barang, jasa, dan bantuan dari orang di sekitarmu.</p>{/if}</header>
 <div class="offering-filters" role="group" aria-label="Jenis penawaran">{#each [['','Semua'],['offer','Menawarkan'],['request','Mencari']] as [value,label]}<button aria-pressed={kind===value} onclick={()=>kind=value}>{label}</button>{/each}{#if !authorId}<label><input type="checkbox" bind:checked={closed}/>Termasuk yang selesai</label>{/if}</div>
 {#if pending}<ContentSkeleton rows={2}/>{:else if error}<p class="commons-alert" role="alert">{error}</p>{:else if !items.length}<p class="commons-empty">Belum ada penawaran yang cocok.</p>{:else}{#each items as post}<PostCard {post} community={communities.find(c=>c.id===post.community_id)} loggedIn={!!auth.actor} canVote={memberships.some(m=>m.community_id===post.community_id)} onError={message=>error=message}/>{/each}{/if}
</section>
