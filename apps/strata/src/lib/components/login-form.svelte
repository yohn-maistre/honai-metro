<script lang="ts">
  // Adapted from shadcn-svelte login-01 (MIT). Authentication remains AT OAuth.
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
  } from '$lib/components/ui/field/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { ArrowUpRight, LoaderCircle, KeyRound } from '@lucide/svelte'
  let {
    handle = $bindable(''),
    publishing = $bindable(false),
    livePublishing = false,
    busy = false,
    failed = false,
    onsubmit,
  }: {
    handle?: string
    publishing?: boolean
    livePublishing?: boolean
    busy?: boolean
    failed?: boolean
    onsubmit: () => void
  } = $props()
</script>

<Card.Root class="login-card">
  <Card.Header>
    <KeyRound size={23} class="text-primary mb-3" /><Card.Title class="text-xl">
      Masuk ke ETNOS
    </Card.Title><Card.Description>
      Gunakan akun Bluesky atau akun lain di jaringan AT Protocol.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      onsubmit={(e) => {
        e.preventDefault()
        onsubmit()
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel for="at-handle">Handle akun</FieldLabel><Input
            id="at-handle"
            bind:value={handle}
            placeholder="nama.bsky.social"
            autocomplete="username"
            autocapitalize="none"
            spellcheck={false}
            required
          /><FieldDescription>
            Kata sandi tetap di penyedia akunmu.
          </FieldDescription>
        </Field>
        {#if livePublishing}<Field orientation="horizontal">
            <Checkbox
              id="publishing-consent"
              bind:checked={publishing}
            /><FieldLabel for="publishing-consent">
              Izinkan penerbitan ke AT
            </FieldLabel>
          </Field>{/if}
        {#if failed}<p role="alert" class="cx-form-error">
            Sesi masuk berakhir. Silakan coba lagi.
          </p>{/if}
        <Button type="submit" disabled={busy} class="w-full">
          {#if busy}<LoaderCircle
              class="animate-spin"
            />{/if}Lanjutkan<ArrowUpRight size={16} />
        </Button>
        <FieldDescription>
          Untuk ikut menulis, akunmu perlu undangan ETNOS. Minta undangan kepada
          pengelola dengan menyebutkan handle akunmu. Bergabung ke komunitas
          tetap memerlukan izin tersendiri.
        </FieldDescription>
      </FieldGroup>
    </form>
  </Card.Content>
  <Card.Footer class="border-t text-sm text-muted-foreground">
    <a href="/explore" class="cx-text-link">Tetap membaca tanpa masuk</a>
    <span>
      Belum punya akun? <a
        class="cx-text-link ml-1"
        href="https://bsky.app"
        target="_blank"
        rel="noreferrer"
      >
        Buat akun Bluesky<ArrowUpRight size={13} />
      </a>
    </span>
    <small>Membuat akun belum memberi undangan ETNOS.</small>
  </Card.Footer>
</Card.Root>
