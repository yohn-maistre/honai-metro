<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import { Check, Moon, Sun } from '@lucide/svelte'
  import { appearance, palettes } from './appearance.svelte'
  let custom = $state(appearance.accent),
    invalid = $state(false)
</script>

<Card.Root class="appearance-card">
  <Card.Header><Card.Title>Tampilan</Card.Title></Card.Header>
  <Card.Content class="strata-stack">
    <Tabs.Root bind:value={appearance.theme}>
      <Tabs.List aria-label="Tema" class="w-full">
        <Tabs.Trigger value="light" class="flex-1">
          <Sun size={16} />Terang
        </Tabs.Trigger>
        <Tabs.Trigger value="dark" class="flex-1">
          <Moon size={16} />Gelap
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
    <div>
      <Label>Warna aksen</Label>
      <div class="accent-options">
        {#each palettes as palette}<Button
            variant="outline"
            class="accent-choice"
            aria-pressed={appearance.accent === palette.color}
            onclick={() => {
              appearance.accent = palette.color
              custom = palette.color
              invalid = false
            }}
          >
            <span class="color-dot" style:background={palette.color}>
              {#if appearance.accent === palette.color}<Check
                  size={13}
                  color="#111"
                />{/if}
            </span>
            {palette.name}
          </Button>{/each}
      </div>
    </div>
    <form
      class="custom-accent"
      onsubmit={(e) => {
        e.preventDefault()
        invalid = !/^#[0-9a-f]{6}$/i.test(custom)
        if (!invalid) appearance.accent = custom.toLowerCase()
      }}
    >
      <div>
        <Label for="custom-accent">Warna sendiri</Label><Input
          id="custom-accent"
          bind:value={custom}
          placeholder="#c5b0e2"
          maxlength={7}
          spellcheck={false}
          aria-invalid={invalid}
        />
      </div>
      <Button type="submit" variant="outline">Terapkan</Button>
    </form>
    {#if invalid}<p role="alert" class="cx-form-error">
        Gunakan kode warna seperti #c5b0e2.
      </p>{/if}
    <p class="cx-hint">
      Disimpan di perangkat ini. Kontras teks menyesuaikan tema.
    </p>
  </Card.Content>
</Card.Root>
