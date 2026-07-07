<script lang="ts">
  /**
   * ETNOS signup: PieFed's API has no signup method, so instead of the
   * Photon instance-picker (which would end in an error), this page
   * says plainly where the account lives: register on the backend
   * instance, then log in here. One honest step, no dead buttons.
   * (Lemmy-type deployments still redirect to /signup/[instance] via
   * +page.ts, where the API signup form works.)
   */
  import { t } from '$lib/app/i18n'
  import { DEFAULT_INSTANCE_URL } from '$lib/app/instance.svelte'
  import EndPlaceholder from '$lib/ui/layout/EndPlaceholder.svelte'
  import { Button, Note } from 'mono-svelte'
  import { ArrowTopRightOnSquare, Icon } from 'svelte-hero-icons/dist'

  const host = DEFAULT_INSTANCE_URL.replace(/^https?:\/\//, '')
  const registerUrl = `https://${host}/auth/register`
</script>

<svelte:head>
  <title>{$t('account.signup')} · ETNOS</title>
</svelte:head>

<div class="flex flex-col gap-5 max-w-xl mx-auto w-full my-8">
  <EndPlaceholder size="lg">{$t('account.signup')}</EndPlaceholder>

  <div
    class="bg-white dark:bg-zinc-900 rounded p-6 shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-4"
  >
    <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
      ETNOS berjalan di atas jaringan federasi. Akun dibuat di instance
      <strong>{host}</strong>. Satu langkah di situs mereka, lalu kembali ke
      sini dan masuk dengan akun itu.
    </p>
    <ol
      class="text-sm text-slate-700 dark:text-zinc-300 list-decimal list-inside flex flex-col gap-1"
    >
      <li>Daftar di {host} (tautan di bawah)</li>
      <li>Konfirmasi email bila diminta</li>
      <li>
        Kembali ke ETNOS dan
        <a href="/accounts/login" class="underline">masuk</a>
      </li>
    </ol>
    <div class="flex gap-2 flex-wrap">
      <Button color="primary" size="lg" href={registerUrl} target="_blank">
        Daftar di {host}
        {#snippet suffix()}
          <Icon src={ArrowTopRightOnSquare} micro size="16" />
        {/snippet}
      </Button>
      <Button color="secondary" size="lg" href="/accounts/login">
        Sudah punya akun, masuk
      </Button>
    </div>
  </div>

  <Note>
    Ketika ETNOS pindah ke server sendiri, pendaftaran akan terjadi langsung
    di sini. Sampai saat itu, halaman ini jujur menunjuk ke tempat akun
    benar-benar dibuat.
  </Note>
</div>
