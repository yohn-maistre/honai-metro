<script lang="ts">
 let {record,kind}:{record:any;kind:string}=$props();
 const story=$derived(record.development||record);
 const title=$derived(story.title_id||story.title_en||'');
 const summary=$derived(story.summary_id||story.summary_en||'');
 const sources=$derived(record.articles||record.reporting||[]);
 const safe=(value:string)=>{try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}};
</script>
<svelte:head><title>{title} · ETNOS</title></svelte:head>
<article class="detail"><a href="/explore" class="back">← Jelajah</a><h1>{title}</h1><p class="summary">{summary}</p>
 {#if record.developments?.length}<section><h2>Perkembangan</h2>{#each record.developments as item}<a class="development" href={'/explore/news/'+item.id}>{item.title_id||item.title_en}</a>{/each}</section>{/if}
 {#if sources.length}<section><h2>Sumber</h2>{#each sources as source}<div class="source">{#if safe(source.canonical_url)}<a href={safe(source.canonical_url)}>{source.title}</a>{:else}<span>{source.title}</span>{/if}<small>{source.publisher}</small></div>{/each}</section>{/if}
</article>
<style>
 .detail{max-width:68ch;margin:auto;padding:12px 0 50px}.back{font-size:.85rem;opacity:.75}h1{font-size:clamp(2rem,4vw,3.2rem);line-height:1.08;letter-spacing:-.045em;font-weight:550;margin:26px 0;overflow-wrap:anywhere}.summary{font-size:1.1rem;line-height:1.8;white-space:pre-line}section{margin-top:40px}h2{font-size:1.3rem;margin-bottom:20px}.source,.development{display:block;padding:16px 0;line-height:1.55}.source small{display:block;opacity:.65;margin-top:5px}a:hover{text-decoration:underline}
</style>
