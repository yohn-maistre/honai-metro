<script lang="ts">
 import {untrack} from 'svelte'
 import {BookOpen,Plus,ArrowUpRight,History,Globe,LockKeyhole} from '@lucide/svelte'
 import {request,relativeDate,type Auth,type Community,type Membership} from './api'
 import {Button} from '$lib/components/ui/button/index.js'
 import {Input} from '$lib/components/ui/input/index.js'
 import {Textarea} from '$lib/components/ui/textarea/index.js'
 import ContentSkeleton from './ContentSkeleton.svelte'
 import {markdown} from './markdown'
 type Note={id:string;community_id:string;title:string;text:string;kind:string;language:string;citations:string[];revision:number;state:string;updated:number;wiki_page_id:string|null;author:{id:string;name:string;kind:string};evidenceStatus:string;availableActions:{edit:boolean;promote:boolean}}
 let {auth,path,navigate}:{auth:Auth;path:string;navigate:(url:string)=>void}=$props()
 let notes=$state<Note[]>([]),selected=$state<Note|null>(null),rooms=$state<Community[]>([]),memberships=$state<Membership[]>([]),loading=$state(true),busy=$state(false),error=$state(''),editing=$state(false),history=$state<{revision:number;text:string;created:number}[]>([]),showHistory=$state(false)
 let communityId=$state(''),title=$state(''),body=$state(''),kind=$state('note'),urls=$state(''),requestKey=$state(crypto.randomUUID())
 let generation=0
 const eligible=$derived(rooms.filter(c=>memberships.some(m=>m.community_id===c.id))),labels:Record<string,string>={note:'Catatan',question:'Pertanyaan',memory:'Ingatan', 'source-comparison':'Perbandingan sumber'}
 async function load(){const mine=++generation;loading=true;error='';selected=null;editing=false;showHistory=false
  try{const [ns,cs,ms]=await Promise.all([request<Note[]>('/v1/knowledge'),request<Community[]>('/v1/communities'),auth.actor?request<Membership[]>('/v1/memberships'):Promise.resolve([])])
   if(mine!==generation)return;notes=ns;rooms=cs;memberships=ms;communityId=cs.find(c=>ms.some(m=>m.community_id===c.id))?.id??''
   const id=path.split('/')[2];if(id){const note=await request<Note>('/v1/knowledge/'+id);if(mine===generation)selected=note}
  }catch(e){if(mine===generation)error=e instanceof Error?e.message:'Catatan belum dapat dimuat.'}finally{if(mine===generation)loading=false}}
 $effect(()=>{void path;void auth.actor?.id;untrack(()=>void load());return()=>{generation++}})
 function open(note:Note|null=null){title=note?.title??'';body=note?.text??'';kind=note?.kind??'note';urls=note?.citations.join('\n')??'';requestKey=crypto.randomUUID();editing=true;error=''}
 async function act(fn:()=>Promise<void>){if(busy)return;busy=true;error='';try{await fn()}catch(e){error=e instanceof Error?e.message:'Perubahan belum tersimpan.'}finally{busy=false}}
 async function save(){await act(async()=>{const payload={title,text:body,citations:urls.split('\n').map(v=>v.trim()).filter(Boolean),requestKey}
  const note=await request<Note>(selected?'/v1/knowledge/'+selected.id+'/edit':'/v1/knowledge',selected?{...payload,revision:selected.revision}:{...payload,communityId,kind,language:'id'})
  editing=false;if(path==='/knowledge/'+note.id)await load();else navigate('/knowledge/'+note.id)})}
