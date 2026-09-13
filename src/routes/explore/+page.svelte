<script lang="ts">
 import {onMount} from 'svelte';
 type Item={id?:number;slug?:string;title?:string|{id?:string;en?:string};title_id?:string;title_en?:string;summary?:string|{id?:string;en?:string};summary_id?:string;description?:string;url?:string;publisher?:string};
 let section=$state('news'),items=$state<Item[]>([]),loading=$state(true),error=$state('');
 const tabs=[['news','Berita'],['issues','Isu'],['library','Pustaka']];
 const text=(v:Item['title'])=>typeof v==='string'?v:v?.id||v?.en||'';
 let serial=0;
 async function load(next:string){section=next;const token=++serial;loading=true;error='';items=[];try{const path=next==='news'?'current':next==='library'?'resources':'issues';const r=await fetch('/api/etnos/watch/'+path);if(!r.ok)throw Error(r.status===503?'Layanan belum tersambung.':'Bahan belum dapat dimuat.');const d=await r.json();if(token!==serial)return;items=d.items||[]}catch(e){if(token===serial)error=e instanceof Error?e.message:'Gagal memuat.'}finally{if(token===serial)loading=false}}
 function href(item:Item){if(section==='news')return '/explore/news/'+item.id;if(section==='issues')return '/explore/issues/'+item.slug;try{const u=new URL(item.url||'');return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
 onMount(()=>{void load('news')});
</script>
<svelte:head><title>Jelajah · ETNOS</title></svelte:head>
<section class="etnos-explore">
 <header><h1>Jelajah</h1><a href="/search">Cari</a></header>
 <nav aria-label="Bagian Jelajah">{#each tabs as [key,label]}<button type="button" aria-pressed={section===key} onclick={()=>load(key)}>{label}</button>{/each}</nav>
 {#if loading}<p role="status">Memuat…</p>{:else if error}<div role="status"><p>{error}</p><button type="button" onclick={()=>load(section)}>Coba lagi</button></div>{:else if !items.length}<p role="status">Belum ada bahan.</p>{:else}
 <div class:issue-grid={section==='issues'}>{#each items as item,index}<article class:issue-tile={section==='issues'} data-tone={index%4}><h2>{#if href(item)}<a href={href(item)}>{text(item.title)||item.title_id||item.title_en}</a>{:else}{text(item.title)||item.title_id||item.title_en}{/if}</h2><p>{text(item.summary)||item.summary_id||item.description||''}</p>{#if item.publisher}<small>{item.publisher}</small>{/if}</article>{/each}</div>
 {/if}
</section>
<style>
 header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:28px}h1{font-size:2.3rem;letter-spacing:-.055em;font-weight:550;margin:0}header a{font-size:.9rem}nav{display:flex;gap:24px;margin-bottom:25px}button{padding:10px 0;font-size:.9rem;cursor:pointer}button[aria-pressed=true]{color:var(--color-primary-900);box-shadow:0 2px currentColor;font-weight:600}article{padding:24px 0;max-width:65ch}h2{font-size:1.35rem;letter-spacing:-.025em;line-height:1.3;font-weight:550;overflow-wrap:anywhere;margin:0 0 12px}p{line-height:1.65;font-size:1rem;opacity:.78;overflow-wrap:anywhere}.issue-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.issue-tile{position:relative;isolation:isolate;padding:28px;border-radius:12px;color:#faf8f2;overflow:hidden;min-height:230px;background:radial-gradient(ellipse at 100% 0%,#788b58,transparent 80%),#263c32}.issue-tile[data-tone='1']{background:radial-gradient(ellipse at 100% 0%,#8c788a,transparent 90%),#383146}.issue-tile[data-tone='2']{background:radial-gradient(ellipse at 100% 0%,#497d84,transparent 90%),#243c48}.issue-tile[data-tone='3']{background:radial-gradient(ellipse at 100% 0%,#a68065,transparent 90%),#493930}.issue-tile:before{content:'';position:absolute;z-index:-1;width:85%;aspect-ratio:1;right:-24%;top:-38%;border:1px solid #ffffff22;border-radius:50%;box-shadow:0 0 0 48px #ffffff05,0 0 0 96px #ffffff04}.issue-tile h2{font-size:1.65rem}a:hover{color:var(--color-primary-900)}.issue-tile a:hover{color:inherit;text-decoration:underline}@media(max-width:600px){.issue-grid{grid-template-columns:1fr}}
</style>
