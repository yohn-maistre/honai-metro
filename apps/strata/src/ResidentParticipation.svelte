<script lang="ts">
  import {untrack} from 'svelte'
  import {Globe, Pause} from '@lucide/svelte'
  import {Button} from '$lib/components/ui/button/index.js'
  import {request,type Auth,type Community} from './api'
  import {notify} from './notifications.svelte'
  type Binding={agent_id:string;home_community_id:string;operator_id:string;enabled:number;coverage:string[];revision:number}
  type Participation={sitewide:{agentId:string;name:string;homeCommunityId:string;operatorId:string;enabled:boolean}|null;destination:{enabled:boolean;revision:number;expires:number|null;hourlyLimit:number|null}|null}
  let {auth,scope,rooms,agentId,ready}:{auth:Auth;scope:string;rooms:Community[];agentId:string;ready:boolean}=$props()
  let binding=$state<Binding|null>(null),participation=$state<Participation|null>(null),coverage=$state<string[]>([]),busy=$state(false),loading=$state(true),error=$state(''),consent=$state(false),generation=0
  async function load(id=scope,mine=++generation){
    loading=true;error='';consent=false
    try{const [p,g]=await Promise.all([request<Participation>('/v1/resident/destinations?community='+encodeURIComponent(id)),auth.steward?request<{binding:Binding|null}>('/v1/resident/sitewide'):Promise.resolve({binding:null})]);if(mine!==generation)return;participation=p;binding=g.binding;coverage=g.binding?.coverage??[id]}
    catch{if(mine===generation)error='Izin Aksara ETNOS belum dapat dimuat.'}
    finally{if(mine===generation)loading=false}
  }
  $effect(()=>{const id=scope;void auth.actor?.id;untrack(()=>void load(id));return()=>{generation++}})
  async function change(fn:()=>Promise<unknown>){if(busy)return;busy=true;error='';try{await fn();notify('Izin partisipasi Aksara diperbarui.');await load()}catch(e){error=e instanceof Error?e.message:'Izin belum dapat disimpan.'}finally{busy=false}}
  function designate(enabled:boolean){const prior=binding;return change(()=>request('/v1/resident/sitewide',{agentId:enabled?agentId:prior!.agent_id,homeCommunityId:enabled?scope:prior!.home_community_id,enabled,coverage:enabled?coverage:[],revision:prior?.revision??0,requestKey:crypto.randomUUID()}))}
  function destination(enabled:boolean){return change(()=>request('/v1/resident/destinations',{agentId:participation!.sitewide!.agentId,communityId:scope,enabled,revision:participation?.destination?.revision??0,...(enabled?{issueGrant:true,admitAgent:true,durationHours:24,hourlyLimit:3}:{}),requestKey:crypto.randomUUID()}))}
</script>

<details class="resident-settings resident-participation"><summary><Globe size={15}/>Aksara ETNOS · lintas komunitas</summary>
  {#if loading}<p class="cx-hint" role="status">Memeriksa izin partisipasi…</p>{:else}
    {#if error}<p class="commons-alert" role="alert">{error}</p>{/if}
    {#if auth.steward}
      {#if binding?.enabled&&binding.home_community_id!==scope}<p class="cx-hint">Aksara ETNOS sudah memiliki rumah di komunitas lain. Pilih komunitas itu di Studio untuk mengubah cakupan sumbernya.</p>
      {:else if ready&&agentId}<form class="commons-editor" onsubmit={e=>{e.preventDefault();void designate(true)}}>
        <p class="cx-hint">Gunakan identitas Aksara komunitas ini sebagai steward ETNOS. Setiap komunitas tujuan tetap memerlukan keanggotaan dan izin balasan tersendiri.</p>
        <fieldset disabled={busy}><legend>Cakupan sumber publik</legend>{#each rooms.filter(r=>r.visibility==='public') as room}<label class="commons-check"><input type="checkbox" checked={room.id===scope||coverage.includes(room.id)} disabled={room.id===scope} onchange={e=>coverage=e.currentTarget.checked?[...new Set([...coverage,room.id])]:coverage.filter(id=>id!==room.id)}/>{room.title}</label>{/each}</fieldset>
        <Button type="submit" disabled={busy||coverage.length>16}>{binding?.enabled?'Simpan cakupan ETNOS':'Gunakan Aksara ini untuk ETNOS'}</Button>
      </form>{:else}<p class="cx-hint">Aktifkan Aksara komunitas ini terlebih dahulu untuk memilihnya sebagai steward ETNOS.</p>{/if}
      {#if binding?.enabled}<Button variant="outline" disabled={busy} onclick={()=>void designate(false)}><Pause size={14}/>Jeda Aksara ETNOS</Button>{/if}
    {/if}
    {#if participation?.sitewide?.enabled&&participation.sitewide.homeCommunityId!==scope}
      <div class="resident-destination"><h3>{participation.sitewide.name} di komunitas ini</h3><p class="cx-hint">{participation.destination?.enabled?'Izin balasan diaktifkan.':'Belum diaktifkan untuk membalas.'}{participation.destination?.expires?' Berlaku sampai '+new Date(participation.destination.expires).toLocaleString('id')+'.':''}</p>
      {#if participation.sitewide.operatorId===auth.actor?.id}<form class="commons-editor" onsubmit={e=>{e.preventDefault();if(consent)void destination(true)}}><label class="commons-check"><input type="checkbox" bind:checked={consent} disabled={busy}/>Tambahkan Aksara ETNOS sebagai anggota dan izinkan balasan publik selama 24 jam, maksimal 3 per jam.</label><small class="cx-hint">Pemilik komunitas harus mengaktifkan partisipasi agen. Ini tidak memberi izin moderasi, data privat atau penerbitan Wiki.</small><Button type="submit" disabled={busy||!consent}>Izinkan balasan · 24 jam</Button></form>{:else}<p class="cx-hint">Operator Aksara ETNOS yang juga mengelola komunitas ini dapat mengaktifkan partisipasinya.</p>{/if}
      {#if participation.destination?.enabled}<Button variant="outline" disabled={busy} onclick={()=>void destination(false)}><Pause size={14}/>Hentikan balasan di sini</Button>{/if}</div>
    {:else if !auth.steward}<p class="cx-hint">Belum ada Aksara ETNOS lintas komunitas yang aktif di sini.</p>{/if}
  {/if}
</details>
