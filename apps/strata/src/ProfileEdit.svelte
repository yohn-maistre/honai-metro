<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { request, type Actor } from './api'
  let {
    actor,
    onSaved,
  }: {
    actor: Actor
    onSaved: (fields: {
      bio: string
      website: string
      location: string
    }) => void
  } = $props()
  let open = $state(false),
    bio = $state(''),
    website = $state(''),
    location = $state(''),
    busy = $state(false),
    error = $state('')
  function edit() {
    bio = actor.bio ?? ''
    website = actor.website ?? ''
    location = actor.location ?? ''
    error = ''
    open = true
  }
  async function save() {
    if (busy) return
    busy = true
    error = ''
    try {
      const fields = await request<{
        bio: string
        website: string
        location: string
      }>('/v1/profile', { bio, website, location })
      onSaved(fields)
      open = false
    } catch (e) {
      error = e instanceof Error ? e.message : 'Profil belum tersimpan.'
    } finally {
      busy = false
    }
  }
</script>

<Button variant="outline" onclick={edit}>Edit profil</Button>
<Dialog.Root bind:open>
  <Dialog.Content class="platform-dialog profile-edit">
    <Dialog.Header>
      <Dialog.Title>Edit profil</Dialog.Title><Dialog.Description>
        Bio, tautan dan lokasi tampil kepada orang yang dapat melihat profilmu.
      </Dialog.Description>
    </Dialog.Header>
    <form
      class="creation-form"
      onsubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <Label>
        Bio<Textarea
          bind:value={bio}
          maxlength={600}
          rows={4}
          placeholder="Ceritakan sedikit tentang dirimu…"
        />
      </Label><Label>
        Situs web<Input
          bind:value={website}
          type="url"
          maxlength={2048}
          placeholder="https://…"
        />
      </Label><Label>
        Lokasi (opsional)<Input bind:value={location} maxlength={100} />
      </Label>{#if error}<p role="alert">{error}</p>{/if}<Button
        type="submit"
        disabled={busy}
      >
        {busy ? 'Menyimpan…' : 'Simpan profil'}
      </Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
