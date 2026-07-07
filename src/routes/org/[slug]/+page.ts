import orgsData from '$lib/etnos/data/orgs.json'
import { error } from '@sveltejs/kit'

export const load = ({ params }) => {
  const org = orgsData.orgs.find((o) => o.slug === params.slug)
  if (!org) {
    error(404, `Organisasi "${params.slug}" tidak ditemukan`)
  }
  return { org, note: orgsData._meta.description }
}
