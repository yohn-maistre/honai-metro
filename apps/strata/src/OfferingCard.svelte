<script lang="ts">
 import {ShoppingBag,MapPin,MessageCircle,Settings2} from '@lucide/svelte'
 import {request,type Post,type Community} from './api'
 import {Button} from '$lib/components/ui/button/index.js'
 import {Input} from '$lib/components/ui/input/index.js'
 let {post,community,loggedIn=false,onUpdated,onError}:{post:Post;community?:Community;loggedIn?:boolean;onUpdated:(post:Post)=>void;onError:(message:string)=>void}=$props()
 let editing=$state(false),busy=$state(false),price=$state(''),unit=$state(''),status=$state('open'),expiry=$state(''),error=$state('')
 const o=$derived(post.offering)
 const labels:Record<string,string>={open:'Terbuka',paused:'Dijeda',fulfilled:'Terpenuhi',expired:'Berakhir',withdrawn:'Ditarik'}
 function open(){if(!o)return;price=o.price===null?'':String(o.price);unit=o.unit;status=o.status==='expired'?'open':o.status;expiry=o.expiresAt?new Date(o.expiresAt).toLocaleDateString('en-CA'):'';editing=true;error=''}
 async function save(){if(!o||busy)return;busy=true;error='';try{const result=await request<Post>('/v1/offerings/'+post.id+'/edit',{revision:o.revision,price:String(price??'').trim()?Number(price):null,unit,status,expiresAt:expiry?new Date(expiry+'T23:59:00').getTime():null,requestKey:crypto.randomUUID()});onUpdated(result);editing=false}catch(e){error=e instanceof Error?e.message:'Penawaran belum tersimpan.';onError(error)}finally{busy=false}}
</script>
{#if o}<aside class="offering-card" aria-label={o.kind==='offer'?'Penawaran':'Kebutuhan'}>
 <div class="offering-caption"><span><ShoppingBag size={14}/>{o.kind==='offer'?'Menawarkan':'Mencari'}</span><span class:offering-closed={o.status!=='open'}>{labels[o.status]}</span></div>
 <div class="offering-terms"><strong>{o.price===null?(o.kind==='request'?'Anggaran terbuka':'Harga dibicarakan'):o.price===0?'Gratis':new Intl.NumberFormat('id-ID',{style:'currency',currency:o.currency,maximumFractionDigits:0}).format(o.price)}</strong>{#if o.unit}<span>· {o.unit}</span>{/if}</div>
 {#if o.place}<a class="offering-place" href={'/contexts/'+o.place.id}><MapPin size={13}/>{o.place.title}</a>{/if}
 {#if o.expiresAt}<small>Berlaku hingga {new Date(o.expiresAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</small>{/if}
 <div class="offering-actions">{#if o.canContact}<Button variant="outline" href={community?.visibility==='public'?'/messages?to='+post.author_id:'/square/'+post.id+'#reply'}><MessageCircle size={15}/>{community?.visibility==='public'?'Hubungi':'Diskusikan'}</Button>{:else if !loggedIn&&o.status==='open'}<Button variant="outline" href={'/login?returnTo='+encodeURIComponent(community?.visibility==='public'?'/messages?to='+post.author_id:'/square/'+post.id)}>Masuk untuk menghubungi</Button>{/if}{#if o.canManage}<Button variant="ghost" onclick={open}><Settings2 size={15}/>Kelola penawaran</Button>{/if}</div>
 {#if editing}<form class="offering-editor" onsubmit={e=>{e.preventDefault();void save()}}>
  <label for={'offering-price-'+post.id}>{o.kind==='request'?'Anggaran (Rp)':'Harga (Rp)'}</label><Input id={'offering-price-'+post.id} type="number" min="0" step="1" bind:value={price} placeholder="Boleh dikosongkan" disabled={busy}/>
  <label for={'offering-unit-'+post.id}>Satuan / keterangan harga</label><Input id={'offering-unit-'+post.id} bind:value={unit} maxlength={60} placeholder="Misalnya per ikat atau per jam" disabled={busy}/>
  <label for={'offering-status-'+post.id}>Status</label><select id={'offering-status-'+post.id} bind:value={status} disabled={busy}><option value="open">Terbuka</option><option value="paused">Dijeda</option><option value="fulfilled">Terpenuhi</option></select>
  <label for={'offering-expiry-'+post.id}>Berlaku hingga</label><Input id={'offering-expiry-'+post.id} type="date" bind:value={expiry} disabled={busy}/>
  {#if error}<p role="alert">{error}</p>{/if}<div class="offering-actions"><Button type="submit" disabled={busy}>Simpan penawaran</Button><Button variant="ghost" disabled={busy} onclick={()=>editing=false}>Batal</Button></div>
 </form>{/if}
</aside>{/if}
