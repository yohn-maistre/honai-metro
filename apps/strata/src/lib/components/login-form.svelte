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
      Gunakan akun AT yang kamu miliki.
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
          Pratinjau ini menerima akun yang diundang. Akses komunitas diatur
          terpisah.
        </FieldDescription>
      </FieldGroup>
    </form>
  </Card.Content>
  <Card.Footer class="border-t text-sm text-muted-foreground">
    Belum punya akun? <a
      class="cx-text-link ml-1"
      href="https://bsky.app"
      target="_blank"
      rel="noreferrer"
    >
      Lihat penyedia AT<ArrowUpRight size={13} />
    </a>
  </Card.Footer>
</Card.Root>
