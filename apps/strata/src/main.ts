import { mount } from 'svelte'
import '@fontsource-variable/gabarito'
import './styles/geist-serif.css'
import './styles/ui.css'
import './styles/conversation.css'
import './styles/november.css'
import './styles/commons-next.css'
import App from './App.svelte'
import './styles/friends-pass.css'
import './styles/agents.css'
import './styles/refinement.css'
import './styles/navigation-refinement.css'
import { restoreAppearance } from './appearance.svelte'
restoreAppearance()
if (location.pathname === '/recover-messages') {
  void import('./RecoveryPage.svelte').then(({ default: Recovery }) =>
    mount(Recovery, { target: document.getElementById('app')! }),
  )
} else mount(App, { target: document.getElementById('app')! })
