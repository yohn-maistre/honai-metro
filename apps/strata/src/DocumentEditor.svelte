<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { Editor } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import { Markdown } from '@tiptap/markdown'
  import Image from '@tiptap/extension-image'
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
  } from '@lucide/svelte'
  let {
    value = $bindable(''),
    label = 'Isi tulisan',
    max = 20000,
    disabled = false,
  }: {
    value?: string
    label?: string
    max?: number
    disabled?: boolean
  } = $props()
  let element: HTMLDivElement,
    editor = $state<Editor | undefined>(),
    revision = $state(0),
    source = $state(false)
  const advanced = $derived(/<\/?[a-z]|^\|.*\|\s*$|!\[[^\]]*\]/im.test(value))
  onMount(() => {
    let active = true
    // Existing advanced Markdown stays in source mode, never silently round-tripped.
    source = untrack(() => advanced)
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
        },
        handlePaste: (_view, event) => {
          if ((event.clipboardData?.getData('text/plain').length ?? 0) > max) {
            event.preventDefault()
            return true
          }
          return false
        },
      },
      onTransaction: () => {
        if (active) revision++
      },
      onUpdate: ({ editor }) => {
        if (active) value = editor.getMarkdown()
      },
    })
    return () => {
      active = false
      editor?.destroy()
    }
  })
  $effect(() => {
    editor?.setEditable(!disabled)
  })
  function toggleSource() {
    if (source) {
      editor?.commands.setContent(value, {
        contentType: 'markdown',
        emitUpdate: false,
      })
    }
    source = !source
  }
  function command(action: string) {
    if (!editor) return
    const c = editor.chain().focus()
    if (action === 'bold') c.toggleBold().run()
    if (action === 'italic') c.toggleItalic().run()
    if (action === 'heading') c.toggleHeading({ level: 2 }).run()
    if (action === 'list') c.toggleBulletList().run()
    if (action === 'ordered') c.toggleOrderedList().run()
    if (action === 'quote') c.toggleBlockquote().run()
    if (action === 'undo') c.undo().run()
    if (action === 'redo') c.redo().run()
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
  const id = $props.id()
</script>

<div
  class="document-editor"
  class:document-source={source}
  data-revision={revision}
>
  <div class="document-toolbar" role="toolbar" aria-label="Format tulisan">
    {#if !source}{#each [{ id: 'bold', label: 'Tebal', icon: Bold }, { id: 'italic', label: 'Miring', icon: Italic }, { id: 'heading', label: 'Subjudul', icon: Heading2 }, { id: 'list', label: 'Daftar', icon: List }, { id: 'ordered', label: 'Daftar bernomor', icon: ListOrdered }, { id: 'quote', label: 'Kutipan', icon: Quote }, { id: 'undo', label: 'Urungkan', icon: Undo2 }, { id: 'redo', label: 'Ulangi', icon: Redo2 }] as tool}<button
          type="button"
          title={tool.label}
          aria-label={tool.label}
          {disabled}
          onmousedown={(e) => e.preventDefault()}
          onclick={() => command(tool.id)}
        >
          <tool.icon size={16} />
        </button>{/each}{/if}
    <button
      type="button"
      class="document-source-toggle"
      disabled={disabled || (source && advanced)}
      aria-pressed={source}
      onclick={toggleSource}
    >
      <Code size={15} />{source ? 'Markdown' : 'Sumber'}
    </button>
  </div>
  <div bind:this={element} hidden={source}></div>
  {#if source}<textarea
      {id}
      aria-label={label}
      bind:value
      maxlength={max}
      {disabled}
      rows={10}
    ></textarea>{/if}
  <div class="document-editor-footer">
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
