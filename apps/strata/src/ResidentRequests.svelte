<script lang="ts">
  import {untrack} from 'svelte'
  import {Bot, LoaderCircle, RefreshCw, ArrowUpRight} from '@lucide/svelte'
  import {request,type ResidentRequest} from './api'
  let {postId,replyCount=0,onAnswered}:{postId:string;replyCount?:number;onAnswered:()=>Promise<void>}=$props()
  let rows=$state<ResidentRequest[]>([]),busy=$state(false),error=$state('')
  const labels:Record<ResidentRequest['state'],string>={queued:'Menunggu giliran',running:'Sedang menyiapkan balasan',answered:'Sudah membalas',cancelled:'Permintaan dihentikan',unavailable:'Belum ada balasan yang tersedia'}
  let refresh:()=>void=()=>{}
  $effect(()=>{
    const id=postId;void replyCount;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,attempts=0,active=true
    rows=[];error=''
    async function load(manual=false){
      if(!active||untrack(()=>busy))return
      clearTimeout(timer);busy=true
      try{
        const next=await request<ResidentRequest[]>('/v1/resident/requests?post='+encodeURIComponent(id),undefined,controller.signal,true)
        if(!active)return
        const before=untrack(()=>rows),arrived=next.some(n=>n.state==='answered'&&n.replyId&&before.some(p=>p.postId===n.postId&&['queued','running'].includes(p.state)))
        rows=next;error=''
        if(arrived||manual)await onAnswered()
        if(active&&next.some(n=>['queued','running'].includes(n.state))&&attempts++<24)timer=setTimeout(()=>{if(document.visibilityState==='visible')void load();else timer=setTimeout(()=>void load(),10000)},5000)
      }catch{if(active)error='Status balasan belum dapat diperiksa.'}
      finally{if(active)busy=false}
    }
    refresh=()=>{attempts=0;void load(true)}
    void load()
    return()=>{active=false;controller.abort();clearTimeout(timer);busy=false}
  })
</script>

{#if rows.length||error}<section class="resident-requests" aria-label="Balasan Aksara">
  <header><span><Bot size={16}/>Aksara di percakapan ini</span><button type="button" aria-label="Periksa balasan Aksara" disabled={busy} onclick={()=>refresh()}><RefreshCw size={14} class={busy?'animate-spin':''}/></button></header>
  {#each rows as row (row.postId)}<div class="resident-request-row"><span role="status">{#if row.state==='running'}<LoaderCircle size={14} class="animate-spin"/>{/if}{labels[row.state]}</span><a href={'/square/'+(row.replyId??row.postId)}>{row.replyId?'Lihat balasan':'Lihat pertanyaan'}<ArrowUpRight size={13}/></a></div>{/each}
  {#if error}<p role="status">{error}</p>{/if}
</section>{/if}
