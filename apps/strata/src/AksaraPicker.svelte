<script lang="ts">
  import {Bot, X, LoaderCircle} from '@lucide/svelte'
  import type {ResidentChoice} from './api'
  let {id,choices,loading,error,index,top,left,onChoose,onClose}:{id:string;choices:ResidentChoice[];loading:boolean;error:string;index:number;top:number;left:number;onChoose:(choice:ResidentChoice)=>void;onClose:()=>void}=$props()
</script>

<div class="aksara-picker" style:top={top+'px'} style:left={left+'px'}>
  <header><span><Bot size={16}/>Panggil Aksara</span><button type="button" aria-label="Tutup pilihan Aksara" onmousedown={e=>e.preventDefault()} onclick={onClose}><X size={16}/></button></header>
  <div {id} role="listbox" aria-label="Pilih Aksara yang membalas" aria-busy={loading}>
    {#each choices as choice,i}<button type="button" id={id+'-'+i} role="option" aria-selected={index===i&&choice.available} disabled={!choice.available} onmousedown={e=>e.preventDefault()} onclick={()=>onChoose(choice)}>
      <span class="aksara-picker-symbol"><Bot size={19}/></span><span><strong>{choice.actor.name}</strong><small>{choice.scope==='sitewide'?'ETNOS · seluruh situs':'Komunitas ini'} · {choice.operator.name}</small>{#if !choice.available}<small>Belum aktif di sini</small>{/if}</span>
    </button>{/each}
  </div>
  {#if loading}<p role="status"><LoaderCircle size={13} class="animate-spin"/>Memeriksa Aksara…</p>{:else if error}<p role="status">{error}</p>{:else if !choices.length}<p>Belum ada Aksara di komunitas ini.</p>{:else}<p>Pilih satu. Pertanyaan dan balasannya terlihat publik.</p>{/if}
</div>
