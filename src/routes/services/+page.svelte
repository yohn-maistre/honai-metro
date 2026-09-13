<script>
 import {services} from '$lib/etnos/features/services/catalog.mjs';
</script>
<svelte:head><title>Services · ETNOS</title></svelte:head>
<section class="services-page" aria-labelledby="services-title">
 <h1 id="services-title">Services</h1>
 <div class="service-grid">
  {#each services as service}
   <article><div class="service-heading"><h2>{service.title}</h2><span>Direncanakan</span></div><p>{service.summary}</p></article>
  {/each}
 </div>
</section>
<style>
 .services-page{padding:clamp(1rem,3vw,2.5rem);max-width:70rem;margin:auto}
 h1{font-size:clamp(2rem,4vw,3rem);font-weight:550;letter-spacing:-.045em;margin:0 0 2rem}
 .service-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
 article{padding:1.6rem;border-radius:10px;background:color-mix(in srgb,currentColor 4%,transparent);min-width:0}
 .service-heading{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;flex-wrap:wrap}
 h2{font-size:1.2rem;font-weight:550;margin:0}span{font-size:.75rem;opacity:.7}
 p{font-size:.95rem;line-height:1.6;opacity:.75;margin:1rem 0 0;max-width:36ch}
 @media(max-width:600px){.service-grid{grid-template-columns:1fr}}
</style>
