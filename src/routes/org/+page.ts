import orgsData from '$lib/etnos/data/orgs.json'

export const load = () => {
  return { orgs: orgsData.orgs, note: orgsData._meta.description }
}
