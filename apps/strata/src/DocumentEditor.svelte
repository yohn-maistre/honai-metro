<script lang="ts">
  import { onMount, untrack, tick } from 'svelte'
  import { autosizeText } from './autosize-text'
  import { Editor } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import { Markdown } from '@tiptap/markdown'
  import Image from '@tiptap/extension-image'
  import type {ResidentChoice} from './api'
  import AksaraPicker from './AksaraPicker.svelte'
  const ownImage = (src: unknown) =>
    typeof src === 'string' && /^\/v1\/media\/[-a-f0-9]{36}$/.test(src)
  const ScopedImage = Image.extend({
    parseHTML() {
      return [
        {
          tag: 'img[src]',
          getAttrs: (node) =>
            ownImage(node.getAttribute('src')) ? null : false,
        },
      ]
    },
    renderHTML({ HTMLAttributes }) {
      return [
        'img',
        {
          ...HTMLAttributes,
          src: ownImage(HTMLAttributes.src) ? HTMLAttributes.src : undefined,
        },
      ]
    },
  })
  import {
    Bold,
    Italic,
    Heading2,
    List,
    ListOrdered,
    Quote,
    Undo2,
    Redo2,
    Code,
    Link,
    X,
  } from '@lucide/svelte'
  let {
    value = $bindable(''),
    label = 'Isi tulisan',
    max = 20000,
    disabled = false, toolbar = true, compact = false, placeholder = '', autofocus = false, onSubmit,
    mentionChoices, mentionLoading=false, mentionError='', onMentionSelect,
  }: {
    value?: string
    label?: string
    max?: number
    disabled?: boolean
    toolbar?: boolean
    compact?: boolean
    placeholder?: string
    autofocus?: boolean
    onSubmit?: () => void
    mentionChoices?: ResidentChoice[]
    mentionLoading?: boolean
    mentionError?: string
    onMentionSelect?: (choice:ResidentChoice)=>void
  } = $props()
  let element: HTMLDivElement,
    editor = $state<Editor | undefined>(),
    revision = $state(0),
    source = $state(false), linkEditing = $state(false), linkValue = $state(''), linkError = $state(''), editorError = $state(''), linkInput = $state<HTMLInputElement|null>(null)
  const advanced = $derived(/<\/?[a-z]|^\|.*\|\s*$|!\[[^\]]*\]/im.test(value))
  let mention=$state<{from:number;to:number;top:number;left:number}|null>(null),mentionIndex=$state(0)
  let mentionDismissedAt=''
  const id=$props.id()
  const mentionId=id+'-aksara'
  function closeMention(){if(mention)mentionDismissedAt=mention.from+':'+mention.to;mention=null}
  function syncMention(current:Editor){
    const {selection}=current.state
    if(disabled||source||!mentionChoices||!selection.empty||current.isActive('code')||current.isActive('codeBlock')||current.isActive('blockquote')||current.isActive('link')){mention=null;return}
    const before=selection.$from.parent.textBetween(0,selection.$from.parentOffset,'\n','\ufffc'),match=before.match(/(?:^|\s)(@(?:a(?:k(?:s(?:a(?:r(?:a)?)?)?)?)?)?)$/i)
    if(!match){mention=null;mentionDismissedAt='';return}
    const from=selection.from-match[1].length,to=selection.from
    if(mentionDismissedAt===from+':'+to)return
    const anchor=current.view.coordsAtPos(selection.from),bounds=element.parentElement!.getBoundingClientRect(),below=anchor.bottom-bounds.top+8,available=Math.min(innerHeight,element.closest('form')?.getBoundingClientRect().bottom??innerHeight)
    if(mention?.from!==from)mentionIndex=Math.max(0,mentionChoices.findIndex(c=>c.available))
    mention={from,to,top:anchor.bottom+220<available?below:Math.max(0,anchor.top-bounds.top-220),left:Math.max(0,Math.min(anchor.left-bounds.left,bounds.width-330))}
  }
  function chooseMention(choice:ResidentChoice){
    if(!editor||!mention||disabled||!choice.available||!choice.choiceKey)return
    const range={from:mention.from,to:mention.to};mention=null
    editor.chain().focus().insertContentAt(range,[{type:'text',text:'@'+choice.actor.name,marks:[{type:'link',attrs:{href:'/people/'+choice.actor.id}}]},{type:'text',text:' '}]).run()
    onMentionSelect?.(choice)
  }
  export function openMention(){
    if(!editor||source||disabled||!mentionChoices)return false
    mentionDismissedAt='';editor.chain().focus().insertContent(' @aksara').run()
    return true
  }
  let lastMarkdown = ''
  onMount(() => {
    let active = true
    // Existing advanced Markdown stays in source mode, never silently round-tripped.
    source = untrack(() => advanced)
    lastMarkdown = untrack(() => value)
    editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          link: {
            openOnClick: false,
            autolink: false,
            protocols: ['https', 'http'],
          },
        }),
        ScopedImage.configure({ allowBase64: false }),
        Markdown,
      ],
      content: untrack(() => (source ? '' : value)),
      contentType: 'markdown',
      editable: !disabled,
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': label,
          'aria-multiline': 'true',
          class: 'document-prose',
          'data-placeholder': placeholder,
        },
        handleKeyDown: (_view,event) => {
          if(mention&&!event.isComposing){
            if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMention();return true}
            if(event.key==='Tab'){closeMention();return false}
            if(event.key==='ArrowDown'||event.key==='ArrowUp'){
              event.preventDefault();event.stopPropagation();const choices=mentionChoices??[],step=event.key==='ArrowDown'?1:-1
              for(let n=1;n<=choices.length;n++){const next=(mentionIndex+step*n+choices.length)%choices.length;if(choices[next].available){mentionIndex=next;break}}return true
            }
            if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey&&mentionChoices?.[mentionIndex]?.available){event.preventDefault();event.stopPropagation();chooseMention(mentionChoices[mentionIndex]);return true}
          }
          if(!disabled&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();event.stopPropagation();void openLink();return true}
          if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&onSubmit&&!event.isComposing){event.preventDefault();event.stopPropagation();onSubmit();return true}
          return false
        },
        handlePaste: (view, event) => {
          const selected=view.state.doc.textBetween(view.state.selection.from,view.state.selection.to,'\n').length
          if (value.length-selected+(event.clipboardData?.getData('text/plain').length ?? 0) > max) {
            event.preventDefault()
            editorError='Tempelan terlalu panjang. Batas tulisan '+max.toLocaleString('id')+' karakter.'
            return true
          }
          return false
        },
      },
      onTransaction: ({editor}) => {
        if (active) {revision++;syncMention(editor)}
      },
      onUpdate: ({ editor }) => {
        if (active) {lastMarkdown=editor.getMarkdown();value=lastMarkdown;editorError=''}
      },
    })
    // A lazy editor may arrive after the dialog's initial focus pass. Do not
    // take focus back if the person has already moved to another form control.
    const focusFrame=requestAnimationFrame(()=>{if(active&&autofocus&&!disabled){
      const current=document.activeElement
      if(current===document.body||current?.matches('.compose-cancel,[data-slot="dialog-content"]'))focus()
    }})
    return () => {
      active = false
      cancelAnimationFrame(focusFrame)
      editor?.destroy()
    }
  })
  $effect(() => {
    editor?.setEditable(!disabled)
    editor?.view.dom.setAttribute('data-placeholder',placeholder)
  })
  $effect(()=>{
    if(!editor)return
    const open=!!mention&&!disabled&&!!mentionChoices
    if(!open)mention=null
    editor.view.dom.setAttribute('aria-autocomplete',mentionChoices?'list':'none')
    if(open){editor.view.dom.setAttribute('aria-controls',mentionId);const index=mentionChoices?.[mentionIndex]?.available?mentionIndex:-1;if(index>=0)editor.view.dom.setAttribute('aria-activedescendant',mentionId+'-'+index);else editor.view.dom.removeAttribute('aria-activedescendant')}
    else{editor.view.dom.removeAttribute('aria-controls');editor.view.dom.removeAttribute('aria-activedescendant')}
  })
  $effect(() => {
    // External resets (not ordinary typing) must clear the still-mounted editor.
    if(editor&&!source&&lastMarkdown!==value){
      lastMarkdown=value
      editor.commands.setContent(value,{contentType:'markdown',emitUpdate:false})
    }
  })
  export function toggleSource() {
    if(disabled||(source&&advanced))return
    if (source) {
      editor?.commands.setContent(value, {
        contentType: 'markdown',
        emitUpdate: false,
      })
    }
    source = !source
    mention=null
    linkEditing=false
    void tick().then(()=>focus())
  }
  function command(action: string) {
    if (!editor) return
    const c = editor.chain().focus()
    if (action === 'bold') c.toggleBold().run()
    if (action === 'italic') c.toggleItalic().run()
    if (action === 'heading') c.toggleHeading({ level: 2 }).run()
    if (action === 'list') c.toggleBulletList().run()
    if (action === 'ordered') c.toggleOrderedList().run()
    if (action === 'code') c.toggleCode().run()
    if (action === 'quote') c.toggleBlockquote().run()
    if (action === 'undo') c.undo().run()
    if (action === 'redo') c.redo().run()
  }
  function active(action:string){void revision;const names:Record<string,string>={bold:'bold',italic:'italic',heading:'heading',list:'bulletList',ordered:'orderedList',quote:'blockquote',code:'code',link:'link'};return !!editor&&!!names[action]&&editor.isActive(names[action])}
  async function openLink(){if(!editor||source)return;const href=editor.getAttributes('link').href;linkValue=typeof href==='string'?href:'';linkError='';linkEditing=true;await tick();linkInput?.focus();linkInput?.select()}
  function applyLink(){
    const href=linkValue.trim();let allowed=/^\/(?![\/\\])/.test(href)&&!/[\u0000-\u0020\\]/.test(href)
    try{const url=new URL(href);allowed=['https:','http:'].includes(url.protocol)&&!url.username&&!url.password}catch{/* Local absolute paths are allowed separately. */}
    if(!href||href.length>2000||!allowed){linkError='Gunakan tautan http/https lengkap atau alamat halaman ETNOS.';return}
    editor?.chain().focus().extendMarkRange('link').setLink({href}).run();linkEditing=false
  }
  export function focus() {
    if (source) document.getElementById(id)?.focus()
    else editor?.commands.focus()
  }
  export function insertImage(src: string, alt: string) {
    if (!/^\/v1\/media\/[-a-f0-9]{36}$/.test(src)) return
    if (source)
      value += '\n\n![' + alt.replace(/[[\]\\\n]/g, ' ') + '](' + src + ')\n'
    else editor?.chain().focus().setImage({ src, alt }).run()
  }
  export function removeImage(src: string) {
    if (source) {
      value = value
        .split('\n')
        .filter((line) => !line.includes('](' + src + ')'))
        .join('\n')
      return
    }
    if (!editor) return
    const transaction = editor.state.tr
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) {
        const from = transaction.mapping.map(pos)
        transaction.delete(from, from + node.nodeSize)
      }
    })
    editor.view.dispatch(transaction)
  }
