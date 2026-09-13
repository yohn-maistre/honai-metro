<script lang="ts">
 import {page} from '$app/state';
 import type {Snippet} from 'svelte';
 import type {ClassValue} from 'svelte/elements';
 type Slot=Snippet<[{class:ClassValue;style?:string}]>;
 let {children,navbar,sidebar,main,suffix}:{children?:Snippet;navbar?:Slot;sidebar?:Slot;main?:Slot;suffix?:Slot}=$props();
 const links=[['/','Forum'],['/explore','Jelajah'],['/explore/communities','Komunitas'],['/inbox','Inbox'],['/services','Services']];
 const selected=(href:string)=>href==='/'?page.url.pathname==='/':href==='/explore'?page.url.pathname==='/explore'||page.url.pathname.startsWith('/explore/news')||page.url.pathname.startsWith('/explore/issues'):page.url.pathname.startsWith(href);
 let menu=$state(false);
 const wide=$derived(page.url.pathname==='/explore'||page.url.pathname.startsWith('/services'));
</script>
{@render children?.()}
<div class="etnos-frame" class:wide>
 <aside class="etnos-navigation">
  <a class="etnos-brand" href="/">etnos<span aria-hidden="true">.</span></a>
  <nav aria-label="Navigasi utama">{#each links as [href,label]}<a {href} aria-current={selected(href)?'page':undefined}>{label}</a>{/each}</nav>
  <a class="etnos-settings" href="/settings/app">Pengaturan</a>
 </aside>
 <div class="etnos-workspace">
  <header class="etnos-toolbar">
   <a class="mobile-brand" href="/">etnos.</a>
   <div class="upstream-actions">{@render navbar?.({class:'etnos-upstream-navbar'})}</div>
   <button type="button" aria-expanded={menu} aria-controls="etnos-secondary" onclick={()=>menu=!menu}>Menu</button>
  </header>
  {#if menu}<div id="etnos-secondary" class="etnos-secondary"><a href="/services">Services</a><a href="/settings/app">Pengaturan</a>{@render sidebar?.({class:'etnos-secondary-content'})}</div>{/if}
  <div class="etnos-body">
   {@render main?.({class:'etnos-main'})}
   {#if !wide}<aside class="etnos-context">{@render suffix?.({class:'etnos-context-content'})}</aside>{/if}
  </div>
 </div>
 <nav class="etnos-mobile-nav" aria-label="Navigasi utama seluler">{#each links.slice(0,4) as [href,label]}<a {href} aria-current={selected(href)?'page':undefined}>{label}</a>{/each}</nav>
</div>
<style>
 .etnos-frame{display:grid;grid-template-columns:210px minmax(0,1fr);max-width:1600px;margin:auto;min-height:100dvh}
 .etnos-navigation{position:sticky;top:0;height:100dvh;padding:35px 22px;display:flex;flex-direction:column;gap:32px}
 .etnos-brand,.mobile-brand{font-size:32px;font-weight:650;letter-spacing:-2px}.etnos-brand span{color:var(--color-primary-900)}
 nav{display:flex;flex-direction:column;gap:7px}nav a{padding:12px 15px;border-radius:9px;font-size:14px}nav a[aria-current]{background:color-mix(in srgb,currentColor 7%,transparent);font-weight:600}
 .etnos-settings{margin-top:auto;font-size:13px;opacity:.7;padding:12px 15px}.etnos-workspace{min-width:0}.etnos-toolbar{display:flex;align-items:center;gap:14px;min-height:70px;padding:8px 24px}.upstream-actions{flex:1;min-width:0}.etnos-toolbar>button{font-size:12px;padding:10px;border-radius:8px}
 .etnos-secondary{padding:20px;display:grid;gap:18px;background:color-mix(in srgb,currentColor 5%,transparent)}
 .etnos-body{display:grid;grid-template-columns:minmax(0,780px) minmax(190px,280px);gap:24px}.wide .etnos-body{grid-template-columns:minmax(0,1fr)}
 .etnos-context{padding-top:24px;min-width:0}.etnos-body :global(.etnos-main){padding:24px!important;min-height:70dvh}
 .etnos-mobile-nav,.mobile-brand{display:none}
 .upstream-actions :global(a[href="/"]),.upstream-actions :global(a[href="/explore/communities"]){display:none}
 @media(max-width:1100px){.etnos-body{grid-template-columns:1fr}.etnos-context{display:none}.etnos-frame{grid-template-columns:180px minmax(0,1fr)}}
 @media(max-width:700px){.etnos-frame{display:block;padding-bottom:calc(70px + env(safe-area-inset-bottom))}.etnos-navigation{display:none}.mobile-brand{display:block;font-size:27px}.etnos-toolbar{padding:8px 16px;gap:6px}.etnos-mobile-nav{display:flex;flex-direction:row;justify-content:space-around;position:fixed;bottom:0;left:0;right:0;z-index:50;padding:10px 8px calc(10px + env(safe-area-inset-bottom));background:var(--color-slate-50)}:global(.dark) .etnos-mobile-nav{background:var(--color-zinc-950)}.etnos-mobile-nav a{font-size:12px;padding:12px}.etnos-body :global(.etnos-main){padding:18px!important}.upstream-actions :global(.navbar){padding:0!important}}
 @media(prefers-reduced-motion:no-preference){nav a{transition:background-color .15s,color .15s}}
</style>
