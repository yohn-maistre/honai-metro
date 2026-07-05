import registry from '$lib/etnos/data/registry.json'
import agents from '$lib/etnos/data/agents.json'

export const load = () => {
  return { registry, agents }
}
