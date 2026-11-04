<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Check, Moon, Sun } from '@lucide/svelte'
  import { appearance, palettes } from './appearance.svelte'
  import { bases } from './appearance-bases'
  import { fontPairs } from './font-pairs'
  import Choice from './Choice.svelte'
  let custom = $state(appearance.accent),
    invalid = $state(false)
</script>

<Card.Root class="appearance-card">
  <Card.Header><Card.Title>Tampilan</Card.Title></Card.Header>
  <Card.Content class="strata-stack">
    <section class="font-settings">
      <Label for="font-pair">Pasangan huruf</Label>
      <Choice
        id="font-pair"
        aria-label="Pasangan huruf"
        bind:value={appearance.fontPair}
        items={fontPairs.map((p) => ({ value: p.id, label: p.name }))}
      />
      <div class="font-specimen">
        <h2>Tempat kita bertemu.</h2>
        <p>
          Cerita sehari-hari, kabar dari sekitar, dan pengetahuan yang dirawat
          bersama.
        </p>
        <small>
          {fontPairs.find((p) => p.id === appearance.fontPair)?.note}
        </small>
      </div>
    </section>
    <div role="group" aria-label="Tema" class="appearance-theme">
      <Button
        variant="ghost"
        aria-pressed={appearance.themeMode === 'light'}
        onclick={() => (appearance.themeMode = 'light')}
      >
        <Sun size={16} />Terang
      </Button><Button
        variant="ghost"
        aria-pressed={appearance.themeMode === 'dark'}
        onclick={() => (appearance.themeMode = 'dark')}
      >
        <Moon size={16} />Gelap
      </Button><Button
        variant="ghost"
        aria-pressed={appearance.themeMode === 'clock'}
        onclick={() => (appearance.themeMode = 'clock')}
      >
        Otomatis
      </Button>
    </div>
    <p class="cx-hint">
      Otomatis: terang pukul 06.00–18.00, mengikuti waktu perangkat.
    </p>
    <div>
      <Label>Warna dasar</Label>
      <div class="base-options" role="group" aria-label="Warna dasar">
        {#each bases as base}<button
            class="base-choice"
            aria-pressed={appearance.base === base.id}
            onclick={() => (appearance.base = base.id)}
          >
            <span
              class="base-preview"
              style:background={appearance.theme === 'dark'
                ? base.dark[0]
                : base.light[0]}
            >
              <i
                style:background={appearance.theme === 'dark'
                  ? base.dark[1]
                  : base.light[1]}
              ></i>
              <i style:background={appearance.accent}></i>
            </span>
            <span>{base.name}</span>
            {#if appearance.base === base.id}<Check size={14} />{/if}
          </button>{/each}
      </div>
    </div>
    <div>
      <Label>Tekstur</Label>
      <div class="texture-options" role="group" aria-label="Tekstur">
        {#each [['none', 'Polos'], ['grain', 'Serat'], ['dither', 'Dither']] as [id, name]}<Button
            variant="outline"
            aria-pressed={appearance.texture === id}
            onclick={() => (appearance.texture = id)}
          >
            {name}
          </Button>{/each}
      </div>
      {#if appearance.texture !== 'none'}<div
          class="texture-options"
          role="group"
          aria-label="Intensitas tekstur"
        >
          <Button
            variant="outline"
            aria-pressed={appearance.textureStrength === 'soft'}
            onclick={() => (appearance.textureStrength = 'soft')}
          >
            Halus
          </Button>
          <Button
            variant="outline"
            aria-pressed={appearance.textureStrength === 'full'}
            onclick={() => (appearance.textureStrength = 'full')}
          >
            Penuh
          </Button>
        </div>{/if}
    </div>
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
    <div class="media-preference">
      <div>
        <Label>Sampul video</Label>
        <p class="cx-hint">
          Sampul dan judul saja. Pemutar dimuat setelah diketuk.
        </p>
      </div>
      <Button
        variant="outline"
        aria-pressed={appearance.externalMedia}
        onclick={() => (appearance.externalMedia = !appearance.externalMedia)}
      >
        {appearance.externalMedia ? 'Otomatis' : 'Saat diketuk'}
      </Button>
    </div>
    <p class="cx-hint">
      Disimpan di perangkat ini. Kontras teks menyesuaikan tema.
    </p>
  </Card.Content>
</Card.Root>