</script>

<div
  class="document-editor"
  class:document-source={source}
  class:document-compact={compact}
  data-revision={revision}
>
  {#if toolbar}<div class="document-toolbar" role="toolbar" aria-label="Format tulisan">
    {#if !source}{#each [{ id: 'bold', label: 'Tebal', icon: Bold }, { id: 'italic', label: 'Miring', icon: Italic }, { id: 'heading', label: 'Subjudul', icon: Heading2 }, { id: 'list', label: 'Daftar', icon: List }, { id: 'ordered', label: 'Daftar bernomor', icon: ListOrdered }, { id: 'quote', label: 'Kutipan', icon: Quote }, {id:'code',label:'Kode sebaris',icon:Code}, { id: 'undo', label: 'Urungkan', icon: Undo2 }, { id: 'redo', label: 'Ulangi', icon: Redo2 }] as tool}<button
          type="button"
          title={tool.label}
          aria-label={tool.label}
          {disabled}
          aria-pressed={['undo','redo'].includes(tool.id)?undefined:active(tool.id)}
          onmousedown={(e) => e.preventDefault()}
          onclick={() => command(tool.id)}
        >
          <tool.icon size={16} />
        </button>{/each}<button type="button" aria-label="Sisipkan tautan" title="Sisipkan tautan · Ctrl/⌘ K" {disabled} aria-pressed={linkEditing||active('link')} onmousedown={e=>e.preventDefault()} onclick={()=>void openLink()}><Link size={16}/></button>{/if}
    <button
      type="button"
      class="document-source-toggle"
      disabled={disabled || (source && advanced)}
      aria-pressed={source}
      onclick={toggleSource}
    >
      <Code size={15} />{source ? 'Markdown' : 'Sumber'}
    </button>
  </div>{/if}
  {#if linkEditing}<div class="document-link-editor" role="group" aria-label="Sisipkan tautan"><label for={id+'-link'}>Alamat tautan</label><div><input id={id+'-link'} bind:this={linkInput} bind:value={linkValue} maxlength="2000" placeholder="https://…" inputmode="url" onkeydown={e=>{if(e.key==='Enter'){e.preventDefault();applyLink()}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();linkEditing=false;focus()}}}/><button type="button" onclick={applyLink}>Terapkan</button><button type="button" aria-label="Tutup pengaturan tautan" onclick={()=>{linkEditing=false;focus()}}><X size={16}/></button></div>{#if linkError}<p role="alert">{linkError}</p>{/if}{#if editor?.isActive('link')}<button type="button" onclick={()=>{editor?.chain().focus().unsetLink().run();linkEditing=false}}>Hapus tautan</button>{/if}</div>{/if}
  <div bind:this={element} hidden={source}></div>
  {#if mention&&mentionChoices}<AksaraPicker id={mentionId} choices={mentionChoices} loading={mentionLoading} error={mentionError} index={mentionIndex} top={mention.top} left={mention.left} onChoose={chooseMention} onClose={closeMention}/>{/if}
  {#if source}<textarea
      {id}
      aria-label={label}
      bind:value
      maxlength={max}
      {disabled}
      rows={10}
      {placeholder}
      use:autosizeText={value}
      oninput={()=>editorError=''}
      onkeydown={event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&onSubmit&&!event.isComposing){event.preventDefault();event.stopPropagation();onSubmit()}}}
      onpaste={event=>{const input=event.currentTarget;const pasted=event.clipboardData?.getData('text/plain')??'';if(value.length-(input.selectionEnd-input.selectionStart)+pasted.length>max){event.preventDefault();editorError='Tempelan terlalu panjang. Batas tulisan '+max.toLocaleString('id')+' karakter.'}}}
    ></textarea>{/if}
  {#if editorError}<p role="alert" class="document-editor-error">{editorError}</p>{/if}
  <div class="document-editor-footer" class:near-limit={value.length>max-1000}>
    <span>
      {source && advanced
        ? 'Format lanjutan dipertahankan di Markdown.'
        : 'Tautan dapat ditempel di tulisan.'}
    </span>
    <span class:over-limit={value.length > max}>
      {value.length.toLocaleString('id')} / {max.toLocaleString('id')}
    </span>
  </div>
</div>
