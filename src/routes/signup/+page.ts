import { DEFAULT_CLIENT_TYPE } from '$lib/api/base'
import { LINKED_INSTANCE_URL } from '$lib/app/instance.svelte'
import { redirect } from '@sveltejs/kit'

export const load = () => {
  // PieFed has no signup API — the honest registration page renders here.
  // Lemmy-type locked instances keep the working API signup form.
  if (LINKED_INSTANCE_URL && DEFAULT_CLIENT_TYPE.name !== 'piefed') {
    redirect(302, `/signup/${LINKED_INSTANCE_URL}`)
  }
}
