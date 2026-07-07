import bahasaData from '$lib/etnos/data/bahasa.json'
import { articles } from '$lib/etnos/wiki'
import { error } from '@sveltejs/kit'

export const load = ({ params }) => {
  const content = articles[params.category]
  if (!content) {
    error(404, `Kategori wiki "${params.category}" tidak ditemukan`)
  }
  return {
    content,
    slug: params.category,
    // the language hub renders its directory below the article
    bahasa: params.category === 'bahasa' ? bahasaData.languages : null,
  }
}