</script>
{#if loading}<ContentSkeleton />{:else}
 <div class="commons-page-head"><div><h1>{selected?'Catatan bersama':'Pengetahuan yang sedang tumbuh'}</h1>{#if !selected}<p class="cx-hint">Catatan, pertanyaan & ingatan dari komunitas.</p>{/if}</div><a href="/wiki" class="commons-quiet-link"><BookOpen size={16}/>Wiki</a></div>
 {#if error}<p role="alert" class="commons-alert">{error}</p><Button variant="outline" onclick={load}>Muat ulang</Button>{/if}
 {#if editing}<form class="commons-editor" onsubmit={e=>{e.preventDefault();void save()}}>
  {#if !selected}<label for="knowledge-room">Komunitas</label><select id="knowledge-room" bind:value={communityId} required>{#each eligible as room}<option value={room.id}>{room.title}{room.visibility!=='public'?' · khusus anggota':''}</option>{/each}</select><label for="knowledge-kind">Bentuk catatan</label><select id="knowledge-kind" bind:value={kind}>{#each Object.entries(labels) as [value,label]}<option {value}>{label}</option>{/each}</select>{/if}
  <label for="knowledge-title">Judul</label><Input id="knowledge-title" bind:value={title} maxlength={160} required/><label for="knowledge-text">Catatanmu</label><Textarea id="knowledge-text" bind:value={body} rows={8} maxlength={20000} required placeholder="Apa yang kamu ketahui, ingat, atau ingin tanyakan?"/>
  <details><summary>Sumber (opsional)</summary><label for="knowledge-sources">Satu tautan HTTPS per baris</label><Textarea id="knowledge-sources" bind:value={urls} rows={3}/></details>
  <div class="commons-actions"><Button type="submit" disabled={busy||!communityId}>Simpan catatan</Button><Button variant="ghost" onclick={()=>editing=false}>Batal</Button></div>
 </form>
 {:else if selected}
  <article class="commons-working-note"><div class="commons-note-meta"><span>{labels[selected.kind]}</span><span>{rooms.find(r=>r.id===selected?.community_id)?.visibility==='public'?'Publik':'Khusus anggota'}</span><span>Revisi {selected.revision}</span></div><h2>{selected.title}</h2><a class="commons-byline" href={'/people/'+selected.author.id}>{selected.author.name}{selected.author.kind==='agent'?' · Agen AI':''}</a>
   {#if selected.evidenceStatus!=='current'}<p role="status" class="commons-alert">Sumber berubah atau ditarik. Catatan ini perlu ditinjau kembali.</p>{/if}
   <div class="strata-body">{@html markdown(selected.text)}</div>
   {#if selected.citations.length}<ul class="commons-source-links">{#each selected.citations as url}<li><a href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname}<ArrowUpRight size={14}/></a></li>{/each}</ul>{/if}
   {#if selected.wiki_page_id}<a class="commons-quiet-link" href={'/wiki/'+selected.wiki_page_id}><BookOpen size={16}/>Lihat halaman Wiki</a>{/if}
   <div class="commons-actions">{#if selected.availableActions.edit}<Button variant="outline" onclick={()=>open(selected!)}>Sunting</Button>{/if}{#if selected.availableActions.promote}<Button variant="outline" disabled={busy||selected.evidenceStatus!=='current'} onclick={()=>act(async()=>{const result=await request<{pageId:string}>('/v1/knowledge/'+selected!.id+'/promote',{revision:selected!.revision,requestKey:crypto.randomUUID()});navigate('/wiki/'+result.pageId)})}><BookOpen size={16}/>Ajukan ke Wiki</Button>{/if}<Button variant="ghost" onclick={()=>act(async()=>{history=await request('/v1/knowledge/'+selected!.id+'/history');showHistory=!showHistory})}><History size={16}/>Riwayat</Button></div>
   {#if showHistory}<ol class="commons-history">{#each history as entry}<li><strong>Revisi {entry.revision}</strong><time>{relativeDate(entry.created)}</time><p>{entry.text}</p></li>{/each}</ol>{/if}
  </article>
 {:else}
  <div class="commons-actions">{#if auth.actor&&eligible.length}<Button onclick={()=>open()}><Plus size={16}/>Tambah catatan</Button>{:else if !auth.actor}<Button href="/login" variant="outline">Masuk untuk berkontribusi</Button>{/if}</div>
  {#if !notes.length}<div class="strata-nodata"><BookOpen size={28}/><h2>Mulai dari sebuah catatan</h2><p>Hal yang belum lengkap pun bisa menjadi awal percakapan.</p></div>{/if}
  <div class="commons-note-list">{#each notes as note}<a href={'/knowledge/'+note.id} class="commons-note-row"><div class="commons-note-meta"><span>{labels[note.kind]}</span>{#if rooms.find(r=>r.id===note.community_id)?.visibility!=='public'}<span><LockKeyhole size={12}/>Khusus anggota</span>{:else}<span><Globe size={12}/>Publik</span>{/if}</div><h2>{note.title}</h2><p>{note.text.slice(0,180)}</p><small>{note.author.name}{note.author.kind==='agent'?' · AI':''} · {relativeDate(note.updated)}{note.evidenceStatus!=='current'?' · Sumber perlu ditinjau':''}</small></a>{/each}</div>
 {/if}
{/if}
