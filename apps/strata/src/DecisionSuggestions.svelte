<script lang="ts">
  import {Sparkles,ArrowUpRight,GitPullRequest} from '@lucide/svelte'
  import {Button} from '$lib/components/ui/button/index.js'
  import {request} from './api'
  let {postId,onDraft}:{postId:string;onDraft?:()=>void}=$props()
  type Suggestion={model:string;story:{id:string;title:string}|null;confidence:number;wikiScore:number;wikiCandidate:boolean;reviewRequired:true}
  let enabled=$state(false),busy=$state(false),error=$state(''),result=$state<Suggestion|null>(null),requestKey=$state(crypto.randomUUID())
  $effect(()=>{const id=postId,abort=new AbortController();enabled=false;busy=false;error='';result=null;requestKey=crypto.randomUUID();request<{decisions?:{enabled:boolean}}>('/v1/capabilities',undefined,abort.signal).then(c=>{if(!abort.signal.aborted&&postId===id)enabled=!!c.decisions?.enabled}).catch(()=>{});return()=>abort.abort()})
  async function suggest(){
    if(busy)return
    const id=postId;busy=true;error=''
    try{const data=await request<Suggestion>('/v1/posts/'+id+'/suggestions',{requestKey});if(postId===id)result=data}
    catch(e){if(postId===id)error=e instanceof Error?e.message:'Saran belum tersedia'}
    finally{if(postId===id)busy=false}
  }
</script>
{#if enabled}<div class="decision-suggestions">
  {#if !result}<Button variant="ghost" disabled={busy||!!error} onclick={suggest}><Sparkles size={15}/>{busy?'Mencari kaitan…':'Temukan kaitan & bahan wiki'}</Button>{/if}
  {#if error}<p role="status">{error}</p>{/if}
  {#if result}<div class="decision-result" aria-live="polite"><div class="decision-result-heading"><Sparkles size={14}/><strong>Saran AI</strong><small>Perlu ditinjau</small></div>
    {#if result.story}<a href={'/news/'+result.story.id}><span><small>Kabar yang mungkin terkait</small><strong>{result.story.title}</strong></span><ArrowUpRight size={16}/></a>{:else}<p>Belum ada kaitan kabar yang cukup kuat.</p>{/if}
    {#if result.wikiCandidate && onDraft}<Button variant="outline" onclick={onDraft}><GitPullRequest size={15}/>Tinjau sebagai bahan wiki</Button>{:else}<p>Belum disarankan sebagai bahan wiki.</p>{/if}
    <small class="decision-model">Clef-flash · {Math.round(result.wikiScore*100)}% skor kandidat wiki</small>
  </div>{/if}
</div>{/if}
