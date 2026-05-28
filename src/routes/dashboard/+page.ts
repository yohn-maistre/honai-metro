import ekonomi from '$lib/etnos/data/ekonomi.json'
import infrastruktur from '$lib/etnos/data/infrastruktur.json'
import kualitasHidup from '$lib/etnos/data/kualitas-hidup.json'
import otsus from '$lib/etnos/data/otsus.json'
import pendidikan from '$lib/etnos/data/pendidikan.json'
import topStats from '$lib/etnos/data/stats.json'

export const load = () => {
  return {
    topStats,
    sections: {
      pendidikan,
      ekonomi,
      infrastruktur,
      kualitasHidup,
    },
    otsus,
  }
}
